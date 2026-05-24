from pydantic import BaseModel, Field, field_validator
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
    
    @field_validator('metadata', mode='before')
    @classmethod
    def parse_metadata(cls, v):
        """SQLAlchemy JSON -> Python dict dönüşümü"""
        if v is None:
            return None
        if isinstance(v, dict):
            return v
        # SQLAlchemy JSON objesi veya string gelirse
        import json
        if hasattr(v, 'val'):  # PostgreSQL JSON type
            return v.val
        if isinstance(v, str):
            return json.loads(v)
        return dict(v) if hasattr(v, '__iter__') else None
    
    @field_validator('timestamp', mode='before')
    @classmethod
    def parse_timestamp(cls, v):
        """None veya string timestamp'ı handle et"""
        if v is None:
            return datetime.utcnow()
        if isinstance(v, datetime):
            return v
        if isinstance(v, str):
            from datetime import datetime as dt
            return dt.fromisoformat(v.replace('Z', '+00:00'))
        return v


class EventCountResponse(BaseModel):
    event_type: str
    count: int