# JAY Onboarding Quiz — Complete Reference

**Last updated:** 2026-03-29
**Status:** Phase 1 complete, all wires verified, real data displayed everywhere

---

## 1. Architecture Overview

```
Frontend (React Native / Expo Router)          Backend (FastAPI)                    Database (Supabase PostgreSQL)
========================================       ==========================           ============================
app/onboarding/quiz.tsx                        app/features/profile/                user_profiles table
  |                                              router.py                            |
  |-- GET /api/v1/profile/questionnaire ------>  get_questionnaire()                  |
  |     (public, no auth)                        returns questionnaire.py dict        |
  |                                                                                   |
  |-- PUT /api/v1/profile/basics ------------->  update_basics()                      |
  |-- PUT /api/v1/profile/skin-identity ------>  update_skin_identity()         ---> user_profiles row
  |-- PUT /api/v1/profile/skin-state --------->  update_skin_state()                  |
  |-- PUT /api/v1/profile/routine ------------>  update_routine_state()               |
  |-- PUT /api/v1/profile/lifestyle ---------->  update_lifestyle()                   |
  |-- PUT /api/v1/profile/preferences -------->  update_preferences()                 |
  |                                                                                   |
  |-- POST /api/v1/profile/complete-onboarding-> complete_onboarding()         ---> onboarding_completed = true
  |                                                                                   |
  |-- GET /api/v1/profile -------------------->  get_or_create_profile()        <--- full profile row
```

---

## 2. Complete Auth + Quiz User Journey

### 2.1 App Launch

```
_layout.tsx: initAuth() → supabase.auth.onAuthStateChange()
  |
  |-- INITIAL_SESSION with session?
  |     YES → setApiToken(token) → fetchProfile() from backend
  |           → profile.onboarding_completed?
  |               YES → router.replace('/(tabs)')
  |               NO  → router.replace('/onboarding/quiz')
  |     NO  → router.replace('/onboarding')
```

### 2.2 Signup / Login

```
/onboarding/signup.tsx or /onboarding/login.tsx
  |
  |-- supabase.auth.signUp() or signInWithPassword()
  |-- onAuthStateChange SIGNED_IN fires
  |-- setApiToken(session.access_token) ← immediate, no race condition
  |-- fetchProfile() → creates empty profile in DB if first time
  |-- _layout.tsx navigation re-evaluates → sends to /onboarding/quiz
```

### 2.3 Quiz Flow

```
/onboarding/quiz.tsx
  |
  |-- useEffect: GET /api/v1/profile/questionnaire (public)
  |-- Render section intro cards between sections
  |
  |-- For each section:
  |     Show questions one at a time
  |     Collect answers in local state (answers: Record<string, unknown>)
  |     On section complete → buildSectionPayload() → PUT /api/v1/profile/{section}
  |
  |-- After last section:
  |     POST /api/v1/profile/complete-onboarding
  |     fetchProfile() → syncs onboardingComplete from DB
  |     router.replace('/(tabs)')
```

### 2.4 Token Flow

```
Supabase signs JWT with SUPABASE_JWT_SECRET (HS256)
  ↓
Frontend stores in supabase.auth session
  ↓
onAuthStateChange → setApiToken(session.access_token) in lib/api.ts
  ↓
apiFetch() attaches Authorization: Bearer <token>
  ↓
Backend auth.py: pyjwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
  ↓
CurrentUser(payload) → extracts sub (user_id), email, role, user_metadata
  ↓
service.py: get_or_create_profile(user, db) → matches user_id to user_profiles.user_id
```

---

## 3. Backend API Routes

### 3.1 Profile Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/profile/questionnaire` | Public | Full questionnaire JSON (47 questions, 6 sections) |
| `GET` | `/api/v1/profile` | Bearer JWT | Get user profile (auto-creates on first access) |
| `GET` | `/api/v1/profile/completeness` | Bearer JWT | Profile completeness % and per-section breakdown |
| `PUT` | `/api/v1/profile/basics` | Bearer JWT | Save basics section |
| `PUT` | `/api/v1/profile/skin-identity` | Bearer JWT | Save skin identity section |
| `PUT` | `/api/v1/profile/skin-state` | Bearer JWT | Save current skin state |
| `PUT` | `/api/v1/profile/routine` | Bearer JWT | Save routine info |
| `PUT` | `/api/v1/profile/lifestyle` | Bearer JWT | Save lifestyle section |
| `PUT` | `/api/v1/profile/preferences` | Bearer JWT | Save preferences section |
| `POST` | `/api/v1/profile/complete-onboarding` | Bearer JWT | Mark onboarding as done |

### 3.2 Dev Routes (DEBUG=true only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/dev/test-token` | None | Generate fake Supabase JWT for testing |
| `GET` | `/health` | None | Health check |

---

## 4. Database Schema

### 4.1 Table: `user_profiles`

```sql
CREATE TABLE user_profiles (
    -- Identity
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         VARCHAR(36) NOT NULL UNIQUE,  -- Supabase auth.users.id

    -- Synced from JWT
    email           VARCHAR(255),
    full_name       VARCHAR(150),
    avatar_url      VARCHAR(500),

    -- Section 1: Basics (individual columns)
    username        VARCHAR(30) UNIQUE,
    date_of_birth   VARCHAR(10),          -- "YYYY-MM-DD"
    gender          VARCHAR(20),          -- male | female | non_binary | prefer_not_to_say
    location_city   VARCHAR(100),
    location_state  VARCHAR(100),
    location_country VARCHAR(100) DEFAULT 'India',

    -- Section 2: Skin Identity (individual columns)
    skin_type       VARCHAR(20),          -- oily | dry | combination | normal
    fitzpatrick_type INTEGER,             -- 1-6
    primary_concerns VARCHAR[] (ARRAY),   -- e.g. {"acne","dark_spots","pores"}
    skin_feel_midday VARCHAR(30),         -- oily_all_over | oily_t_zone | comfortable | tight_dry | varies
    skin_history    VARCHAR[] (ARRAY),    -- e.g. {"eczema","hormonal_acne"}
    allergies       VARCHAR[] (ARRAY),    -- e.g. {"fragrance","parabens"}
    sensitivities   VARCHAR[] (ARRAY),    -- e.g. {"retinol","aha_bha"}

    -- Sections 3-6: JSONB blobs
    current_skin_state JSONB,             -- {acne_level, oiliness_level, dryness_level, irritation_level, new_breakouts, overall_feeling, updated_at}
    current_routine    JSONB,             -- {am_steps, pm_steps, routine_consistency, products_currently_using, how_long_current_routine}
    lifestyle          JSONB,             -- {physical_activity, water_intake_glasses, sleep_hours, sleep_quality, sun_exposure, ...15 fields}
    preferences        JSONB,             -- {budget_range, product_preference, ingredient_preference, ...10 fields}

    -- Onboarding tracking
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_progress  JSONB DEFAULT '{"basics":false,"skin":false,"skin_state":false,"routine":false,"lifestyle":false,"preferences":false}',
    profile_completeness INTEGER DEFAULT 0,  -- 0-100%

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX ix_user_profiles_user_id ON user_profiles(user_id);
CREATE UNIQUE INDEX ix_user_profiles_username ON user_profiles(username);
```

### 4.2 Storage Strategy

| Section | Storage | Why |
|---------|---------|-----|
| Basics | Individual columns | Queried directly (username search, location filtering) |
| Skin Identity | Individual columns | Used in product matching, ARRAY types for multi-select |
| Skin State | JSONB | Rewritten as a whole on each check-in, timestamped |
| Routine | JSONB | Variable structure, rarely queried individually |
| Lifestyle | JSONB | 15 fields, too many for individual columns |
| Preferences | JSONB | 10 fields, variable, used as a blob by AI |

### 4.3 Profile Completeness Weights

| Section | Weight | Fields counted |
|---------|--------|----------------|
| Basics | 10% | 4: username, date_of_birth, gender, location_city |
| Skin Identity | 25% | 7: skin_type, fitzpatrick_type, primary_concerns, skin_feel_midday, skin_history, allergies, sensitivities |
| Skin State | 15% | 6: acne_level, oiliness_level, dryness_level, irritation_level, new_breakouts, overall_feeling |
| Routine | 15% | 5: am_steps, pm_steps, routine_consistency, products_currently_using, how_long_current_routine |
| Lifestyle | 20% | up to 15 fields |
| Preferences | 15% | up to 10 fields |

---

## 5. Questionnaire Content — All 47 Questions

### Section 1: Basics — "Let's get to know you"

*"The basics -- so JAY can stop calling you 'hey you'"*

