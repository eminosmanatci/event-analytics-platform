#!/bin/sh
set -e

echo "⏳ Waiting for database..."
# DB'nin hazır olmasını bekle (zaten healthcheck var ama ekstra güvenlik)
sleep 3

echo "🚀 Running migrations..."
# Önce migration dene
if alembic upgrade head; then
    echo "✅ Migrations applied successfully"
else
    echo "⚠️ Migration failed or no migrations found. Creating tables directly..."
    # Python ile create_all çalıştır
    python -c "
from app.core.database import Base, engine
from app.models.event import Event
from app.models.user import User
Base.metadata.create_all(bind=engine)
print('✅ Tables created successfully')
"
fi

echo "🎯 Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload