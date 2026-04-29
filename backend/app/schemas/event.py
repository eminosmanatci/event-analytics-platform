from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any


class EventBase(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=100, description="Olay tipi")
    user_id: int = Field(..., gt=0, description="Kullanıcı ID")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Ek veri (JSON)")


class EventCreate(EventBase):
    pass


class EventResponse(BaseModel):
    id: int
    user_id: int
    event_type: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            user_id=obj.user_id,
            event_type=obj.event_type,
            timestamp=obj.timestamp,
            metadata=obj.metadata_  # ← Burada map ediyoruz!
        )


class EventCountResponse(BaseModel):
    event_type: str
    count: int