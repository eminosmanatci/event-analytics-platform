from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse


def create_event(db: Session, event: EventCreate) -> Event:
    db_event = Event(
        user_id=event.user_id,
        event_type=event.event_type,
        metadata_=event.metadata  # ← modelde metadata_, schema'da metadata
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event  # ← direkt model döndür, router'da response_model halleder


def get_events(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    event_type: Optional[str] = None,
    user_id: Optional[int] = None
) -> List[Event]:
    query = db.query(Event)
    
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if user_id:
        query = query.filter(Event.user_id == user_id)
    
    return query.order_by(Event.timestamp.desc()).offset(skip).limit(limit).all()


def get_event_by_id(db: Session, event_id: int) -> Optional[Event]:
    return db.query(Event).filter(Event.id == event_id).first()

def delete_event(db: Session, event_id: int) -> bool:
    """Delete an event by ID. Returns True if deleted, False if not found."""
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        return False
    
    db.delete(db_event)
    db.commit()
    return True