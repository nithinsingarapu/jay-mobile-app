# JAY Backend — Complete Build Playbook

**What this is:** A step-by-step, copy-paste-ready guide to build JAY's entire backend from an empty folder to a deployed, scalable production system. Every command is real. Every code block is paste-ready. Every decision is explained.

**How to use this:** Work through it sequentially. Each phase builds on the previous. Don't skip ahead. Each step has a "verify" checkpoint so you know it worked before moving on.

**Time estimate:** 4–6 weeks for a solo builder working full-time. Phase 1 (MVP) is launchable in ~2 weeks.

---

## PHASE 0: Environment Setup (Day 1)

### Step 0.1 — Install core tools

```bash
# Python version manager + Python 3.12
curl -LsSf https://astral.sh/uv/install.sh | sh
uv python install 3.12

# Docker (for local PostgreSQL + Redis)
# Install Docker Desktop from https://docker.com if not already installed

# Verify
uv --version          # should be 0.5+
python --version      # should be 3.12.x
docker --version      # should be 24+
docker compose version # should be 2.x
```

### Step 0.2 — Create the project

```bash
mkdir jay-backend && cd jay-backend

# Initialize with uv
uv init --python 3.12
uv add fastapi uvicorn[standard] pydantic-settings
uv add sqlalchemy[asyncio] asyncpg alembic
uv add redis celery[redis]
uv add pyjwt passlib[argon2] python-multipart
uv add httpx python-jose[cryptography]
uv add langgraph langchain-core
uv add langchain-google-genai langchain-anthropic
uv add boto3  # S3/R2 uploads
uv add sentry-sdk[fastapi]

# Dev dependencies
uv add --dev pytest pytest-asyncio pytest-cov httpx
uv add --dev ruff mypy
uv add --dev factory-boy faker
```

### Step 0.3 — Local infrastructure

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: jay
      POSTGRES_USER: jay
      POSTGRES_PASSWORD: jay_dev_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jay"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

```bash
docker compose up -d
# Verify all three are healthy:
docker compose ps
```

### Step 0.4 — Environment config

Create `.env`:

