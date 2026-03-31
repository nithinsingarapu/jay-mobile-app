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
    # Invalidate AI context cache so JAY picks up new profile data
    from app.ai.context import invalidate_context_cache
    invalidate_context_cache(profile.user_id)


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
