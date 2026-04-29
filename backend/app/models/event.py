from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func

from app.core.database import Base


class Event(Base):
    
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    metadata_ = Column("metadata", JSON, nullable=True)  # 'metadata' SQL keyword olduğu için alias kullandık
    
    def __repr__(self):
        return f"<Event(id={self.id}, type={self.event_type}, user={self.user_id})>"