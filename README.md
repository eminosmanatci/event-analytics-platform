# Event Analytics Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Alembic](https://img.shields.io/badge/Alembic-6F4E37?style=flat)](https://alembic.sqlalchemy.org/)

&gt; Scalable event tracking system that collects, processes, and analyzes user activity data with FastAPI and PostgreSQL.

## Features

- **Event Ingestion API** - Collect user actions via REST API
- **Real-time Storage** - PostgreSQL with JSON metadata support
- **Analytics Dashboard** - Aggregation endpoints with filtering
- **Database Migrations** - Alembic for schema versioning
- **Auto-generated Docs** - Swagger UI & ReDoc

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| API Docs | OpenAPI/Swagger |

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 16+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/eminosmanatci/event-analytics-platform.git
cd event-analytics-platform

# Setup backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload

API Endpoints
Table
Method	Endpoint	Description
POST	/api/v1/events/	Create new event
GET	/api/v1/events/	List events (with filters)
GET	/api/v1/events/{id}	Get single event
GET	/api/v1/analytics/daily-events	Daily event counts
GET	/api/v1/analytics/active-users	Active user count
GET	/api/v1/analytics/event-count	Filtered event count
GET	/api/v1/analytics/event-types	Event type distribution
Example Request
bash
Copy
curl -X POST "http://localhost:8000/api/v1/events/" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_login",
    "user_id": 1,
    "metadata": {"device": "mobile", "os": "ios"}
  }'
Project Structure
plain
Copy
backend/
├── app/
│   ├── core/          # Config & database
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── routers/       # API endpoints
│   └── services/      # Business logic
├── alembic/           # DB migrations
└── tests/             # Test suite
Architecture
plain
Copy
Client → FastAPI → PostgreSQL
              ↓
        Background Worker
              ↓
        Analytics API
License
MIT
