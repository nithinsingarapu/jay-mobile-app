# JAY — Backend Architecture

**Version:** 1.0  
**Date:** March 28, 2026  
**Architecture pattern:** Feature-based modular monolith  
**Designed for:** Solo founder now, 2–4 engineers within 6 months

---

## 1. Architecture decision: Why modular monolith

JAY has ~15 features, an AI layer, a product database, user-generated content, and real-time chat. The temptation is microservices. Resist it.

**Modular monolith wins here because:**

- You're a solo founder. One repo, one deploy, one database, one log stream. Debugging a distributed system alone at 2 AM is a nightmare you don't need.
- JAY's features are tightly coupled. A routine references products from the database. Research references the same products. The AI chat references routines, products, and diary entries. Microservice boundaries would create an explosion of inter-service calls for every user request.
- You can extract services later. The modular structure enforces feature isolation at the code level, so if "Jay Research" needs its own service someday (heavy AI load), you literally move the folder and point it at its own database. Zero rewrite.
- You already did this for Anthill. Same pattern — feature-based folders, shared utilities centralized, clean import boundaries.

**The one exception:** The AI inference layer runs as a separate worker process (not a separate service — same codebase, different entry point). LLM calls are slow (2–30 seconds) and should never block your API server's event loop, even with async. More on this in section 6.

---

