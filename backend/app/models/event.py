from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func

from app.core.database import Base


class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)  # ← nullable=True (schema ile uyumlu)
    event_type = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    metadata_ = Column("metadata", JSON, nullable=True)  # DB'de "metadata", Python'da metadata_
    
    def __repr__(self):
        return f"<Event(id={self.id}, type={self.event_type}, user={self.user_id})>"