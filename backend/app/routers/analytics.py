from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.services import analytics_service


router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    responses={404: {"description": "Not found"}}
)


@router.get("/daily-events")
def daily_events(
    days: int = Query(30, ge=1, le=365, description="Kaç günlük veri"),
    db: Session = Depends(get_db)
):
    return analytics_service.get_daily_events(db, days=days)


@router.get("/active-users")
def active_users(
    days: int = Query(7, ge=1, le=90, description="Kaç günlük periyot"),
    db: Session = Depends(get_db)
):
    return analytics_service.get_active_users(db, days=days)


@router.get("/event-count")
def event_count(
    event_type: Optional[str] = Query(None, description="Filtre: event tipi"),
    start_date: Optional[datetime] = Query(None, description="Başlangıç tarihi (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="Bitiş tarihi (ISO format)"),
    db: Session = Depends(get_db)
):
    return analytics_service.get_event_count(
        db, event_type=event_type, start_date=start_date, end_date=end_date
    )


@router.get("/event-types")
def event_types(db: Session = Depends(get_db)):
    return analytics_service.get_event_counts_by_type(db)