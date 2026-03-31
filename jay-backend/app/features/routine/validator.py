"""
Routine validator — pure logic, no DB, no AI.
Checks ingredient conflicts, application order, period rules.
"""
from .constants import CONFLICT_RULES, APPLICATION_ORDER, STEP_CATEGORIES
from .schemas import ConflictOut, ValidationResultOut


def validate_routine(steps: list[dict], period: str) -> ValidationResultOut:
    conflicts = []
    order_issues = []
    suggestions = []

    # 1. Ingredient conflict detection
    for i, step_a in enumerate(steps):
        ings_a = _get_ingredients(step_a)
        for step_b in steps[i + 1:]:
            ings_b = _get_ingredients(step_b)
            conflicts.extend(check_product_conflicts(ings_a, ings_b))

    # 2. Application order check
    order_key = f"order_{period}"
    expected_order = APPLICATION_ORDER.get(period, {}).get("order", [])
    step_categories = [s.get("category", "") for s in steps]

    for idx, cat in enumerate(step_categories):
        cat_info = STEP_CATEGORIES.get(cat)
        if not cat_info:
            continue
        cat_order = cat_info.get(order_key)
        if cat_order is None:
            continue
        # Check if any later step should come before this one
        for jdx in range(idx + 1, len(step_categories)):
            next_cat = step_categories[jdx]
            next_info = STEP_CATEGORIES.get(next_cat)
            if not next_info:
                continue
            next_order = next_info.get(order_key)
            if next_order is not None and next_order < cat_order:
                order_issues.append(
                    f"{next_info.get('name', next_cat)} should come before {cat_info.get('name', cat)}"
                )

    # 3. Period-specific rules
    for step in steps:
        cat = step.get("category", "")
        cat_info = STEP_CATEGORIES.get(cat, {})
        allowed_periods = cat_info.get("period", ["am", "pm"])

        if period not in allowed_periods:
            if cat == "sunscreen" and period == "pm":
                order_issues.append("Sunscreen is an AM-only step — remove from PM routine")
            elif cat in ("treatment", "exfoliant", "spot_treatment", "face_oil", "sleeping_mask") and period == "am":
                order_issues.append(f"{cat_info.get('name', cat)} is typically a PM step")

        # Check retinol in AM
        ings = _get_ingredients(step)
        if period == "am" and any(ing in ings for ing in ["retinol", "retinoid", "tretinoin"]):
            order_issues.append("Retinol should NOT be in AM routine — it's photosensitizing. Move to PM.")

    # 4. Sunscreen check for AM
    if period == "am":
        has_spf = any(s.get("category") == "sunscreen" for s in steps)
        if not has_spf:
            suggestions.append("Missing sunscreen — the single most important AM step. Add SPF 30+ as the final step.")
        else:
            # Sunscreen should be last
            if steps and steps[-1].get("category") != "sunscreen":
                order_issues.append("Sunscreen should be the LAST step in your AM routine")

    # 5. Missing essentials
    suggestions.extend(suggest_missing_steps(steps, period, ""))

    # 6. Exfoliant frequency check
    for step in steps:
        if step.get("category") == "exfoliant" and step.get("frequency", "daily") == "daily":
            suggestions.append("Daily exfoliation is too aggressive — reduce to 2-3x per week")

    valid = len(conflicts) == 0 and len(order_issues) == 0
    return ValidationResultOut(
        valid=valid, conflicts=conflicts, order_issues=order_issues, suggestions=suggestions
    )


def check_product_conflicts(
    ingredients_a: list[str], ingredients_b: list[str]
) -> list[ConflictOut]:
    conflicts = []
    ings_a = {i.lower() for i in ingredients_a}
    ings_b = {i.lower() for i in ingredients_b}

    for severity in ["avoid", "caution"]:
        for rule in CONFLICT_RULES.get(severity, []):
            a = rule["ingredient_a"].lower()
            b = rule["ingredient_b"].lower()
            if (a in ings_a and b in ings_b) or (b in ings_a and a in ings_b):
                conflicts.append(ConflictOut(
                    ingredient_a=rule["ingredient_a"],
                    ingredient_b=rule["ingredient_b"],
                    severity=severity,
                    reason=rule["reason"],
                    solution=rule.get("solution", "Use on alternate days"),
                ))
    return conflicts


def get_correct_order(steps: list[dict], period: str) -> list[dict]:
    order_key = f"order_{period}"

    def sort_key(step):
        cat = step.get("category", "")
        cat_info = STEP_CATEGORIES.get(cat, {})
        return cat_info.get(order_key, 99)

    return sorted(steps, key=sort_key)


def suggest_missing_steps(steps: list[dict], period: str, routine_type: str) -> list[str]:
    suggestions = []
    categories = {s.get("category") for s in steps}

    essentials = {
        cat: info for cat, info in STEP_CATEGORIES.items()
        if info.get("is_essential") and period in info.get("period", [])
    }

    for cat, info in essentials.items():
        if cat not in categories:
            suggestions.append(f"Missing essential step: {info.get('name', cat)}")

    return suggestions


def _get_ingredients(step: dict) -> list[str]:
    """Extract ingredient keywords from a step for conflict checking."""
    ings = []
    # From product key_ingredients if available
    if step.get("key_ingredients"):
        ings.extend(step["key_ingredients"])
    # From custom product name — extract known actives
    name = (step.get("custom_product_name") or step.get("product_name") or "").lower()
    active_keywords = [
        "retinol", "retinoid", "tretinoin", "vitamin_c", "vitamin c", "ascorbic",
        "niacinamide", "salicylic", "bha", "glycolic", "aha", "lactic",
        "benzoyl_peroxide", "benzoyl peroxide", "azelaic",
        "alpha arbutin", "alpha_arbutin", "hyaluronic", "ceramide",
        "vitamin_e", "vitamin e", "ferulic",
    ]
    for kw in active_keywords:
        if kw in name:
            ings.append(kw.replace(" ", "_"))
    # From category hints
    cat = step.get("category", "")
    if cat == "exfoliant":
        if not any(i in ings for i in ["aha", "bha", "glycolic", "salicylic", "lactic"]):
            ings.append("aha")  # Assume AHA if exfoliant with no specifics
    return ings
