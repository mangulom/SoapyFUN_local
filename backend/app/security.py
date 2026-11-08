from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.settings import settings

password_hash = PasswordHash.recommended()
JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_access_token(user_id: int, email: str) -> str:
    secret = settings.secret_key
    if len(secret) < 32:
        raise RuntimeError("SECRET_KEY must be set to at least 32 characters")
    now = datetime.now(timezone.utc)
    claims = {"sub": str(user_id), "email": email, "iat": now, "exp": now + timedelta(hours=8)}
    return jwt.encode(claims, secret, algorithm=JWT_ALGORITHM)