```env
# App
APP_NAME=jay
APP_ENV=development
DEBUG=true
SECRET_KEY=dev-secret-key-change-in-production-$(openssl rand -hex 32)

# Database
DATABASE_URL=postgresql+asyncpg://jay:jay_dev_password@localhost:5432/jay

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=jwt-dev-secret-change-this
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# AI Providers
GEMINI_API_KEY=your-gemini-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here

# S3/MinIO
S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=jay-uploads
S3_REGION=us-east-1

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

Create `.env.example` (same file, placeholder values).

Add to `.gitignore`:

```
.env
__pycache__/
.venv/
*.pyc
.mypy_cache/
.pytest_cache/
.ruff_cache/
alembic/versions/*.py
!alembic/versions/.gitkeep
```

### Step 0.5 — Project skeleton

```bash
# Create the full directory structure
mkdir -p app/{features/{auth,onboarding,products,routine,diary,chat,research,dupe_finder,cap_or_slap,intelligence,community,diet,gamification,notifications},ai/{providers,prompts,graphs},shared,middleware}
mkdir -p alembic/versions
mkdir -p tests/{features,ai}
mkdir -p assets/fonts scripts

# Create __init__.py files everywhere
find app -type d -exec touch {}/__init__.py \;
touch tests/__init__.py tests/features/__init__.py tests/ai/__init__.py

# Create .gitkeep for empty dirs
touch alembic/versions/.gitkeep
```

**Verify:** Your folder structure should match the architecture doc exactly. Run `find app -type d | sort` and compare.

---

## PHASE 1: Foundation (Days 2–4)

### Step 1.1 — Config module

Create `app/config.py`:

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "jay"
    app_env: str = "development"
    debug: bool = True
    secret_key: str
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str
    
    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 30
    
    # AI
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    
    # S3
    s3_endpoint_url: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket_name: str = "jay-uploads"
    s3_region: str = "us-east-1"
    
    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

### Step 1.2 — Database setup

Create `app/database.py`:

```python
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

### Step 1.3 — Shared dependencies

Create `app/dependencies.py`:

```python
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from app.database import get_db
from app.config import get_settings, Settings

# Database session
DbSession = Annotated[AsyncSession, Depends(get_db)]

# Settings
AppSettings = Annotated[Settings, Depends(get_settings)]


# Redis client (singleton)
_redis_client: Redis | None = None


async def get_redis() -> Redis:
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = Redis.from_url(
            settings.redis_url,
            decode_responses=True,
        )
    return _redis_client


RedisClient = Annotated[Redis, Depends(get_redis)]
```

### Step 1.4 — Custom exceptions

Create `app/shared/exceptions.py`:

```python
from fastapi import HTTPException, status


class NotFoundError(HTTPException):
    def __init__(self, resource: str, identifier: str | int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"{resource} '{identifier}' not found"},
        )


class AuthenticationError(HTTPException):
    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_ERROR", "message": message},
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenError(HTTPException):
    def __init__(self, message: str = "Access denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": message},
        )


class ValidationError(HTTPException):
    def __init__(self, message: str, field: str | None = None):
        detail = {"code": "VALIDATION_ERROR", "message": message}
        if field:
            detail["field"] = field
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class RateLimitError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMITED", "message": "Too many requests. Please try again later."},
        )
```

### Step 1.5 — Pagination helper

Create `app/shared/pagination.py`:

```python
from dataclasses import dataclass
from base64 import b64encode, b64decode
from uuid import UUID
import json


@dataclass
class PaginatedResponse:
    data: list
    cursor: str | None
    has_more: bool


def encode_cursor(last_id: str, last_created_at: str) -> str:
    payload = json.dumps({"id": last_id, "ts": last_created_at})
    return b64encode(payload.encode()).decode()


def decode_cursor(cursor: str) -> dict:
    try:
        payload = b64decode(cursor.encode()).decode()
        return json.loads(payload)
    except Exception:
        return {}
```

### Step 1.6 — Middleware

Create `app/middleware/request_id.py`:

```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
```

Create `app/middleware/rate_limit.py`:

```python
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.dependencies import get_redis


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.rpm = requests_per_minute

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ("/health", "/docs", "/openapi.json"):
            return await call_next(request)

        # Identify client by JWT user ID or IP
        client_id = request.client.host if request.client else "unknown"
        if hasattr(request.state, "user_id"):
            client_id = str(request.state.user_id)

        try:
            redis = await get_redis()
            key = f"ratelimit:{client_id}:{int(time.time()) // 60}"
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, 60)
            if count > self.rpm:
                return JSONResponse(
                    status_code=429,
                    content={"error": {"code": "RATE_LIMITED", "message": "Too many requests"}},
                )
        except Exception:
            pass  # If Redis is down, don't block requests

        return await call_next(request)
```

### Step 1.7 — Main app factory

Create `app/main.py`:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.rate_limit import RateLimitMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    print(f"Starting JAY API ({settings.app_env})")
    yield
    # Shutdown
    print("Shutting down JAY API")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="JAY API",
        description="AI-Powered Personal Skincare Companion",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )

    # Middleware (order matters — last added = first executed)
    app.add_middleware(RateLimitMiddleware, requests_per_minute=60)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.debug else ["https://jay.skin"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check
    @app.get("/health")
    async def health():
        return {"status": "ok", "service": "jay-api"}

    # Mount feature routers (we'll add these as we build each feature)
    # from app.features.auth.router import router as auth_router
    # app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])

    return app


app = create_app()
```

### Step 1.8 — Alembic setup

```bash
uv run alembic init alembic
```

Edit `alembic/env.py` — replace the entire file:

```python
import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.config import get_settings
from app.database import Base

# Import ALL models here so Alembic can detect them
# We'll add imports as we create models:
# from app.features.auth.models import User, SkinProfile
# from app.features.products.models import Product
# etc.

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url.replace("+asyncpg", ""))

target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=settings.database_url,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

Edit `alembic.ini` — change the sqlalchemy.url line:

```ini
# Leave this empty — it's set dynamically in env.py from .env
sqlalchemy.url =
```

### Step 1.9 — First run

```bash
# Start the server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, verify:
curl http://localhost:8000/health
# → {"status":"ok","service":"jay-api"}

# Check docs:
# Open http://localhost:8000/docs in browser
```

**Checkpoint:** You should see the FastAPI Swagger UI with just the `/health` endpoint. If yes, your foundation is solid.

---

## PHASE 2: Auth + User System (Days 4–6)

### Step 2.1 — User models

Create `app/features/auth/models.py`:

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(100))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    auth_provider: Mapped[str] = mapped_column(String(20), default="email")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    skin_profile: Mapped["SkinProfile"] = relationship(back_populates="user", uselist=False)


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    skin_type: Mapped[str | None] = mapped_column(String(20))
    concerns: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=list)
    allergies: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=list)
    budget_range: Mapped[str | None] = mapped_column(String(20))
    age_range: Mapped[str | None] = mapped_column(String(10))
    gender: Mapped[str | None] = mapped_column(String(20))
    climate: Mapped[str | None] = mapped_column(String(30))
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="skin_profile")
```

### Step 2.2 — Auth schemas

Create `app/features/auth/schemas.py`:

```python
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: UUID
    email: str
    display_name: str | None
    avatar_url: str | None
    auth_provider: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SkinProfileOut(BaseModel):
    skin_type: str | None
    concerns: list[str]
    allergies: list[str]
    budget_range: str | None
    age_range: str | None
    gender: str | None
    onboarding_completed: bool

    model_config = {"from_attributes": True}


class SkinProfileUpdate(BaseModel):
    skin_type: str | None = None
    concerns: list[str] | None = None
    allergies: list[str] | None = None
    budget_range: str | None = None
    age_range: str | None = None
    gender: str | None = None
    climate: str | None = None
```

### Step 2.3 — Auth service

Create `app/features/auth/service.py`:

```python
from uuid import UUID
from datetime import datetime, timedelta, timezone
from passlib.hash import argon2
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.shared.exceptions import AuthenticationError, ValidationError
from .models import User, SkinProfile
from .schemas import SignupRequest, LoginRequest, TokenResponse


settings = get_settings()


def hash_password(password: str) -> str:
    return argon2.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return argon2.verify(password, password_hash)


def create_access_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days)
    payload = {"sub": str(user_id), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        raise AuthenticationError("Invalid or expired token")


async def signup(data: SignupRequest, db: AsyncSession) -> TokenResponse:
    # Check if email exists
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise ValidationError("Email already registered", field="email")

    # Create user
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        auth_provider="email",
    )
    db.add(user)
    await db.flush()

    # Create empty skin profile
    profile = SkinProfile(user_id=user.id)
    db.add(profile)
    await db.flush()

    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


async def login(data: LoginRequest, db: AsyncSession) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise AuthenticationError("Invalid email or password")

    if not verify_password(data.password, user.password_hash):
        raise AuthenticationError("Invalid email or password")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


async def refresh_tokens(refresh_token: str, db: AsyncSession) -> TokenResponse:
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise AuthenticationError("Invalid refresh token")

    user_id = UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise AuthenticationError("User not found")

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


async def get_user_by_id(user_id: UUID, db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
```

### Step 2.4 — Auth dependency (get_current_user)

Create `app/features/auth/dependencies.py`:

```python
from typing import Annotated
from uuid import UUID
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.shared.exceptions import AuthenticationError
from .service import decode_token, get_user_by_id
from .models import User

security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise AuthenticationError("Invalid access token")

    user_id = UUID(payload["sub"])
    user = await get_user_by_id(user_id, db)
    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive")

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
```

### Step 2.5 — Auth router

Create `app/features/auth/router.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from . import service
from .schemas import SignupRequest, LoginRequest, TokenResponse, RefreshRequest, UserOut
from .dependencies import CurrentUser

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    return await service.signup(data, db)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await service.login(data, db)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await service.refresh_tokens(data.refresh_token, db)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser):
    return current_user
```

### Step 2.6 — Register router in main.py

Edit `app/main.py` — add inside `create_app()`, after the health check:

```python
    from app.features.auth.router import router as auth_router
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
```

### Step 2.7 — Run first migration

Update `alembic/env.py` — add the model import:

```python
from app.features.auth.models import User, SkinProfile  # noqa
```

```bash
uv run alembic revision --autogenerate -m "create users and skin_profiles"
uv run alembic upgrade head
```

### Step 2.8 — Verify auth works

```bash
uv run uvicorn app.main:app --reload

# In another terminal:
# Signup
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"priya@test.com","password":"test1234","display_name":"Priya"}'

# Should return: {"access_token":"eyJ...", "refresh_token":"eyJ...", ...}

# Use the access_token to call /me
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <paste_access_token_here>"

# Should return: {"id":"...", "email":"priya@test.com", "display_name":"Priya", ...}
```

**Checkpoint:** Signup returns tokens, /me returns user data. Auth is working.

---

## PHASE 3: Products + Routine + Diary (Days 6–10)

This phase builds the three core data features. I'll show the pattern for Products — Routine and Diary follow the exact same pattern (models → schemas → service → router → migration → register).

### Step 3.1 — Products models

Create `app/features/products/models.py`:

```python
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, Boolean, Text, ARRAY, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[str | None] = mapped_column(String(50), index=True)
    subcategory: Mapped[str | None] = mapped_column(String(50))
    price_inr: Mapped[float | None] = mapped_column(Numeric(10, 2))
    size_ml: Mapped[float | None] = mapped_column(Numeric(8, 2))
    key_ingredients: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=list)
    full_ingredients: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    shopify_url: Mapped[str | None] = mapped_column(String(500))
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
```

### Step 3.2 — Products service with search

Create `app/features/products/service.py`:

```python
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from .models import Product


async def search_products(
    db: AsyncSession,
    query: str | None = None,
    brand: str | None = None,
    category: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[Product]:
    stmt = select(Product).where(Product.is_available == True)

    if query:
        # Full-text search on name + brand
        search_filter = or_(
            Product.name.ilike(f"%{query}%"),
            Product.brand.ilike(f"%{query}%"),
            Product.key_ingredients.any(query.lower()),
        )
        stmt = stmt.where(search_filter)

    if brand:
        stmt = stmt.where(Product.brand.ilike(f"%{brand}%"))

    if category:
        stmt = stmt.where(Product.category == category)

    stmt = stmt.order_by(Product.name).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_product_by_id(db: AsyncSession, product_id: int) -> Product | None:
    result = await db.execute(select(Product).where(Product.id == product_id))
    return result.scalar_one_or_none()
```

### Step 3.3 — Products router

Create `app/features/products/router.py`:

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.shared.exceptions import NotFoundError
from . import service
from .schemas import ProductOut

router = APIRouter()


@router.get("", response_model=list[ProductOut])
async def list_products(
    q: str | None = Query(None, description="Search term"),
    brand: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await service.search_products(db, query=q, brand=brand, category=category, limit=limit, offset=offset)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await service.get_product_by_id(db, product_id)
    if not product:
        raise NotFoundError("Product", product_id)
    return product
```

Create `app/features/products/schemas.py`:

```python
from pydantic import BaseModel
from datetime import datetime


class ProductOut(BaseModel):
    id: int
    name: str
    brand: str
    category: str | None
    price_inr: float | None
    size_ml: float | None
    key_ingredients: list[str]
    description: str | None
    image_url: str | None
    is_available: bool

    model_config = {"from_attributes": True}
```

### Step 3.4 — Seed your products_master data

Create `scripts/seed_products.py`:

```python
"""
Seed the products table from your existing products_master CSVs.
Run: uv run python scripts/seed_products.py
"""
import asyncio
import csv
from pathlib import Path
from app.database import async_session_factory
from app.features.products.models import Product


async def seed():
    csv_dir = Path("data/products")  # Put your CSVs here
    
    async with async_session_factory() as db:
        for csv_file in sorted(csv_dir.glob("*.csv")):
            print(f"Seeding from {csv_file.name}...")
            with open(csv_file) as f:
                reader = csv.DictReader(f)
                for row in reader:
                    product = Product(
                        name=row["name"],
                        brand=row["brand"],
                        category=row.get("category"),
                        price_inr=float(row["price_inr"]) if row.get("price_inr") else None,
                        size_ml=float(row["size_ml"]) if row.get("size_ml") else None,
                        key_ingredients=row.get("key_ingredients", "").split("|") if row.get("key_ingredients") else [],
                        full_ingredients=row.get("full_ingredients"),
                        description=row.get("description"),
                    )
                    db.add(product)
            await db.commit()
            print(f"  Done: {csv_file.name}")
    
    print("Seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed())
```

```bash
mkdir -p data/products
# Place your existing products_master CSVs in data/products/
# Then run:
uv run python scripts/seed_products.py
```

### Step 3.5 — Build Routine and Diary (same pattern)

For each feature, create the same 4 files following the auth/products pattern:

**Routine:** `models.py` (Routine + RoutineStep tables), `schemas.py`, `service.py` (CRUD + step ordering + mark-complete), `router.py` (GET/POST/PUT + complete-step endpoint)

**Diary:** `models.py` (DiaryEntry table), `schemas.py`, `service.py` (CRUD by date + monthly listing), `router.py` (GET by month, GET/POST by date)

After creating models:

```bash
# Add model imports to alembic/env.py
# Then:
uv run alembic revision --autogenerate -m "add routines diary products"
uv run alembic upgrade head
```

Register all routers in `app/main.py`:

```python
    from app.features.products.router import router as products_router
    from app.features.routine.router import router as routine_router
    from app.features.diary.router import router as diary_router
    
    app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
    app.include_router(routine_router, prefix="/api/v1/routine", tags=["Routine"])
    app.include_router(diary_router, prefix="/api/v1/diary", tags=["Diary"])
```

**Checkpoint:** Open http://localhost:8000/docs — you should see Auth, Products, Routine, and Diary endpoints. Test each CRUD operation.

---

## PHASE 4: AI Layer — Ask JAY Chat (Days 10–14)

This is where JAY comes alive.

### Step 4.1 — LLM provider abstraction

Create `app/ai/providers/base.py`:

```python
from abc import ABC, abstractmethod
from typing import AsyncIterator
from dataclasses import dataclass


@dataclass
class Message:
    role: str  # "system", "user", "assistant"
    content: str


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, messages: list[Message], **kwargs) -> str:
        """Single response generation."""
        ...

    @abstractmethod
    async def stream(self, messages: list[Message], **kwargs) -> AsyncIterator[str]:
        """Stream response tokens."""
        ...
```

Create `app/ai/providers/gemini.py`:

```python
from typing import AsyncIterator
import google.generativeai as genai
from app.config import get_settings
from .base import LLMProvider, Message


class GeminiProvider(LLMProvider):
    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    async def generate(self, messages: list[Message], **kwargs) -> str:
        chat_messages = [{"role": m.role if m.role != "system" else "user", "parts": [m.content]} for m in messages]
        response = await self.model.generate_content_async(
            chat_messages,
            generation_config={"temperature": 0.7, "max_output_tokens": 2048},
        )
        return response.text

    async def stream(self, messages: list[Message], **kwargs) -> AsyncIterator[str]:
        chat_messages = [{"role": m.role if m.role != "system" else "user", "parts": [m.content]} for m in messages]
        response = await self.model.generate_content_async(
            chat_messages,
            generation_config={"temperature": 0.7, "max_output_tokens": 2048},
            stream=True,
        )
        async for chunk in response:
            if chunk.text:
                yield chunk.text
```

Create `app/ai/providers/claude.py` following the same pattern with the Anthropic SDK.

### Step 4.2 — User context builder

Create `app/ai/context.py`:

```python
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.features.auth.models import SkinProfile
from app.features.routine.models import Routine, RoutineStep
from app.features.diary.models import DiaryEntry
from datetime import datetime, timedelta


async def build_user_context(user_id: UUID, db: AsyncSession) -> str:
    """Build a structured context string for AI prompts."""
    
    # Skin profile
    profile_result = await db.execute(
        select(SkinProfile).where(SkinProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()

    # Active routine
    routine_result = await db.execute(
        select(Routine).where(Routine.user_id == user_id, Routine.is_active == True)
    )
    routines = routine_result.scalars().all()

    # Recent diary (7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    diary_result = await db.execute(
        select(DiaryEntry)
        .where(DiaryEntry.user_id == user_id, DiaryEntry.entry_date >= week_ago.date())
        .order_by(DiaryEntry.entry_date.desc())
    )
    diary_entries = diary_result.scalars().all()

    # Format context
    parts = []
    
    if profile:
        parts.append(f"""USER SKIN PROFILE:
- Skin type: {profile.skin_type or 'Not set'}
- Concerns: {', '.join(profile.concerns) if profile.concerns else 'None specified'}
- Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}
- Budget: {profile.budget_range or 'Not set'}""")

    if routines:
        for routine in routines:
            # Load steps for each routine
            steps_result = await db.execute(
                select(RoutineStep)
                .where(RoutineStep.routine_id == routine.id)
                .order_by(RoutineStep.step_order)
            )
            steps = steps_result.scalars().all()
            step_text = "\n".join(
                f"  {s.step_order}. {s.category}: {s.custom_product_name or 'Product #' + str(s.product_id)}"
                for s in steps
            )
            parts.append(f"CURRENT {routine.period.upper()} ROUTINE:\n{step_text}")

    if diary_entries:
        diary_text = "\n".join(
            f"  {e.entry_date}: mood {e.mood}/5, tags: {', '.join(e.tags) if e.tags else 'none'}"
            for e in diary_entries[:7]
        )
        parts.append(f"RECENT DIARY (last 7 days):\n{diary_text}")

    return "\n\n".join(parts) if parts else "No profile data available yet."
```

### Step 4.3 — Chat system prompt

Create `app/ai/prompts/chat_system.py`:

```python
SYSTEM_PROMPT = """You are JAY, an AI skincare expert and personal skincare companion. You speak like a knowledgeable best friend who happens to know everything about skincare science.

PERSONALITY:
- Warm, clear, supportive, never judgmental
- Science-aware without being clinical
- Opinionated when asked (give clear verdicts, not wishy-washy "it depends")
- Use simple language, avoid jargon unless explaining it
- Keep responses concise — 2-3 short paragraphs max unless the user asks for depth

CAPABILITIES:
- Ingredient analysis and compatibility checks
- Routine building and optimization
- Product recommendations (always consider the user's budget and skin type)
- Myth busting (Cap or Slap style verdicts)
- General skincare education

RULES:
- Never diagnose medical conditions. If something sounds serious (persistent rashes, painful cysts, suspicious moles), recommend seeing a dermatologist.
- Always consider the user's skin profile when giving advice.
- When recommending products, prefer Indian brands and INR pricing.
- If you reference a specific product claim, flag whether it's proven, partially true, or misleading.
- When giving a verdict, use the format: SLAP (legit) or CAP (overhyped), with a brief rationale.

USER CONTEXT:
{user_context}
"""
```

### Step 4.4 — Chat models, service, and streaming router

Create the chat feature following the established pattern, but with one key addition — a **streaming endpoint** using Server-Sent Events (SSE):

Create `app/features/chat/router.py`:

```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.features.auth.dependencies import CurrentUser
from . import service
from .schemas import SendMessageRequest, MessageOut, ConversationOut

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await service.get_conversations(current_user.id, db)


@router.post("/conversations", response_model=ConversationOut, status_code=201)
async def create_conversation(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await service.create_conversation(current_user.id, db)


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conversation_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    return await service.get_messages(conversation_id, current_user.id, db)


@router.post("/{conversation_id}/stream")
async def stream_message(
    conversation_id: str,
    data: SendMessageRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Stream JAY's response as Server-Sent Events."""
    
    async def event_stream():
        async for token in service.stream_response(
            conversation_id=conversation_id,
            user_message=data.content,
            user_id=current_user.id,
            db=db,
        ):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
```

The `service.stream_response` function builds user context, loads conversation history, calls the Gemini provider's `.stream()` method, saves the complete response to the database, and yields tokens as they arrive.

### Step 4.5 — Register and test

```python
# In app/main.py
from app.features.chat.router import router as chat_router
app.include_router(chat_router, prefix="/api/v1/chat", tags=["Chat"])
```

```bash
# Test streaming with curl:
curl -N -X POST http://localhost:8000/api/v1/chat/{conv_id}/stream \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Can I use vitamin C and niacinamide together?"}'

# You should see tokens streaming in real-time
```

**Checkpoint:** Chat streams responses with skincare-specific knowledge, personalized to the user's skin profile.

---

## PHASE 5: Research + Dupes + Verdicts (Days 14–20)

### Step 5.1 — Jay Research (async pipeline)

This is the heaviest AI feature. Use Celery for background processing:

Create `app/features/research/tasks.py`:

```python
from celery import shared_task
from uuid import UUID


@shared_task(name="generate_research_report")
def generate_research_report(report_id: str, product_id: int, user_id: str):
    """
    Runs the 5-branch LangGraph research pipeline.
    Each branch runs concurrently, results saved to research_modules table.
    
    Branches:
    1. Overview — product summary, key metrics
    2. Brand reputation — brand trust analysis
    3. Claims verification — marketing vs reality
    4. Ingredients deep dive — full ingredient breakdown
    5. User review consensus — synthesized review themes
    """
    import asyncio
    asyncio.run(_run_research(report_id, product_id, user_id))


async def _run_research(report_id: str, product_id: int, user_id: str):
    from app.database import async_session_factory
    from app.ai.graphs.research_graph import run_research_pipeline
    from app.features.research.models import ResearchReport, ResearchModule
    from sqlalchemy import select

    async with async_session_factory() as db:
        # Update status to processing
        report = await db.get(ResearchReport, report_id)
        report.status = "processing"
        await db.commit()

        try:
            # Run the LangGraph pipeline
            results = await run_research_pipeline(product_id, user_id, db)

            # Save each module
            for module_type, content in results.items():
                module = ResearchModule(
                    report_id=report_id,
                    module_type=module_type,
                    status="completed",
                    content=content,
                    read_time_minutes=len(str(content)) // 1000 + 1,
                )
                db.add(module)

            # Update report status
            report.status = "completed"
            report.jay_score = results.get("overview", {}).get("score", 0)
            report.verdict = results.get("overview", {}).get("verdict", "")
            await db.commit()

            # TODO: Send push notification to user

        except Exception as e:
            report.status = "failed"
            await db.commit()
            raise
```

The research router triggers this task and returns immediately:

```python
@router.post("/{product_id}", status_code=202)
async def start_research(product_id: int, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Initiate research — returns immediately, processes in background."""
    report = ResearchReport(product_id=product_id, requested_by=current_user.id, status="pending")
    db.add(report)
    await db.flush()
    
    # Dispatch to Celery worker
    generate_research_report.delay(str(report.id), product_id, str(current_user.id))
    
    return {"report_id": str(report.id), "status": "pending", "message": "Research started. We'll notify you when it's ready."}
```

### Step 5.2 — Dupe Finder (deterministic)

Create `app/features/dupe_finder/service.py`:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.features.products.models import Product


# Ingredient importance weights
STAR_ACTIVES = {
    "l-ascorbic acid", "retinol", "niacinamide", "salicylic acid",
    "glycolic acid", "hyaluronic acid", "tretinoin", "azelaic acid",
    "benzoyl peroxide", "vitamin c", "retinal", "bakuchiol",
}
SUPPORTING_ACTIVES = {
    "ceramides", "peptides", "alpha arbutin", "tranexamic acid",
    "centella asiatica", "zinc oxide", "titanium dioxide", "allantoin",
    "panthenol", "squalane", "tea tree oil", "ferulic acid",
}


def normalize_ingredient(name: str) -> str:
    return name.strip().lower().replace("-", " ")


def compute_match_score(original: Product, candidate: Product) -> float:
    if not original.key_ingredients or not candidate.key_ingredients:
        return 0.0

    orig_set = {normalize_ingredient(i) for i in original.key_ingredients}
    cand_set = {normalize_ingredient(i) for i in candidate.key_ingredients}

    total_weight = 0.0
    matched_weight = 0.0
    matching_ingredients = []

    for ingredient in orig_set:
        if ingredient in STAR_ACTIVES:
            weight = 3.0
        elif ingredient in SUPPORTING_ACTIVES:
            weight = 2.0
        else:
            weight = 1.0

        total_weight += weight
        if ingredient in cand_set:
            matched_weight += weight
            matching_ingredients.append(ingredient)

    if total_weight == 0:
        return 0.0

    return round((matched_weight / total_weight) * 100, 1)


async def find_dupes(
    product_id: int,
    db: AsyncSession,
    limit: int = 10,
    min_match: float = 50.0,
) -> list[dict]:
    # Get original product
    original = await db.get(Product, product_id)
    if not original:
        return []

    # Get candidates in same category, different brand, lower price
    stmt = (
        select(Product)
        .where(
            Product.category == original.category,
            Product.id != original.id,
            Product.is_available == True,
        )
    )
    if original.price_inr:
        stmt = stmt.where(Product.price_inr < original.price_inr)

    result = await db.execute(stmt)
    candidates = result.scalars().all()

    # Score and rank
    scored = []
    for candidate in candidates:
        score = compute_match_score(original, candidate)
        if score >= min_match:
            savings = float(original.price_inr - candidate.price_inr) if original.price_inr and candidate.price_inr else 0
            orig_set = {normalize_ingredient(i) for i in (original.key_ingredients or [])}
            cand_set = {normalize_ingredient(i) for i in (candidate.key_ingredients or [])}
            matching = list(orig_set & cand_set)

            scored.append({
                "product": candidate,
                "match_percentage": score,
                "price_savings": savings,
                "matching_ingredients": matching,
            })

    scored.sort(key=lambda x: x["match_percentage"], reverse=True)
    return scored[:limit]
```

### Step 5.3 — Cap or Slap + remaining features

Follow the same pattern for each: models → schemas → service → router → migration → register. The Cap or Slap verdicts use Celery tasks with Claude for AI-generated verdicts. Community, Diet, Gamification, and Notifications all follow standard CRUD patterns.

---

## PHASE 6: Background Jobs + Intelligence (Days 20–24)

### Step 6.1 — Celery configuration

Create `app/worker.py`:

```python
from celery import Celery
from celery.schedules import crontab
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "jay",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Auto-discover tasks in all feature folders
celery_app.autodiscover_tasks([
    "app.features.research",
    "app.features.cap_or_slap",
    "app.features.intelligence",
    "app.features.notifications",
    "app.features.diet",
    "app.features.products",
])

# Scheduled tasks
celery_app.conf.beat_schedule = {
    "generate-daily-insights": {
        "task": "generate_user_insights_all",
        "schedule": crontab(hour=2, minute=0),  # 2 AM IST daily
    },
    "send-morning-reminders": {
        "task": "send_routine_reminders",
        "schedule": crontab(hour=7, minute=0),  # 7 AM IST
        "kwargs": {"period": "am"},
    },
    "send-evening-reminders": {
        "task": "send_routine_reminders",
        "schedule": crontab(hour=20, minute=0),  # 8 PM IST
        "kwargs": {"period": "pm"},
    },
    "recompute-dupe-matches": {
        "task": "recompute_all_dupes",
        "schedule": crontab(day_of_week="sunday", hour=3, minute=0),
    },
    "update-product-data": {
        "task": "sync_product_data",
        "schedule": crontab(hour=4, minute=0),
    },
}
```

```bash
# Run worker (separate terminal):
uv run celery -A app.worker.celery_app worker --loglevel=info --concurrency=4

# Run beat scheduler (another terminal):
uv run celery -A app.worker.celery_app beat --loglevel=info
```

### Step 6.2 — Intelligence engine

Create `app/features/intelligence/tasks.py`:

```python
from celery import shared_task


@shared_task(name="generate_user_insights_all")
def generate_user_insights_all():
    """Run nightly for all active users."""
    import asyncio
    asyncio.run(_generate_all())


async def _generate_all():
    from app.database import async_session_factory
    from sqlalchemy import select
    from app.features.auth.models import User

    async with async_session_factory() as db:
        result = await db.execute(select(User.id).where(User.is_active == True))
        user_ids = [row[0] for row in result.all()]

    # Process each user (could parallelize with group)
    for user_id in user_ids:
        generate_user_insights.delay(str(user_id))


@shared_task(name="generate_user_insights")
def generate_user_insights(user_id: str):
    import asyncio
    asyncio.run(_generate_for_user(user_id))


async def _generate_for_user(user_id: str):
    from uuid import UUID
    from datetime import datetime, timedelta
    from app.database import async_session_factory
    from sqlalchemy import select, func
    from app.features.diary.models import DiaryEntry
    from app.features.routine.models import RoutineStep
    from app.features.intelligence.models import Insight

    uid = UUID(user_id)

    async with async_session_factory() as db:
        # Get last 30 days of diary data
        month_ago = datetime.utcnow() - timedelta(days=30)
        diary_result = await db.execute(
            select(DiaryEntry)
            .where(DiaryEntry.user_id == uid, DiaryEntry.entry_date >= month_ago.date())
            .order_by(DiaryEntry.entry_date)
        )
        entries = diary_result.scalars().all()

        if not entries:
            return

        # Insight 1: Weekly mood trend
        recent_7 = [e for e in entries if e.entry_date >= (datetime.utcnow() - timedelta(days=7)).date()]
        if recent_7:
            good_days = sum(1 for e in recent_7 if e.mood and e.mood >= 4)
            insight = Insight(
                user_id=uid,
                insight_type="weekly_summary",
                title=f"{good_days} out of {len(recent_7)} good skin days this week",
                description="Based on your diary mood ratings from the past 7 days.",
                data={"good_days": good_days, "total_days": len(recent_7)},
            )
            db.add(insight)

        # Insight 2: Product correlation
        # (Compare mood before and after adding a new product to routine)
        # ... implement correlation logic here

        # Insight 3: Tag patterns
        # (Find tags that frequently appear on bad days)
        # ... implement pattern detection here

        await db.commit()
```

---

## PHASE 7: Testing (Ongoing — but formalize here)

### Step 7.1 — Test configuration

Create `tests/conftest.py`:

```python
import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.database import Base, get_db
from app.main import create_app
from app.config import get_settings

settings = get_settings()

# Test database
TEST_DATABASE_URL = settings.database_url.replace("/jay", "/jay_test")
test_engine = create_async_engine(TEST_DATABASE_URL)
TestSessionFactory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionFactory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    app = create_app()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
```

### Step 7.2 — Write tests for each feature

Create `tests/features/test_auth.py`:

```python
import pytest


@pytest.mark.asyncio
async def test_signup(client):
    response = await client.post("/api/v1/auth/signup", json={
        "email": "test@example.com",
        "password": "testpass123",
        "display_name": "Test User",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_signup_duplicate_email(client):
    # First signup
    await client.post("/api/v1/auth/signup", json={
        "email": "dupe@example.com",
        "password": "testpass123",
        "display_name": "User 1",
    })
    # Duplicate
    response = await client.post("/api/v1/auth/signup", json={
        "email": "dupe@example.com",
        "password": "testpass123",
        "display_name": "User 2",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login(client):
    # Signup first
    await client.post("/api/v1/auth/signup", json={
        "email": "login@example.com",
        "password": "testpass123",
        "display_name": "Login User",
    })
    # Login
    response = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "testpass123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_me_unauthorized(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 403  # No auth header
```

```bash
# Create test database
docker compose exec postgres createdb -U jay jay_test

# Run tests
uv run pytest tests/ -v --cov=app --cov-report=term-missing
```

---

## PHASE 8: Deployment (Days 24–28)

### Step 8.1 — Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy app code
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .

# Expose port
EXPOSE 8000

# Run with gunicorn + uvicorn workers
CMD ["uv", "run", "gunicorn", "app.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--timeout", "120"]
```

### Step 8.2 — Production docker-compose

```yaml
# docker-compose.prod.yml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file: .env.production
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  worker:
    build: .
    command: uv run celery -A app.worker.celery_app worker --loglevel=info --concurrency=4
    env_file: .env.production
    depends_on:
      - postgres
      - redis

  beat:
    build: .
    command: uv run celery -A app.worker.celery_app beat --loglevel=info
    env_file: .env.production
    depends_on:
      - redis

  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: jay
      POSTGRES_USER: jay
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

### Step 8.3 — Deploy to Railway (quickest path)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and init
railway login
railway init

# Add services
railway add --name postgres   # Managed PostgreSQL
railway add --name redis      # Managed Redis

# Set environment variables
railway variables set SECRET_KEY=$(openssl rand -hex 32)
railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)
railway variables set GEMINI_API_KEY=your-key
railway variables set ANTHROPIC_API_KEY=your-key
# ... set all .env variables

# Deploy
railway up

# Run migrations on deployed instance
railway run uv run alembic upgrade head
```

---

## PHASE 9: Post-Launch Checklist

### Monitoring

```bash
# Install Sentry SDK (already in dependencies)
# Add to app/main.py startup:
import sentry_sdk
sentry_sdk.init(dsn="your-sentry-dsn", traces_sample_rate=0.1)
```

### Performance baselines to hit

| Endpoint | Target P95 latency |
|----------|-------------------|
| GET /products | < 50ms |
| GET /routine | < 30ms |
| GET /diary | < 40ms |
| POST /chat/stream (first token) | < 1.5s |
| POST /research (job dispatch) | < 200ms |
| GET /dupes | < 100ms (cached), < 500ms (computed) |

### Security hardening

- [ ] Switch JWT to RS256 with rotating keys
- [ ] Enable PostgreSQL SSL
- [ ] Set CORS to production domains only
- [ ] Add request body size limits (10MB max)
- [ ] Enable Sentry for error tracking
- [ ] Set up daily database backups
- [ ] Add API key auth for any public endpoints

---

## Quick Reference: Daily Workflow

```bash
# Start local infra
docker compose up -d

# Start API server
uv run uvicorn app.main:app --reload

# Start Celery worker (separate terminal)
uv run celery -A app.worker.celery_app worker --loglevel=info

# Start Celery beat (separate terminal, only if testing scheduled tasks)
uv run celery -A app.worker.celery_app beat --loglevel=info

# Create new feature (example: scan)
mkdir -p app/features/scan
touch app/features/scan/{__init__,models,schemas,service,router}.py

# After adding new models:
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head

# Run tests
uv run pytest tests/ -v

# Lint
uv run ruff check app/ --fix
uv run mypy app/
```

---

## Timeline Summary

| Phase | Days | What you build | What's launchable after |
|-------|------|---------------|------------------------|
| 0 | 1 | Environment, Docker, project skeleton | Nothing — setup only |
| 1 | 2–4 | Config, database, middleware, main app | Health check endpoint |
| 2 | 4–6 | Auth, JWT, user profiles, onboarding | User signup/login |
| 3 | 6–10 | Products, routine, diary | Core app (users can build routines, log diary) |
| 4 | 10–14 | AI chat (Ask JAY), streaming | **MVP launchable** — users can chat, build routines, track skin |
| 5 | 14–20 | Research pipeline, dupe finder, verdicts | Full feature set |
| 6 | 20–24 | Celery jobs, intelligence, notifications | Smart insights, reminders |
| 7 | Ongoing | Tests for each feature | Confidence to ship |
| 8 | 24–28 | Docker, Railway deploy, monitoring | **Production deployed** |

**Day 14 is your MVP.** Auth + products + routines + diary + Ask JAY chat. That's enough to launch, get users, and validate before building the rest.

---

*Start with Phase 0 right now. Once Docker is running and the first `curl /health` returns `{"status": "ok"}`, you're in the game.*
