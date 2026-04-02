# JAY — Ultimate Routine Section: Architecture

## The Big Idea

The Routine section is no longer just a tracker. It's JAY's **Skincare Routine Library + Personal Manager + Daily Tracker + Education Hub** — the single place where users go to learn about routines, discover new ones, build their own, track daily, and understand the science behind every step.

Think Apple Fitness+ — your personal workout tracking sits alongside a massive curated library of classes, articles, and programs.

---

## Root Navigation (4 segments)

```
┌──────────────────────────────────────────────────┐
│  Today     Explore     My Routines     Learn      │
└──────────────────────────────────────────────────┘
```

### 1. TODAY — Daily tracker (refined)
Existing functionality, polished. Shows active routine steps, completion checkboxes, progress ring, streak, day dots, conflict notices.

### 2. EXPLORE — Routine library (NEW)
Browse 40+ routine types organized by category. Each routine type is a "recipe card" users can preview, learn about, and use as a template to build their own.

Content structure:
```
Featured Routine of the Week (hero card)

Section: "Core Routines"
├── Essential 3-Step (AAD Standard)
├── Standard 4-Step
├── Standard 5-6 Step
├── Extended 7-9 Step
└── 10-Step K-Beauty

Section: "By Concern"
├── Acne-Focused
├── Anti-Aging
├── Hyperpigmentation & Melasma
├── Rosacea
├── Sensitive/Reactive Skin
├── Barrier Repair
├── Eczema Care
└── Psoriasis Care

Section: "Cultural Routines"
├── Korean Glass Skin
├── Japanese Mochi Skin
├── Ayurvedic (Dosha-based)
├── French Pharmacy
├── TCM (Chinese Medicine)
├── African Traditional
└── Middle Eastern Hammam

Section: "Trending Methods"
├── Skin Cycling (4-Night Rotation)
├── Slugging
├── Skinimalism
├── Skin Fasting
├── Skip-Care / Skin Streaming
├── Sandwich Method (Buffering)
└── Biohacking (2026)

Section: "By Life Stage"
├── Teen/Adolescent
├── Twenties (Preventive)
├── Thirties-Forties (Corrective)
├── Fifties+ (Mature Skin)
├── Men's Skincare
├── Pregnancy-Safe
└── Pre-Wedding/Bridal

Section: "Body Zone"
├── Face (default)
├── Body
├── Neck & Décolletage
├── Hands
├── Lips
├── Feet
└── Scalp
```

Each routine type card → pushes to a **Routine Detail Page** showing:
- Philosophy / description
- Step-by-step protocol (with product category per step)
- Key ingredients to look for
- Suitable skin types
- Evidence base / source
- "Build This Routine" CTA → opens create flow pre-filled with this template

### 3. MY ROUTINES — Personal management (refined)
All user-created routines. Active ones with green border, saved ones without. Tap to view, edit, duplicate, delete. "Set as active" to switch which routine tracks on the Today tab.

### 4. LEARN — Education hub (NEW)
Curated skincare knowledge, bite-sized and browsable.

Content structure:
```
Section: "Quick Tips" (horizontal scroll cards)
├── "Always apply thinnest to thickest"
├── "Vitamin C in AM, Retinol in PM"
├── "Wait 1-2 min between actives"
├── "2 finger-lengths of sunscreen"
├── "Patch test new products for 7-10 days"
└── ...12 more tips

Section: "Application Order"
├── AM order diagram (interactive)
└── PM order diagram (interactive)

Section: "Ingredient Conflicts"
├── Interactive conflict checker
├── "Never combine" list (red)
├── "Use with caution" list (orange)
└── "Great together" synergies (green)

Section: "Seasonal Guide"
├── Summer routine tips
├── Winter routine tips
├── Monsoon routine tips (India-specific)
└── Climate adaptation guide

Section: "Ingredient Spotlights"
├── Retinol — The Gold Standard
├── Vitamin C — The Antioxidant Shield
├── Niacinamide — The All-Rounder
├── Hyaluronic Acid — The Hydrator
├── AHAs & BHAs — The Exfoliators
├── Ceramides — The Barrier Builders
└── SPF — The Non-Negotiable

Section: "Science Corner"
├── How the stratum corneum works
├── Fitzpatrick types explained
├── The 5 fundamental skin types
├── How actives penetrate skin
└── Why routine order matters
```

---

## Pushed Views (drill-down, tab bar hides)

1. **Routine Template Detail** — Full page about a specific routine type (from Explore)
2. **My Routine Detail** — View a personal routine (from My Routines)
3. **Edit Routine** — Modify steps (from My Routine Detail)
4. **Build with JAY** — AI generation (from create flow)
5. **Tip/Article Detail** — Full article (from Learn)
6. **Ingredient Spotlight** — Deep dive on an ingredient (from Learn)

---

## Data Sources

| Content | Source | Storage |
|---------|--------|---------|
| Routine templates (40+) | Encyclopedia DOCX | Hardcoded JSON in `data/routineLibrary.ts` |
| Quick tips (20+) | Curated from encyclopedia | Hardcoded in `data/tips.ts` |
| Ingredient spotlights | Curated from encyclopedia | Hardcoded in `data/ingredients.ts` |
| Conflict rules | Backend constants.py | Hardcoded + API validation |
| Application order | Backend constants.py | Hardcoded diagrams |
| User's routines | Backend API | Zustand store |
| Daily tracking | Backend API | Zustand store |
| Stats/streaks | Backend API | Zustand store |
| Products (for step builder) | Backend API | Zustand store |

---

## New Components Needed

### Explore Tab
- `FeaturedRoutineCard` — Hero card with gradient bg, routine name, description, "Try it" CTA
- `RoutineTypeCard` — Compact card: icon/emoji + name + step count + difficulty badge
- `RoutineTemplateDetail` — Full screen: philosophy, steps, ingredients, suitability, CTA
- `CategoryRow` — Horizontal scroll of routine type cards within a category
- `ConcernBadge` — Pill showing which concern a routine addresses

### Learn Tab
- `TipCard` — Small horizontal scroll card with tip icon + short text
- `OrderDiagram` — Interactive AM/PM order visualization
- `ConflictChecker` — Interactive: pick two ingredients, see if they conflict
- `IngredientCard` — Spotlight card: ingredient name, what it does, concentration, products
- `ArticleCard` — Tappable card linking to full article view
- `SeasonalCard` — Season icon + tips for that season

---

## UX Philosophy

This section should feel like opening Apple Fitness+:
- The TODAY tab is like your daily workout ring
- EXPLORE is like browsing workout classes by category
- MY ROUTINES is like your saved/favorited workouts
- LEARN is like the articles/tips section

Everything is browsable, nothing requires commitment. You can spend 30 seconds checking off your morning routine, or 30 minutes exploring Korean glass skin protocols and reading about why vitamin C needs a low pH to work.