| # | ID | Type | Question | Required | Options / Validation |
|---|---|---|---|---|---|
| 1 | `username` | text_input | Pick a username | Yes | 3-30 chars, `^[a-zA-Z0-9_]+$` |
| 2 | `date_of_birth` | date_picker | When's your birthday? | No | DD/MM/YYYY, age 13-100 |
| 3 | `gender` | single_select | How do you identify? | No | male, female, non_binary, prefer_not_to_say |
| 4 | `location` | location_picker | Where are you based? | No | city, state, country (default: India) |

### Section 2: Skin Identity — "Your skin, decoded"

*"No judgment zone -- just honest skin talk"*

| # | ID | Type | Question | Required | Options |
|---|---|---|---|---|---|
| 5 | `skin_type` | single_select_card | What's your skin type? | Yes | oily, dry, combination, normal (with emoji + description) |
| 6 | `fitzpatrick_type` | single_select_card | How does your skin react to sun? | No | Type I-VI with descriptions |
| 7 | `primary_concerns` | multi_select_chip | What are your top skin concerns? | Yes | 12 options, max 3: acne, dark_spots, wrinkles, pores, texture, dullness, dark_circles, tan, oiliness, dryness, sensitivity, aging |
| 8 | `skin_feel_midday` | single_select | How does your skin feel by midday? | No | oily_all_over, oily_t_zone, comfortable, tight_dry, varies |
| 9 | `skin_history` | multi_select_chip | Any skin conditions, past or present? | No | eczema, psoriasis, rosacea, dermatitis, fungal_acne, melasma, vitiligo, cystic_acne, hormonal_acne, none |
| 10 | `allergies` | tag_input | Any known allergies? | No | 9 suggestions + custom text input |
| 11 | `sensitivities` | multi_select_chip | What irritates your skin? | No | fragrance, alcohol, retinol, aha_bha, vitamin_c, essential_oils, niacinamide, sulfates, silicones, not_sure |

### Section 3: Skin State — "Skin check-in"

*"How's your skin doing RIGHT NOW? Be brutally honest."*

| # | ID | Type | Question | Required | Range |
|---|---|---|---|---|---|
| 12 | `acne_level` | slider (0-5) | Acne level right now | Yes | 0="Clear skies" ... 5="Code red" |
| 13 | `oiliness_level` | slider (0-5) | Oiliness level | Yes | 0="Sahara desert" ... 5="BP called, they want their oil back" |
| 14 | `dryness_level` | slider (0-5) | Dryness level | Yes | 0="Nope, hydrated" ... 5="Crocodile mode" |
| 15 | `irritation_level` | slider (0-5) | Irritation / redness | Yes | 0="Calm and collected" ... 5="Full tomato" |
| 16 | `new_breakouts` | yes_no | Any new breakouts in the last week? | Yes | true / false |
| 17 | `overall_feeling` | emoji_select | Overall, how does your skin feel today? | Yes | great/good/okay/bad/terrible with emoji |

### Section 4: Routine — "Your current game plan"

*"What are you already doing? No wrong answers -- even 'nothing' counts."*

| # | ID | Type | Question | Required | Options |
|---|---|---|---|---|---|
| 18 | `am_steps` | multi_select_ordered | What's your morning routine? | No | cleanser, toner, serum, moisturizer, sunscreen, eye_cream, face_oil, mist, lip_balm, nothing |
| 19 | `pm_steps` | multi_select_ordered | What's your night routine? | No | oil_cleanser, cleanser, exfoliant, toner, serum, retinol, eye_cream, moisturizer, face_oil, spot_treatment, sleeping_mask, nothing |
| 20 | `routine_consistency` | single_select | How consistent are you? | No | daily, most_days, sometimes, rarely |
| 21 | `products_currently_using` | tag_input | What products are you currently using? | No | 12 suggestions (Cetaphil, Minimalist, etc.) + custom input |
| 22 | `how_long_current_routine` | single_select | How long have you been on this routine? | No | less_than_month, 1_3_months, 3_6_months, 6_plus_months, over_a_year, no_routine |

### Section 5: Lifestyle — "Life outside skincare"

*"Your skin is a mirror of your lifestyle -- let's connect the dots"*

