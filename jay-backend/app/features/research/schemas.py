from pydantic import BaseModel
from datetime import datetime


class ResearchRequest(BaseModel):
    product_name: str
    product_id: int | None = None


class ReportCardScore(BaseModel):
    ingredient_quality: int | None = None
    formula_safety: int | None = None
    value_for_money: int | None = None
    brand_transparency: int | None = None
    user_satisfaction: int | None = None
    derm_endorsement: int | None = None
    overall: int | None = None


class ResearchOut(BaseModel):
    id: int
    product_id: int | None = None
    product_name: str
    brand: str | None = None
    status: str
    product_data: dict | None = None
    ingredients_analysis: str | None = None
    review_synthesis: str | None = None
    expert_reviews: str | None = None
    brand_intelligence: str | None = None
    claims_alternatives: str | None = None
    report_markdown: str | None = None
    tldr: str | None = None
    usage_protocol: str | None = None
    report_card: dict | None = None
    error_message: str | None = None
    model_used: str | None = None
    total_tokens: int | None = None
    estimated_cost_usd: float | None = None
    duration_seconds: float | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ResearchStatusOut(BaseModel):
    id: int
    product_name: str
    status: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
