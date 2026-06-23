from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.event import Event
from app.schemas.event import EventCreate
from app.worker import process_event_task

def create_event(event: EventCreate) -> dict:
    """
    Event'i alır, direkt veritabanına yazmak yerine Redis kuyruğuna atar.
    """
    # Pydantic modelini dictionary formatına çeviriyoruz ki Celery işleyebilsin
    event_dict = {
        "user_id": event.user_id,
        "event_type": event.event_type,
        "metadata": event.metadata
    }
    
    # process_event_task görevini arka planda (delay ile) çalıştır
    process_event_task.delay(event_dict)
    
    # Kullanıcıya anında cevap dönüyoruz
    return {"status": "accepted", "message": "Event is queued for processing"}

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
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        return False
    
    db.delete(db_event)
    db.commit()
    return True