| # | ID | Type | Question | Required | Options / Range |
|---|---|---|---|---|---|
| 23 | `physical_activity` | single_select | How active are you? | No | sedentary, light, moderate, active, very_active |
| 24 | `water_intake_glasses` | slider (0-15) | How many glasses of water daily? | No | stepper: 0="Does coffee count?" ... 15="Aquaman" |
| 25 | `sleep_hours` | slider (0-12, step 0.5) | How many hours of sleep? | No | stepper: 0="Barely" ... 12="Hibernating" |
| 26 | `sleep_quality` | single_select | How's the quality of your sleep? | No | great, good, okay, poor, terrible |
| 27 | `sun_exposure` | single_select | How much sun do you get daily? | No | minimal, moderate, high, very_high |
| 28 | `sun_protection_habit` | single_select | Do you wear sunscreen? | No | always, mostly, sometimes, rarely, never |
| 29 | `diet_type` | single_select | What's your diet like? | No | vegetarian, non_vegetarian, vegan, eggetarian, pescatarian, flexitarian |
| 30 | `dairy_consumption` | single_select | How often do you consume dairy? | No | daily, often, sometimes, rarely, never |
| 31 | `sugar_consumption` | single_select | How's your sugar intake? | No | daily, often, sometimes, rarely, never |
| 32 | `spicy_food` | single_select | Spicy food tolerance? | No | love_it, moderate, mild, avoid |
| 33 | `smoking` | single_select | Do you smoke? | No | never, occasionally, regularly, quit |
| 34 | `alcohol` | single_select | Alcohol consumption? | No | never, occasionally, socially, regularly |
| 35 | `stress_level` | single_select | Current stress level? | No | low, moderate, high, very_high |
| 36 | `screen_time_hours` | slider (0-16, step 0.5) | Daily screen time? | No | stepper: 0="Touching grass" ... 16="Screen is life" |
| 37 | `travel_frequency` | single_select | How often do you travel? | No | rarely, monthly, weekly, constantly |

### Section 6: Preferences — "Your preferences"

*"What does your ideal skincare world look like?"*

| # | ID | Type | Question | Required | Options |
|---|---|---|---|---|---|
| 38 | `budget_range` | single_select_card | Monthly skincare budget? | No | under_500, 500_1000, 1000_2000, 2000_plus, no_limit (with INR amounts) |
| 39 | `product_preference` | single_select_card | What kind of products? | No | pharmacy, luxury, natural, korean, ayurvedic, no_preference (with brand examples) |
| 40 | `ingredient_preference` | single_select | Ingredient philosophy? | No | clean_only, science_backed, natural_only, no_preference |
| 41 | `fragrance_preference` | single_select | How do you feel about fragrance? | No | love, neutral, prefer_unscented, strictly_unscented |
| 42 | `remedy_openness` | single_select | Open to home remedies? | No | love_home_remedies, open_to_trying, prefer_products, products_only |
| 43 | `routine_complexity` | single_select_card | How complex do you want your routine? | No | minimal_1_3, moderate_4_5, elaborate_6_plus, whatever_works |
| 44 | `top_goal` | single_select_card | If you could fix ONE thing? | Yes | clear_skin, anti_aging, glow, even_tone, hydration, oil_control |
| 45 | `willing_to_try_prescription` | yes_no | Open to prescription products? | No | true / false |
| 46 | `preferred_texture` | multi_select_chip | What textures do you prefer? | No | gel, cream, lotion, serum, oil, balm, foam, no_preference |
| 47 | `shopping_preference` | single_select | Where do you buy skincare? | No | online, offline, both |

---

## 6. Frontend Question Types

| Type | UI Component | Used for |
|------|-------------|----------|
| `text_input` | TextInput with border | Username |
| `date_picker` | 3 TextInputs (DD/MM/YYYY), raw storage until save | Date of birth |
| `location_picker` | "Use my location" button (expo-location) + manual TextInputs | City, state, country |
| `single_select` | Half-width option cards | Gender, skin feel, diet, etc. |
| `single_select_card` | Full-width cards with description | Skin type, budget, goal |
| `multi_select_chip` | Pill-shaped chips | Concerns, history, textures |
| `multi_select_ordered` | Pill-shaped chips (order matters) | AM/PM routine steps |
| `emoji_select` | Small cards with emoji + label | Overall skin feeling |
| `yes_no` | Two cards with thumbs up/down | Breakouts, prescriptions |
| `slider` (0-5) | Circle buttons in a row | Acne, oil, dry, irritation levels |
| `slider` (large range) | +/- stepper with large number | Water, sleep, screen time |
| `tag_input` | TextInput + Add button + chips | Allergies, products |

