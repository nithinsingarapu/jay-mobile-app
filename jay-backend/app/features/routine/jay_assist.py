"""
JAY Assist — fast inline AI helpers for routine building.
Uses Groq (free, <1s response) for instant suggestions.

Three assist modes:
1. suggest_steps — Given routine purpose, suggest step categories
2. pick_product — Given a step category + user profile, recommend best product
3. suggest_instruction — Given step + product, write personalized instruction
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.auth import CurrentUser
from app.ai.context import build_user_context
from app.features.products.service import search_for_routine_step
from app.features.profile.models import UserProfile


async def _get_groq():
    from app.ai.providers.groq import GroqProvider
    return GroqProvider()


async def _get_user_summary(user_id: str, db: AsyncSession) -> str:
    """Short user summary for fast prompts."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return "No profile data. Assume combination skin, general care."

    parts = []
    if profile.skin_type:
        parts.append(f"Skin: {profile.skin_type}")
    if profile.primary_concerns:
        parts.append(f"Concerns: {', '.join(profile.primary_concerns[:3])}")
    if profile.allergies:
        parts.append(f"Allergies: {', '.join(profile.allergies)}")
    if profile.location_city:
        parts.append(f"Location: {profile.location_city}")
    return ". ".join(parts) or "General skincare user."


# ══════════════════════════════════════════════════════════════════════
# 1. SUGGEST STEPS — "What steps do I need?"
# ══════════════════════════════════════════════════════════════════════

async def suggest_steps(
    user: CurrentUser,
    routine_name: str,
    routine_description: str,
    session: str,
    db: AsyncSession,
) -> dict:
    """Given a routine purpose, suggest step categories and order."""
    user_summary = await _get_user_summary(user.id, db)
    groq = await _get_groq()

    prompt = f"""User wants to build a "{routine_name}" routine for {session} session.
Description: {routine_description}
User: {user_summary}

Suggest the ideal step categories in order. Only include what's genuinely needed.
Respond in JSON only:
{{"steps": ["cleanser", "toner", "serum", ...], "reasoning": "Brief explanation"}}

Valid categories: cleanser, toner, essence, serum, treatment, eye_cream, moisturizer, sunscreen, face_oil, exfoliant, sleeping_mask, lip_balm, spot_treatment
Only return categories that make sense for this routine purpose."""

    response = await groq.generate(
        system_prompt="You are JAY, a skincare expert. Respond with ONLY valid JSON.",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=300,
    )

    try:
        # Parse JSON from response
        text = response.strip()
        if "```" in text:
            for part in text.split("```"):
                cleaned = part.strip().lstrip("json").strip()
                if cleaned.startswith("{"):
                    text = cleaned
                    break
        return json.loads(text)
    except Exception:
        return {"steps": ["cleanser", "moisturizer", "sunscreen"], "reasoning": "Default suggestion."}


# ══════════════════════════════════════════════════════════════════════
# 2. PICK PRODUCT — "What product for this step?"
# ══════════════════════════════════════════════════════════════════════

async def pick_product(
    user: CurrentUser,
    category: str,
    routine_context: str,
    db: AsyncSession,
) -> dict:
    """Given a step category, recommend the best product from the database."""
    user_summary = await _get_user_summary(user.id, db)

    # Get top products for this category
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = profile_result.scalar_one_or_none()
    allergies = profile.allergies if profile and profile.allergies else []

    products = await search_for_routine_step(
        db, category=category,
        exclude_ingredients=allergies,
        limit=5,
    )

    if not products:
        return {
            "product_id": None,
            "product_name": f"Custom {category}",
            "product_brand": None,
            "reasoning": "No products found in database for this category.",
        }

    # Format products for LLM
    product_lines = []
    for p in products:
        price = f"₹{p.price_inr}" if p.price_inr else "price TBD"
        rating = f"★{p.rating}" if hasattr(p, 'rating') and p.rating else ""
        ings = ", ".join(p.key_ingredients[:4]) if p.key_ingredients else ""
        product_lines.append(f"ID:{p.id} | {p.brand} — {p.name} | {price} {rating} | {ings}")

    products_text = "\n".join(product_lines)

    groq = await _get_groq()
    prompt = f"""Pick the BEST {category} for this user.
User: {user_summary}
Routine context: {routine_context}

Available products:
{products_text}

Pick ONE product. Respond JSON only:
{{"product_id": 42, "product_name": "Name", "product_brand": "Brand", "reasoning": "Why this product for THIS user (1 sentence)"}}"""

    response = await groq.generate(
        system_prompt="You are JAY, a skincare expert. Pick the best product. JSON only.",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=200,
    )

    try:
        text = response.strip()
        if "```" in text:
            for part in text.split("```"):
                cleaned = part.strip().lstrip("json").strip()
                if cleaned.startswith("{"):
                    text = cleaned
                    break
        result = json.loads(text)
        # Validate product_id exists
        pid = result.get("product_id")
        if pid and any(p.id == pid for p in products):
            return result
        # Fallback to first product
        p = products[0]
        return {
            "product_id": p.id,
            "product_name": p.name,
            "product_brand": p.brand,
            "reasoning": result.get("reasoning", f"Top-rated {category} for your skin type."),
        }
    except Exception:
        p = products[0]
        return {
            "product_id": p.id,
            "product_name": p.name,
            "product_brand": p.brand,
            "reasoning": f"Top-rated {category} in our database.",
        }


# ══════════════════════════════════════════════════════════════════════
# 3. SUGGEST INSTRUCTION — "How should I use this?"
# ══════════════════════════════════════════════════════════════════════

async def suggest_instruction(
    category: str,
    product_name: str,
    session: str,
) -> dict:
    """Generate a personalized application instruction."""
    groq = await _get_groq()
    prompt = f"""Write a specific, actionable application instruction for:
Product: {product_name}
Category: {category}
Session: {session}

One sentence. Be specific about technique, duration, and any wait times.
Example: "Massage onto damp skin for 60 seconds, focusing on T-zone. Rinse with lukewarm water."

Respond JSON: {{"instruction": "...", "wait_time_seconds": null or number}}"""

    response = await groq.generate(
        system_prompt="You are JAY. Write skincare instructions. JSON only.",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=150,
    )

    try:
        text = response.strip()
        if "```" in text:
            for part in text.split("```"):
                cleaned = part.strip().lstrip("json").strip()
                if cleaned.startswith("{"):
                    text = cleaned
                    break
        return json.loads(text)
    except Exception:
        return {"instruction": f"Apply {product_name} as directed.", "wait_time_seconds": None}
