from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, DateTime
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class Ingredient(Base):
    __tablename__ = "content_ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    also_known_as: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    what_it_does: Mapped[str | None] = mapped_column(Text, nullable=True)
    how_it_works: Mapped[str | None] = mapped_column(Text, nullable=True)
    benefits: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    who_its_for: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    avoid_with: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    safety_rating: Mapped[str | None] = mapped_column(String(20), nullable=True)
    concentration_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    facts: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sources: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    departments: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Article(Base):
    __tablename__ = "content_articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    author_credential: Mapped[str | None] = mapped_column(String(200), nullable=True)
    author_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    read_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    departments: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    concerns: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Concern(Base):
    __tablename__ = "content_concerns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    causes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    symptoms: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    treatments: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    recommended_ingredients: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    avoid_ingredients: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    lifestyle_tips: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    severity_levels: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    departments: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    sources: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Myth(Base):
    __tablename__ = "content_myths"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    myth: Mapped[str] = mapped_column(Text, nullable=False)
    truth: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    departments: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Tip(Base):
    __tablename__ = "content_tips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    departments: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
