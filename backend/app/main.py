from datetime import datetime  # ← EKLENDİ
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.rate_limit import setup_rate_limiting
from app.core.logging_config import LogMiddleware, logger
from app.routers import events, analytics, auth

app = FastAPI(
    title=settings.APP_NAME,
    description="Scalable event tracking system that collects, processes, and analyzes user activity data.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Rate limiting setup
setup_rate_limiting(app)

# Logging middleware
app.add_middleware(LogMiddleware)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://frontend:5173",
        "http://event-analytics-frontend:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(events.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "message": "Event Analytics Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "features": ["rate_limiting", "caching", "background_tasks", "logging"]
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Event Analytics Platform API started")