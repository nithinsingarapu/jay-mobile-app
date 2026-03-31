# JAY Phase 3 — Routine Builder Constants
# All configuration data for the routine feature.

# ---------------------------------------------------------------------------
# ROUTINE TYPES
# ---------------------------------------------------------------------------

ROUTINE_TYPES = {
    "essential": {
        "name": "Essential",
        "description": "The non-negotiable basics. Perfect for beginners or minimalists.",
        "complexity": "minimal",
        "am_template": ["cleanser", "moisturizer", "sunscreen"],
        "pm_template": ["cleanser", "moisturizer"],
        "max_steps": 4,
        "who_its_for": "Beginners, minimalists, people who want consistency over complexity",
    },
    "complete": {
        "name": "Complete",
        "description": "A well-rounded routine with actives. The sweet spot for most people.",
        "complexity": "moderate",
        "am_template": ["cleanser", "toner", "serum", "moisturizer", "sunscreen"],
        "pm_template": ["cleanser", "toner", "treatment", "moisturizer"],
        "max_steps": 7,
        "who_its_for": "Intermediate users who want targeted results",
    },
    "glass_skin": {
        "name": "Glass Skin",
        "description": "The K-beauty layered approach. Maximum hydration and glow.",
        "complexity": "elaborate",
        "am_template": [
            "oil_cleanser",
            "water_cleanser",
            "toner",
            "essence",
            "serum",
            "eye_cream",
            "moisturizer",
            "sunscreen",
        ],
        "pm_template": [
            "oil_cleanser",
            "water_cleanser",
            "exfoliant",
            "toner",
            "essence",
            "serum",
            "eye_cream",
            "moisturizer",
            "face_oil",
            "sleeping_mask",
        ],
        "max_steps": 10,
        "who_its_for": "Skincare enthusiasts who enjoy the process",
    },
    "barrier_repair": {
        "name": "Barrier Repair",
        "description": "Gentle recovery routine. Strip back everything, rebuild your barrier.",
        "complexity": "minimal",
        "am_template": ["gentle_cleanser", "barrier_moisturizer", "sunscreen"],
        "pm_template": ["gentle_cleanser", "barrier_serum", "barrier_moisturizer"],
        "max_steps": 4,
        "who_its_for": "Damaged barrier, over-exfoliated skin, post-treatment recovery",
        "duration": "2-4 weeks until barrier recovers",
        "restrictions": ["no_actives", "no_exfoliants", "no_fragrance"],
    },
    "anti_acne": {
        "name": "Anti-Acne",
        "description": "Targeted routine for breakout-prone skin. Gentle but effective.",
        "complexity": "moderate",
        "am_template": [
            "gentle_cleanser",
            "niacinamide_serum",
            "oil_free_moisturizer",
            "sunscreen",
        ],
        "pm_template": [
            "gentle_cleanser",
            "bha_treatment",
            "oil_free_moisturizer",
        ],
        "max_steps": 5,
        "who_its_for": "Active acne, frequent breakouts, oily/combination skin",
        "key_ingredients": [
            "salicylic_acid",
            "niacinamide",
            "benzoyl_peroxide",
            "azelaic_acid",
        ],
    },
    "custom": {
        "name": "Custom",
        "description": "Build your own from scratch. JAY validates your choices.",
        "complexity": "any",
        "am_template": [],
        "pm_template": [],
        "max_steps": 12,
        "who_its_for": "Experienced users who know what they want",
    },
}

# ---------------------------------------------------------------------------
# STEP CATEGORIES
# ---------------------------------------------------------------------------

