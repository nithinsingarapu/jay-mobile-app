# JAY — Next Session Handoff

> **Date:** 2026-04-04
> **Last commit:** a75f394 (routine queue — completed sessions move to back)
> **Branch:** main (pushed to GitHub)

---

## What Was Built This Session

### Routine Section (Complete Rebuild)
- 3-tab layout: Today / Library / My Routines
- HeroRing (130px animated), StatPill (compact), StepTable + StepTableRow (Apple Reminders style)
- RoutineManagementCard with per-routine stats + action pills
- Session queue: completed routines move to back, auto-advance to next incomplete

### Create Routine (Smart 2-Step Flow)
- Step 1: Name + Tell JAY + When + What Kind
- "Let JAY decide" → skips to AI build
- "Choose from Library" → switches to Library tab
- "Custom" → creates empty, opens edit
- Specific type → Step 2: Build with JAY or Build Myself

### JAY AI System
- **Generator (Gemini)**: Smart auto-type inference, climate-aware, existing routine gap analysis
- **JAY Assist (Groq)**: Ambient auto-fill — pick category → product auto-selected + instruction auto-written
- **Advisor mode**: JAY analyzes existing routines before suggesting new ones
- Flexible sessions: morning/afternoon/evening/night/full_day/custom

### Notifications
- 40+ personality-driven messages across 4 sessions
- Deep-link to routine screen on tap
- Local scheduled notifications via expo-notifications

### Discover Section
- Product browser with department tabs, subcategory chips, brand tier filter, sort
- 687 products enriched (prices, images, ratings via Serper)
- Product detail with 5 tabs (Overview, Ingredients, Prices, Experts, Alternatives)

---

## What Needs Building Next (3 Tasks)

### Task 1: Redesign Session Pills (TODAY tab)
**Current:** Plain blue/gray pills with text. Completed pills show ✓ green tint.
**Issue:** "Session pills look worst" — need beautiful, polished design.
**Design direction:**
- Replace pills with elegant cards/indicators
- Show routine name + step progress + completion status
- Apple Health-style summary cards (not plain pills)
- SVG icons instead of emoji

### Task 2: Time-of-Day Ambient Gradients (TODAY tab)
**Requirement:** When viewing morning routine → slight warm morning gradient on screen background. Afternoon → warm amber. Evening → sunset. Night → deep indigo.
**Design tokens (from UI/UX Pro Max):**
```
Morning:   #FFF7ED → #FFFBEB (warm peach/cream) — dark: #1a1510 → #0f0f0a
Afternoon: #FFFBEB → #FEF3C7 (warm amber/gold) — dark: #1a1708 → #0f0d05
Evening:   #FFF1F2 → #FCE7F3 (rose/sunset) — dark: #1a0f10 → #150a10
Night:     #EEF2FF → #E0E7FF (cool indigo) — dark: #0a0f1a → #080c15
```
- Subtle, minimal — not shiny. Background tint only.
- Gradient should be at the TOP of the screen, fading to transparent.

### Task 3: Diary Section (NEW — 4th tab)
**Add a 4th tab:** Today / Library / My Routines / **Diary**
**Content:**
- **Calendar heatmap** — GitHub-style contribution graph showing routine completion per day (green intensity = % completed)
- **Streak dashboard** — current streak, longest streak, streak calendar
- **Weekly/Monthly stats** — adherence %, completed vs skipped vs missed, cost tracking
- **Achievements/Badges** — milestone rewards (7-day streak, 30-day, first routine, etc.)
- **Skin journal** — daily notes about skin condition, photos (future)
- **Charts** — weekly bar chart, monthly trend line, category completion breakdown

**Design reference:** Apple Health Summary page + GitHub contribution graph + Duolingo streak system

---

## Current File Structure (Key Files)

```
jay-app/
├── app/(screens)/routine.tsx          # Main 3-tab screen (Today/Library/My Routines)
├── app/(screens)/routine-detail.tsx   # Routine detail view
├── app/(screens)/routine-edit.tsx     # Edit routine steps
├── app/(screens)/routine-template.tsx # Library template detail
├── app/(screens)/build-with-jay.tsx   # AI generation screen
├── app/(screens)/article.tsx          # Learn article view
├── components/routine/
│   ├── HeroRing.tsx                   # 130px animated ring
│   ├── StatPill.tsx                   # Compact stat pill
│   ├── StepTable.tsx                  # Apple Reminders table wrapper
│   ├── StepTableRow.tsx               # Step row with checkbox
│   ├── RoutineManagementCard.tsx      # My Routines card with actions
│   ├── ActionPill.tsx                 # Small action button
│   ├── sheets/CreateRoutineSheet.tsx  # Smart 2-step creation
│   ├── sheets/AddStepSheet.tsx        # Ambient JAY assist step builder
│   ├── sheets/SkipReasonSheet.tsx     # Skip reason picker
│   └── ... (30+ more components)
├── stores/routineStore.ts             # Zustand store (flat routines model)
├── services/routine.ts                # API service (all endpoints + JAY Assist)
├── services/notifications.ts          # Local notification system
├── data/routineLibrary.ts             # 41 routine templates
├── data/learnContent.ts               # Tips, conflicts, spotlights, articles
└── types/routine.ts                   # TypeScript types

jay-backend/
├── app/features/routine/
│   ├── generator.py                   # AI routine generation (Gemini)
│   ├── jay_assist.py                  # Fast inline assists (Groq)
│   ├── prompts.py                     # Prompt templates (advisor mode)
│   ├── constants.py                   # Templates, conflicts, rules
│   ├── validator.py                   # Conflict + order validation
│   └── router.py                      # All endpoints including /assist/*
├── app/ai/providers/
│   ├── gemini.py                      # Gemini 2.5 Flash
│   └── groq.py                        # Groq llama-3.3-70b
└── app/config.py                      # Keys: gemini, groq, serper
```

## Environment Variables Needed
```
# jay-backend/.env
GEMINI_API_KEY=...
GROQ_API_KEY=...        # Get free at console.groq.com
SERPER_API_KEY=...       # Get free at serper.dev
SUPABASE_URL=...
SUPABASE_JWT_SECRET=...
DATABASE_URL=...

# jay-app/.env
EXPO_PUBLIC_API_URL=http://192.168.1.6:8000
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Design System (from UI/UX Pro Max)
- **Style:** Soft UI Evolution — modern, subtle depth, accessibility-focused
- **Colors:** Soft pink + lavender luxury palette (current: iOS system colors)
- **Typography:** Outfit family (already installed)
- **Icons:** SVG (react-native-svg), NO emojis in structural UI
- **Animation:** Spring physics, 150-300ms micro-interactions
- **Touch targets:** Min 44×44pt