---

## 7. Backend Pydantic Schemas

### Request schemas (one per section)

```
BasicsUpdate         → username, date_of_birth, gender, location_city, location_state, location_country
SkinIdentityUpdate   → skin_type, fitzpatrick_type, primary_concerns, skin_feel_midday, skin_history, allergies, sensitivities
SkinStateUpdate      → acne_level, oiliness_level, dryness_level, irritation_level, new_breakouts, overall_feeling
RoutineStateUpdate   → am_steps, pm_steps, routine_consistency, products_currently_using, how_long_current_routine
LifestyleUpdate      → physical_activity, water_intake_glasses, sleep_hours, sleep_quality, sun_exposure, sun_protection_habit, travel_frequency, diet_type, dairy_consumption, sugar_consumption, spicy_food, smoking, alcohol, stress_level, screen_time_hours
PreferencesUpdate    → budget_range, product_preference, ingredient_preference, fragrance_preference, remedy_openness, routine_complexity, top_goal, willing_to_try_prescription, preferred_texture, shopping_preference
```

### Response schemas

```
UserProfileOut          → full profile with all fields
ProfileCompletenessOut  → { completeness: int, sections: dict, onboarding_completed: bool }
```

---

## 8. Field Mapping Verification (Audit Results)

All 47 questions traced through: **Frontend question ID** -> **API payload key** -> **Pydantic schema field** -> **SQLAlchemy model column** -> **DB migration column**

| Section | Questions | Fields in DB | All wired | Status |
|---------|-----------|-------------|-----------|--------|
| Basics | 4 (6 fields with location) | 6 columns | Yes | PASS |
| Skin Identity | 7 | 7 columns | Yes | PASS |
| Skin State | 6 | 1 JSONB (6 keys) | Yes | PASS |
| Routine | 5 | 1 JSONB (5 keys) | Yes | PASS |
| Lifestyle | 15 | 1 JSONB (15 keys) | Yes | PASS |
| Preferences | 10 | 1 JSONB (10 keys) | Yes | PASS |
| **Total** | **47** | **49 fields** | **All** | **PASS** |

---

## 9. Completion Rewards

| Section | Points | Message |
|---------|--------|---------|
| Basics | 5 | "JAY now knows your name!" |
| Skin Identity | 10 | "Your skin identity is mapped" |
| Skin State | 5 | "Current state logged" |
| Routine | 5 | "JAY knows your shelf now" |
| Lifestyle | 10 | "The full picture is forming" |
| Preferences | 5 | "Personalization complete!" |
| **Total bonus** | **20** | — |

---

## 10. Where User Data Is Stored and Displayed

### Storage: Supabase PostgreSQL

All questionnaire answers are stored in the `user_profiles` table in Supabase PostgreSQL. There is one row per user.

- **Database**: Supabase project `rheofqhoosrhklikqdvp`
- **Table**: `user_profiles`
- **View data**: Supabase Dashboard -> Table Editor -> user_profiles
- **API access**: `GET /api/v1/profile` (authenticated)

### Data Flow: Quiz -> DB -> Screens

```
Quiz Answer (frontend)
  |
  |-- buildSectionPayload() collects answers for the section
  |-- PUT /api/v1/profile/{section} sends to backend
  |-- service.py writes to UserProfile model
  |-- SQLAlchemy commits to PostgreSQL
  |
  |-- After quiz completion:
  |     POST /api/v1/profile/complete-onboarding
  |     fetchProfile() → GET /api/v1/profile
  |     profileToDisplayData() converts backend data to display format
  |     Zustand store updates → all screens re-render with real data
```

### Display Points (screens using real backend data)

| Screen | Data Displayed | Source |
|--------|---------------|--------|
| **Home** (index.tsx) | Name, profile completeness %, level | `user.name`, `user.profileCompleteness`, `user.level` |
| **Profile** (profile.tsx) | Name, username, skin type, sensitivities, top goal, concerns, glow points, level, member since | Full `user` object from `profileToDisplayData()` |
| **Preferences** (preferences.tsx) | Skin type, concerns, budget | `backendProfile.skin_type`, `backendProfile.primary_concerns`, `backendProfile.preferences.budget_range` |
| **Achievements** (achievements.tsx) | Glow points, level, level progress | `user.glowPoints`, `user.level`, `user.levelProgress` |

