from pydantic import BaseModel
from datetime import datetime


class SourcedFact(BaseModel):
    text: str
    source_url: str | None = None
    source_name: str | None = None


class IngredientOut(BaseModel):
    id: int
    name: str
    slug: str
    also_known_as: list[str] | None = None
    category: str | None = None
    what_it_does: str | None = None
    how_it_works: str | None = None
    benefits: list[str] | None = None
    who_its_for: list[str] | None = None
    avoid_with: list[str] | None = None
    safety_rating: str | None = None
    concentration_range: str | None = None
    facts: list[SourcedFact] | None = None
    image_url: str | None = None
    sources: list[dict] | None = None
    departments: list[str] | None = None
    tags: list[str] | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}


class ArticleOut(BaseModel):
    id: int
    slug: str
    title: str
    type: str
    summary: str | None = None
    body: str | None = None
    author_name: str | None = None
    author_credential: str | None = None
    author_image_url: str | None = None
    image_url: str | None = None
    read_time_minutes: int | None = None
    tags: list[str] | None = None
    departments: list[str] | None = None
    concerns: list[str] | None = None
    source_url: str | None = None
    source_name: str | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}


class ConcernOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    causes: list[SourcedFact] | None = None
    symptoms: list[SourcedFact] | None = None
    treatments: list[SourcedFact] | None = None
    recommended_ingredients: list[str] | None = None
    avoid_ingredients: list[str] | None = None
    lifestyle_tips: list[SourcedFact] | None = None
    image_url: str | None = None
    severity_levels: dict | None = None
    departments: list[str] | None = None
    tags: list[str] | None = None
    sources: list[dict] | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}


class MythOut(BaseModel):
    id: int
    myth: str
    truth: str
    explanation: str | None = None
    source_url: str | None = None
    source_name: str | None = None
    departments: list[str] | None = None
    tags: list[str] | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}


class TipOut(BaseModel):
    id: int
    title: str
    body: str
    category: str | None = None
    source_url: str | None = None
    source_name: str | None = None
    departments: list[str] | None = None
    tags: list[str] | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}
