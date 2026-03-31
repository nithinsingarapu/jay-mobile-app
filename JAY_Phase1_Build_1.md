# JAY Backend — Phase 1: Complete Build from Zero

> **Prerequisites:** A computer with a terminal. That's it. This prompt handles everything else.
> **Attach:** `JAY_UserProfile_Prompt.md` (questionnaire reference)
> **Time:** ~45 minutes end to end

---

## BEFORE YOU PASTE INTO CLAUDE CODE — Do These 3 Things Manually

### 1. Install uv (Python package manager — replaces pip, venv, poetry)

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify
uv --version
# Should print uv 0.5.x or higher
```

### 2. Create a Supabase Project (free — takes 2 minutes)

1. Go to https://supabase.com → Sign up / Log in
2. Click "New Project"
3. Pick any organization, name it "jay", set a database password (SAVE THIS), pick a region close to you
4. Wait ~60 seconds for it to provision

Now collect these 3 values from the Supabase dashboard:

**Value 1 — JWT Secret:**
- Go to Settings (gear icon) → API → scroll to "JWT Settings"
- Copy the "JWT Secret" string

**Value 2 — Project URL:**
- Same Settings → API page
- Copy the "Project URL" (looks like `https://abcdefgh.supabase.co`)

**Value 3 — Database Connection String:**
- Go to Settings → Database
- Under "Connection string", select "Transaction pooler" tab (NOT "Direct")
- Copy the URI
- It looks like: `postgresql://postgres.abcdefgh:YOUR-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
- You'll need to change `postgresql://` to `postgresql+asyncpg://` (add `+asyncpg`)

### 3. Enable Google OAuth in Supabase (optional — do later if you want)

- Dashboard → Authentication → Providers → Google → Enable
- You'll need a Google Cloud OAuth client ID (https://console.cloud.google.com → Credentials)
- Skip this for now if you just want to test with email/password

---

## NOW PASTE THIS INTO CLAUDE CODE

```
I need you to build the complete Phase 1 backend for JAY, an AI-powered skincare companion app. Nothing exists yet — build everything from an empty folder.

I've attached JAY_UserProfile_Prompt.md which has the complete profile schema and questionnaire design. Use it for all questionnaire content.

Here's what Phase 1 includes:
- Project setup (Python, dependencies, config)
- Supabase JWT verification (my auth system — Supabase handles signup/login/OAuth on the frontend, my backend just verifies the JWT)
- User profiles table in Supabase PostgreSQL (via SQLAlchemy + Alembic migrations)
- Complete 6-section onboarding questionnaire system
- Dev test-token endpoint for testing without a frontend

Here's what Phase 1 does NOT include:
- No Docker, no Redis, no Celery, no background jobs
- No AI features, no product database, no chat
- No auth endpoints (Supabase handles all auth on the frontend)

The entire backend runs with one command: `uv run uvicorn app.main:app --reload`

---

## STEP 1: Create the project

Create a folder called `jay-backend` in the current directory. Inside it, create everything:

### 1a. pyproject.toml

```toml
[project]
name = "jay-backend"
version = "0.1.0"
description = "JAY — AI-Powered Personal Skincare Companion API"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic-settings>=2.6.0",
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30.0",
    "alembic>=1.14.0",
    "pyjwt>=2.9.0",
    "cryptography>=44.0.0",
    "httpx>=0.28.0",
    "python-multipart>=0.0.18",
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "W"]
```

### 1b. .env.example

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret

# Database (Supabase PostgreSQL — use Transaction pooler URI with +asyncpg)
DATABASE_URL=postgresql+asyncpg://postgres.your-project:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# App
DEBUG=true
```

### 1c. .env

Create this file with the SAME content as .env.example. The user will fill in their actual Supabase values. For now, use the placeholder values so the file exists.

### 1d. .gitignore

```
.env
__pycache__/
*.pyc
.venv/
alembic/versions/*.py
!alembic/versions/.gitkeep
.ruff_cache/
.pytest_cache/
*.egg-info/
```

### 1e. Directory structure

```
jay-backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── auth.py
│   ├── features/
│   │   ├── __init__.py
│   │   └── profile/
│   │       ├── __init__.py
│   │       ├── models.py
│   │       ├── schemas.py
│   │       ├── service.py
│   │       ├── router.py
│   │       └── questionnaire.py
│   └── shared/
│       ├── __init__.py
│       └── exceptions.py
├── alembic/
│   └── versions/
│       └── .gitkeep
├── pyproject.toml
├── .env
├── .env.example
└── .gitignore
```

