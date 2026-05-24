#!/bin/sh
set -e

echo "⏳ Waiting for database..."
sleep 3

echo "🚀 Running migrations..."
alembic upgrade head

echo "✅ Migrations applied successfully"

echo "🎯 Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload