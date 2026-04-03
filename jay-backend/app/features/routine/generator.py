"""
AI routine generation — "Build with JAY".

Improvements over v1:
- Smart auto-type: maps user concerns → best routine type (not just complexity preference)
- Budget-unaware: recommends the BEST products, not cheapest
- Richer product data: includes ratings, reviews, descriptions, formulation flags
- More products per category (10 instead of 5)
- Climate-aware: uses user location for seasonal adjustments
- Passes user's top_goal and specific concerns to the LLM
- Better system prompt: stricter JSON, more specific instructions
- description field in output
"""
import json
import re
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.ai.context import build_user_context
from app.features.profile.models import UserProfile
from app.features.products.service import search_for_routine_step
from app.features.products.models import Product
from .constants import ROUTINE_TYPES, STEP_CATEGORIES, SKIN_TYPE_RULES, APPLICATION_ORDER
from .models import RoutineGeneration
from .prompts import SYSTEM_PROMPT, ROUTINE_GENERATION_PROMPT
from .schemas import GenerateRoutineRequest, GeneratedRoutineOut


# ── Smart auto-type mapping ──────────────────────────────────────────────

def _infer_routine_type(profile) -> str:
    """Map user's concerns + preferences to the best routine type."""
    if not profile:
        return "complete"

    concerns = set(profile.primary_concerns or [])
    preferences = profile.preferences or {}

    # Check concerns first — specific needs override complexity preference
    acne_signals = {"acne", "breakouts", "blackheads", "whiteheads", "oily_skin", "pimples", "cystic_acne"}
    if concerns & acne_signals:
        return "anti_acne"

    barrier_signals = {"sensitivity", "irritation", "redness", "barrier_damage", "over_exfoliated", "eczema"}
    if concerns & barrier_signals:
        return "barrier_repair"

    aging_signals = {"fine_lines", "wrinkles", "sagging", "loss_of_firmness", "photoaging"}
    pigment_signals = {"dark_spots", "hyperpigmentation", "melasma", "uneven_tone", "pih"}

    if concerns & aging_signals and concerns & pigment_signals:
        return "glass_skin"  # Needs multi-active approach
    if concerns & aging_signals:
        return "complete"  # Retinol + vitamin C + peptides
    if concerns & pigment_signals:
        return "complete"  # Needs actives like vitamin C, arbutin

    # Fall back to complexity preference
    complexity = preferences.get("routine_complexity", "moderate_4_5")
    return {
        "minimal_1_3": "essential",
        "moderate_4_5": "complete",
        "elaborate_6_plus": "glass_skin",
        "whatever_works": "complete",
    }.get(complexity, "complete")


# ── Climate helper ────────────────────────────────────────────────────────

def _get_climate_note(profile) -> str:
    """Generate climate-aware skincare advice based on location and current month."""
    month = datetime.now().month
    location = ""
    if profile and profile.location_city:
        location = profile.location_city
        if profile.location_state:
            location += f", {profile.location_state}"

    # Indian climate zones
    season = "moderate"
    if month in (4, 5, 6):
        season = "hot_summer"
    elif month in (7, 8, 9):
        season = "monsoon"
    elif month in (11, 12, 1, 2):
        season = "winter"
    else:
        season = "transition"

    notes = {
        "hot_summer": f"Currently SUMMER in {location or 'India'}. Recommend lightweight gel textures, mattifying SPF, minimal occlusion. Higher UV index — SPF 50+ essential. Avoid heavy creams.",
        "monsoon": f"Currently MONSOON in {location or 'India'}. High humidity — use lightweight, non-comedogenic products. Anti-fungal awareness important. Double cleanse daily. Water-resistant SPF.",
        "winter": f"Currently WINTER in {location or 'India'}. Barrier protection critical — richer creams, facial oils, ceramides. Reduce exfoliation frequency. Humectants (HA) need occlusive seal.",
        "transition": f"Transition season in {location or 'India'}. Moderate approach — balanced textures, standard SPF 30-50.",
        "moderate": f"Location: {location or 'India'}. Standard recommendations apply.",
    }
    return notes.get(season, notes["moderate"])