Create all directories and all `__init__.py` files. The `__init__.py` files can be empty.

### 1f. Install dependencies

```bash
cd jay-backend
uv sync
```

This installs Python 3.12 (if not present) and all dependencies into a local `.venv`.

---

## STEP 2: Build the foundation (4 files)

### app/config.py

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = "https://placeholder.supabase.co"
    supabase_jwt_secret: str = "placeholder-secret"
    database_url: str = "postgresql+asyncpg://localhost:5432/jay"
    debug: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

### app/database.py

Connect to Supabase's PostgreSQL via SQLAlchemy async. This is a standard Postgres connection — nothing Supabase-specific about it.

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=5,
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


async def get_db():
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

### app/shared/exceptions.py

```python
from fastapi import HTTPException, status


class AuthError(HTTPException):
    def __init__(self, message: str = "Not authenticated"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message,
            headers={"WWW-Authenticate": "Bearer"},
        )


class NotFoundError(HTTPException):
    def __init__(self, resource: str, identifier: str | int = ""):
        detail = f"{resource} not found" if not identifier else f"{resource} '{identifier}' not found"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ConflictError(HTTPException):
    def __init__(self, message: str):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=message)
```

### app/auth.py

This is the ENTIRE auth system. One file. ~60 lines. It verifies Supabase JWTs — nothing else.

The mobile app handles signup, login, Google OAuth, password reset — all via the Supabase SDK. By the time a request hits our backend, the user is already authenticated and we get a JWT in the `Authorization: Bearer <token>` header.

```python
"""
Supabase JWT verification.

The React Native app uses @supabase/supabase-js for:
  - supabase.auth.signUp({ email, password })
  - supabase.auth.signInWithPassword({ email, password })
  - supabase.auth.signInWithOAuth({ provider: 'google' })
  - supabase.auth.resetPasswordForEmail(email)

It sends the resulting access_token to our API.
We verify it here and extract the user_id. That's it.
"""

from typing import Annotated
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt as pyjwt

from app.config import get_settings
from app.shared.exceptions import AuthError

security = HTTPBearer()


def verify_supabase_token(token: str) -> dict:
    """Verify a Supabase JWT. Returns the decoded payload."""
    settings = get_settings()
    try:
        payload = pyjwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except pyjwt.ExpiredSignatureError:
        raise AuthError("Token has expired — please sign in again")
    except pyjwt.InvalidAudienceError:
        raise AuthError("Invalid token audience")
    except pyjwt.InvalidTokenError as e:
        raise AuthError(f"Invalid token: {e}")


class CurrentUser:
    """
    The authenticated user, extracted from the Supabase JWT.

    NOT a database model. Just a lightweight object holding JWT claims.
    The user's profile/business data lives in our user_profiles table.
    """

    def __init__(self, payload: dict):
        self.id: str = payload["sub"]
        self.email: str = payload.get("email", "")
        self.role: str = payload.get("role", "authenticated")

        meta = payload.get("user_metadata", {})
        self.full_name: str = meta.get("full_name", meta.get("name", ""))
        self.avatar_url: str | None = meta.get("avatar_url", meta.get("picture"))

    def __repr__(self):
        return f"CurrentUser(id={self.id}, email={self.email})"


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> CurrentUser:
    """FastAPI dependency — extracts and verifies the Supabase JWT."""
    payload = verify_supabase_token(credentials.credentials)
    return CurrentUser(payload)


# Type alias for clean route signatures
AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]
```

---

## STEP 3: Build the profile feature (5 files)

### app/features/profile/models.py

One table. Native PostgreSQL types (ARRAY, JSONB, UUID, TIMESTAMPTZ). This table stores everything about a user's skincare profile.

The `user_id` column holds the UUID from Supabase's `auth.users.id`. There's NO foreign key constraint because `auth.users` is in Supabase's managed schema that we don't control. The link is logical, not enforced by the database.

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)

    # Synced from Supabase JWT on every request
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Section 1: Basics
    username: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True, index=True)
    date_of_birth: Mapped[str | None] = mapped_column(String(10), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    location_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location_state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location_country: Mapped[str] = mapped_column(String(100), default="India")

    # Section 2: Skin identity
    skin_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fitzpatrick_type: Mapped[int | None] = mapped_column(Integer, nullable=True)
    primary_concerns: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    skin_feel_midday: Mapped[str | None] = mapped_column(String(30), nullable=True)
    skin_history: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    allergies: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    sensitivities: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)

    # Sections 3-6: Nested JSONB
    current_skin_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    current_routine: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    lifestyle: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    preferences: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Onboarding
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_progress: Mapped[dict] = mapped_column(
        JSONB,
        default=lambda: {
            "basics": False, "skin": False, "skin_state": False,
            "routine": False, "lifestyle": False, "preferences": False,
        },
    )
    profile_completeness: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
