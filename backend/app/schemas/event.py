from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, Dict, Any, List


class EventBase(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=100, description="Event type")
    user_id: Optional[int] = Field(default=None, gt=0, description="User ID (optional)")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional JSON data")


class EventCreate(EventBase):
    pass


class EventResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None  # NEW: Kullanıcı adı (varsa)
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
        import json
        if hasattr(v, 'val'):
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


# NEW: Event filtreleme için query params
class EventFilter(BaseModel):
    event_type: Optional[str] = None
    user_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    skip: int = 0
    limit: int = 100


# NEW: Dashboard istatistikleri
class DashboardStats(BaseModel):
    total_events: int
    active_users: int
    event_types_count: int
    todays_events: int
    period_change_percent: Optional[float] = None


# NEW: Event tipi dağılımı (chart için)
class EventTypeDistribution(BaseModel):
    type: str
    count: int
    percentage: Optional[float] = None


# NEW: Günlük event sayısı (line chart için)
class DailyEventCount(BaseModel):
    date: str
    count: int


# NEW: Aktif kullanıcı istatistikleri
class ActiveUserStats(BaseModel):
    date: str
    count: int


class AnalyticsSummary(BaseModel):
    daily_events: List[DailyEventCount]
    event_types: List[EventTypeDistribution]
    active_users: List[ActiveUserStats]
    total_unique_users: int