# ── Enhanced product search ──────────────────────────────────────────────

async def _get_products_for_category(
    db: AsyncSession, category: str, allergies: list[str], skin_type: str | None
) -> str:
    """Search products with richer data — ratings, reviews, formulation flags."""
    products = await search_for_routine_step(
        db, category=category,
        budget=None,  # No budget constraint — recommend the BEST
        exclude_ingredients=allergies,
        skin_type=skin_type,
        limit=10,  # More options for LLM to choose from
    )

    if not products:
        return f"\n[{category.upper()}]: No products found in database. Suggest a custom product name with specific ingredients."

    lines = []
    for p in products:
        price = f"₹{p.price_inr}" if p.price_inr else "price TBD"
        rating = f"★{p.rating}/5 ({p.review_count} reviews)" if hasattr(p, 'rating') and p.rating else "no reviews yet"
        ings = ", ".join(p.key_ingredients[:6]) if p.key_ingredients else "ingredients unlisted"

        # Formulation flags
        flags = []
        if hasattr(p, 'formulation') and p.formulation:
            f = p.formulation
            if f.get("fragrance_free"): flags.append("fragrance-free")
            if f.get("paraben_free"): flags.append("paraben-free")
            if f.get("alcohol_free"): flags.append("alcohol-free")
        flag_str = f" | Flags: {', '.join(flags)}" if flags else ""

        # Suitable for
        suitable = ""
        if hasattr(p, 'suitable_for') and p.suitable_for:
            s = p.suitable_for
            types = s.get("skin_types", [])
            if types:
                suitable = f" | For: {', '.join(types)}"
            if s.get("pregnancy_safe"):
                suitable += " | Pregnancy-safe"

        desc_snippet = (p.description or "")[:100]

        lines.append(
            f"  - ID:{p.id} | {p.brand} — {p.name} | {price} | {rating}\n"
            f"    Key ingredients: {ings}{flag_str}{suitable}\n"
            f"    {desc_snippet}{'...' if len(p.description or '') > 100 else ''}"
        )

    return f"\n[{category.upper()}] ({len(products)} options):\n" + "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════
# MAIN GENERATOR
# ══════════════════════════════════════════════════════════════════════════

