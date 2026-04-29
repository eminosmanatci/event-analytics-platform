from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, cast, Date
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.models.event import Event


def get_daily_events(db: Session, days: int = 30) -> List[Dict[str, Any]]:
    start_date = datetime.utcnow() - timedelta(days=days)
    
    results = (
        db.query(
            cast(Event.timestamp, Date).label("date"),
            func.count(Event.id).label("count")
        )
        .filter(Event.timestamp >= start_date)
        .group_by(cast(Event.timestamp, Date))
        .order_by(cast(Event.timestamp, Date).desc())
        .all()
    )
    
    return [{"date": str(row.date), "count": row.count} for row in results]


def get_active_users(db: Session, days: int = 7) -> Dict[str, Any]:
    start_date = datetime.utcnow() - timedelta(days=days)
    
    active_users_count = (
        db.query(func.count(distinct(Event.user_id)))
        .filter(Event.timestamp >= start_date)
        .scalar()
    )
    
    return {
        "period_days": days,
        "active_users": active_users_count or 0
    }


def get_event_counts_by_type(db: Session) -> List[Dict[str, Any]]:
    results = (
        db.query(
            Event.event_type,
            func.count(Event.id).label("count")
        )
        .group_by(Event.event_type)
        .order_by(func.count(Event.id).desc())
        .all()
    )
    
    return [
        {"event_type": row.event_type, "count": row.count} 
        for row in results
    ]


def get_event_count(
    db: Session, 
    event_type: str = None, 
    start_date: datetime = None,
    end_date: datetime = None
) -> Dict[str, Any]:
    """Filtreli event sayısı döndürür."""
    query = db.query(func.count(Event.id))
    
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if start_date:
        query = query.filter(Event.timestamp >= start_date)
    if end_date:
        query = query.filter(Event.timestamp <= end_date)
    
    count = query.scalar() or 0
    
    response = {"count": count}
    if event_type:
        response["event_type"] = event_type
    
    return response