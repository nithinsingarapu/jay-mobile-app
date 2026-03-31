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