STEP_CATEGORIES = {
    "cleanser": {
        "name": "Cleanser",
        "slot": "cleanse",
        "period": ["am", "pm"],
        "order_am": 1,
        "order_pm": 2,
        "default_instruction": (
            "Massage onto damp skin for 60 seconds, rinse with lukewarm water"
        ),
        "is_essential": True,
    },
    "oil_cleanser": {
        "name": "Oil Cleanser",
        "slot": "cleanse",
        "period": ["pm"],
        "order_pm": 1,
        "default_instruction": (
            "Apply to dry skin, massage 60 seconds to dissolve sunscreen and makeup, rinse"
        ),
        "is_essential": False,
        "note": "First step of double cleanse",
    },
    # water_cleanser is an alias for cleanser used in the glass_skin context
    "water_cleanser": {
        "name": "Water Cleanser",
        "slot": "cleanse",
        "period": ["am", "pm"],
        "order_am": 1,
        "order_pm": 2,
        "default_instruction": (
            "Massage onto damp skin for 60 seconds, rinse with lukewarm water"
        ),
        "is_essential": False,
        "note": "Second step of double cleanse (glass skin context)",
    },
    "toner": {
        "name": "Toner",
        "slot": "prep",
        "period": ["am", "pm"],
        "order_am": 2,
        "order_pm": 3,
        "default_instruction": "Pat into damp skin with hands or cotton pad",
        "is_essential": False,
    },
    "essence": {
        "name": "Essence",
        "slot": "prep",
        "period": ["am", "pm"],
        "order_am": 3,
        "order_pm": 4,
        "default_instruction": (
            "Press into skin with palms, layer 2-3 times for extra hydration"
        ),
        "is_essential": False,
        "note": "K-beauty step",
    },
    "serum": {
        "name": "Serum",
        "slot": "treat",
        "period": ["am", "pm"],
        "order_am": 4,
        "order_pm": 5,
        "default_instruction": "Apply 2-3 drops to face, pat in gently",
        "is_essential": True,
        "wait_time_seconds": 60,
        "note": "AM: Vitamin C, niacinamide. PM: retinol, AHA/BHA",
    },
    "treatment": {
        "name": "Treatment",
        "slot": "treat",
        "period": ["pm"],
        "order_pm": 5,
        "default_instruction": "Apply thin layer to target areas",
        "is_essential": False,
    },
    "eye_cream": {
        "name": "Eye Cream",
        "slot": "treat",
        "period": ["am", "pm"],
        "order_am": 5,
        "order_pm": 6,
        "default_instruction": (
            "Dab small amount around orbital bone with ring finger"
        ),
        "is_essential": False,
    },
    "spot_treatment": {
        "name": "Spot Treatment",
        "slot": "treat",
        "period": ["pm"],
        "order_pm": 6,
        "default_instruction": "Apply only on affected spots",
        "is_essential": False,
    },
    "exfoliant": {
        "name": "Exfoliant",
        "slot": "treat",
        "period": ["pm"],
        "order_pm": 3,
        "default_instruction": (
            "Apply to dry skin, leave for recommended time, rinse if needed"
        ),
        "is_essential": False,
        "frequency": "2x_week",
        "note": "Chemical exfoliants only",
    },
    "moisturizer": {
        "name": "Moisturizer",
        "slot": "moisturize",
        "period": ["am", "pm"],
        "order_am": 6,
        "order_pm": 7,
        "default_instruction": "Apply evenly to face and neck",
        "is_essential": True,
    },
    "face_oil": {
        "name": "Face Oil",
        "slot": "moisturize",
        "period": ["pm"],
        "order_pm": 8,
        "default_instruction": (
            "2-3 drops pressed into skin as final step to seal moisture"
        ),
        "is_essential": False,
    },
    "sleeping_mask": {
        "name": "Sleeping Mask",
        "slot": "moisturize",
        "period": ["pm"],
        "order_pm": 9,
        "default_instruction": (
            "Apply thick layer as final step, leave overnight"
        ),
        "is_essential": False,
        "frequency": "2x_week",
    },
    "sunscreen": {
        "name": "Sunscreen",
        "slot": "protect",
        "period": ["am"],
        "order_am": 10,
        "default_instruction": (
            "Apply 2 finger lengths to face and neck. Reapply every 2-3 hours if outdoors."
        ),
        "is_essential": True,
        "note": "Non-negotiable",
    },
    "lip_balm": {
        "name": "Lip Balm",
        "slot": "protect",
        "period": ["am"],
        "order_am": 11,
        "default_instruction": (
            "Apply to lips after sunscreen. Reapply after eating."
        ),
        "is_essential": False,
    },
}

# ---------------------------------------------------------------------------
# CONFLICT RULES
# ---------------------------------------------------------------------------