### Level System (derived from profile completeness)

| Completeness | Level | Glow Points |
|-------------|-------|-------------|
| 0-19% | Newcomer | completeness |
| 20-49% | Skincare Explorer | completeness + 20 (if onboarded) |
| 50-79% | Skincare Enthusiast | completeness + 20 (if onboarded) |
| 80-100% | Skincare Expert | completeness + 20 (if onboarded) |

### What's still mock data (Phase 2+)

| Feature | Status | Why |
|---------|--------|-----|
| Routine steps | Mock | No routine backend yet |
| Chat messages | Mock | No AI chat backend yet |
| Diary entries | Mock | No diary backend yet |
| Articles/Discover | Mock | No content backend yet |
| Cap or Slap verdicts | Mock | No product backend yet |
| Community posts | Mock | No community backend yet |
| Dupe finder | Mock | No product backend yet |
| Research reports | Mock | No AI research backend yet |
| Calendar dots | Mock | No diary backend yet |
| Weekly insights | Mock | No intelligence backend yet |

---

## 11. File Reference

### Frontend

| File | Purpose |
|------|---------|
| `jay-app/.env` | `EXPO_PUBLIC_API_URL=http://localhost:8000` |
| `jay-app/lib/api.ts` | HTTP client with JWT token injection |
| `jay-app/lib/supabase.ts` | Supabase client initialization |
| `jay-app/services/auth.ts` | Supabase signup/login/logout |
| `jay-app/services/profile.ts` | Profile API service + section updater map |
| `jay-app/stores/userStore.ts` | Zustand store: auth + profile sync + profileToDisplayData() |
| `jay-app/app/_layout.tsx` | Root navigation: auth guard + onboarding redirect |
| `jay-app/app/onboarding/quiz.tsx` | Quiz screen: fetch, render, submit |

### Backend

| File | Purpose |
|------|---------|
| `jay-backend/.env` | Supabase URL, JWT secret, DATABASE_URL |
| `jay-backend/app/main.py` | FastAPI app factory, dev token endpoint |
| `jay-backend/app/auth.py` | JWT verification, CurrentUser extraction |
| `jay-backend/app/config.py` | Pydantic Settings from .env |
| `jay-backend/app/database.py` | Async SQLAlchemy engine (statement_cache_size=0 for PgBouncer) |
| `jay-backend/app/features/profile/questionnaire.py` | Full 47-question questionnaire dict |
| `jay-backend/app/features/profile/router.py` | All profile API routes |
| `jay-backend/app/features/profile/schemas.py` | Pydantic validation schemas per section |
| `jay-backend/app/features/profile/service.py` | Business logic + completeness calculation |
| `jay-backend/app/features/profile/models.py` | SQLAlchemy UserProfile model |
| `jay-backend/app/shared/exceptions.py` | AuthError, NotFoundError, ConflictError |
| `jay-backend/alembic/versions/001_create_user_profiles_table.py` | DB migration |

---

## 11. Known Considerations

1. **JSONB mutations**: SQLAlchemy does NOT detect in-place JSONB mutations. The service always reassigns the entire dict (`profile.current_skin_state = state`), never mutates in place.

2. **PgBouncer compatibility**: Supabase uses PgBouncer in transaction pooling mode. `statement_cache_size=0` is set in `database.py` to disable asyncpg prepared statement caching.

3. **Username uniqueness**: Enforced at both application level (service checks before save) and database level (unique index). IntegrityError handler in `main.py` catches DB-level constraint violations.

4. **Profile auto-creation**: First authenticated API call creates an empty profile row. No separate "create profile" step needed.

5. **Section independence**: Each section saves independently. User can complete sections in any order, skip sections, and return later.

6. **Date picker storage**: Raw `{ day, month, year }` stored in frontend state during input. Only formatted to `YYYY-MM-DD` when building the API payload on section submit. This prevents the premature-padding bug.

7. **Location access**: Uses `expo-location` for GPS + reverse geocoding. Falls back to manual text inputs if permission denied.

8. **No mock data in profile flow**: The `mockUser` object is no longer imported or used in the store. All user display data is derived from the backend profile via `profileToDisplayData()`.
