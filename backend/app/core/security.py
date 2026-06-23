from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme - auto_error=False ile opsiyonel auth desteği
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False
)


# ═══════════════════════════════════════════════════════════
# PASSWORD UTILS
# ═══════════════════════════════════════════════════════════

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Plain password'ü hash ile karşılaştır"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Password'ü hash'le"""
    return pwd_context.hash(password)


# ═══════════════════════════════════════════════════════════
# JWT TOKEN UTILS
# ═══════════════════════════════════════════════════════════

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT access token oluştur.
    
    Args:
        data: Token içine encode edilecek data (örn: {"sub": user_id})
        expires_delta: Token geçerlilik süresi (default: 30 dakika)
    
    Returns:
        JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    JWT token'ı decode et.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded payload veya None (geçersiz token ise)
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


# ═══════════════════════════════════════════════════════════
# AUTH DEPENDENCIES
# ═══════════════════════════════════════════════════════════

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Zorunlu auth - token yoksa veya geçersizse 401 döner.
    Endpoint'lerde: current_user: User = Depends(get_current_user)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Opsiyonel auth - token yoksa None döner, hata vermez.
    Endpoint'lerde: current_user: Optional[User] = Depends(get_current_user_optional)
    """
    if not token:
        return None
    
    payload = decode_token(token)
    if payload is None:
        return None
    
    user_id = payload.get("sub")
    if user_id is None:
        return None
    
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return None
    
    return db.query(User).filter(User.id == user_id).first()


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Aktif kullanıcı kontrolü (opsiyonel - is_active field'i varsa)
    """
    # if not current_user.is_active:
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user