CONFLICT_RULES = {
    "avoid": [
        {
            "ingredient_a": "retinol",
            "ingredient_b": "benzoyl_peroxide",
            "reason": "Benzoyl peroxide oxidises retinol, rendering it inactive and increasing irritation risk.",
            "solution": "Use benzoyl peroxide in AM and retinol in PM, or alternate nights.",
        },
        {
            "ingredient_a": "retinol",
            "ingredient_b": "vitamin_c",
            "reason": "Both are potent actives — combining raises irritation and can destabilise vitamin C.",
            "solution": "Use vitamin C in AM and retinol in PM.",
        },
        {
            "ingredient_a": "retinol",
            "ingredient_b": "aha",
            "reason": "AHAs lower skin pH and can deactivate retinol; combined use causes excessive irritation and peeling.",
            "solution": "Use AHA on alternate nights to retinol, never on the same evening.",
        },
        {
            "ingredient_a": "retinol",
            "ingredient_b": "bha",
            "reason": "BHA lowers skin pH and intensifies retinol irritation; over-exfoliation risk.",
            "solution": "Use BHA on alternate nights to retinol, never on the same evening.",
        },
        {
            "ingredient_a": "vitamin_c",
            "ingredient_b": "benzoyl_peroxide",
            "reason": "Benzoyl peroxide oxidises and degrades vitamin C, making it ineffective.",
            "solution": "Use vitamin C in AM only; avoid benzoyl peroxide in the same session.",
        },
        {
            "ingredient_a": "aha",
            "ingredient_b": "bha",
            "reason": "Stacking multiple acids increases irritation, over-exfoliation, and barrier damage.",
            "solution": "Alternate AHA and BHA on different nights rather than using both simultaneously.",
        },
    ],
    "caution": [
        {
            "ingredient_a": "niacinamide",
            "ingredient_b": "low_ph_acids",
            "reason": (
                "At very low pH, niacinamide can convert to niacin and cause temporary flushing; "
                "modern formulations largely mitigate this, but layering with very low-pH acids "
                "may still reduce efficacy."
            ),
            "solution": "Allow a 20–30 minute wait between a low-pH acid and niacinamide, or use them in separate routines.",
        },
        {
            "ingredient_a": "vitamin_c",
            "ingredient_b": "aha",
            "reason": (
                "Both are acidic actives; layering can cause stinging and over-exfoliation on "
                "sensitive skin, though tolerated by many."
            ),
            "solution": "Apply vitamin C first and wait 20–30 minutes before applying an AHA, or use in separate routines.",
        },
    ],
    "synergy": [
        {
            "ingredient_a": "vitamin_c",
            "ingredient_b": "vitamin_e",
            "reason": (
                "Vitamin E regenerates oxidised vitamin C, prolonging its antioxidant activity "
                "and enhancing photoprotection."
            ),
        },
        {
            "ingredient_a": "vitamin_c",
            "ingredient_b": "ferulic_acid",
            "reason": (
                "Ferulic acid stabilises vitamin C (and vitamin E) against oxidation, significantly "
                "boosting the antioxidant effect."
            ),
        },
        {
            "ingredient_a": "niacinamide",
            "ingredient_b": "hyaluronic_acid",
            "reason": (
                "Niacinamide strengthens the barrier while hyaluronic acid provides deep hydration; "
                "together they improve moisture retention and skin texture."
            ),
        },
        {
            "ingredient_a": "niacinamide",
            "ingredient_b": "alpha_arbutin",
            "reason": (
                "Both target hyperpigmentation through complementary pathways, producing faster and "
                "more even brightening results."
            ),
        },
        {
            "ingredient_a": "retinol",
            "ingredient_b": "ceramides",
            "reason": (
                "Ceramides replenish the lipid barrier that retinol can compromise, reducing dryness "
                "and irritation while supporting long-term retinol use."
            ),
        },
        {
            "ingredient_a": "retinol",
            "ingredient_b": "niacinamide",
            "reason": (
                "Niacinamide calms retinol-induced redness and irritation while reinforcing the "
                "barrier, making the combination more tolerable for sensitive skin."
            ),
        },
    ],
}

# ---------------------------------------------------------------------------
# SKIN TYPE RULES
# ---------------------------------------------------------------------------

