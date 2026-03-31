# JAY Mobile App — Frontend Structure & Design Language

**Version:** 1.0
**Last Updated:** 2026-03-30
**Platform:** React Native (Expo 55) + Expo Router + TypeScript
**State:** Zustand 5 · **Styling:** NativeWind + StyleSheet · **Animations:** Reanimated 4

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.83.4 |
| Platform | Expo | 55.0.10 |
| Navigation | Expo Router (file-based) | 55.0.9 |
| Language | TypeScript | 5.9.2 |
| State | Zustand | 5.0.12 |
| Styling | NativeWind + StyleSheet | 4.2.3 |
| Animations | React Native Reanimated | 4.2.1 |
| Auth | Supabase JS | 2.100.1 |
| HTTP | Native fetch + custom apiFetch wrapper | — |
| Storage | AsyncStorage (native) / localStorage (web) | 2.2.0 |
| Icons | react-native-svg (inline SVG) | 15.15.3 |
| Fonts | Outfit (Google Fonts) via expo-font | — |
| Gestures | react-native-gesture-handler | 2.30.0 |
| Blur | expo-blur | 55.0.11 |
| Clipboard | expo-clipboard | 55.0.9 |
| Location | expo-location | 55.1.5 |
| Haptics | expo-haptics | 55.0.10 |

---

## 2. Design Language — "Monochrome Confidence"

### 2.1 Philosophy

JAY's design is **monochrome, borderline brutalist, but warm**. No accent colors. No gradients. No shadows. Every element earns its place through typography and spacing, not decoration. The visual language says: "I'm serious about skincare, but I'm not clinical."

**Five principles:**
1. **White-first clarity** — Pure #FFFFFF backgrounds. No tinted surfaces, no off-whites.
2. **Monochromatic restraint** — Black, white, and five greys. Zero accent colors.
3. **Typographic confidence** — Outfit at weights 500-700. Size and weight create hierarchy, not color.
4. **Surgical spacing** — 24px screen padding, 14px card padding. Every pixel intentional.
5. **Content over chrome** — 0.5px borders instead of shadows. 4px progress bars. Thin, not thick.

### 2.2 Color System

| Token | Hex | Usage |
|-------|-----|-------|
| **Black** | `#000000` | Primary text, buttons, active icons, filled badges, JAY avatar |
| **Dark** | `#333333` | Strong secondary text, good-day calendar dots |
| **Mid** | `#666666` | Body text, secondary labels, product descriptions |
| **Grey** | `#999999` | Tertiary text, placeholders, timestamps, inactive icons |
| **Light** | `#CCCCCC` | Disabled text, hint text, day labels |
| **Border** | `#E5E5E5` | All borders (always 0.5px / `StyleSheet.hairlineWidth`) |
| **Surface** | `#F5F5F5` | Input backgrounds, icon circles, tag fills, card surfaces |
| **White** | `#FFFFFF` | Page background, card background |
| **Tab Bar** | `rgba(255,255,255,0.94)` | Frosted glass tab bar (web fallback) |
| **SLAP** | `#000000` | Positive verdict badge |
| **CAP** | `#888888` | Negative verdict badge |
| **Error** | `#D32F2F` | Error text (only exception to monochrome — validation only) |
| **Success** | `#2E7D32` | Success text (password reset confirmation) |
| **Online** | `#4CAF50` | Chat "online" dot (6px, only in JAY header) |

**Rule:** NO other colors exist in the app. If a new element needs color, it must be one of the above.

### 2.3 Typography

**Font Family:** Outfit (Google Fonts)
**Weights loaded:** 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
**JAY "J" avatar:** fontWeight '900', fallback: Arial Black, Impact

