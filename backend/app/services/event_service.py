from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse


def create_event(db: Session, event: EventCreate) -> EventResponse:
    db_event = Event(
        user_id=event.user_id,
        event_type=event.event_type,
        metadata_=event.metadata
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return EventResponse.from_orm(db_event)  # ← from_orm kullan!


def get_events(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    event_type: Optional[str] = None,
    user_id: Optional[int] = None
) -> List[EventResponse]:
    query = db.query(Event)
    
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if user_id:
        query = query.filter(Event.user_id == user_id)
    
    events = query.order_by(Event.timestamp.desc()).offset(skip).limit(limit).all()
    return [EventResponse.from_orm(event) for event in events]  # ← from_orm kullan!


def get_event_by_id(db: Session, event_id: int) -> Optional[EventResponse]:
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if db_event:
        return EventResponse.from_orm(db_event)  # ← from_orm kullan!
    return None