SKIN_TYPE_RULES = {
    "oily": {
        "prefer_textures": ["gel", "foam", "lightweight_lotion", "water_based_serum"],
        "avoid_textures": ["heavy_cream", "balm", "oil", "rich_butter"],
        "key_ingredients": [
            "niacinamide",
            "salicylic_acid",
            "zinc",
            "hyaluronic_acid",
            "clay",
            "glycolic_acid",
        ],
        "avoid_ingredients": ["mineral_oil", "petrolatum", "heavy_silicones"],
        "notes": (
            "Focus on oil control and pore clarity. Lightweight, non-comedogenic formulas. "
            "Avoid skipping moisturiser — dehydrated oily skin produces even more sebum."
        ),
    },
    "dry": {
        "prefer_textures": ["rich_cream", "balm", "oil", "lotion", "serum"],
        "avoid_textures": ["foam_cleanser", "alcohol_toner", "gel"],
        "key_ingredients": [
            "hyaluronic_acid",
            "ceramides",
            "glycerin",
            "squalane",
            "shea_butter",
            "peptides",
        ],
        "avoid_ingredients": ["alcohol_denat", "high_concentration_aha", "harsh_surfactants"],
        "notes": (
            "Prioritise hydration and occlusion. Double cleanse with caution — oil cleanser only "
            "when wearing SPF/makeup. Layer a humectant serum under a rich moisturiser."
        ),
    },
    "combination": {
        "prefer_textures": ["lightweight_lotion", "gel_cream", "water_based_serum", "foam"],
        "avoid_textures": ["heavy_oil", "thick_balm"],
        "key_ingredients": [
            "niacinamide",
            "hyaluronic_acid",
            "salicylic_acid",
            "ceramides",
            "glycerin",
        ],
        "avoid_ingredients": ["heavy_occlusive_oils"],
        "notes": (
            "Zone-target where needed. BHA on the T-zone, richer moisturiser on dry areas. "
            "Balanced cleansers that don't strip or over-moisturise."
        ),
    },
    "sensitive": {
        "prefer_textures": ["cream", "lotion", "gentle_serum", "milk_cleanser"],
        "avoid_textures": ["foaming_cleanser", "exfoliating_scrub", "high_alcohol_toner"],
        "key_ingredients": [
            "centella_asiatica",
            "ceramides",
            "allantoin",
            "panthenol",
            "oat_extract",
            "hyaluronic_acid",
        ],
        "avoid_ingredients": [
            "fragrance",
            "essential_oils",
            "alcohol_denat",
            "high_concentration_actives",
            "soap",
        ],
        "notes": (
            "Introduce one new product at a time. Patch test everything. "
            "Fragrance-free and minimal ingredient lists. Avoid layering multiple actives."
        ),
    },
    "normal": {
        "prefer_textures": ["lotion", "serum", "gel_cream", "lightweight_cream"],
        "avoid_textures": [],
        "key_ingredients": [
            "antioxidants",
            "peptides",
            "hyaluronic_acid",
            "vitamin_c",
            "retinol",
        ],
        "avoid_ingredients": [],
        "notes": (
            "Maintenance and prevention are the priority. Focus on antioxidants and SPF in the AM, "
            "and retinoids or peptides in the PM for long-term skin health."
        ),
    },
}

# ---------------------------------------------------------------------------
# APPLICATION ORDER
# ---------------------------------------------------------------------------

APPLICATION_ORDER = {
    "am": {
        "principle": (
            "Thinnest to thickest consistency, water-based before oil-based, "
            "treatments before protection."
        ),
        "order": [
            {"step": 1, "category": "cleanser", "slot": "cleanse"},
            {"step": 2, "category": "toner", "slot": "prep"},
            {"step": 3, "category": "essence", "slot": "prep"},
            {"step": 4, "category": "serum", "slot": "treat"},
            {"step": 5, "category": "eye_cream", "slot": "treat"},
            {"step": 6, "category": "moisturizer", "slot": "moisturize"},
            {"step": 10, "category": "sunscreen", "slot": "protect"},
            {"step": 11, "category": "lip_balm", "slot": "protect"},
        ],
        "rules": [
            "Always apply sunscreen as the absolute last skincare step in AM.",
            "Wait 60 seconds after vitamin C serum before applying the next product.",
            "Apply eye cream before moisturiser so it isn't diluted.",
            "Toner and essence are optional but increase hydration if included.",
            "Sunscreen is non-negotiable — skip it and no other step matters.",
        ],
    },
    "pm": {
        "principle": (
            "Double cleanse if wearing SPF or makeup, then thinnest to thickest, "
            "actives before occlusives."
        ),
        "order": [
            {"step": 1, "category": "oil_cleanser", "slot": "cleanse"},
            {"step": 2, "category": "cleanser", "slot": "cleanse"},
            {"step": 3, "category": "exfoliant", "slot": "treat"},
            {"step": 3, "category": "toner", "slot": "prep"},
            {"step": 4, "category": "essence", "slot": "prep"},
            {"step": 5, "category": "serum", "slot": "treat"},
            {"step": 5, "category": "treatment", "slot": "treat"},
            {"step": 6, "category": "eye_cream", "slot": "treat"},
            {"step": 6, "category": "spot_treatment", "slot": "treat"},
            {"step": 7, "category": "moisturizer", "slot": "moisturize"},
            {"step": 8, "category": "face_oil", "slot": "moisturize"},
            {"step": 9, "category": "sleeping_mask", "slot": "moisturize"},
        ],
        "rules": [
            "Oil cleanser first on nights you wore SPF or makeup; skip if bare-faced.",
            "Never use AHA/BHA exfoliant on the same night as retinol.",
            "Apply retinol or treatment after toner/essence, before moisturiser.",
            "Face oil seals in moisture — always apply after water-based products.",
            "Sleeping mask replaces night moisturiser 2x per week, not in addition to it.",
            "Wait 20–30 minutes after retinol before applying moisturiser if experiencing irritation.",
        ],
    },
}
