from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import engine, get_db
from app.models import Base, Role, User
from app.security import create_access_token, verify_password
from app.settings import settings

app = FastAPI(
    title="SoapyFUN API",
    description="API de gestion de jaboneria artesanal: inventario, compras y ventas.",
    version="0.1.0",
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class LoginRequest(BaseModel):
    model_config = ConfigDict(  # local/demo domains are valid account identifiers here
        json_schema_extra={"example": {"email": "admin@soapyfun.local", "password": "..."}}
    )
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Enter a valid email address")
        return normalized


class UserResponse(BaseModel):
    id: int
    email: str
    nombre: str
    rol: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UserResponse


@app.middleware("http")
async def development_cors_for_local_frontend(request, call_next):
    """Allow local Angular development origins without exposing DB configuration."""
    origin = request.headers.get("origin", "")
    allowed_origin = origin if origin in settings.allowed_origins() else None
    if settings.app_env == "development" and origin in {
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    }:
        allowed_origin = origin

    if request.method == "OPTIONS" and allowed_origin:
        from starlette.responses import Response

        response = Response(status_code=204)
        response.headers["Access-Control-Allow-Origin"] = allowed_origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = request.headers.get(
            "access-control-request-headers", "Authorization, Content-Type"
        )
        response.headers["Access-Control-Max-Age"] = "600"
        response.headers["Vary"] = "Origin"
        return response

    response = await call_next(request)
    if allowed_origin:
        response.headers["Access-Control-Allow-Origin"] = allowed_origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response


@app.get("/api/health", tags=["system"])
def health() -> dict[str, str]:
    """Liveness check; does not expose credentials or database details."""
    return {"status": "ok", "application": "SoapyFUN API", "version": app.version}


@app.get("/health", tags=["system"], include_in_schema=False)
def short_health() -> dict[str, str]:
    """Short health-check path for local tooling."""
    return health()


@app.post("/api/auth/login", tags=["auth"], response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if user is None or not user.is_active or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    role = db.get(Role, user.role_id)
    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        usuario=UserResponse(id=user.id, email=user.email, nombre=user.full_name, rol=role.name if role else "user"),
    )


@app.get("/api/auth/me", tags=["auth"], response_model=UserResponse)
def current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserResponse:
    import jwt
    try:
        claims = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user = db.get(User, int(claims["sub"]))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida") from exc
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no disponible")
    role = db.get(Role, user.role_id)
    return UserResponse(id=user.id, email=user.email, nombre=user.full_name, rol=role.name if role else "user")


@app.get("/api/health/ready", tags=["system"])
def readiness() -> dict[str, str]:
    """Check PostgreSQL without returning its URL or credentials."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return {"status": "degraded", "database": "unavailable"}
    return {"status": "ok", "database": "available"}