```

### app/features/profile/schemas.py

Section-specific Pydantic models. Each section saves independently. Use Literal types for all enum fields so Pydantic validates the values.

```python
from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
from uuid import UUID


# --- Section inputs (one per onboarding section) ---

class BasicsUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
    date_of_birth: str | None = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    gender: Literal["male", "female", "non_binary", "prefer_not_to_say"] | None = None
    location_city: str | None = Field(None, max_length=100)
    location_state: str | None = Field(None, max_length=100)
    location_country: str | None = Field(None, max_length=100)


class SkinIdentityUpdate(BaseModel):
    skin_type: Literal["oily", "dry", "combination", "normal"] | None = None
    fitzpatrick_type: int | None = Field(None, ge=1, le=6)
    primary_concerns: list[str] | None = Field(None, max_length=5)
    skin_feel_midday: Literal[
        "oily_all_over", "oily_t_zone", "comfortable", "tight_dry", "varies"
    ] | None = None
    skin_history: list[str] | None = None
    allergies: list[str] | None = None
    sensitivities: list[str] | None = None


class SkinStateUpdate(BaseModel):
    acne_level: int = Field(ge=0, le=5)
    oiliness_level: int = Field(ge=0, le=5)
    dryness_level: int = Field(ge=0, le=5)
    irritation_level: int = Field(ge=0, le=5)
    new_breakouts: bool = False
    overall_feeling: Literal["great", "good", "okay", "bad", "terrible"] = "okay"


class RoutineStateUpdate(BaseModel):
    am_steps: list[str] | None = None
    pm_steps: list[str] | None = None
    routine_duration_minutes: int | None = Field(None, ge=0, le=120)
    routine_consistency: Literal["daily", "most_days", "sometimes", "rarely"] | None = None
    products_currently_using: list[str] | None = None
    how_long_current_routine: Literal[
        "less_than_month", "1_3_months", "3_6_months",
        "6_plus_months", "over_a_year", "no_routine",
    ] | None = None


class LifestyleUpdate(BaseModel):
    physical_activity: Literal["sedentary", "light", "moderate", "active", "very_active"] | None = None
    water_intake_glasses: int | None = Field(None, ge=0, le=15)
    sleep_hours: float | None = Field(None, ge=0, le=16)
    sleep_quality: Literal["great", "good", "okay", "poor", "terrible"] | None = None
    sun_exposure: Literal["minimal", "moderate", "high", "very_high"] | None = None
    sun_protection_habit: Literal["always", "mostly", "sometimes", "rarely", "never"] | None = None
    travel_frequency: Literal["rarely", "monthly", "weekly", "constantly"] | None = None
    diet_type: Literal[
        "vegetarian", "non_vegetarian", "vegan", "eggetarian", "pescatarian", "flexitarian"
    ] | None = None
    dairy_consumption: Literal["daily", "often", "sometimes", "rarely", "never"] | None = None
    sugar_consumption: Literal["daily", "often", "sometimes", "rarely", "never"] | None = None
    spicy_food: Literal["love_it", "moderate", "mild", "avoid"] | None = None
    smoking: Literal["never", "occasionally", "regularly", "quit"] | None = None
    alcohol: Literal["never", "occasionally", "socially", "regularly"] | None = None
    stress_level: Literal["low", "moderate", "high", "very_high"] | None = None
    screen_time_hours: float | None = Field(None, ge=0, le=16)


class PreferencesUpdate(BaseModel):
    budget_range: Literal["under_500", "500_1000", "1000_2000", "2000_plus", "no_limit"] | None = None
    product_preference: Literal[
        "pharmacy", "luxury", "natural", "korean", "ayurvedic", "no_preference"
    ] | None = None
    ingredient_preference: Literal[
        "clean_only", "science_backed", "natural_only", "no_preference"
    ] | None = None
    fragrance_preference: Literal[
        "love", "neutral", "prefer_unscented", "strictly_unscented"
    ] | None = None
    remedy_openness: Literal[
        "love_home_remedies", "open_to_trying", "prefer_products", "products_only"
    ] | None = None
    routine_complexity: Literal[
        "minimal_1_3", "moderate_4_5", "elaborate_6_plus", "whatever_works"
    ] | None = None
    top_goal: Literal[
        "clear_skin", "anti_aging", "glow", "even_tone", "hydration", "oil_control"
    ] | None = None
    willing_to_try_prescription: bool | None = None
    preferred_texture: list[str] | None = None
    shopping_preference: Literal["online", "offline", "both"] | None = None


