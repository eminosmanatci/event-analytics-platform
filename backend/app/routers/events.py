from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.core.logging_config import logger
from app.core.rate_limit import limiter
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventResponse, EventFilter

router = APIRouter(prefix="/events", tags=["Events"])


def log_event_creation(event_id: int, event_type: str, user_id: Optional[int]):
    """Background task: Event oluşturulduğunda logla"""
    logger.info(f"BACKGROUND | Event created | ID: {event_id} | Type: {event_type} | User: {user_id or 'anonymous'}")


@router.post("/", response_model=EventResponse, status_code=201)
@limiter.limit("30/minute")
def create_event(
    request: Request,
    event: EventCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Yeni event oluştur.
    
    - Auth varsa: Otomatik current_user.id kullanılır
    - Auth yoksa: EventCreate.user_id veya anonymous (user_id=NULL)
    - Rate limit: 30 istek/dakika
    """
    # Auth varsa user_id'yi override et, yoksa body'den geleni veya None kullan
    user_id = current_user.id if current_user else (event.user_id or None)
    
    db_event = Event(
        event_type=event.event_type,
        user_id=user_id,
        metadata=event.metadata,
        timestamp=datetime.utcnow()
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Username bilgisini ekle (response için)
    response_data = EventResponse.model_validate(db_event)
    if current_user:
        response_data.username = current_user.username
    elif db_event.user_id:
        user = db.query(User).filter(User.id == db_event.user_id).first()
        response_data.username = user.username if user else None
    
    # Background task: Loglama
    background_tasks.add_task(
        log_event_creation,
        db_event.id,
        db_event.event_type,
        user_id
    )
    
    logger.info(f"EVENT_CREATED | ID: {db_event.id} | Type: {event.event_type} | User: {user_id or 'anonymous'}")
    
    return response_data


@router.get("/", response_model=List[EventResponse])
@limiter.limit("60/minute")
def get_events(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    event_type: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Event listele (pagination + filtreleme).
    
    Query params:
    - skip/limit: Pagination
    - event_type: Belirli event tipi
    - user_id: Belirli kullanıcı
    - start_date/end_date: Tarih aralığı (ISO format)
    """
    query = db.query(Event)
    
    # Filtreler
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if user_id:
        query = query.filter(Event.user_id == user_id)
    if start_date:
        query = query.filter(Event.timestamp >= start_date)
    if end_date:
        query = query.filter(Event.timestamp <= end_date)
    
    # Auth yoksa sadece son 100 event göster (güvenlik)
    if not current_user:
        query = query.order_by(Event.timestamp.desc()).limit(100)
    else:
        query = query.order_by(Event.timestamp.desc())
    
    events = query.offset(skip).limit(limit).all()
    
    # Username bilgilerini ekle
    result = []
    for event in events:
        evt = EventResponse.model_validate(event)
        if event.user_id:
            user = db.query(User).filter(User.id == event.user_id).first()
            evt.username = user.username if user else None
        result.append(evt)
    
    return result


@router.get("/{event_id}", response_model=EventResponse)
@limiter.limit("60/minute")
def get_event(
    request: Request,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Tekil event getir"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    response = EventResponse.model_validate(event)
    if event.user_id:
        user = db.query(User).filter(User.id == event.user_id).first()
        response.username = user.username if user else None
    
    return response


@router.delete("/{event_id}", status_code=204)
@limiter.limit("20/minute")
def delete_event(
    request: Request,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Silme için auth zorunlu
):
    """
    Event sil.
    
    - Sadece kendi event'i veya admin silebilir
    - Rate limit: 20 istek/dakika
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Güvenlik kontrolü
    if event.user_id != current_user.id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")
    
    db.delete(event)
    db.commit()
    
    logger.info(f"EVENT_DELETED | ID: {event_id} | By: {current_user.username}")
    return None