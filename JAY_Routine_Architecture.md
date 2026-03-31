# JAY Routine Builder — Architecture & Feature Plan

> **Reference:** routine_.pdf (skincare routine research), existing user profile system, products.csv database
> **Status:** Planning phase — architecture approval before build

---

## What the Routine Builder Does

This is JAY's core retention feature — users open the app twice daily for this. It does four things:

1. **Know:** Captures what the user currently does (or doesn't do)
2. **Build:** AI generates a personalized routine based on profile, concerns, skin type, and available products
3. **Track:** Users mark steps complete each morning/night — builds streaks and feeds intelligence
4. **Evolve:** Routine adapts over time based on diary data, season, and skin state changes

---

## Feature Breakdown

### Feature 1: Routine Types

Users can have multiple routine types. Each type has a different structure and philosophy:

```
┌─────────────────────────────────────────────────────────────┐
│                     ROUTINE TYPES                            │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐│
│  │ Essential    │  │ Complete    │  │ Glass Skin           ││
│  │ 3-4 steps   │  │ 5-7 steps   │  │ 7-10 steps (K-beauty)││
│  │ Beginners   │  │ Intermediate│  │ Advanced / enthusiast││
│  │             │  │             │  │                      ││
│  │ Cleanse     │  │ Cleanse     │  │ Oil cleanse          ││
│  │ Moisturize  │  │ Tone        │  │ Water cleanse        ││
│  │ SPF (AM)    │  │ Serum       │  │ Exfoliate (1-2x/wk)  ││
│  │             │  │ Moisturize  │  │ Toner                ││
│  │             │  │ SPF (AM)    │  │ Essence              ││
│  │             │  │ Treatment(PM│  │ Serum/ampoule        ││
│  │             │  │             │  │ Eye cream            ││
│  │             │  │             │  │ Moisturizer          ││
│  │             │  │             │  │ SPF (AM) / Oil (PM)  ││
│  └─────────────┘  └─────────────┘  └──────────────────────┘│
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐│
│  │ Repair      │  │ Anti-Acne   │  │ Custom               ││
│  │ Focus       │  │ Focus       │  │ Build your own       ││
│  │             │  │             │  │                      ││
│  │ Barrier     │  │ Gentle      │  │ User picks steps     ││
│  │ recovery    │  │ cleanse     │  │ from a menu,         ││
│  │ after       │  │ + BHA/AHA   │  │ JAY validates        ││
│  │ damage,     │  │ + targeted  │  │ order and            ││
│  │ over-       │  │ treatment   │  │ compatibility        ││
│  │ exfoliation │  │ + barrier   │  │                      ││
│  │ or reaction │  │ repair      │  │                      ││
│  └─────────────┘  └─────────────┘  └──────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Type definitions (stored as config, not hardcoded per routine):**

```python
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
        "am_template": ["oil_cleanser", "water_cleanser", "toner", "essence", "serum", "eye_cream", "moisturizer", "sunscreen"],
        "pm_template": ["oil_cleanser", "water_cleanser", "exfoliant", "toner", "essence", "serum", "eye_cream", "moisturizer", "face_oil", "sleeping_mask"],
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
        "am_template": ["gentle_cleanser", "niacinamide_serum", "oil_free_moisturizer", "sunscreen"],
        "pm_template": ["gentle_cleanser", "bha_treatment", "oil_free_moisturizer"],
        "max_steps": 5,
        "who_its_for": "Active acne, frequent breakouts, oily/combination skin",
        "key_ingredients": ["salicylic_acid", "niacinamide", "benzoyl_peroxide", "azelaic_acid"],
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
```

### Feature 2: Current Routine Capture

Before building anything new, JAY needs to know what the user already does. This was partially captured during onboarding (profile.current_routine), but the routine builder makes it concrete — mapping actual products to steps.

```
User flow:
┌─────────────────────────────────────────────┐
│  "What does your current routine look like?" │
│                                              │
│  ┌──── AM Routine ────────────────────────┐  │
│  │                                        │  │
│  │  + Add step                            │  │
│  │  ┌────────────────────────────────┐    │  │
│  │  │ Step 1: Cleanser               │    │  │
│  │  │ 🔍 Search: "CeraVe Foam..."   │    │  │
│  │  │ → CeraVe Foaming Cleanser ₹599│    │  │
│  │  └────────────────────────────────┘    │  │
│  │  ┌────────────────────────────────┐    │  │
│  │  │ Step 2: Moisturizer            │    │  │
│  │  │ 🔍 Search or type custom name  │    │  │
│  │  └────────────────────────────────┘    │  │
│  │  ┌────────────────────────────────┐    │  │
│  │  │ Step 3: SPF                    │    │  │
│  │  │ 🔍 "La Shield..."             │    │  │
│  │  └────────────────────────────────┘    │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌──── PM Routine ────────────────────────┐  │
│  │  + Add step                            │  │
│  │  ...                                   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [I don't have a routine yet]                │
│  [Save current routine]                      │
└──────────────────────────────────────────────┘
```

Each step maps to:
- A category (cleanser, serum, moisturizer, sunscreen, etc.)
- Either a product from the database (product_id) OR a custom name typed by the user
- Application instructions (auto-filled from product category or user-customized)
- Wait time before next step (if applicable)

### Feature 3: Build with JAY (AI Routine Generation)

The star feature. JAY analyzes the user's profile and generates a personalized routine with specific product recommendations from the database.

```
┌─────────────────── BUILD WITH JAY ─────────────────────┐
│                                                         │
│  Step 1: JAY reads user profile                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Skin type: combination                            │  │
│  │ Concerns: acne, dark spots, pores                 │  │
│  │ Fitzpatrick: IV                                   │  │
│  │ Budget: ₹500-1000/month                           │  │
│  │ Complexity pref: moderate (4-5 steps)             │  │
│  │ Allergies: fragrance                              │  │
│  │ Current state: acne 2/5, oiliness 3/5             │  │
│  │ Location: Mumbai (humid)                          │  │
│  │ Lifestyle: high dairy, moderate stress             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Step 2: JAY selects routine type                       │
│  → "Complete" type fits moderate preference             │
│  → AM: 5 steps, PM: 4 steps                            │
│                                                         │
│  Step 3: JAY selects products from DB                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │ For "serum" slot targeting "dark spots":           │  │
│  │                                                   │  │
│  │ Query products WHERE:                             │  │
│  │   category = 'serum'                              │  │
│  │   'dark_spots' in target_concerns                 │  │
│  │   price_inr <= 1000 (budget filter)               │  │
│  │   NOT contains user's allergens                   │  │
│  │   is_available = true                             │  │
│  │                                                   │  │
│  │ Results ranked by:                                │  │
│  │   1. Concern match score                          │  │
│  │   2. Ingredient quality                           │  │
│  │   3. Price-to-value ratio                         │  │
│  │   4. Brand preference match                       │  │
│  │                                                   │  │
│  │ → Minimalist 10% Vitamin C ₹549                   │  │
│  │   (vitamin C targets dark spots,                  │  │
│  │    unscented = no fragrance,                      │  │
│  │    within budget, pharmacy brand)                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Step 4: JAY validates the full routine                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Check ingredient conflicts:                       │  │
│  │   ✓ Vitamin C + Niacinamide: SAFE                 │  │
│  │   ✓ No retinol in AM: CORRECT                     │  │
│  │   ✓ SPF is last AM step: CORRECT                  │  │
│  │   ✓ No allergens in any product: VERIFIED         │  │
│  │   ✓ Total cost: ₹847/month — within budget        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Step 5: Present to user                                │
│  → Show full routine with products, prices, why         │
│  → User can swap any product, remove steps, add steps   │
│  → "Save this routine" or "Regenerate"                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Feature 4: Daily Tracking

```
┌──────────── TODAY'S ROUTINE ──────────────────┐
│                                                │
│  ☀️ Morning          2 of 4 complete           │
│  ━━━━━━━━━━━━░░░░░░░░░  50%                   │
│                                                │
│  ☑ Cleanser — CeraVe Foaming                  │
│    "Massage 60s on damp skin"        ✓ 7:32am │
│                                                │
│  ☑ Serum — Minimalist 10% Vit C               │
│    "2-3 drops, pat in"               ✓ 7:34am │
│    ⏱ Wait 1-2 min before next step             │
│                                                │
│  ☐ Moisturizer — Neutrogena Hydro Boost        │
│    "Apply evenly"                              │
│                                                │
│  ☐ SPF 50 — La Shield Mineral                  │
│    "2 finger lengths, reapply 2-3hrs"          │
│                                                │
│  ──────────────────────────────────────────    │
│                                                │
│  🌙 Night             not started              │
│  ░░░░░░░░░░░░░░░░░░░░  0%                     │
│                                                │
│  ☐ Cleanser — CeraVe Foaming                  │
│  ☐ Treatment — Minimalist 0.3% Retinol         │
│    "Apply pea-sized amount"                    │
│    💡 Use 2-3x/week only (Mon, Wed, Fri)        │
│  ☐ Moisturizer — Neutrogena Hydro Boost        │
│                                                │
└────────────────────────────────────────────────┘
```

Completion data feeds into:
- **Gamification**: 2 points per step, 5 bonus for full routine
- **Intelligence**: Adherence percentage, streak tracking
- **Diary correlation**: "Good skin days correlate with SPF usage"

### Feature 5: Additional Features

**Routine sharing** — Export routine as a shareable image/link ("My JAY routine" card with steps and products)

**Routine comparison** — Side-by-side view of old vs new routine when JAY suggests changes

**Seasonal adjustment** — JAY notifies when season changes and suggests swaps: "Mumbai monsoon → switch to gel moisturizer, add stronger SPF"

**Product alerts** — If a product in the routine goes out of stock or gets discontinued, JAY suggests a replacement

**Step timer** — Optional timer for wait times between actives (1-2 min between vitamin C and niacinamide)

**Routine cost calculator** — Shows monthly cost of the full routine, broken down by product. Suggests dupes if over budget.

**Product usage tracker** — Estimate how long each product will last based on usage frequency and size. "Your SPF will run out in ~18 days"

**Ingredient conflict scanner** — Whenever a product is added, instantly checks compatibility with all other products in the routine

---

## Database Schema

```sql
-- Routine definitions (one per user per period)
routines
├── id                      UUID PRIMARY KEY
├── user_id                 VARCHAR(36) NOT NULL
├── name                    VARCHAR(100)           -- "My morning routine", custom name
├── period                  VARCHAR(5) NOT NULL     -- 'am' or 'pm'
├── routine_type            VARCHAR(30) NOT NULL    -- essential, complete, glass_skin, etc.
├── is_active               BOOLEAN DEFAULT true
├── total_monthly_cost      NUMERIC(10,2)           -- calculated from products
├── created_at              TIMESTAMPTZ
├── updated_at              TIMESTAMPTZ
└── UNIQUE(user_id, period) WHERE is_active = true  -- one active per period

-- Individual steps within a routine
routine_steps
├── id                      UUID PRIMARY KEY
├── routine_id              UUID FK → routines ON DELETE CASCADE
├── step_order              INTEGER NOT NULL
├── category                VARCHAR(30) NOT NULL
│                           -- cleanser, oil_cleanser, water_cleanser, toner, essence,
│                           -- serum, treatment, eye_cream, moisturizer, sunscreen,
│                           -- face_oil, sleeping_mask, exfoliant, spot_treatment, lip_balm
├── product_id              INTEGER FK → products   -- null if custom
├── custom_product_name     VARCHAR(255)            -- if product not in DB
├── instruction             TEXT                    -- "Massage 60s on damp skin"
├── wait_time_seconds       INTEGER                 -- null if no wait needed
├── frequency               VARCHAR(30) DEFAULT 'daily'
│                           -- daily, every_other_day, 2x_week, 3x_week, weekly, as_needed
├── frequency_days          TEXT[]                   -- ['mon','wed','fri'] for 3x_week
├── is_essential            BOOLEAN DEFAULT true     -- core step vs optional
├── notes                   TEXT                     -- "Start at 0.3%, build to 1%"
├── why_this_product        TEXT                     -- JAY's reason for recommending this
└── UNIQUE(routine_id, step_order)

-- Daily completion tracking
routine_completions
├── id                      UUID PRIMARY KEY
├── user_id                 VARCHAR(36) NOT NULL
├── routine_id              UUID FK → routines
├── step_id                 UUID FK → routine_steps
├── completion_date         DATE NOT NULL
├── completed_at            TIMESTAMPTZ             -- exact time
├── skipped                 BOOLEAN DEFAULT false    -- explicitly skipped vs just not done
├── skip_reason             VARCHAR(100)            -- "ran out of product", "running late", etc.
└── UNIQUE(step_id, completion_date)

-- Routine generation history (what JAY recommended and why)
routine_generations
├── id                      UUID PRIMARY KEY
├── user_id                 VARCHAR(36) NOT NULL
├── routine_type            VARCHAR(30)
├── period                  VARCHAR(5)
├── input_profile_snapshot  JSONB                   -- profile state when generated
├── generated_routine       JSONB                   -- full routine with reasoning
├── was_accepted            BOOLEAN                 -- did user save this?
├── modifications           JSONB                   -- what user changed before saving
├── created_at              TIMESTAMPTZ

Indexes:
  - idx_completions_user_date ON routine_completions(user_id, completion_date)
  - idx_completions_routine_date ON routine_completions(routine_id, completion_date)
  - idx_routines_user_active ON routines(user_id) WHERE is_active = true
```

---

## Step Category Definitions

```python
STEP_CATEGORIES = {
    # Cleansing
    "cleanser": {
        "name": "Cleanser",
        "slot": "cleanse",
        "period": ["am", "pm"],
        "order_am": 1,
        "order_pm": 2,  # after oil cleanser
        "default_instruction": "Massage onto damp skin for 60 seconds, rinse with lukewarm water",
        "is_essential": True,
    },
    "oil_cleanser": {
        "name": "Oil cleanser",
        "slot": "cleanse",
        "period": ["pm"],  # PM only — removes sunscreen and makeup
        "order_pm": 1,
        "default_instruction": "Apply to dry skin, massage 60 seconds to dissolve sunscreen and makeup, rinse",
        "is_essential": False,
        "note": "First step of double cleanse. Only needed if wearing sunscreen or makeup.",
    },

    # Prep
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
        "default_instruction": "Press into skin with palms, layer 2-3 times for extra hydration",
        "is_essential": False,
        "note": "K-beauty step. Lightweight hydration booster.",
    },

    # Treat
    "serum": {
        "name": "Serum",
        "slot": "treat",
        "period": ["am", "pm"],
        "order_am": 4,
        "order_pm": 5,
        "default_instruction": "Apply 2-3 drops to face, pat in gently",
        "is_essential": True,
        "wait_time_seconds": 60,
        "note": "AM: Vitamin C, niacinamide, alpha arbutin. PM: retinol, AHA/BHA, azelaic acid.",
    },
    "treatment": {
        "name": "Treatment",
        "slot": "treat",
        "period": ["pm"],  # PM only — most treatments are photosensitizing
        "order_pm": 5,
        "default_instruction": "Apply thin layer to target areas",
        "is_essential": False,
    },
    "eye_cream": {
        "name": "Eye cream",
        "slot": "treat",
        "period": ["am", "pm"],
        "order_am": 5,
        "order_pm": 6,
        "default_instruction": "Dab small amount around orbital bone with ring finger",
        "is_essential": False,
    },
    "spot_treatment": {
        "name": "Spot treatment",
        "slot": "treat",
        "period": ["pm"],
        "order_pm": 6,
        "default_instruction": "Apply only on affected spots, avoid surrounding skin",
        "is_essential": False,
    },
    "exfoliant": {
        "name": "Exfoliant",
        "slot": "treat",
        "period": ["pm"],  # PM only
        "order_pm": 3,  # after cleanser, before serum
        "default_instruction": "Apply to dry skin, leave for recommended time, rinse if needed",
        "is_essential": False,
        "frequency": "2x_week",
        "note": "Chemical exfoliants (AHA/BHA) only. Never use physical scrubs with actives.",
    },

    # Moisturize
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
        "name": "Face oil",
        "slot": "moisturize",
        "period": ["pm"],  # PM only — can interfere with SPF
        "order_pm": 8,
        "default_instruction": "2-3 drops pressed into skin as final step to seal moisture",
        "is_essential": False,
    },
    "sleeping_mask": {
        "name": "Sleeping mask",
        "slot": "moisturize",
        "period": ["pm"],
        "order_pm": 9,
        "default_instruction": "Apply thick layer as final step, leave overnight",
        "is_essential": False,
        "frequency": "2x_week",
    },

    # Protect
    "sunscreen": {
        "name": "Sunscreen SPF 30+",
        "slot": "protect",
        "period": ["am"],  # AM ONLY — always last step
        "order_am": 10,  # always last
        "default_instruction": "Apply 2 finger lengths to face and neck. Reapply every 2-3 hours if outdoors.",
        "is_essential": True,
        "note": "Non-negotiable. The single most impactful step for long-term skin health.",
    },
    "lip_balm": {
        "name": "Lip balm with SPF",
        "slot": "protect",
        "period": ["am"],
        "order_am": 11,
        "default_instruction": "Apply to lips after sunscreen. Reapply after eating.",
        "is_essential": False,
    },
}
```

---

## Ingredient Conflict Rules (for validation)

```python
CONFLICT_RULES = {
    # Hard conflicts — NEVER use together in same session
    "avoid": [
        {
            "ingredient_a": "retinol",
            "ingredient_b": "benzoyl_peroxide",
            "reason": "Benzoyl peroxide deactivates retinol, making it useless",
            "solution": "Use on alternate nights",
        },
        {
            "ingredient_a": "retinol",
            "ingredient_b": "vitamin_c",
            "reason": "Both are potent actives that can cause irritation together",
            "solution": "Vitamin C in AM, retinol in PM",
        },
        {
            "ingredient_a": "retinol",
            "ingredient_b": "aha",
            "reason": "Both increase cell turnover — together risks over-exfoliation",
            "solution": "Alternate nights or different days",
        },
        {
            "ingredient_a": "retinol",
            "ingredient_b": "bha",
            "reason": "Double exfoliation risk — irritation, barrier damage",
            "solution": "Alternate nights",
        },
        {
            "ingredient_a": "vitamin_c",
            "ingredient_b": "benzoyl_peroxide",
            "reason": "Benzoyl peroxide oxidizes vitamin C, destroying its efficacy",
            "solution": "Vitamin C in AM, benzoyl peroxide in PM",
        },
        {
            "ingredient_a": "aha",
            "ingredient_b": "bha",
            "reason": "Double acid exfoliation — extreme irritation risk",
            "solution": "Use in one formulated product or alternate days",
        },
    ],

    # Soft conflicts — CAN use together but with caution
    "caution": [
        {
            "ingredient_a": "niacinamide",
            "ingredient_b": "low_ph_acids",
            "reason": "Very low pH can cause temporary flushing with niacinamide",
            "solution": "Wait 10-15 minutes between application",
        },
        {
            "ingredient_a": "vitamin_c",
            "ingredient_b": "aha",
            "reason": "Both are acidic — can irritate if used at high concentrations",
            "solution": "Use vitamin C in AM, AHA in PM, or use low concentrations",
        },
    ],

    # Safe combinations — explicitly good together
    "synergy": [
        {
            "ingredient_a": "vitamin_c",
            "ingredient_b": "vitamin_e",
            "reason": "Vitamin E stabilizes vitamin C and boosts its antioxidant power 4x",
        },
        {
            "ingredient_a": "vitamin_c",
            "ingredient_b": "ferulic_acid",
            "reason": "Ferulic acid doubles the photoprotection of vitamin C+E combo",
        },
        {
            "ingredient_a": "niacinamide",
            "ingredient_b": "hyaluronic_acid",
            "reason": "Both are universally well-tolerated and complement each other",
        },
        {
            "ingredient_a": "niacinamide",
            "ingredient_b": "alpha_arbutin",
            "reason": "Dream team for pigmentation — different mechanisms, same goal",
        },
        {
            "ingredient_a": "retinol",
            "ingredient_b": "ceramides",
            "reason": "Ceramides buffer retinol irritation while maintaining efficacy",
        },
        {
            "ingredient_a": "retinol",
            "ingredient_b": "niacinamide",
            "reason": "Niacinamide reduces retinol irritation and boosts barrier repair",
        },
    ],
}

# Skin-type specific rules (from your research PDF)
SKIN_TYPE_RULES = {
    "oily": {
        "prefer_textures": ["gel", "lightweight", "oil_free", "water_based"],
        "avoid_textures": ["heavy_cream", "oil_based", "rich"],
        "key_ingredients": ["niacinamide", "salicylic_acid", "bha"],
        "avoid_ingredients": ["heavy_oils", "petroleum_jelly", "coconut_oil"],
        "notes": "Biggest mistake: over-cleansing or skipping moisturizer. Both signal skin to produce MORE oil.",
    },
    "dry": {
        "prefer_textures": ["cream", "rich", "oil_based", "balm"],
        "avoid_textures": ["foaming_cleanser", "mattifying"],
        "key_ingredients": ["hyaluronic_acid", "ceramides", "glycerin", "urea", "squalane"],
        "avoid_ingredients": ["alcohol_denat", "harsh_sulfates"],
        "notes": "Think in layers: essence → serum → moisturizer → oil. Each locks in the previous.",
    },
    "combination": {
        "prefer_textures": ["lightweight", "gel_cream", "balancing"],
        "avoid_textures": [],
        "key_ingredients": ["niacinamide", "hyaluronic_acid"],
        "avoid_ingredients": [],
        "notes": "Treat T-zone and cheeks as separate zones. Niacinamide uniquely balances both.",
    },
    "sensitive": {
        "prefer_textures": ["gentle", "fragrance_free", "minimal_ingredients"],
        "avoid_textures": ["exfoliating", "high_concentration_actives"],
        "key_ingredients": ["centella_asiatica", "allantoin", "panthenol", "ceramides"],
        "avoid_ingredients": ["fragrance", "essential_oils", "alcohol", "harsh_acids"],
        "notes": "Less is more. Fewer ingredients = fewer chances of reaction. Bakuchiol is a gentle retinol alternative.",
    },
    "normal": {
        "prefer_textures": ["any"],
        "avoid_textures": [],
        "key_ingredients": ["vitamin_c", "retinol", "spf"],
        "avoid_ingredients": [],
        "notes": "Focus on prevention. Consistent SPF + Vitamin C (AM) + Retinol (PM) = best long-term strategy.",
    },
}
```

---

## Application Order Rules (from your research PDF)

```python
APPLICATION_ORDER = {
    "am": {
        "principle": "CLEANSE → PREP → TREAT → MOISTURIZE → PROTECT",
        "order": [
            "cleanser",          # 1. Cleanse
            "toner",             # 2. Prep (optional)
            "essence",           # 3. Prep (optional, K-beauty)
            "serum",             # 4. Treat — Vitamin C, niacinamide, alpha arbutin
            "eye_cream",         # 5. Treat (optional)
            "moisturizer",       # 6. Moisturize
            "sunscreen",         # 7. Protect (ALWAYS LAST)
            "lip_balm",          # 8. Protect (optional)
        ],
        "rules": [
            "Thinnest to thickest consistency",
            "Water-based before oil-based",
            "Actives before moisturizer (better absorption)",
            "SPF is ALWAYS the final step",
            "NO retinol in AM routine (photosensitizing)",
            "NO AHA/BHA in AM unless experienced + diligent with SPF",
        ],
    },
    "pm": {
        "principle": "CLEANSE → PREP → TREAT → MOISTURIZE",
        "order": [
            "oil_cleanser",      # 1. First cleanse (removes sunscreen/makeup)
            "cleanser",          # 2. Second cleanse (water-based)
            "toner",             # 3. Prep (optional)
            "exfoliant",         # 4. Treat (1-2x/week only)
            "essence",           # 5. Prep (optional, K-beauty)
            "serum",             # 6. Treat — retinol, azelaic acid
            "treatment",         # 7. Treat — targeted
            "spot_treatment",    # 8. Treat — spots only
            "eye_cream",         # 9. Treat (optional)
            "moisturizer",       # 10. Moisturize
            "face_oil",          # 11. Seal (optional)
            "sleeping_mask",     # 12. Seal (optional, 2-3x/week)
        ],
        "rules": [
            "Double cleanse only if wearing sunscreen/makeup",
            "Retinol and strong actives belong here (skin repairs at night)",
            "Don't combine retinol + AHA/BHA in same session",
            "Moisturizer acts as a buffer for retinol if needed",
            "Face oil goes AFTER moisturizer (seals everything in)",
        ],
    },
}
```

---

## API Endpoints

```
ROUTINE CRUD:
GET    /api/v1/routine                              Get active AM + PM routines with steps
POST   /api/v1/routine                              Create routine manually
PUT    /api/v1/routine/{id}                          Update routine metadata
PUT    /api/v1/routine/{id}/steps                    Replace all steps
POST   /api/v1/routine/{id}/steps                   Add a step
PUT    /api/v1/routine/{id}/steps/{step_id}          Update a step
DELETE /api/v1/routine/{id}/steps/{step_id}          Remove a step
POST   /api/v1/routine/{id}/reorder                  Reorder steps
DELETE /api/v1/routine/{id}                          Deactivate routine

ROUTINE TYPES:
GET    /api/v1/routine/types                         List all routine types with descriptions

AI GENERATION:
POST   /api/v1/routine/generate                      Generate routine with JAY
       Body: {
         "period": "am" | "pm" | "both",
         "routine_type": "essential" | "complete" | ... | "auto",
         "goals": ["clear_skin", "hydration"],
         "avoid_products": [product_ids],
         "keep_products": [product_ids],           -- products from current routine to keep
         "additional_instructions": "I want something simple"
       }
       Response: generated routine with products, reasoning, cost

POST   /api/v1/routine/validate                      Validate a routine for conflicts
       Body: { "steps": [...] }
       Response: { "valid": bool, "conflicts": [...], "suggestions": [...] }

DAILY TRACKING:
POST   /api/v1/routine/{id}/complete                 Mark a step complete today
       Body: { "step_id": "uuid", "skipped": false }
POST   /api/v1/routine/{id}/complete-all             Mark all steps complete
GET    /api/v1/routine/{id}/today                    Today's completion status
GET    /api/v1/routine/stats                         Adherence stats (weekly/monthly)
       ?period=7d|30d|90d
GET    /api/v1/routine/streak                        Current completion streak

PRODUCT SEARCH (used within routine builder):
GET    /api/v1/routine/products/search               Search products for a step
       ?category=serum&concern=dark_spots&budget=1000&exclude_allergens=fragrance
GET    /api/v1/routine/products/recommend             JAY's top picks for a category
       ?category=sunscreen&skin_type=oily&budget=500

UTILITY:
GET    /api/v1/routine/cost                          Calculate monthly routine cost
GET    /api/v1/routine/conflicts                     Check all product conflicts in active routine
GET    /api/v1/routine/export                        Export routine as shareable data
POST   /api/v1/routine/import                        Import a shared routine
```

---

## AI Generation Prompt

When the user taps "Build with JAY", this is the prompt sent to Gemini:

```python
ROUTINE_GENERATION_PROMPT = """You are JAY, generating a personalized skincare routine.

TASK: Create a {period} skincare routine for this user.

USER PROFILE:
{user_context}

ROUTINE TYPE SELECTED: {routine_type}
Template: {template_steps}

ADDITIONAL USER INSTRUCTIONS: {additional_instructions}

PRODUCTS TO KEEP (user wants to keep these from their current routine):
{keep_products}

AVAILABLE PRODUCTS IN DATABASE:
{available_products}
(These are real products with verified ingredients and pricing. Only recommend from this list.)

RULES:
1. Follow the application order: {application_order_rules}
2. Check skin type rules: {skin_type_rules}
3. Check ingredient conflicts — NO conflicting actives in the same routine
4. Stay within budget: {budget_range} per month total
5. Respect allergies — NEVER include: {allergies}
6. Match the routine type complexity — don't add 8 steps if type is "essential"
7. Prefer products matching their brand preference: {product_preference}
8. For {period}:
   - AM: Focus on protection (antioxidants + SPF). Vitamin C works best in AM.
   - PM: Focus on repair (retinol, exfoliants). Skin repairs during sleep.
9. Include wait times between actives (vitamin C needs 1-2 min before next step)
10. If user is new to an active (retinol especially), note to start slow

OUTPUT FORMAT (respond in JSON only):
{{
  "routine_type": "{routine_type}",
  "period": "{period}",
  "name": "Suggested name for this routine",
  "total_monthly_cost": 0,
  "steps": [
    {{
      "step_order": 1,
      "category": "cleanser",
      "product_id": 42,
      "product_name": "CeraVe Foaming Cleanser",
      "product_brand": "CeraVe",
      "product_price": 599,
      "instruction": "Massage onto damp skin for 60 seconds",
      "wait_time_seconds": null,
      "frequency": "daily",
      "is_essential": true,
      "why_this_product": "Gentle sulfate-free formula, won't strip your combination skin. Contains ceramides for barrier support."
    }},
    ...
  ],
  "reasoning": "Brief explanation of the overall routine strategy",
  "tips": [
    "Start retinol at 2x/week and build up over a month",
    "Always apply vitamin C on slightly damp skin for better absorption"
  ],
  "conflicts_checked": [
    {{"pair": "Vitamin C + Niacinamide", "status": "safe", "note": "Despite the myth, these work great together"}}
  ]
}}
"""
```

---

## Files to Create

```
app/features/routine/
├── __init__.py
├── models.py               # Routine, RoutineStep, RoutineCompletion, RoutineGeneration
├── schemas.py              # All request/response models
├── service.py              # CRUD + completion tracking + stats
├── router.py               # All endpoints
├── generator.py            # AI routine generation logic
├── validator.py            # Conflict detection, order validation
├── constants.py            # ROUTINE_TYPES, STEP_CATEGORIES, CONFLICT_RULES, etc.
└── prompts.py              # AI generation prompt template
```

---

## User Flow Summary

```
USER OPENS ROUTINE SECTION
         │
         ├─→ Has active routine? 
         │       │
         │       YES → Show today's tracking view
         │       │     (mark steps, see progress)
         │       │
         │       NO → Show routine builder
         │
         ▼
ROUTINE BUILDER
         │
         ├─→ "Add current routine" 
         │       → Manual step-by-step entry
         │       → Search products from DB
         │       → Save as active routine
         │
         ├─→ "Build with JAY"
         │       → Select routine type (or "auto")
         │       → JAY reads profile + concerns + budget
         │       → JAY queries product DB
         │       → JAY generates routine with reasoning
         │       → User reviews, swaps products, adjusts
         │       → Save as active routine
         │
         ├─→ "Choose a template"
         │       → Pick: Essential / Complete / Glass Skin / etc.
         │       → Template loads with empty product slots
         │       → User fills in products
         │       → Save as active routine
         │
         └─→ "Custom"
                 → Blank canvas
                 → Add steps from category menu
                 → JAY validates order + conflicts live
                 → Save as active routine

DAILY USAGE
         │
         ├─→ Morning: app shows AM routine
         │       → Tap each step as completed
         │       → Timer for wait times
         │       → Skip option with reason
         │
         ├─→ Evening: app shows PM routine
         │       → Same tracking flow
         │
         └─→ Stats: adherence %, streak, history
```

---

## What to Build First (phased)

**Phase 1 (MVP):**
- Routine model + steps model + completion model
- CRUD endpoints (create, read, update, delete routines and steps)
- Daily completion tracking (mark step done)
- Routine types config (GET /routine/types)
- Basic stats (adherence %, streak)

**Phase 2 (AI generation):**
- "Build with JAY" endpoint
- Product search within routine builder
- Conflict validation
- Generation history

**Phase 3 (Enhancements):**
- Routine sharing/export
- Cost calculator
- Seasonal adjustment suggestions
- Product usage tracker
- Step timer

---

*Start with Phase 1. Want me to write the Claude Code build prompt?*