# --- Response schemas ---

class UserProfileOut(BaseModel):
    user_id: str
    email: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    username: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    location_city: str | None = None
    location_state: str | None = None
    location_country: str = "India"
    skin_type: str | None = None
    fitzpatrick_type: int | None = None
    primary_concerns: list[str] | None = None
    skin_feel_midday: str | None = None
    skin_history: list[str] | None = None
    allergies: list[str] | None = None
    sensitivities: list[str] | None = None
    current_skin_state: dict | None = None
    current_routine: dict | None = None
    lifestyle: dict | None = None
    preferences: dict | None = None
    onboarding_completed: bool = False
    onboarding_progress: dict = {}
    profile_completeness: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ProfileCompletenessOut(BaseModel):
    completeness: int
    sections: dict
    onboarding_completed: bool
```

### app/features/profile/service.py

The business logic. Key design: profile auto-creates on first authenticated request using JWT data. No separate "create account" call from the backend's perspective.

IMPORTANT JSONB NOTE: SQLAlchemy does NOT detect in-place mutations to JSONB/dict columns. You MUST reassign the entire dict for changes to persist. Always do: `profile.onboarding_progress = {**profile.onboarding_progress, section: True}` — NEVER do: `profile.onboarding_progress[section] = True`.

```python
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.shared.exceptions import ConflictError
from .models import UserProfile
from .schemas import (
    BasicsUpdate, SkinIdentityUpdate, SkinStateUpdate,
    RoutineStateUpdate, LifestyleUpdate, PreferencesUpdate,
)


async def get_or_create_profile(user: CurrentUser, db: AsyncSession) -> UserProfile:
    """Get profile or create empty one on first access. Syncs JWT data every time."""
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()

    if profile:
        # Sync latest from JWT (name/avatar may change via OAuth)
        profile.email = user.email
        if user.full_name:
            profile.full_name = user.full_name
        if user.avatar_url:
            profile.avatar_url = user.avatar_url
        return profile

    # First request ever — create empty profile
    profile = UserProfile(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
    )
    db.add(profile)
    await db.flush()
    return profile


