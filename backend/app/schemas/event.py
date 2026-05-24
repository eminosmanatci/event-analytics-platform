from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any


class EventBase(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=100, description="Event type")
    user_id: Optional[int] = Field(default=None, gt=0, description="User ID (optional)")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional JSON data")


class EventCreate(EventBase):
    pass


class EventResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    event_type: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class EventCountResponse(BaseModel):
    event_type: str
    count: int