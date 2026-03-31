"""
User context builder for AI personalization.
Caches per user_id for 5 minutes to avoid repeated DB queries during chat.
"""
import time
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.features.profile.models import UserProfile

# In-memory cache: { user_id: (context_string, timestamp) }
_context_cache: dict[str, tuple[str, float]] = {}
_CACHE_TTL = 300  # 5 minutes


def invalidate_context_cache(user_id: str):
    """Call this when a user updates their profile."""
    _context_cache.pop(user_id, None)


async def build_user_context(user_id: str, db: AsyncSession) -> str:
    # Check cache first
    if user_id in _context_cache:
        cached, ts = _context_cache[user_id]
        if time.time() - ts < _CACHE_TTL:
            return cached
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        return "New user — no profile data available yet. Ask them about their skin to get started."

    sections = []

    name = profile.full_name or "this user"
    sections.append(f"You're talking to {name}.")

    # Skin profile
    skin_parts = []
    if profile.skin_type:
        skin_parts.append(f"Skin type: {profile.skin_type}")
    if profile.fitzpatrick_type:
        skin_parts.append(f"Fitzpatrick type: {profile.fitzpatrick_type} (sun sensitivity)")
    if profile.primary_concerns:
        skin_parts.append(f"Main concerns: {', '.join(profile.primary_concerns)}")
    if profile.skin_feel_midday:
        skin_parts.append(f"Midday feel: {profile.skin_feel_midday.replace('_', ' ')}")
    if profile.skin_history:
        skin_parts.append(f"Skin history: {', '.join(profile.skin_history)}")
    if profile.allergies:
        skin_parts.append(f"ALLERGIES (never recommend): {', '.join(profile.allergies)}")
    if profile.sensitivities:
        skin_parts.append(f"Sensitivities: {', '.join(profile.sensitivities)}")
    if skin_parts:
        sections.append("SKIN PROFILE:\n" + "\n".join(f"  - {p}" for p in skin_parts))

    # Current skin state
    if profile.current_skin_state:
        state = profile.current_skin_state
        state_parts = []
        if "acne_level" in state:
            state_parts.append(f"Acne level: {state['acne_level']}/5")
        if "oiliness_level" in state:
            state_parts.append(f"Oiliness: {state['oiliness_level']}/5")
        if "dryness_level" in state:
            state_parts.append(f"Dryness: {state['dryness_level']}/5")
        if "irritation_level" in state:
            state_parts.append(f"Irritation: {state['irritation_level']}/5")
        if state.get("new_breakouts"):
            state_parts.append("Currently experiencing new breakouts")
        if "overall_feeling" in state:
            state_parts.append(f"Overall skin feeling: {state['overall_feeling']}")
        if state_parts:
            sections.append("CURRENT SKIN STATE:\n" + "\n".join(f"  - {p}" for p in state_parts))

    # Current routine
    if profile.current_routine:
        routine = profile.current_routine
        if routine.get("am_steps"):
            sections.append(f"AM ROUTINE: {' -> '.join(routine['am_steps'])}")
        if routine.get("pm_steps"):
            sections.append(f"PM ROUTINE: {' -> '.join(routine['pm_steps'])}")
        if routine.get("products_currently_using"):
            sections.append(f"Products currently using: {', '.join(routine['products_currently_using'])}")

    # Lifestyle
    if profile.lifestyle:
        ls = profile.lifestyle
        lifestyle_parts = []
        if ls.get("diet_type"):
            lifestyle_parts.append(f"Diet: {ls['diet_type']}")
        if ls.get("water_intake_glasses"):
            lifestyle_parts.append(f"Water: {ls['water_intake_glasses']} glasses/day")
        if ls.get("sleep_hours"):
            lifestyle_parts.append(f"Sleep: {ls['sleep_hours']}h/night")
        if ls.get("stress_level"):
            lifestyle_parts.append(f"Stress: {ls['stress_level']}")
        if ls.get("smoking") and ls["smoking"] != "never":
            lifestyle_parts.append(f"Smoking: {ls['smoking']}")
        if ls.get("dairy_consumption") and ls["dairy_consumption"] in ("daily", "often"):
            lifestyle_parts.append(f"High dairy intake ({ls['dairy_consumption']})")
        if ls.get("sun_exposure") and ls["sun_exposure"] in ("high", "very_high"):
            lifestyle_parts.append(f"High sun exposure ({ls['sun_exposure']})")
        if lifestyle_parts:
            sections.append("LIFESTYLE:\n" + "\n".join(f"  - {p}" for p in lifestyle_parts))

    # Preferences
    if profile.preferences:
        pref = profile.preferences
        pref_parts = []
        if pref.get("budget_range"):
            budget_map = {"under_500": "under Rs.500", "500_1000": "Rs.500-1000", "1000_2000": "Rs.1000-2000", "2000_plus": "Rs.2000+", "no_limit": "no budget limit"}
            pref_parts.append(f"Budget: {budget_map.get(pref['budget_range'], pref['budget_range'])}/month")
        if pref.get("product_preference"):
            pref_parts.append(f"Prefers: {pref['product_preference']} products")
        if pref.get("routine_complexity"):
            complexity_map = {"minimal_1_3": "minimal (1-3 steps)", "moderate_4_5": "moderate (4-5 steps)", "elaborate_6_plus": "elaborate (6+ steps)", "whatever_works": "whatever works"}
            pref_parts.append(f"Routine complexity: {complexity_map.get(pref['routine_complexity'], pref['routine_complexity'])}")
        if pref.get("top_goal"):
            pref_parts.append(f"#1 goal: {pref['top_goal'].replace('_', ' ')}")
        if pref.get("fragrance_preference") and "unscented" in pref.get("fragrance_preference", ""):
            pref_parts.append("Prefers unscented products")
        if pref_parts:
            sections.append("PREFERENCES:\n" + "\n".join(f"  - {p}" for p in pref_parts))

    # Location
    if profile.location_city:
        location = profile.location_city
        if profile.location_state:
            location += f", {profile.location_state}"
        sections.append(f"Location: {location} (consider local climate and humidity)")

    context = "\n\n".join(sections)

    # Cache it
    _context_cache[user_id] = (context, time.time())

    return context