## 2. Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **API framework** | FastAPI (async) | You already know it. Pydantic v2 for validation. Auto-generated OpenAPI docs. Native async for I/O-bound operations. |
| **Database** | PostgreSQL 16 | JSONB for flexible schemas (diary entries, skin profiles). Full-text search for products. Row-level security for multi-tenant data. pg_trgm for fuzzy product name matching. |
| **ORM** | SQLAlchemy 2.0 (async) | Async session support. Alembic for migrations. Type-safe queries with the 2.0 query style. |
| **Cache** | Redis 7 | Session store, rate limiting, AI response cache, pub/sub for real-time chat, leaderboard/streak tracking. |
| **Task queue** | Celery + Redis broker | AI inference jobs, product database enrichment, email/notification dispatch, scheduled insight generation. |
| **AI orchestration** | LangGraph | Multi-step research pipeline (same pattern as Anthill's pitch deck system). Agent graphs for Ask JAY, Routine AI, and Jay Research. |
| **LLM providers** | Gemini Flash (primary), Claude (complex reasoning) | Gemini Flash for high-volume queries (Ask JAY, Cap or Slap). Claude for deep analysis (Jay Research, Claims Verification). Provider abstraction layer so you can swap. |
| **Object storage** | S3 / Cloudflare R2 | Diary photos, product images, user avatars. R2 is cheaper and S3-compatible. |
| **Search** | PostgreSQL full-text + pg_trgm | Good enough for product search at your scale. No Elasticsearch until 50K+ products. |
| **Auth** | JWT (access + refresh tokens) | Access token: 15 min, in memory. Refresh token: 30 days, in secure HTTP-only cookie. Social login via Google/Apple OAuth2. |
| **Notifications** | Firebase Cloud Messaging (push) + optional WhatsApp Business API | FCM for iOS/Android push. WhatsApp for routine reminders if user opts in. |
| **Deployment** | Docker → Railway or Fly.io (start) → AWS ECS (scale) | Single container initially. Split into API + worker containers when needed. |
| **Monitoring** | Sentry (errors) + Axiom or Grafana Cloud (logs/metrics) | Don't build observability — buy it. Sentry catches exceptions. Axiom ingests structured logs. |

---

## 3. Project structure

```
jay-backend/
├── app/
│   ├── main.py                      # FastAPI app factory, middleware, startup/shutdown
│   ├── config.py                     # Pydantic Settings (env-based config)
│   ├── database.py                   # Async engine, session factory, Base model
│   ├── dependencies.py               # Shared DI: get_db, get_current_user, get_redis
│   ├── middleware/
│   │   ├── auth.py                   # JWT validation middleware
│   │   ├── rate_limit.py             # Redis-based rate limiter
│   │   └── request_id.py            # X-Request-ID injection for tracing
│   │
│   ├── features/                     # ← Each feature is a self-contained module
│   │   ├── auth/
│   │   │   ├── router.py            # POST /auth/login, /auth/signup, /auth/refresh
│   │   │   ├── service.py           # Business logic: hash password, verify, issue JWT
│   │   │   ├── models.py            # SQLAlchemy: User, SkinProfile
│   │   │   ├── schemas.py           # Pydantic: LoginRequest, TokenResponse, UserOut
│   │   │   └── dependencies.py      # get_current_user (feature-specific)
│   │   │
│   │   ├── onboarding/
│   │   │   ├── router.py            # POST /onboarding/quiz, /onboarding/profile
│   │   │   ├── service.py           # Save quiz answers, generate initial routine
│   │   │   ├── models.py            # SkinQuizResponse
│   │   │   └── schemas.py
│   │   │
│   │   ├── products/
│   │   │   ├── router.py            # GET /products, /products/{id}, /products/search
│   │   │   ├── service.py           # Search, filter, CRUD
│   │   │   ├── models.py            # Product, ProductIngredient, Brand
│   │   │   ├── schemas.py
│   │   │   └── tasks.py             # Celery: enrich product data, sync from Shopify
│   │   │
│   │   ├── routine/
│   │   │   ├── router.py            # GET/POST/PUT /routine, /routine/generate
│   │   │   ├── service.py           # Build, edit, reorder steps
│   │   │   ├── models.py            # Routine, RoutineStep
│   │   │   ├── schemas.py
│   │   │   └── ai_service.py        # Routine generation via LLM (calls AI layer)
│   │   │
│   │   ├── diary/
│   │   │   ├── router.py            # GET/POST /diary, /diary/{date}
│   │   │   ├── service.py           # CRUD, mood tracking, photo upload
│   │   │   ├── models.py            # DiaryEntry, DiaryTag
│   │   │   └── schemas.py
│   │   │
│   │   ├── chat/                     # Ask JAY
│   │   │   ├── router.py            # POST /chat/message, GET /chat/history
│   │   │   ├── service.py           # Message handling, context building
│   │   │   ├── models.py            # Conversation, Message
│   │   │   ├── schemas.py
│   │   │   └── ai_service.py        # LLM orchestration for chat responses
│   │   │
│   │   ├── research/                 # Jay Research
│   │   │   ├── router.py            # POST /research/{product_id}, GET /research/{id}/module/{module}
│   │   │   ├── service.py           # Orchestrate research pipeline
│   │   │   ├── models.py            # ResearchReport, ResearchModule
│   │   │   ├── schemas.py
│   │   │   ├── tasks.py             # Celery: async research generation (long-running)
│   │   │   └── pipeline.py          # LangGraph: 5-branch research pipeline
│   │   │
│   │   ├── dupe_finder/
│   │   │   ├── router.py            # GET /dupes/{product_id}
│   │   │   ├── service.py           # Ingredient matching algorithm
│   │   │   ├── models.py            # DupeMatch (cached results)
│   │   │   └── schemas.py
│   │   │
│   │   ├── cap_or_slap/
│   │   │   ├── router.py            # GET /verdicts, /verdicts/{id}
│   │   │   ├── service.py           # Verdict CRUD, scoring
│   │   │   ├── models.py            # Verdict
│   │   │   ├── schemas.py
│   │   │   └── tasks.py             # Celery: generate verdict via AI
│   │   │
│   │   ├── intelligence/
│   │   │   ├── router.py            # GET /intelligence/dashboard, /intelligence/insights
│   │   │   ├── service.py           # Pattern detection, insight generation
│   │   │   ├── models.py            # Insight, SkinTrend
│   │   │   ├── schemas.py
│   │   │   └── tasks.py             # Celery: nightly insight computation
│   │   │
│   │   ├── community/
│   │   │   ├── router.py            # GET/POST /community/posts, /community/posts/{id}
│   │   │   ├── service.py           # Post CRUD, feed ranking
│   │   │   ├── models.py            # Post, Comment, Like
│   │   │   └── schemas.py
│   │   │
│   │   ├── diet/
│   │   │   ├── router.py            # GET /diet/plan, POST /diet/generate
│   │   │   ├── service.py           # Meal plan generation
│   │   │   ├── models.py            # MealPlan, Meal
│   │   │   ├── schemas.py
│   │   │   └── ai_service.py        # Diet plan via LLM
│   │   │
│   │   ├── gamification/
│   │   │   ├── router.py            # GET /achievements, /streaks, /leaderboard
│   │   │   ├── service.py           # Points calculation, badge awarding
│   │   │   ├── models.py            # Badge, UserBadge, GlowPoints
│   │   │   └── schemas.py
│   │   │
│   │   └── notifications/
│   │       ├── router.py            # GET /notifications, PUT /notifications/{id}/read
│   │       ├── service.py           # Notification dispatch
│   │       ├── models.py            # Notification
│   │       ├── schemas.py
│   │       └── tasks.py             # Celery: scheduled reminders, FCM push
│   │
│   ├── ai/                           # ← Shared AI infrastructure
│   │   ├── providers/
│   │   │   ├── base.py              # Abstract LLMProvider interface
│   │   │   ├── gemini.py            # Gemini Flash implementation
│   │   │   └── claude.py            # Claude implementation
│   │   ├── prompts/
│   │   │   ├── chat_system.py       # Ask JAY system prompt
│   │   │   ├── research_system.py   # Jay Research prompts per module
│   │   │   ├── routine_system.py    # Routine generation prompt
│   │   │   ├── verdict_system.py    # Cap or Slap analysis prompt
│   │   │   └── diet_system.py       # Diet planner prompt
│   │   ├── context.py               # User context builder (skin profile, routine, diary → prompt context)
│   │   ├── cache.py                 # Redis-based AI response cache (semantic dedup)
│   │   └── graphs/
│   │       ├── research_graph.py    # LangGraph: 5-branch research pipeline
│   │       ├── chat_graph.py        # LangGraph: Ask JAY with tool use
│   │       └── routine_graph.py     # LangGraph: routine generation + refinement
│   │
│   └── shared/                       # ← Cross-cutting utilities
│       ├── pagination.py             # Cursor-based pagination helper
│       ├── exceptions.py             # Custom HTTP exceptions
│       ├── storage.py                # S3/R2 file upload helper
│       ├── email.py                  # Transactional email (Resend or SES)
│       └── utils.py                  # Misc helpers
│
├── alembic/                          # Database migrations
│   ├── versions/
│   └── env.py
├── tests/
│   ├── conftest.py                   # Fixtures: async test client, test DB, mock Redis
│   ├── features/
│   │   ├── test_auth.py
│   │   ├── test_routine.py
│   │   └── ...                       # One test file per feature
│   └── ai/
│       └── test_research_pipeline.py
├── scripts/
│   ├── seed_products.py              # Seed products_master data
│   └── generate_insights.py          # One-off insight generation
├── docker-compose.yml                # PostgreSQL, Redis, MinIO (local S3)
├── Dockerfile
├── pyproject.toml                    # uv/poetry config, ruff, mypy settings
├── alembic.ini
└── .env.example
```

---

## 4. Database schema

### Core tables

```sql
-- Users and identity
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),           -- NULL for social login users
    auth_provider VARCHAR(20) DEFAULT 'email',  -- email, google, apple
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE skin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    skin_type VARCHAR(20),                -- oily, dry, combination, normal, sensitive
    concerns TEXT[],                      -- array: ['acne', 'dark_spots', 'wrinkles']
    allergies TEXT[],
    budget_range VARCHAR(20),             -- under_500, 500_1500, 1500_3000, no_limit
    climate VARCHAR(20),
    age_range VARCHAR(10),
    gender VARCHAR(20),
    onboarding_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products (your products_master table — already designed)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    category VARCHAR(50),                 -- cleanser, serum, moisturizer, sunscreen, etc.
    subcategory VARCHAR(50),
    price_inr DECIMAL(10,2),
    size_ml DECIMAL(8,2),
    key_ingredients TEXT[],
    full_ingredients TEXT,
    description TEXT,
    image_url VARCHAR(500),
    shopify_url VARCHAR(500),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || brand));
CREATE INDEX idx_products_ingredients ON products USING GIN(key_ingredients);

-- Routines
CREATE TABLE routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    period VARCHAR(5) NOT NULL,           -- 'am' or 'pm'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, period, is_active)    -- one active routine per period
);

CREATE TABLE routine_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    category VARCHAR(30),                 -- cleanser, toner, serum, moisturizer, sunscreen, etc.
    product_id INTEGER REFERENCES products(id),
    custom_product_name VARCHAR(255),     -- if product not in DB
    instruction TEXT,
    wait_time_seconds INTEGER,            -- NULL if no wait needed
    completed_today BOOLEAN DEFAULT false,
    UNIQUE(routine_id, step_order)
);

-- Diary
CREATE TABLE diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    mood INTEGER CHECK (mood BETWEEN 1 AND 5),  -- 1=bad, 5=great
    tags TEXT[],                           -- ['hydrated', 'breakout', 'oily_t_zone']
    notes TEXT,
    products_used INTEGER[],              -- array of product IDs
    photo_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, entry_date)
);

CREATE INDEX idx_diary_user_date ON diary_entries(user_id, entry_date DESC);

-- Chat (Ask JAY)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),                    -- auto-generated from first message
    context_type VARCHAR(20) DEFAULT 'general',  -- general, routine, research
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL,            -- 'user' or 'assistant'
    content TEXT NOT NULL,
    metadata JSONB,                        -- verdict cards, product refs, structured content
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);

-- Jay Research
CREATE TABLE research_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id INTEGER REFERENCES products(id),
    requested_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
    jay_score DECIMAL(3,1),
    verdict TEXT,                          -- "Highly recommended for your skin"
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE research_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES research_reports(id) ON DELETE CASCADE,
    module_type VARCHAR(30) NOT NULL,      -- overview, brand, claims, ingredients, reviews
    status VARCHAR(20) DEFAULT 'pending',
    content JSONB NOT NULL,                -- structured content per module type
    read_time_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Dupe matches (cached)
CREATE TABLE dupe_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_product_id INTEGER REFERENCES products(id),
    dupe_product_id INTEGER REFERENCES products(id),
    match_percentage DECIMAL(5,2),
    matching_ingredients TEXT[],
    price_savings DECIMAL(10,2),
    analysis JSONB,                        -- detailed comparison data
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(original_product_id, dupe_product_id)
);

-- Cap or Slap verdicts
CREATE TABLE verdicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id INTEGER REFERENCES products(id),
    verdict_type VARCHAR(10) NOT NULL,     -- 'slap' or 'cap'
    score DECIMAL(3,1),
    rationale TEXT,
    detailed_analysis JSONB,
    category VARCHAR(20),                  -- product, trend, remedy, ingredient
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Intelligence insights
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(30),              -- product_correlation, routine_adherence, trend, alert
    title VARCHAR(255),
    description TEXT,
    data JSONB,                            -- charts, evidence, supporting data
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Community
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    tags TEXT[],
    image_url VARCHAR(500),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE post_likes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Gamification
CREATE TABLE glow_points_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason VARCHAR(50),                    -- routine_completed, diary_entry, research_read, post_created
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_badges (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50),                  -- first_scan, 7_day_streak, dupe_hunter, etc.
    awarded_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, badge_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30),                      -- routine_reminder, insight, community_reply, research_complete
    title VARCHAR(255),
    body TEXT,
    data JSONB,                            -- deep link data, reference IDs
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- Diet plans
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_concerns TEXT[],
    plan_date DATE NOT NULL,
    meals JSONB NOT NULL,                  -- {breakfast: {...}, lunch: {...}, dinner: {...}}
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, plan_date)
);
```

---

## 5. API design

### Route structure

All routes are versioned under `/api/v1/`. Feature routers are mounted in `main.py`.

```
AUTH
  POST   /api/v1/auth/signup              # Email signup
  POST   /api/v1/auth/login               # Email login → JWT pair
  POST   /api/v1/auth/refresh             # Refresh access token
  POST   /api/v1/auth/social/{provider}   # Google/Apple OAuth callback
  DELETE /api/v1/auth/logout              # Invalidate refresh token

ONBOARDING
  POST   /api/v1/onboarding/quiz          # Submit skin quiz answers
  POST   /api/v1/onboarding/profile       # Set display name, avatar, demographics

PRODUCTS
  GET    /api/v1/products                  # List products (paginated, filterable)
  GET    /api/v1/products/{id}             # Single product detail
  GET    /api/v1/products/search?q=        # Full-text search

ROUTINE
  GET    /api/v1/routine                   # Get active AM + PM routines
  POST   /api/v1/routine                   # Create/save routine
  PUT    /api/v1/routine/{id}              # Update routine
  POST   /api/v1/routine/{id}/complete-step # Mark step as done today
  POST   /api/v1/routine/generate          # AI-generate routine from preferences

DIARY
  GET    /api/v1/diary                     # List entries (paginated, by month)
  GET    /api/v1/diary/{date}              # Single day entry
  POST   /api/v1/diary/{date}              # Create/update day entry
  POST   /api/v1/diary/{date}/photo        # Upload skin photo

CHAT (Ask JAY)
  GET    /api/v1/chat/conversations        # List conversations
  POST   /api/v1/chat/conversations        # Start new conversation
  GET    /api/v1/chat/{conv_id}/messages   # Get message history
  POST   /api/v1/chat/{conv_id}/messages   # Send message → get AI response
  
  # Streaming variant (recommended):
  POST   /api/v1/chat/{conv_id}/stream     # SSE stream of AI response tokens

RESEARCH (Jay Research)
  POST   /api/v1/research/{product_id}     # Initiate research (returns job ID)
  GET    /api/v1/research/{report_id}      # Get report status + overview
  GET    /api/v1/research/{report_id}/module/{type}  # Get specific module content

DUPE FINDER
  GET    /api/v1/dupes/{product_id}        # Get dupe matches (cached or compute)

CAP OR SLAP
  GET    /api/v1/verdicts                  # List verdicts (paginated, filterable)
  GET    /api/v1/verdicts/{id}             # Single verdict detail

INTELLIGENCE
  GET    /api/v1/intelligence/dashboard    # Weekly summary + adherence
  GET    /api/v1/intelligence/insights     # List insights
  GET    /api/v1/intelligence/insights/{id} # Insight detail

COMMUNITY
  GET    /api/v1/community/posts           # Feed (paginated, filterable)
  POST   /api/v1/community/posts           # Create post
  POST   /api/v1/community/posts/{id}/like # Toggle like
  POST   /api/v1/community/posts/{id}/comments # Add comment

DIET
  GET    /api/v1/diet/plan                 # Get today's meal plan
  POST   /api/v1/diet/generate             # Generate new plan for concerns

GAMIFICATION
  GET    /api/v1/achievements              # Badges, streaks, level, points
  GET    /api/v1/achievements/leaderboard  # Top users (optional)

NOTIFICATIONS
  GET    /api/v1/notifications             # List notifications (paginated)
  PUT    /api/v1/notifications/read-all    # Mark all as read
  PUT    /api/v1/notifications/{id}/read   # Mark one as read

PROFILE
  GET    /api/v1/profile                   # Get user profile + skin profile + stats
  PUT    /api/v1/profile                   # Update profile
  PUT    /api/v1/profile/skin              # Update skin profile
  DELETE /api/v1/profile                   # Delete account
```

### Response format

Every response follows a consistent envelope:

```json
{
  "data": { ... },
  "meta": {
    "cursor": "eyJpZCI6...",
    "has_more": true
  }
}
```

Errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Skin type must be one of: oily, dry, combination, normal, sensitive",
    "field": "skin_type"
  }
}
```

### Pagination

Cursor-based, not offset-based. Offset pagination breaks when new items are inserted. Every list endpoint accepts `?cursor=X&limit=20`.

---

## 6. AI layer architecture

This is JAY's brain. Three patterns depending on complexity:

### Pattern A: Simple Q&A (Ask JAY basic questions)

```
User message → Context builder (skin profile + routine + recent diary)
             → Single LLM call (Gemini Flash, streaming)
             → Streamed response to client via SSE
