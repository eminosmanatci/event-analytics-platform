from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# In-memory rate limiter (basit, tek instance için yeterli)
# Redis'e geçmek istersen: limiter = Limiter(key_func=get_remote_address, storage_uri="redis://redis:6379")
limiter = Limiter(key_func=get_remote_address)

def setup_rate_limiting(app):
    """FastAPI app'e rate limiting middleware'i ekler"""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    return limiter