| Style | Size | Weight | Letter-Spacing | Line-Height | Family | Usage |
|-------|------|--------|-----------------|-------------|--------|-------|
| **Hero** | 48px | 900 | 10px | — | Outfit-Bold | JAY brand name on welcome |
| **Page title** | 22-28px | 600-700 | -0.3 to -0.5px | — | Outfit-SemiBold/Bold | Screen titles, empty state headings |
| **Section title** | 15-17px | 600 | -0.2px | — | Outfit-SemiBold | Sub-headers, modal titles |
| **Body** | 13-14px | 400-500 | — | 20-22px | Outfit / Outfit-Medium | Chat messages, descriptions, instructions |
| **Secondary** | 12px | 400-500 | — | 17px | Outfit / Outfit-Medium | Product names, subtitles, timestamps |
| **Small** | 11px | 400-500 | — | 16px | Outfit | Hints, descriptions, helper text |
| **Micro label** | 9-10px | 600 | 1.5-2.5px | — | Outfit-SemiBold | Section labels (ALL CAPS), frequency badges |
| **Score** | 28px | 700 | -1px | — | Outfit-Bold | Progress ring center, stat values |
| **Score XL** | 40-52px | 700 | -1 to -2px | — | Outfit-Bold | Streak hero numbers, stepper values |
| **Button** | 14px | 600 | — | — | Outfit-SemiBold | All button labels |
| **Chip** | 11-13px | 500 | — | — | Outfit-Medium | Filter chips, mode chips, tags |
| **Input** | 15px | 400 | — | — | Outfit | Text input fields |
| **Chat JAY** | 13.5px | 400 | — | 22px | Outfit | JAY chat bubble text |
| **Chat User** | 13.5px | 400 | — | 22px | Outfit | User chat bubble text |

### 2.4 Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| **Screen padding** | 24px | Horizontal padding on all screens |
| **Section gap** | 28px | Between major sections |
| **Card padding** | 14-16px | Internal card/bubble padding |
| **Card gap** | 10-12px | Between cards in lists |
| **List item padding** | 14-16px vertical | Step rows, menu rows, chat rows |
| **Form field gap** | 6px | Label to input |
| **Form section gap** | 18-20px | Between form fields |
| **Chip gap** | 6-8px | Between chips |
| **Input padding** | 14px vertical, 16px horizontal | Text inputs |

### 2.5 Border & Shape

| Element | Border Radius | Border |
|---------|---------------|--------|
| **Cards** | 14px | 0.5px #E5E5E5 |
| **Buttons** | 12px | none (primary) / 0.5px #E5E5E5 (outline) |
| **Text inputs** | 10-12px | 0.5px #E0E0E0 |
| **Chips / Pills** | 100px (fully rounded) | 0.5px #E5E5E5 |
| **Chat bubbles** | 16px (with one 2px corner) | none |
| **Avatars** | 50% (circle) | none |
| **Tab bar** | 0 | 0.5px top #E5E5E5 |
| **Period toggle** | 10px outer, 8px inner | none |
| **Menu rows** | 0 | 0.5px bottom #E5E5E5 (except last) |

**Rule:** NO shadows anywhere. Border-only design. Always `StyleSheet.hairlineWidth`.

### 2.6 Component Specs (Pixel-Level)

#### Button (Primary)
- Background: `#000000`
- Text: `#FFFFFF`, 14px, weight 600, Outfit-SemiBold
- Padding: 14px vertical
- Border radius: 12px
- Press: opacity 0.85 over 100ms
- Disabled: opacity 0.5
- Loading: ActivityIndicator (white) + label in row

#### Button (Outline)
- Background: transparent
- Border: 0.5px solid #E5E5E5
- Text: `#000000`, 14px, weight 600
- Same padding, radius, press behavior

#### Text Input
- Border: 0.5px solid #E0E0E0
- Border radius: 10-12px
- Background: #FAFAFA (empty) → #FFFFFF + border #000 (filled)
- Padding: 13-14px vertical, 14-16px horizontal
- Font: 15px Outfit
- Placeholder: #C0C0C0

#### Card
- Background: #FFFFFF
- Border: 0.5px solid #E5E5E5
- Border radius: 14px
- Padding: 14px
- Press: scale 0.98 over 150ms (where applicable)