```

Fast. Sub-2-second first token. Used for: ingredient questions, product comparisons, routine tips, myth busting.

### Pattern B: Multi-step pipeline (Jay Research)

```
Research request → Celery task
                → LangGraph pipeline:
                    ├── Branch 1: Overview (LLM + product DB)
                    ├── Branch 2: Brand reputation (LLM + web search)
                    ├── Branch 3: Claims verification (LLM + ingredient science)
                    ├── Branch 4: Ingredients deep dive (LLM + INCIdecoder data)
                    └── Branch 5: User review synthesis (LLM + review aggregation)
                → Results written to research_modules table
                → Notification pushed to user: "Research complete"
```

Runs 5 branches concurrently. Total time: 15–30 seconds. User gets a progress indicator and is notified when done. This is your existing JAY Research pipeline pattern.

### Pattern C: Tool-augmented chat (Ask JAY advanced)

```
User message → Context builder
             → LangGraph agent with tools:
                 ├── tool: search_products(query) → product DB
                 ├── tool: get_routine() → user's current routine
                 ├── tool: check_ingredients(product_id) → ingredient analysis
                 ├── tool: find_dupes(product_id) → dupe matcher
                 └── tool: generate_verdict(product_id) → Cap or Slap
             → Agent decides which tools to call
             → Synthesized response streamed back
