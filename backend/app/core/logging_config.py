import logging
import sys
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware  # ← EKLENDİ

def setup_logging():
    """Production-ready logging yapılandırması"""
    
    # Format: timestamp | level | message
    log_format = "%(asctime)s | %(levelname)-8s | %(message)s"
    
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),  # Console output
            logging.FileHandler("app.log", encoding="utf-8")  # File output
        ]
    )
    
    # SQLAlchemy loglarını kapat (gürültü engelleme)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    return logging.getLogger("event_analytics")


logger = setup_logging()


class LogMiddleware(BaseHTTPMiddleware):  # ← BaseHTTPMiddleware'den türettik
    """Her request/response'u loglayan middleware"""
    
    async def dispatch(self, request, call_next):  # ← __call__ yerine dispatch kullanıyoruz
        start_time = datetime.utcnow()
        
        # Request logla
        logger.info(f"REQUEST | {request.method} {request.url.path} | {request.client.host}")
        
        try:
            response = await call_next(request)
        except Exception as e:
            # Hata durumunda loglama yap ve hatayı yukarı fırlat
            duration = (datetime.utcnow() - start_time).total_seconds() * 1000
            logger.error(f"ERROR | {request.method} {request.url.path} | Failed after {duration:.2f}ms | Error: {str(e)}")
            raise e
        
        # Response logla
        duration = (datetime.utcnow() - start_time).total_seconds() * 1000
        logger.info(
            f"RESPONSE | {request.method} {request.url.path} | "
            f"Status: {response.status_code} | Duration: {duration:.2f}ms"
        )
        
        return response