async def update_basics(user: CurrentUser, data: BasicsUpdate, db: AsyncSession) -> UserProfile:
    profile = await get_or_create_profile(user, db)

    if data.username is not None:
        existing = await db.execute(
            select(UserProfile).where(
                UserProfile.username == data.username,
                UserProfile.user_id != user.id,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictError("Username already taken")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    _mark_section(profile, "basics")
    profile.profile_completeness = _calculate_completeness(profile)
    profile.updated_at = datetime.now(timezone.utc)
    return profile


async def update_skin_identity(user: CurrentUser, data: SkinIdentityUpdate, db: AsyncSession) -> UserProfile:
    profile = await get_or_create_profile(user, db)

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    _mark_section(profile, "skin")
    profile.profile_completeness = _calculate_completeness(profile)
    profile.updated_at = datetime.now(timezone.utc)
    return profile


async def update_skin_state(user: CurrentUser, data: SkinStateUpdate, db: AsyncSession) -> UserProfile:
    profile = await get_or_create_profile(user, db)

    state = data.model_dump()
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    profile.current_skin_state = state  # Full reassignment — JSONB requires this

    _mark_section(profile, "skin_state")
    profile.profile_completeness = _calculate_completeness(profile)
    profile.updated_at = datetime.now(timezone.utc)
    return profile


async def update_routine_state(user: CurrentUser, data: RoutineStateUpdate, db: AsyncSession) -> UserProfile:
    profile = await get_or_create_profile(user, db)
    profile.current_routine = data.model_dump(exclude_unset=True)

    _mark_section(profile, "routine")
    profile.profile_completeness = _calculate_completeness(profile)
    profile.updated_at = datetime.now(timezone.utc)
    return profile


async def update_lifestyle(user: CurrentUser, data: LifestyleUpdate, db: AsyncSession) -> UserProfile:
    profile = await get_or_create_profile(user, db)
    profile.lifestyle = data.model_dump(exclude_unset=True)

    _mark_section(profile, "lifestyle")
    profile.profile_completeness = _calculate_completeness(profile)
    profile.updated_at = datetime.now(timezone.utc)
    return profile


async def update_preferences(user: CurrentUser, data: PreferencesUpdate, db: AsyncSession) -> UserProfile:
    profile = await get_or_create_profile(user, db)
    profile.preferences = data.model_dump(exclude_unset=True)

    _mark_section(profile, "preferences")
    profile.profile_completeness = _calculate_completeness(profile)
    profile.updated_at = datetime.now(timezone.utc)
    return profile


async def complete_onboarding(user: CurrentUser, db: AsyncSession) -> UserProfile:
    profile = await get_or_create_profile(user, db)
    profile.onboarding_completed = True
    profile.updated_at = datetime.now(timezone.utc)
    return profile


# --- Private helpers ---

def _mark_section(profile: UserProfile, section: str):
    """Mark section complete. MUST reassign dict for JSONB change detection."""
    progress = dict(profile.onboarding_progress or {})
    progress[section] = True
    profile.onboarding_progress = progress


def _calculate_completeness(profile: UserProfile) -> int:
    """
    Weighted profile completeness: 0–100%.

    Basics:     10%  (4 fields)
    Skin:       25%  (7 fields)
    Skin state: 15%  (6 fields in JSONB)
    Routine:    15%  (5 fields in JSONB)
    Lifestyle:  20%  (15 fields in JSONB)
    Preferences:15%  (10 fields in JSONB)
    """
    score = 0.0

    # Basics (10%)
    basics = [profile.username, profile.date_of_birth, profile.gender, profile.location_city]
    score += (sum(1 for f in basics if f) / 4) * 10

    # Skin identity (25%)
    skin = [
        profile.skin_type, profile.fitzpatrick_type, profile.primary_concerns,
        profile.skin_feel_midday, profile.skin_history, profile.allergies, profile.sensitivities,
    ]
    score += (sum(1 for f in skin if f is not None and f != []) / 7) * 25

    # Skin state (15%)
    if profile.current_skin_state:
        expected = ["acne_level", "oiliness_level", "dryness_level", "irritation_level", "new_breakouts", "overall_feeling"]
        filled = sum(1 for k in expected if k in profile.current_skin_state)
        score += (filled / 6) * 15

    # Routine (15%)
    if profile.current_routine:
        expected = ["am_steps", "pm_steps", "routine_consistency", "products_currently_using", "how_long_current_routine"]
        filled = sum(1 for k in expected if profile.current_routine.get(k))
        score += (filled / 5) * 15

    # Lifestyle (20%)
    if profile.lifestyle:
        filled = sum(1 for v in profile.lifestyle.values() if v is not None)
        score += (min(filled, 15) / 15) * 20

    # Preferences (15%)
    if profile.preferences:
        filled = sum(1 for v in profile.preferences.values() if v is not None)
        score += (min(filled, 10) / 10) * 15

    return round(score)
```

### app/features/profile/questionnaire.py

This file contains the FULL onboarding questionnaire served as JSON. The frontend renders it dynamically — questions are NOT hardcoded in the app.

Create a module-level `QUESTIONNAIRE` dict with this structure. Use ALL the creative copy from the attached JAY_UserProfile_Prompt.md:

```python
QUESTIONNAIRE = {
    "sections": [
        {
            "id": "basics",
            "title": "Let's get to know you",
            "subtitle": "The basics — so JAY can stop calling you 'hey you'",
            "icon": "user",
            "questions": [
                {
                    "id": "username",
                    "type": "text_input",
                    "question": "Pick a username",
                    "subtitle": "This is your identity in the JAY community",
                    "placeholder": "e.g. skincare_priya",
                    "validation": {"min_length": 3, "max_length": 30, "pattern": "^[a-zA-Z0-9_]+$"},
                    "required": True,
                },
                # ... date_of_birth (date_picker), gender (single_select), location (location_picker)
            ],
        },
        {
            "id": "skin",
            "title": "Your skin, decoded",
            "subtitle": "No judgment zone — just honest skin talk",
            "icon": "sparkles",
            "questions": [
                # skin_type (single_select_card with descriptions like "Oily T-zone but dry cheeks — your skin can't decide")
                # fitzpatrick_type (single_select_card with sun reaction descriptions)
                # primary_concerns (multi_select_chip, max 3, options: acne, dark_spots, wrinkles, pores, texture, dullness, dark_circles, tan, oiliness, dryness, sensitivity, aging)
                # skin_feel_midday (single_select with "Be honest — no one's judging your T-zone")
                # skin_history (multi_select_chip: eczema, psoriasis, rosacea, dermatitis, fungal_acne, melasma, vitiligo, cystic_acne, hormonal_acne, none)
                # allergies (tag_input with suggestions)
                # sensitivities (multi_select_chip)
            ],
        },
        {
            "id": "skin_state",
            "title": "Skin check-in",
            "subtitle": "How's your skin doing RIGHT NOW? Be brutally honest.",
            "icon": "scan",
            "questions": [
                # acne_level (slider 0-5, labels: "Clear skies" → "Code red")
                # oiliness_level (slider 0-5, labels: "Sahara desert" → "BP called, they want their oil back")
                # dryness_level (slider 0-5, labels: "Nope, hydrated" → "Crocodile mode")
                # irritation_level (slider 0-5, labels: "Calm and collected" → "Full tomato")
                # new_breakouts (yes_no)
                # overall_feeling (emoji_select: ✨ Glowing, 😊 Good, 😐 Okay, 😞 Not great, 😫 Terrible)
            ],
        },
        {
            "id": "routine",
            "title": "Your current game plan",
            "subtitle": "What are you already doing? No wrong answers — even 'nothing' counts.",
            "icon": "clock",
            "questions": [
                # am_steps (multi_select_ordered, includes "Nothing — I just exist")
                # pm_steps (multi_select_ordered, includes "Pillow is my skincare")
                # routine_consistency (single_select: "Every single day" → "What routine?")
                # products_currently_using (tag_input)
                # how_long_current_routine (single_select)
            ],
        },
        {
            "id": "lifestyle",
            "title": "Life outside skincare",
            "subtitle": "Your skin is a mirror of your lifestyle — let's connect the dots",
            "icon": "heart",
            "questions": [
                # physical_activity, water_intake_glasses (slider: "Does coffee count?" → "Aquaman")
                # sleep_hours (slider: "Barely" → "Hibernating"), sun_exposure
                # diet_type, dairy_consumption ("Dairy and acne have a complicated relationship")
                # sugar_consumption ("Sugar → insulin spike → inflammation → breakouts. Science is fun.")
                # smoking ("Smoking ages skin 2x faster"), alcohol, stress_level, screen_time_hours
            ],
        },
        {
            "id": "preferences",
            "title": "Your preferences",
            "subtitle": "What does your ideal skincare world look like?",
            "icon": "sliders",
            "questions": [
                # budget_range (with ₹ amounts), product_preference (pharmacy/luxury/natural/korean/ayurvedic)
                # remedy_openness ("Turmeric, honey, aloe vera... grandma's arsenal")
                # routine_complexity ("consistency > complexity"), top_goal (single_select_card)
                # fragrance_preference
            ],
        },
    ],
    "completion_rewards": {
        "basics": {"points": 5, "message": "JAY now knows your name!"},
        "skin": {"points": 10, "message": "Your skin identity is mapped"},
        "skin_state": {"points": 5, "message": "Current state logged"},
        "routine": {"points": 5, "message": "JAY knows your shelf now"},
        "lifestyle": {"points": 10, "message": "The full picture is forming"},
        "preferences": {"points": 5, "message": "Personalization complete!"},
    },
    "total_bonus_points": 20,
}
```

CRITICAL: Fill in EVERY question with the FULL content from the attached JAY_UserProfile_Prompt.md. The comments above show what goes where — replace them with actual question dicts including all options, subtitles, descriptions, slider labels, validation rules, and required flags. Do NOT leave placeholder comments. Every single question from all 6 sections must be present with the creative JAY copy.

### app/features/profile/router.py

```python
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import AuthenticatedUser
from . import service
from .schemas import (
    BasicsUpdate, SkinIdentityUpdate, SkinStateUpdate,
    RoutineStateUpdate, LifestyleUpdate, PreferencesUpdate,
    UserProfileOut, ProfileCompletenessOut,
)

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/questionnaire")
async def get_questionnaire():
    """Full onboarding questionnaire definition. Public — no auth required."""
    from .questionnaire import QUESTIONNAIRE
    return QUESTIONNAIRE


@router.get("", response_model=UserProfileOut)
async def get_profile(user: AuthenticatedUser, db: DbSession):
    """Get user profile. Auto-creates on first access."""
    return await service.get_or_create_profile(user, db)


@router.get("/completeness", response_model=ProfileCompletenessOut)
async def get_completeness(user: AuthenticatedUser, db: DbSession):
    """Profile completeness percentage and per-section breakdown."""
    profile = await service.get_or_create_profile(user, db)
    return ProfileCompletenessOut(
        completeness=profile.profile_completeness,
        sections=profile.onboarding_progress,
        onboarding_completed=profile.onboarding_completed,
    )


@router.put("/basics", response_model=UserProfileOut)
async def update_basics(data: BasicsUpdate, user: AuthenticatedUser, db: DbSession):
    """Save basics section (username, DOB, gender, location)."""
    return await service.update_basics(user, data, db)


@router.put("/skin-identity", response_model=UserProfileOut)
async def update_skin_identity(data: SkinIdentityUpdate, user: AuthenticatedUser, db: DbSession):
    """Save skin identity section."""
    return await service.update_skin_identity(user, data, db)


@router.put("/skin-state", response_model=UserProfileOut)
async def update_skin_state(data: SkinStateUpdate, user: AuthenticatedUser, db: DbSession):
    """Save current skin state. Reusable — call anytime, not just onboarding."""
    return await service.update_skin_state(user, data, db)


@router.put("/routine", response_model=UserProfileOut)
async def update_routine(data: RoutineStateUpdate, user: AuthenticatedUser, db: DbSession):
    """Save current routine info."""
    return await service.update_routine_state(user, data, db)


@router.put("/lifestyle", response_model=UserProfileOut)
async def update_lifestyle(data: LifestyleUpdate, user: AuthenticatedUser, db: DbSession):
    """Save lifestyle section."""
    return await service.update_lifestyle(user, data, db)


@router.put("/preferences", response_model=UserProfileOut)
async def update_preferences(data: PreferencesUpdate, user: AuthenticatedUser, db: DbSession):
    """Save preferences section."""
    return await service.update_preferences(user, data, db)


@router.post("/complete-onboarding", response_model=UserProfileOut)
async def complete_onboarding(user: AuthenticatedUser, db: DbSession):
    """Mark onboarding as complete. User can do this even before 100%."""
    return await service.complete_onboarding(user, db)
```

---

## STEP 4: Build app/main.py

```python
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("JAY API started")
    yield
    print("JAY API stopped")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="JAY API",
        description="AI-Powered Personal Skincare Companion",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health():
        return {"status": "ok", "service": "jay-api", "version": "0.1.0"}

    # Profile feature
    from app.features.profile.router import router as profile_router
    app.include_router(profile_router, prefix="/api/v1/profile", tags=["Profile"])

    # Dev-only: test token generator (no frontend needed to test)
    if settings.debug:
        import jwt as pyjwt

        @app.post("/dev/test-token", tags=["Dev"])
        async def create_test_token(email: str = "test@test.com", name: str = "Test User"):
            """
            DEV ONLY. Generates a fake Supabase JWT for testing.
            Same email always produces same user_id (deterministic via uuid5).
            """
            user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, email))
            payload = {
                "sub": user_id,
                "email": email,
                "aud": "authenticated",
                "role": "authenticated",
                "user_metadata": {"full_name": name},
                "iat": datetime.now(timezone.utc),
                "exp": datetime.now(timezone.utc) + timedelta(hours=2),
            }
            token = pyjwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
            return {"access_token": token, "user_id": user_id, "email": email}

    return app