#### Chip (Inactive)
- Border: 0.5px solid #E5E5E5
- Border radius: 100px
- Text: 12-13px, #000 or #666
- Padding: 7-10px vertical, 14-16px horizontal

#### Chip (Active)
- Background: #000000
- Text: #FFFFFF
- Same dimensions

#### JAY Avatar
- Size: varies (24-64px depending on context)
- Background: #000000
- Border radius: 50%
- "J" text: white, weight 800-900, centered

#### Progress Ring
- SVG circle, 100px viewBox
- Background stroke: #F5F5F5, 5px width
- Progress stroke: #000000, 5px width, round linecap
- Center: score (28px bold) + label (10px uppercase #999)

#### Chat Bubble (JAY)
- Background: #F5F5F5
- Border radius: 2px top-left, 16px others
- Padding: 12-14px
- Max width: 280px
- Avatar: 26px black circle with 11px "J"

#### Chat Bubble (User)
- Background: #000000
- Border radius: 16px top-left, 2px top-right, 16px bottom
- Padding: 12-14px
- Max width: 265px
- Text: #FFFFFF

#### Step Row (Today Tracker)
- Checkbox: 22px circle, 1.5px border #E5E5E5
- Done: black fill, white checkmark SVG
- Skipped: #F5F5F5 fill
- Category title: 13px, weight 600
- Product name: 12px, #666
- Instruction: 11px, #999
- Wait pill: #F5F5F5 bg, 100px radius, 10px text
- Frequency badge: 9px, uppercase, #CCC, positioned absolute top-right

#### Step Row (My Routine / Generated)
- Number circle: 22px, black bg, 9px white number
- Same body layout as tracker but no checkbox

---

## 3. App Architecture

### 3.1 File Structure

```
jay-app/
├── app/                              # Expo Router — file-based routing
│   ├── _layout.tsx                   # Root layout: auth guard, font loading, splash
│   ├── (tabs)/                       # Bottom tab navigator
│   │   ├── _layout.tsx               # Custom tab bar (5 tabs, JAY floating circle)
│   │   ├── index.tsx                 # Home — greeting, health card, quick actions, routine preview
│   │   ├── discover.tsx              # Discover — articles, filter chips
│   │   ├── jay.tsx                   # JAY Chat — SSE streaming, conversation history, mode chips
│   │   ├── diary.tsx                 # Diary — calendar grid, mood tracking
│   │   └── profile.tsx               # Profile — stats, concerns, level, menu
│   ├── (screens)/                    # Modal stack screens
│   │   ├── _layout.tsx               # Stack with slide_from_right
│   │   ├── routine.tsx               # Routine — 3 tabs (Today/My Routine/Stats), AI generation
│   │   ├── preferences.tsx           # Skin Profile — view + edit all questionnaire data
│   │   ├── settings.tsx              # Settings — account, preferences, about, sign out
│   │   ├── achievements.tsx          # Badges, glow points, streak
│   │   ├── cap-or-slap.tsx           # Product verdicts
│   │   ├── dupe-finder.tsx           # Budget alternatives
│   │   ├── diet-planner.tsx          # Skin-friendly nutrition
│   │   ├── dermatologist.tsx         # When to see a derm
│   │   ├── community.tsx             # Social feed
│   │   ├── intelligence.tsx          # Skin analytics
│   │   ├── notifications.tsx         # Notifications
│   │   ├── research/[id].tsx         # Product deep-dive
│   │   └── diary/[date].tsx          # Diary entry editor
│   └── onboarding/                   # Auth flow
│       ├── _layout.tsx               # Stack with slide_from_right
│       ├── index.tsx                 # Welcome — animated logo, taglines, CTA
│       ├── signup.tsx                # Create account
│       ├── login.tsx                 # Sign in + forgot password
│       └── quiz.tsx                  # 47-question onboarding questionnaire
├── components/
│   ├── ui/                           # Reusable primitives (11 files)
│   │   ├── Button.tsx                # Primary/outline, loading, disabled
│   │   ├── Card.tsx                  # Border card wrapper
│   │   ├── Chip.tsx                  # Toggleable filter chip
│   │   ├── CompletionCircle.tsx      # Animated checkbox
│   │   ├── Divider.tsx               # Hairline separator
│   │   ├── MenuRow.tsx               # Settings-style row with chevron
│   │   ├── ProgressBar.tsx           # Horizontal progress (animated)
│   │   ├── ScoreRing.tsx             # Circular progress ring (SVG)
│   │   ├── SearchBar.tsx             # Search input with icon
│   │   ├── SectionHeader.tsx         # Micro uppercase label
│   │   └── TopBar.tsx                # Back + title header
│   ├── home/                         # Home-specific (5 files)
│   │   ├── QuickActionsGrid.tsx      # 8-item action grid
│   │   ├── RoutineCarousel.tsx       # AM/PM routine preview
│   │   ├── ForYouCarousel.tsx        # Article cards
│   │   ├── InsightNudge.tsx          # Inline insight
│   │   └── CapSlapPreview.tsx        # Verdict preview cards
│   ├── chat/                         # Chat-specific (5 files)
│   │   ├── ChatBubbleJay.tsx         # JAY message bubble
│   │   ├── ChatBubbleUser.tsx        # User message bubble
│   │   ├── ChatInput.tsx             # Bottom input bar
│   │   ├── VerdictCard.tsx           # Embedded verdict
│   │   └── SuggestedPrompts.tsx      # Quick reply chips
│   ├── diary/                        # Diary-specific (2 files)
│   │   ├── CalendarGrid.tsx          # Monthly calendar
│   │   └── DiaryEntryCard.tsx        # Entry preview
│   ├── community/                    # Community (1 file)
│   │   └── PostCard.tsx              # Social post card
│   └── routine/                      # Routine (1 file)
│       └── RoutineStep.tsx           # Step with timeline
├── stores/                           # Zustand state (4 files)
│   ├── userStore.ts                  # Auth + profile + display data
│   ├── chatStore.ts                  # Conversations + streaming + history
│   ├── routineStore.ts               # Routines + tracking + AI generation
│   └── diaryStore.ts                 # Diary entries (local)
├── services/                         # API layer (3 files)
│   ├── auth.ts                       # Supabase signup/login/logout/resetPassword
│   ├── profile.ts                    # Profile CRUD + questionnaire
│   └── routine.ts                    # Routine CRUD + tracking + AI generation
├── lib/                              # Infra (2 files)
│   ├── api.ts                        # apiFetch with auth, timeout, abort
│   └── supabase.ts                   # Supabase client init
├── hooks/                            # Custom hooks (2 files)
│   ├── useAnimatedValue.ts           # Reanimated helpers
│   └── useOnboarding.ts              # Onboarding state accessor
├── constants/                        # Static data (2 files)
│   ├── colors.ts                     # All color tokens
│   └── mockData.ts                   # Demo data for screens without backend
├── types/                            # TypeScript types (1 file)
│   └── index.ts                      # All shared interfaces
├── assets/
│   └── fonts/                        # Outfit-*.ttf files
├── .env                              # SUPABASE_URL, ANON_KEY, API_URL
├── app.json                          # Expo config
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # NativeWind theme
└── package.json                      # Dependencies
```

### 3.2 Navigation Map

```
App Launch
  │
  ├── Not authenticated ──→ /onboarding (Welcome)
  │                           ├── /signup
  │                           ├── /login
  │                           └── /quiz (47 questions, 6 sections)
  │
  └── Authenticated ──→ /(tabs) (5 tabs)
                          │
                          ├── Home ──→ /(screens)/routine
                          │          ──→ /(screens)/cap-or-slap
                          │          ──→ /(screens)/intelligence
                          │          ──→ /(tabs)/jay
                          │
                          ├── Discover ──→ /(screens)/research/[id]
                          │
                          ├── JAY Chat (full screen, tab bar hidden)
                          │   ├── Chat view (streaming)
                          │   └── History view
                          │
                          ├── Diary ──→ /(screens)/diary/[date]
                          │
                          └── Profile ──→ /(screens)/preferences
                                     ──→ /(screens)/settings (sign out)
                                     ──→ /(screens)/achievements
                                     ──→ /(screens)/routine
```

### 3.3 State Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     ZUSTAND STORES                       │
│                                                         │
│  userStore ──→ Auth state, profile, display data        │
│       ↕ setApiToken()                                   │
│  chatStore ──→ Conversations, messages, streaming       │
│       ↕ SSE via fetch + ReadableStream                  │
│  routineStore ──→ AM/PM routines, today status, stats   │
│       ↕ REST API calls via apiFetch                     │
│  diaryStore ──→ Local diary entries (no backend yet)    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                     SERVICES                             │
│                                                         │
│  auth.ts ──→ supabase.auth.signUp/signIn/signOut       │
│  profile.ts ──→ /api/v1/profile/* (10 endpoints)       │
│  routine.ts ──→ /api/v1/routine/* (12 endpoints)       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                     LIB                                  │
│                                                         │
│  api.ts ──→ apiFetch(path, {method, body, noAuth})     │
│     ├── Auto auth header from Supabase session          │
│     ├── 60s timeout with AbortController                │
│     └── Token override via setApiToken()                │
│                                                         │
│  supabase.ts ──→ Supabase client (auth, storage)       │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Backend API Endpoints (All)

### 4.1 Auth (handled by Supabase — no custom backend)

### 4.2 Profile — `/api/v1/profile`

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/questionnaire` | Public | Full 47-question questionnaire JSON |
| GET | `/` | JWT | User profile (auto-creates on first access) |
| GET | `/completeness` | JWT | `{completeness: int, sections: dict, onboarding_completed: bool}` |
| PUT | `/basics` | JWT | Updated profile |
| PUT | `/skin-identity` | JWT | Updated profile |
| PUT | `/skin-state` | JWT | Updated profile |
| PUT | `/routine` | JWT | Updated profile |
| PUT | `/lifestyle` | JWT | Updated profile |
| PUT | `/preferences` | JWT | Updated profile |
| POST | `/complete-onboarding` | JWT | Updated profile |

### 4.3 Chat — `/api/v1/chat`

| Method | Path | Auth | Response |
|--------|------|------|----------|
| POST | `/conversations` | JWT | New conversation `{id, title, created_at}` |
| GET | `/conversations?limit=N` | JWT | List of conversations |
| GET | `/conversations/{id}/messages` | JWT | Message array |
| POST | `/conversations/{id}/stream` | JWT | SSE stream (data: token\n\n) |
| POST | `/conversations/{id}/messages` | JWT | Non-streaming response |
| DELETE | `/conversations/{id}` | JWT | 204 |

### 4.4 Products — `/api/v1/products`

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/brands` | Public | `string[]` |
| GET | `/categories` | Public | `string[]` |
| GET | `/?q=&brand=&category=&limit=&offset=` | Public | `ProductOut[]` |
| GET | `/{product_id}` | Public | `ProductOut` |

### 4.5 Routine — `/api/v1/routine`

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/types` | Public | Routine type definitions |
| GET | `/stats?period=N` | JWT | Adherence stats |
| GET | `/streak` | JWT | `{current_streak, longest_streak}` |
| GET | `/cost` | JWT | `{total_monthly_cost}` |
| GET | `/conflicts` | JWT | Conflict array |
| GET | `/products/search?category=&budget=` | JWT | Product array |
| POST | `/generate` | JWT | AI-generated routine |
| POST | `/validate` | JWT | Validation result |
| GET | `/` | JWT | `{am: RoutineOut, pm: RoutineOut}` |
| POST | `/` | JWT | New routine |
| PUT | `/{id}/steps` | JWT | Replace all steps |
| POST | `/{id}/steps` | JWT | Add step |
| PUT | `/{id}/steps/{step_id}` | JWT | Update step |
| DELETE | `/{id}/steps/{step_id}` | JWT | 204 |
| POST | `/{id}/reorder` | JWT | Reordered steps |
| POST | `/{id}/complete` | JWT | Completion record |
| POST | `/{id}/complete-all` | JWT | Completion records |
| GET | `/{id}/today` | JWT | Today's status |
| DELETE | `/{id}` | JWT | 204 (deactivate) |

### 4.6 Dev Only

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/health` | None | `{status, service, version}` |
| POST | `/dev/test-token` | None | `{access_token, user_id, email}` |

---

## 5. Animation Specs

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| New message appear | FadeInUp (8px) | 200ms | ease-out |
| Streaming cursor blink | Opacity 0↔1 | 500ms per phase | step(2) |
| Send button state | Background color | 150ms | ease |
| Mode chip selection | Background + text color | 150ms | ease |
| Stop generating pill | FadeIn | 200ms | ease |
| Message action icons | Opacity 0.25→0.5 | 100ms | ease |
| Suggestion chip press | Scale to 0.97 | 100ms | ease |
| Progress ring | stroke-dashoffset | 500ms | ease-out |
| Thinking dots | Staggered opacity pulse | 400ms per dot, 200ms delay | ease |
| Button press | Opacity to 0.85 | 100ms | ease |
| Card press | Scale to 0.98 | 150ms | spring |
| Welcome logo | Spring scale 0.5→1 | spring(friction:6, tension:80) | spring |
| Content slide | translateY 40→0 | 500ms | ease |
| Type card stagger | FadeInUp per card | 250ms, 70ms delay | ease-out |
| Spinner | rotate 360° | 900ms | linear, infinite |

---

## 6. Screens That Use Real Backend Data vs Mock

| Screen | Data Source | Status |
|--------|-------------|--------|
| Home | Real profile + mock articles/verdicts | Partial |
| JAY Chat | Real backend (streaming) | Complete |
| Routine | Real backend (CRUD, tracking, AI) | Complete |
| Profile | Real backend (profile data) | Complete |
| Skin Profile | Real backend (preferences) | Complete |
| Achievements | Real profile (derived) | Complete |
| Settings | Real profile (name, level) | Complete |
| Discover | Mock articles | Mock |
| Diary | Mock entries | Mock |
| Cap or Slap | Mock verdicts | Mock |
| Dupe Finder | Mock results | Mock |
| Diet Planner | Mock meal plan | Mock |
| Dermatologist | Mock conditions/FAQs | Mock |
| Community | Mock posts | Mock |
| Intelligence | Mock insights/weekly data | Mock |
| Notifications | Hardcoded list | Mock |

---

## 7. Environment Configuration

```env
# Frontend (.env)
EXPO_PUBLIC_SUPABASE_URL=https://rheofqhoosrhklikqdvp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
EXPO_PUBLIC_API_URL=http://localhost:8000

# Backend (.env)
SUPABASE_URL=https://rheofqhoosrhklikqdvp.supabase.co
SUPABASE_JWT_SECRET=<legacy, unused for real auth>
GEMINI_API_KEY=AIza...
DATABASE_URL=postgresql+asyncpg://postgres.rheofqhoosrhklikqdvp:...@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
DEBUG=true
```

---

## 8. Key User Flows

### 8.1 First Launch → Home
```
Welcome screen (animated) → Sign up → Quiz (47 questions, 6 sections) → Home
```

### 8.2 Returning User
```
Welcome screen (always shown first) → "Continue →" → Home
```

### 8.3 JAY Chat
```
JAY tab → Empty state / Resume conversation → Type message → SSE streaming response → Follow-up chips → New chat / History
```

### 8.4 Routine Builder
```
My Routine → Empty state → Build with JAY / Template / Manual → AI generates → Review → Save → Today tracker → Complete steps
```

### 8.5 Profile Edit
```
Profile tab → Skin Profile → View all sections (read-only) → Edit → Save to backend
```
