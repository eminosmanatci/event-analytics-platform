from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    
    APP_NAME: str = "Event Analytics Platform"
    DEBUG: bool = False
    
    DATABASE_URL: str
    API_V1_PREFIX: str = "/api/v1"
    
    # JWT Ayarları
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()