from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime


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