async def generate_routine(
    user: CurrentUser, data: GenerateRoutineRequest, db: AsyncSession
) -> GeneratedRoutineOut:
    # 1. Load user profile
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = profile_result.scalar_one_or_none()

    # 2. Smart routine type inference
    routine_type = data.routine_type
    if routine_type == "auto":
        routine_type = _infer_routine_type(profile)

    type_info = ROUTINE_TYPES.get(routine_type, ROUTINE_TYPES["complete"])
    periods = ["am", "pm"] if data.period == "both" else [data.period]

    # 3. Build rich user context
    user_context = await build_user_context(user.id, db)

    # Extract key fields for prompt placeholders
    allergies = profile.allergies if profile and profile.allergies else []
    skin_type = profile.skin_type if profile else "combination"
    skin_rules = SKIN_TYPE_RULES.get(skin_type, {})
    concerns = ", ".join(profile.primary_concerns) if profile and profile.primary_concerns else "general skin health"
    top_goal = "healthy, clear skin"
    if profile and profile.preferences:
        raw_goal = profile.preferences.get("top_goal", "")
        if raw_goal:
            top_goal = raw_goal.replace("_", " ")

    climate_note = _get_climate_note(profile)

    # 3b. Load user's EXISTING routines so JAY knows what's already built
    from .models import Routine, RoutineStep
    from sqlalchemy.orm import selectinload
    existing_result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.steps))
        .where(Routine.user_id == user.id, Routine.is_active == True)
        .order_by(Routine.created_at)
    )
    existing_routines = existing_result.scalars().all()
    existing_routines_text = ""
    if existing_routines:
        parts = []
        for r in existing_routines:
            step_names = [f"{s.category} ({s.custom_product_name or s.product_id or 'no product'})" for s in sorted(r.steps, key=lambda x: x.step_order)]
            parts.append(f"  - {r.name} ({r.period}): {' → '.join(step_names)}")
        existing_routines_text = "USER'S EXISTING ROUTINES (already built — DO NOT duplicate, complement them):\n" + "\n".join(parts)
    else:
        existing_routines_text = "USER'S EXISTING ROUTINES: None yet — this is their first routine."

    # 4. Generate for each period
    all_steps = []
    all_reasoning = []
    all_tips = []
    all_conflicts = []
    total_cost = 0
    all_descriptions = []

    for period in periods:
        template = type_info.get(f"{period}_template", [])

        # 5. Query products — from template + any categories mentioned in user's message
        categories_to_search = list(template)

        # Parse user message for additional product categories to search
        if data.additional_instructions:
            msg_lower = data.additional_instructions.lower()
            extra_cats = {
                'lip': 'lip_balm', 'lipbalm': 'lip_balm', 'lip balm': 'lip_balm',
                'sunscreen': 'sunscreen', 'spf': 'sunscreen', 'sun': 'sunscreen',
                'cleanser': 'cleanser', 'face wash': 'cleanser',
                'serum': 'serum', 'vitamin c': 'serum', 'niacinamide': 'serum',
                'moisturizer': 'moisturizer', 'cream': 'moisturizer',
                'retinol': 'treatment', 'retinoid': 'treatment',
                'exfoliat': 'exfoliant', 'aha': 'exfoliant', 'bha': 'exfoliant',
                'toner': 'toner', 'eye': 'eye_cream', 'mask': 'sleeping_mask',
            }
            for keyword, cat in extra_cats.items():
                if keyword in msg_lower and cat not in categories_to_search:
                    categories_to_search.append(cat)

        available_products_text = ""
        for cat in categories_to_search:
            available_products_text += await _get_products_for_category(
                db, cat, allergies, skin_type
            )

        # 6. Build the prompt
        app_order = APPLICATION_ORDER.get(period, {})
        prompt = ROUTINE_GENERATION_PROMPT
        replacements = {
            "{period}": period.upper(),
            "{user_context}": user_context,
            "{routine_type}": routine_type,
            "{type_description}": type_info.get("description", ""),
            "{template_steps}": ", ".join(template),
            "{max_steps}": str(type_info.get("max_steps", 7)),
            "{top_goal}": top_goal,
            "{concerns}": concerns,
            "{additional_instructions}": data.additional_instructions or "None",
            "{keep_products}": "None specified" if not data.keep_products else str(data.keep_products),
            "{available_products}": available_products_text or "No products in database yet. Suggest custom product names.",
            "{application_order_rules}": "\n".join(app_order.get("rules", [])),
            "{skin_type}": skin_type,
            "{skin_type_rules}": json.dumps(skin_rules, indent=2) if skin_rules else "Standard care",
            "{allergies}": ", ".join(allergies) if allergies else "None reported",
            "{existing_routines}": existing_routines_text,
            "{climate_note}": climate_note,
        }
        for k, v in replacements.items():
            prompt = prompt.replace(k, str(v))

        # 7. Call LLM
        try:
            from app.ai.providers.gemini import GeminiProvider
            provider = GeminiProvider()
            response_text = await provider.generate(
                system_prompt=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,  # Lower = more reliable, consistent output
                max_tokens=8000,
            )

            # 8. Parse JSON response
            result = _parse_llm_json(response_text)

            # 9. Normalize steps
            steps = result.get("steps", [])
            for s in steps:
                s["period"] = period
                if isinstance(s.get("product_price"), str):
                    s["product_price"] = None
                if isinstance(s.get("wait_time_seconds"), str):
                    try:
                        s["wait_time_seconds"] = int(s["wait_time_seconds"])
                    except (ValueError, TypeError):
                        s["wait_time_seconds"] = None

            all_steps.extend(steps)
            all_reasoning.append(result.get("reasoning", ""))
            all_tips.extend(result.get("tips", []))
            all_conflicts.extend(result.get("conflicts_checked", []))
            all_descriptions.append(result.get("description", ""))

            cost_val = result.get("total_monthly_cost", 0)
            if isinstance(cost_val, (int, float)):
                total_cost += cost_val

        except Exception as e:
            print(f"[Routine Generator] Error for {period}: {e}")
            # Fallback — return template without specific products
            for idx, cat in enumerate(template):
                cat_info = STEP_CATEGORIES.get(cat, {})
                all_steps.append({
                    "step_order": idx + 1,
                    "category": cat,
                    "product_id": None,
                    "product_name": None,
                    "product_brand": None,
                    "product_price": None,
                    "instruction": cat_info.get("default_instruction", "Apply as directed"),
                    "wait_time_seconds": cat_info.get("wait_time_seconds"),
                    "frequency": cat_info.get("frequency", "daily"),
                    "is_essential": cat_info.get("is_essential", True),
                    "why_this_product": None,
                    "period": period,
                })
            all_reasoning.append(f"AI generation failed for {period}: {str(e)[:100]}. Template provided — add your own products.")
            all_descriptions.append(f"{type_info.get('name', 'Custom')} routine — fill in products manually.")

    # 10. Save generation record
    gen_record = RoutineGeneration(
        user_id=user.id,
        routine_type=routine_type,
        period=data.period,
        input_profile_snapshot={
            "skin_type": skin_type,
            "concerns": profile.primary_concerns if profile else [],
            "allergies": allergies,
            "top_goal": top_goal,
            "climate": climate_note[:100],
        },
        generated_routine={"steps": all_steps, "reasoning": " ".join(all_reasoning)},
    )
    db.add(gen_record)
    await db.flush()

    # 11. Build response
    routine_name = f"JAY's {type_info['name']} Routine"
    if all_steps and all_steps[0].get("period") == "am":
        routine_name = result.get("name", routine_name) if 'result' in dir() else routine_name

    return GeneratedRoutineOut(
        routine_type=routine_type,
        period=data.period,
        name=routine_name,
        description=" ".join(filter(None, all_descriptions)) or f"Personalized {type_info['name']} routine for {skin_type} skin.",
        total_monthly_cost=total_cost,
        steps=all_steps,
        reasoning=" ".join(filter(None, all_reasoning)),
        tips=list(dict.fromkeys(all_tips)),  # Deduplicate while preserving order
        conflicts_checked=all_conflicts,
    )


# ── JSON parser with error recovery ──────────────────────────────────────

def _parse_llm_json(text: str) -> dict:
    """Parse JSON from LLM response with aggressive error recovery."""
    text = text.strip()

    # Strip markdown code fences
    if "```" in text:
        for part in text.split("```"):
            cleaned = part.strip()
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()
            if cleaned.startswith("{"):
                text = cleaned
                break

    # Try as-is
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fix common LLM quirks
    fixed = text
    fixed = re.sub(r"'([^']*)'", r'"\1"', fixed)  # single → double quotes
    fixed = re.sub(r',\s*([}\]])', r'\1', fixed)  # trailing commas
    fixed = re.sub(r':\s*None', ': null', fixed)  # Python None → JSON null
    fixed = re.sub(r':\s*True', ': true', fixed)  # Python True → JSON true
    fixed = re.sub(r':\s*False', ': false', fixed)  # Python False → JSON false

    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    # Last resort: extract JSON object
    start = fixed.find('{')
    end = fixed.rfind('}')
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(fixed[start:end + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse LLM response as JSON. First 200 chars: {text[:200]}")
