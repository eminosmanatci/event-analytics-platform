from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


# PostgreSQL bağlantı motoru
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG  # DEBUG=True ise SQL sorgularını terminale yazdırır
)

# Session factory (her request'te yeni session açar)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Model base class (tüm modeller bunu extend eder)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()