```

Used when the user asks something that requires data: "Is my moisturizer compatible with retinol?", "Find me a dupe for this", "Add SPF to my routine."

### AI context builder

Every AI call includes a structured user context block:

```python
def build_user_context(user_id: UUID, db: AsyncSession) -> str:
    """Build the user context string injected into every AI prompt."""
    profile = await get_skin_profile(user_id, db)
    routine = await get_active_routine(user_id, db)
    recent_diary = await get_recent_diary(user_id, db, days=7)
    
    return f"""
    USER SKIN PROFILE:
    - Skin type: {profile.skin_type}
    - Concerns: {', '.join(profile.concerns)}
    - Allergies: {', '.join(profile.allergies or ['None'])}
    - Budget: {profile.budget_range}
    
    CURRENT ROUTINE:
    AM: {format_routine(routine.am)}
    PM: {format_routine(routine.pm)}
    
    RECENT SKIN DIARY (last 7 days):
    {format_diary(recent_diary)}
    """
```

### LLM provider abstraction

```python
class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, messages: list[Message], **kwargs) -> str: ...
    
    @abstractmethod
    async def stream(self, messages: list[Message], **kwargs) -> AsyncIterator[str]: ...

class GeminiProvider(LLMProvider):
    """Gemini Flash — fast, cheap, high volume."""
    
