from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas.event import EventCreate, EventResponse
from app.routers.auth import get_current_user, oauth2_scheme
from app.services.event_service import create_event, get_events, get_event_by_id

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_new_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # Token'dan user_id al (şimdilik basit, servis katmanında decode edilebilir)
    # Şimdilik anonim event olarak kaydedelim, sonraki adımda user bağlayacağız
    return create_event(db, event)


@router.get("/", response_model=List[EventResponse])
def list_events(
    skip: int = 0,
    limit: int = 100,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Sadece giriş yapmış kullanıcılar eventleri görebilir"""
    return get_events(db, skip=skip, limit=limit, event_type=event_type)


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    event = get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event