app = create_app()
```

---

## STEP 5: Set up Alembic

Run inside the jay-backend directory:

```bash
uv run alembic init alembic
```

Then replace `alembic/env.py` with this content:

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.config import get_settings
from app.database import Base

# Import models so Alembic can detect them
from app.features.profile.models import UserProfile  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

settings = get_settings()

# Convert async URL to sync for Alembic (replace +asyncpg with nothing)
sync_url = settings.database_url.replace("+asyncpg", "")
config.set_main_option("sqlalchemy.url", sync_url)

target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

Edit `alembic.ini` — find the line `sqlalchemy.url = ...` and set it to empty:
```ini
sqlalchemy.url =
```

Now generate and run the migration:

```bash
uv run alembic revision --autogenerate -m "create user_profiles table"
uv run alembic upgrade head
```

After running the migration, go to your Supabase dashboard → Table Editor. You should see the `user_profiles` table with all columns.

---

## STEP 6: Start and verify

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Now run every test. ALL must pass:

```bash
# 1. Health
curl -s http://localhost:8000/health
# → {"status":"ok","service":"jay-api","version":"0.1.0"}

# 2. Swagger — open http://localhost:8000/docs in browser

# 3. Get test token
TOKEN=$(curl -s -X POST "http://localhost:8000/dev/test-token?email=priya@test.com&name=Priya+Sharma" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Got token: ${TOKEN:0:20}..."

# 4. No auth → error
curl -s http://localhost:8000/api/v1/profile
# → {"detail":"Not authenticated"}

# 5. Questionnaire (public)
curl -s http://localhost:8000/api/v1/profile/questionnaire | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'Sections: {len(d[\"sections\"])}')
for s in d['sections']:
    print(f'  {s[\"id\"]}: {len(s[\"questions\"])} questions — {s[\"title\"]}')
"
# → 6 sections, 39 questions total

# 6. Get profile (auto-creates)
curl -s http://localhost:8000/api/v1/profile -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Email: {d[\"email\"]}, Name: {d[\"full_name\"]}, Completeness: {d[\"profile_completeness\"]}%')
"
# → Email: priya@test.com, Name: Priya Sharma, Completeness: 0%

# 7. Save basics
curl -s -X PUT http://localhost:8000/api/v1/profile/basics \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"username":"priya_skin","date_of_birth":"1998-05-15","gender":"female","location_city":"Mumbai","location_state":"Maharashtra"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Username: {d[\"username\"]}, Completeness: {d[\"profile_completeness\"]}%')"

# 8. Username taken
TOKEN2=$(curl -s -X POST "http://localhost:8000/dev/test-token?email=ananya@test.com&name=Ananya" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl -s -X PUT http://localhost:8000/api/v1/profile/basics \
  -H "Authorization: Bearer $TOKEN2" -H "Content-Type: application/json" \
  -d '{"username":"priya_skin"}'
# → {"detail":"Username already taken"}

# 9. Save skin identity
curl -s -X PUT http://localhost:8000/api/v1/profile/skin-identity \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"skin_type":"combination","fitzpatrick_type":4,"primary_concerns":["acne","dark_spots","pores"],"skin_feel_midday":"oily_t_zone","sensitivities":["fragrance"]}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Completeness: {d[\"profile_completeness\"]}%')"

# 10. Save skin state
curl -s -X PUT http://localhost:8000/api/v1/profile/skin-state \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"acne_level":2,"oiliness_level":3,"dryness_level":1,"irritation_level":0,"new_breakouts":false,"overall_feeling":"okay"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Completeness: {d[\"profile_completeness\"]}%')"

# 11. Save routine
curl -s -X PUT http://localhost:8000/api/v1/profile/routine \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"am_steps":["cleanser","moisturizer","sunscreen"],"pm_steps":["cleanser","serum","moisturizer"],"routine_consistency":"most_days","how_long_current_routine":"1_3_months"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Completeness: {d[\"profile_completeness\"]}%')"

# 12. Save lifestyle
curl -s -X PUT http://localhost:8000/api/v1/profile/lifestyle \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"physical_activity":"moderate","water_intake_glasses":6,"sleep_hours":7,"diet_type":"vegetarian","dairy_consumption":"daily","sugar_consumption":"sometimes","stress_level":"moderate","smoking":"never","alcohol":"occasionally","sun_exposure":"moderate","screen_time_hours":8}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Completeness: {d[\"profile_completeness\"]}%')"

# 13. Save preferences
curl -s -X PUT http://localhost:8000/api/v1/profile/preferences \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"budget_range":"500_1000","product_preference":"pharmacy","routine_complexity":"moderate_4_5","top_goal":"clear_skin","fragrance_preference":"prefer_unscented","remedy_openness":"open_to_trying"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Completeness: {d[\"profile_completeness\"]}%')"

# 14. Completeness check
curl -s http://localhost:8000/api/v1/profile/completeness \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 15. Complete onboarding
curl -s -X POST http://localhost:8000/api/v1/profile/complete-onboarding \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Onboarding complete: {d[\"onboarding_completed\"]}')"

# 16. Final profile
curl -s http://localhost:8000/api/v1/profile -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## RULES
- No git commands
- Create all files via tool use — never paste code in chat
- NO auth feature folder — auth is ONE file: app/auth.py
- NO users table — Supabase manages auth.users
- questionnaire.py must contain the FULL questionnaire with ALL creative JAY copy from the attached file — every question, every option, every subtitle, every slider label
- Profile auto-creates on first authenticated request
- /questionnaire is PUBLIC, everything else requires auth
- Use uuid5 in the test-token endpoint so same email = same user_id always
- JSONB columns: always reassign the whole dict, never mutate in place
- The server must start with: uv run uvicorn app.main:app --reload
- Run ALL 16 verification checks at the end

## WHAT I'LL DO AFTER THIS PROMPT
1. Fill in real Supabase values in .env
2. Run `uv run alembic upgrade head` to create the table
3. Start the server
4. Test everything

## WHAT COMES NEXT (future phases — NOT part of this prompt)
Phase 2: Products database + search
Phase 3: Ask JAY (AI chat with streaming)
Phase 4: Routine builder + Diary
Phase 5: Dupe Finder + Cap or Slap
Phase 6: Research pipeline
Phase 7: Intelligence + Gamification
Phase 8: Community + Diet + Notifications
```