class ClaudeProvider(LLMProvider):
    """Claude — deep reasoning, complex analysis."""
```

### Routing rules

| Feature | Provider | Why |
|---------|----------|-----|
| Ask JAY (simple) | Gemini Flash | Speed. Sub-second first token. |
| Ask JAY (with tools) | Gemini Flash | Tool calling is fast and cheap. |
| Jay Research modules | Claude | Deep analysis quality matters more than speed. |
| Routine generation | Gemini Flash | Structured output, speed. |
| Cap or Slap verdict | Claude | Nuanced reasoning for verdicts. |
| Diet planner | Gemini Flash | Structured meal output. |

---

## 7. Dupe finder algorithm

Not AI-driven — this is a deterministic matching algorithm for speed and consistency:

```python
def compute_dupe_score(original: Product, candidate: Product) -> float:
    """
    Score 0-100 based on ingredient overlap.
    
    1. Extract key active ingredients from both products
    2. Match by ingredient name (fuzzy, handles naming variations)
    3. Weight by ingredient importance:
       - Star actives (L-Ascorbic Acid, Retinol, Niacinamide): 3x weight
       - Supporting actives (Hyaluronic Acid, Ceramides): 2x weight
       - Base ingredients (water, glycerin): 1x weight
    4. Penalize if candidate is missing a star active
    5. Bonus if candidate has the same concentration range
    """
