from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Optional

from app.services.ai_service import generate_insights
from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.core.logging_config import logger
from app.core.rate_limit import limiter
from app.models.event import Event
from app.models.user import User
from app.schemas.event import (
    DailyEventCount,           # ← DailyEvents YERİNE
    EventTypeDistribution,
    ActiveUserStats,           # ← ActiveUsersStats YERİNE (tekil)
    AnalyticsSummary
)

# Redis caching (opsiyonel)
try:
    import redis
    redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
except:
    REDIS_AVAILABLE = False
    redis_client = None

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def get_cache_key(prefix: str, *args):
    return f"analytics:{prefix}:{':'.join(str(a) for a in args)}"


def cache_result(key: str, data: dict, expire: int = 300):
    if REDIS_AVAILABLE:
        import json
        redis_client.setex(key, expire, json.dumps(data))


def get_cached_result(key: str):
    if REDIS_AVAILABLE:
        import json
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)
    return None


@router.get("/daily-events")
@limiter.limit("30/minute")
def get_daily_events(
    request: Request,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Günlük event sayıları (cache'li)"""
    cache_key = get_cache_key("daily", days)
    cached = get_cached_result(cache_key)
    if cached:
        logger.info(f"CACHE_HIT | daily-events | days={days}")
        return cached
    
    since = datetime.utcnow() - timedelta(days=days)
    
    results = (
        db.query(
            func.date(Event.timestamp).label("date"),
            func.count(Event.id).label("count")
        )
        .filter(Event.timestamp >= since)
        .group_by(func.date(Event.timestamp))
        .order_by(func.date(Event.timestamp))
        .all()
    )
    
    data = [{"date": str(r.date), "count": r.count} for r in results]
    cache_result(cache_key, data)
    
    logger.info(f"ANALYTICS | daily-events | days={days} | records={len(data)}")
    return data


@router.get("/active-users")
@limiter.limit("30/minute")
def get_active_users(
    request: Request,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Aktif kullanıcı istatistikleri (cache'li)"""
    cache_key = get_cache_key("active_users", days)
    cached = get_cached_result(cache_key)
    if cached:
        return cached
    
    since = datetime.utcnow() - timedelta(days=days)
    
    daily_active = (
        db.query(
            func.date(Event.timestamp).label("date"),
            func.count(func.distinct(Event.user_id)).label("active_users")
        )
        .filter(Event.timestamp >= since)
        .group_by(func.date(Event.timestamp))
        .order_by(func.date(Event.timestamp))
        .all()
    )
    
    total_unique = (
        db.query(func.count(func.distinct(Event.user_id)))
        .filter(Event.timestamp >= since)
        .scalar()
    )
    
    data = {
        "daily_active": [{"date": str(r.date), "count": r.active_users} for r in daily_active],
        "total_unique": total_unique,
        "period_days": days
    }
    
    cache_result(cache_key, data)
    return data


@router.get("/event-types")
@limiter.limit("30/minute")
def get_event_types(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Event tipi dağılımı (cache'li)"""
    cache_key = get_cache_key("types")
    cached = get_cached_result(cache_key)
    if cached:
        return cached
    
    results = (
        db.query(Event.event_type, func.count(Event.id).label("count"))
        .group_by(Event.event_type)
        .order_by(desc("count"))
        .all()
    )
    
    data = [{"type": r.event_type, "count": r.count} for r in results]
    cache_result(cache_key, data)
    return data


@router.get("/event-count")
@limiter.limit("30/minute")
def get_event_count(
    request: Request,
    event_type: str = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Belirli event tipinin sayısı"""
    query = db.query(func.count(Event.id))
    
    if event_type:
        query = query.filter(Event.event_type == event_type)
    
    count = query.scalar()
    return {"count": count, "event_type": event_type or "all"}


@router.get("/summary")
@limiter.limit("30/minute")
def get_summary(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Dashboard için özet istatistikler"""
    cache_key = get_cache_key("summary")
    cached = get_cached_result(cache_key)
    if cached:
        return cached
    
    today = datetime.utcnow().date()
    
    total_events = db.query(func.count(Event.id)).scalar()
    
    todays_events = (
        db.query(func.count(Event.id))
        .filter(func.date(Event.timestamp) == today)
        .scalar()
    )
    
    active_users = db.query(func.count(func.distinct(Event.user_id))).scalar()
    
    event_types_count = db.query(func.count(func.distinct(Event.event_type))).scalar()
    
    data = {
        "total_events": total_events,
        "active_users": active_users,
        "event_types_count": event_types_count,
        "todays_events": todays_events
    }
    
    cache_result(cache_key, data, expire=60)  # 1 dakika cache
    return data

@router.get("/ai-insights")
@limiter.limit("5/minute") # AI isteklerini limitli tutmak önemli
def get_ai_insights(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Groq LLaMA 3 ile Yapay Zeka Destekli Sistem Analizi"""
    # Her girişte API'yi yormamak için 15 dakika cache'liyoruz
    cache_key = get_cache_key("ai_insights_v1")
    cached = get_cached_result(cache_key)
    if cached:
        logger.info("CACHE_HIT | ai-insights")
        return {"insights": cached}
        
    # AI'a göndermek için veritabanından güncel durumu çekiyoruz
    today = datetime.utcnow().date()
    total_events = db.query(func.count(Event.id)).scalar()
    todays_events = db.query(func.count(Event.id)).filter(func.date(Event.timestamp) == today).scalar()
    active_users = db.query(func.count(func.distinct(Event.user_id))).scalar()
    
    # En çok tekrar eden top 5 event
    results = (
        db.query(Event.event_type, func.count(Event.id).label("count"))
        .group_by(Event.event_type)
        .order_by(desc("count"))
        .limit(5)
        .all()
    )
    top_events = {r.event_type: r.count for r in results}
    
    # AI'ın okuyacağı özet veri formatı
    summary_data = {
        "toplam_sistem_eventi": total_events,
        "bugunku_event_sayisi": todays_events,
        "toplam_aktif_kullanici": active_users,
        "en_cok_tetiklenen_eventler": top_events
    }
    
    # Groq API'sine gönder
    insights_text = generate_insights(summary_data)
    
    # Sonucu Redis'e kaydet (15 dakika = 900 saniye)
    cache_result(cache_key, insights_text, expire=900)
    
    return {"insights": insights_text}