import os
from celery import Celery
from app.core.database import SessionLocal
from app.models.event import Event

# Redis URL'ini al (Docker üzerinden gelecek)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Celery uygulamasını başlat
celery_app = Celery(
    "event_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

@celery_app.task(name="process_event_task")
def process_event_task(event_data: dict):
    """
    Kuyruktan veriyi alır ve PostgreSQL'e kaydeder.
    API'yi meşgul etmeden arka planda çalışır.
    """
    db = SessionLocal()
    try:
        db_event = Event(
            user_id=event_data.get("user_id"),
            event_type=event_data.get("event_type"),
            metadata_=event_data.get("metadata")
        )
        db.add(db_event)
        db.commit()
        return f"Event {db_event.id} saved successfully."
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()