```

Results are cached in `dupe_matches` table. Recomputed weekly or when product data updates.

---

## 8. Intelligence engine

Runs as nightly Celery beat tasks:

```python
@celery.task
def generate_user_insights(user_id: UUID):
    """
    Analyze diary + routine data to surface patterns.
    
    Insight types:
    1. Product correlation — "Your skin improved after adding X"
       Method: Compare mood scores 7 days before vs after adding a product
       
    2. Routine adherence — "You completed 85% of steps this week"
       Method: Count completed steps / total steps per day
       
    3. Trigger detection — "Breakouts correlate with skipping SPF"
       Method: Cross-reference bad diary days with missed routine steps
       
    4. Streak tracking — "12-day routine streak!"
       Method: Redis sorted set, increment daily
       
    5. Hydration correlation — "Good skin days correlate with water intake"
       Method: If diary tags include hydration data
    """
```

Insights are computed, stored in the `insights` table, and a push notification is sent if a new actionable insight is found.

---

## 9. Caching strategy

| Data | Cache | TTL | Invalidation |
|------|-------|-----|-------------|
| Product search results | Redis | 1 hour | On product update |
| Dupe match results | PostgreSQL + Redis | 7 days | Weekly recompute |
| User's active routine | Redis | Until modified | On routine update |
| Jay Research reports | PostgreSQL (permanent) | — | Never (reports are immutable) |
| Cap or Slap verdicts | Redis | 24 hours | On new verdict |
| AI chat responses | Not cached | — | Every response is contextual |
| Community feed | Redis sorted set | 5 minutes | On new post |
| User skin score | Redis | Until diary update | On diary entry |
| Gamification streaks | Redis sorted set | Real-time | On routine completion |

---

## 10. Background jobs (Celery)

### Immediate tasks (triggered by user action)

- `generate_research_report` — 5-branch AI pipeline, 15–30 seconds
- `generate_routine` — AI routine generation, 3–5 seconds
- `generate_diet_plan` — AI meal plan, 3–5 seconds
- `generate_verdict` — AI verdict for Cap or Slap, 5–10 seconds
- `send_push_notification` — FCM push dispatch

### Scheduled tasks (Celery beat)

| Task | Schedule | Purpose |
|------|----------|---------|
| `generate_insights` | Daily 2 AM | Compute user insights from diary + routine |
| `send_routine_reminders` | Per user schedule | "Time for your AM routine!" |
| `recompute_dupe_matches` | Weekly Sunday 3 AM | Refresh dupe cache with latest products |
| `update_product_data` | Daily 4 AM | Sync product prices and availability |
| `cleanup_expired_sessions` | Daily 5 AM | Remove expired refresh tokens |
| `compute_weekly_scores` | Monday 6 AM | Skin health score recalculation |

---

## 11. Security

- **Passwords:** Argon2id hashing via `passlib`. Never bcrypt (slower to adopt improvements).
- **JWT:** RS256 signed. Short-lived access tokens (15 min). Refresh tokens stored in Redis with user binding.
- **Rate limiting:** Redis sliding window. 60 requests/min per user for general API. 10/min for AI endpoints. 3/min for auth endpoints.
- **Input validation:** Pydantic v2 on every endpoint. No raw SQL anywhere — all queries through SQLAlchemy.
- **File uploads:** Validate MIME type, max 5MB for photos. Virus scan optional via ClamAV in production.
- **CORS:** Restrict to app domains only. No wildcard origins.
- **Diary photos:** Stored with user-scoped keys in S3. Pre-signed URLs for access (expire in 1 hour).
- **Content moderation:** Community posts pass through a moderation check (LLM-based or keyword filter) before publishing.

---

## 12. Deployment

### Phase 1: Launch (0–10K users)

```
Single server on Railway or Fly.io:
  ├── FastAPI app (uvicorn, 4 workers)
  ├── Celery worker (1 worker, 4 concurrency)
  ├── Celery beat (1 scheduler)
  ├── PostgreSQL (managed, e.g. Neon or Supabase)
  ├── Redis (managed, e.g. Upstash)
  └── S3/R2 for file storage

Total cost: ~$30–50/month
```

### Phase 2: Growth (10K–100K users)

```
Split into 2 containers:
  Container 1: API server (auto-scaling, 2–8 instances)
  Container 2: Worker (Celery, 2–4 instances)
  
  ├── PostgreSQL (dedicated instance, connection pooling via PgBouncer)
  ├── Redis (dedicated instance, 1GB+)
  └── CDN for static assets (Cloudflare)

Total cost: ~$150–300/month
```

### Phase 3: Scale (100K+ users)

```
  ├── API: AWS ECS Fargate or GCP Cloud Run (auto-scaling)
  ├── Workers: Separate ECS service for Celery
  ├── PostgreSQL: RDS with read replica
  ├── Redis: ElastiCache cluster
  ├── Queue: Consider switching to SQS for durability
  ├── AI: Dedicated GPU instance for local model inference (optional)
  └── Monitoring: Full Grafana + Prometheus stack
```

---

## 13. Development workflow

```bash
# Local development
docker compose up -d                    # PostgreSQL + Redis + MinIO
uv run alembic upgrade head             # Run migrations
uv run uvicorn app.main:app --reload    # API server
uv run celery -A app.main.celery worker # Worker (separate terminal)

# Testing
uv run pytest --cov=app tests/

# Database changes
uv run alembic revision --autogenerate -m "add meal_plans table"
uv run alembic upgrade head

# Linting
uv run ruff check app/
uv run mypy app/
```

---

## 14. Build priority

Phase 1 (MVP — launch with these):

1. Auth + onboarding
2. Products (seed your existing products_master data)
3. Routine (CRUD + AI generation)
4. Ask JAY chat (basic Q&A, no tool use yet)
5. Diary (CRUD + calendar)
6. Profile

Phase 2 (core differentiators):

7. Jay Research (full AI pipeline)
8. Dupe Finder (deterministic matching)
9. Cap or Slap (AI verdicts)
10. Intelligence (nightly insight generation)

Phase 3 (engagement + growth):

11. Community
12. Gamification
13. Diet Planner
14. Notifications (push + scheduled)
15. Dermatologist locator

---

*End of backend architecture document.*
