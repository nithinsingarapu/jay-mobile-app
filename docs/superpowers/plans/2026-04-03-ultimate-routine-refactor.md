# Ultimate Routine Section Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Routine section from 3 segments (Today/My Routines/Stats) to 4 segments (Today/Explore/My Routines/Learn) — adding a curated Routine Library with 40+ templates and an Education Hub with tips, ingredient spotlights, conflict rules, and seasonal guides.

**Architecture:** The main routine screen expands its SegmentedControl to 4 tabs. Two new data files (`routineLibrary.ts` and `learnContent.ts`) provide all static content. The Explore tab renders categorized horizontal scroll rows of RoutineTypeCards, each pushable to a RoutineTemplateDetail screen. The Learn tab renders tips, order diagrams, conflict rules, ingredient spotlights, and science articles — all tappable to a full ArticleDetail screen. Existing Today and My Routines tabs are preserved with minor polish. Stats moves into My Routines as a section.

**Tech Stack:** React Native, Expo Router, TypeScript, Zustand, react-native-reanimated, react-native-svg, StyleSheet

---

## File Map

### New Data Files
| File | Responsibility |
|------|----------------|
| `data/routineLibrary.ts` | 40+ routine templates organized by category (core, concern, cultural, trending, life stage, body zone) |
| `data/learnContent.ts` | Tips, ingredient spotlights, conflict display rules, seasonal guides, science articles |

### New Components
| File | Responsibility |
|------|----------------|
| `components/routine/FeaturedRoutineCard.tsx` | Hero card with gradient bg, routine name, description, badges |
| `components/routine/RoutineTypeCard.tsx` | Compact card: emoji + name + description + step count + difficulty badge |
| `components/routine/CategoryRow.tsx` | Section header + horizontal scroll of RoutineTypeCards |
| `components/routine/TipCard.tsx` | Small horizontal scroll card with icon + tip text |
| `components/routine/OrderDiagram.tsx` | AM/PM step order cards (side by side) |
| `components/routine/ConflictRule.tsx` | Left-bordered card: never combine / caution / great together |
| `components/routine/IngredientSpotlight.tsx` | Centered card with emoji + name + subtitle |
| `components/routine/SeasonalCard.tsx` | Season emoji + name + description (2x2 grid) |
| `components/routine/ArticleCard.tsx` | Horizontal card with colored bg + title + subtitle |

### New Screens
| File | Responsibility |
|------|----------------|
| `app/(screens)/routine-template.tsx` | Full page for a routine type: philosophy, protocol steps, key ingredients, suitability, "Build This Routine" CTA |
| `app/(screens)/article.tsx` | Full page article (from Learn tab tips, spotlights, science articles) |

### Modified Files
| File | Change |
|------|--------|
| `app/(screens)/routine.tsx` | Expand SegmentedControl from 3→4, add Explore + Learn segment renderers, move Stats into My Routines section |
| `components/routine/SegmentedControl.tsx` | Support 4 segments (already takes `segments` array, just pass 4) |

---

## Tasks

### Task 1: Create routineLibrary.ts data file

**Files:**
- Create: `jay-app/data/routineLibrary.ts`

- [ ] **Step 1: Create the routine library data**

Create the file with this structure — 40+ routine templates across 6 categories. Each routine has: id, name, emoji, description, difficulty, stepCount, category, tags, philosophy, protocol steps, key ingredients, suitability, source.

```typescript
export interface RoutineTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  stepCount: string; // "3 steps", "4-5 steps", "10 steps"
  category: 'core' | 'concern' | 'cultural' | 'trending' | 'life_stage' | 'body_zone';
  tags: string[];
  tintColor: string; // hex color for card tint
  // Detail page content
  philosophy: string;
  protocol: { step: number; name: string; description: string; color: string }[];
  keyIngredients: string[];
  bestFor: string[];
  source: string;
}

export interface RoutineCategory {
  id: string;
  title: string;
  templates: RoutineTemplate[];
}
```

Populate with ALL templates from the architecture doc:
- **Core Routines (5):** Essential 3-Step, Standard 4-Step, Standard 5-6 Step, Extended 7-9 Step, 10-Step K-Beauty
- **By Concern (8):** Acne-Focused, Anti-Aging, Hyperpigmentation, Rosacea, Sensitive/Reactive, Barrier Repair, Eczema, Psoriasis
- **Cultural Routines (7):** Korean Glass Skin, Japanese Mochi, Ayurvedic, French Pharmacy, TCM, African Traditional, Middle Eastern Hammam
- **Trending Methods (7):** Skin Cycling, Slugging, Skinimalism, Skin Fasting, Skip-Care, Sandwich Method, Biohacking
- **By Life Stage (7):** Teen, Twenties, Thirties-Forties, Fifties+, Men's, Pregnancy-Safe, Pre-Wedding
- **Body Zone (7):** Face, Body, Neck & Décolletage, Hands, Lips, Feet, Scalp

Each template needs realistic protocol steps, ingredients, and descriptions. Use content from the HTML mockup as reference.

Export: `ROUTINE_CATEGORIES: RoutineCategory[]` and `FEATURED_ROUTINE: RoutineTemplate` (Skin Cycling as featured).

---

### Task 2: Create learnContent.ts data file

**Files:**
- Create: `jay-app/data/learnContent.ts`

- [ ] **Step 1: Create the learn content data**

```typescript
export interface Tip {
  id: string;
  emoji: string;
  title: string;
  body: string;
  bgColor: string; // tint color for icon background
}

export interface IngredientSpotlight {
  id: string;
  emoji: string;
  name: string;
  subtitle: string;
  description: string; // full article text
  concentrations: string;
  products: string[];
  pairsWith: string[];
  avoidWith: string[];
}

export interface ConflictDisplay {
  type: 'never' | 'caution' | 'synergy';
  label: string;
  ingredients: string;
  color: string; // red/orange/green
}

export interface SeasonalGuide {
  id: string;
  emoji: string;
  name: string;
  summary: string;
  tips: string[];
}

export interface ScienceArticle {
  id: string;
  title: string;
  subtitle: string;
  readTime: string;
  gradient: [string, string];
  body: string; // full article text in plain paragraphs
}
```

Populate with content from the architecture doc:
- **TIPS (12+):** "Thinnest to thickest", "2 finger-lengths of SPF", "Retinol = PM only", "Wait between actives", "Patch test 7-10 days", etc.
- **AM_ORDER / PM_ORDER:** Step arrays for application order diagrams
- **CONFLICTS (8+):** Never combine (5), Caution (2), Synergies (3+)
- **INGREDIENT_SPOTLIGHTS (7):** Retinol, Vitamin C, Niacinamide, Hyaluronic Acid, AHAs & BHAs, Ceramides, SPF
- **SEASONAL_GUIDES (4):** Summer, Winter, Monsoon, Urban/Pollution
- **SCIENCE_ARTICLES (3+):** Skin barrier, Fitzpatrick types, Why routine order matters

---

### Task 3: Build Explore tab components

**Files:**
- Create: `jay-app/components/routine/FeaturedRoutineCard.tsx`
- Create: `jay-app/components/routine/RoutineTypeCard.tsx`
- Create: `jay-app/components/routine/CategoryRow.tsx`

- [ ] **Step 1: FeaturedRoutineCard**

Props: `{ template: RoutineTemplate, onPress: () => void }`

Match the HTML mockup's `.FHC` class exactly:
- Dark gradient background (linear-gradient #1a2a3a → #0a1520)
- Blur circle (absolute positioned, top-right, blue tint)
- "Featured routine" label (11px, uppercase, systemBlue)
- Name (24px, bold, white)
- Description (15px, secondaryLabel, 1.47 line height)
- Tags as badge pills (green "Trending", gray step count, gray skin types)
- min-height 180px, 18px borderRadius, press scale animation
- 16px horizontal margin

- [ ] **Step 2: RoutineTypeCard**

Props: `{ template: RoutineTemplate, onPress: () => void }`

Match HTML `.RTC` class:
- min-width 160px, secondarySystemBackground bg, 14px radius
- Emoji (28px), name (15px semibold), description (12px, 2-line clamp, secondaryLabel)
- Meta row: step count badge (colored) + difficulty badge (gray)
- Optional tint border (1px, matching concern color)
- Press scale 0.96 animation

- [ ] **Step 3: CategoryRow**

Props: `{ title: string, templates: RoutineTemplate[], onTemplatePress: (id: string) => void, onSeeAll?: () => void }`

- Section header row: title (20px, bold) + "See All" link (15px, systemBlue)
- Horizontal ScrollView of RoutineTypeCards with 12px gap, 16px padding

---

### Task 4: Build Learn tab components

**Files:**
- Create: `jay-app/components/routine/TipCard.tsx`
- Create: `jay-app/components/routine/OrderDiagram.tsx`
- Create: `jay-app/components/routine/ConflictRule.tsx`
- Create: `jay-app/components/routine/IngredientSpotlight.tsx`
- Create: `jay-app/components/routine/SeasonalCard.tsx`
- Create: `jay-app/components/routine/ArticleCard.tsx`

- [ ] **Step 1: TipCard** — min-width 240px, secondarySystemBackground, 14px radius. Icon circle (36px, tinted bg) + title (14px semibold) + body (12px secondaryLabel). Horizontal scroll item.

- [ ] **Step 2: OrderDiagram** — Two side-by-side cards (grid 1fr 1fr, gap 10). AM card (blue header "Morning (AM)") with numbered steps. PM card (indigo header "Evening (PM)") with numbered steps. Last step highlighted in accent color.

- [ ] **Step 3: ConflictRule** — Left border 2.5px (red/orange/green based on type). Label (11px uppercase, colored), ingredient combo text (13px, secondaryLabel). 12px padding, secondarySystemBackground, 12px radius.

- [ ] **Step 4: IngredientSpotlight** — Centered card (min-width 140px, secondarySystemBackground, 14px radius). Large emoji (32px) + name (14px semibold) + subtitle (11px secondaryLabel). Horizontal scroll item.

- [ ] **Step 5: SeasonalCard** — Season emoji (22px) + name (14px semibold) + summary (12px secondaryLabel). Widget card (secondarySystemBackground, 16px padding). Used in 2x2 grid.

- [ ] **Step 6: ArticleCard** — Horizontal card: colored gradient bg section (90px wide) + content (title 14px semibold + subtitle 12px secondaryLabel). 14px radius, min-height 80px. Press scale animation.

---

### Task 5: Build RoutineTemplateDetail screen

**Files:**
- Create: `jay-app/app/(screens)/routine-template.tsx`

- [ ] **Step 1: Create the screen**

Receives `templateId` via route params. Looks up template from `ROUTINE_CATEGORIES` in routineLibrary.ts.

Layout (matching HTML `v-tmpl` exactly):
- Nav bar: back "Explore" + "Use Template" button
- Hero area: 160px gradient bg with large emoji (56px, 0.3 opacity) + "Featured/Trending" label + name (28px bold)
- Tag pills below hero
- Philosophy text (17px, secondaryLabel, 1.47 line height)
- "The Protocol" section: grouped table with numbered step circles (colored) + step name + description
- "Key Ingredients" section: wrapped badge pills
- "Best For" section: grouped table with green checkmarks
- "Source" section: text paragraph
- "Build This Routine" button (full width, systemBlue, 14px radius)
- "Save for Later" button (secondary)

---

### Task 6: Build Article screen

**Files:**
- Create: `jay-app/app/(screens)/article.tsx`

- [ ] **Step 1: Create the screen**

Receives `articleId` and `articleType` (tip/spotlight/science) via route params. Looks up content from learnContent.ts.

Layout (matching HTML `v-article`):
- Nav bar: back "Learn"
- Title (28px bold) + subtitle (13px secondaryLabel, "3 min read · Category")
- Body text (17px, secondaryLabel, 1.6 line height, proper paragraph spacing)
- For ingredient spotlights: add concentration info, pairs with, avoid with sections

---

### Task 7: Refactor main routine screen — 4 segments

**Files:**
- Modify: `jay-app/app/(screens)/routine.tsx`

- [ ] **Step 1: Update SegmentedControl to 4 tabs**

Change `SEGMENTS` from `['Today', 'My Routines', 'Stats']` to `['Today', 'Explore', 'My Routines', 'Learn']`.

Update segment mapping:
```typescript
const SEGMENTS = ['Today', 'Explore', 'My Routines', 'Learn'];
```

- [ ] **Step 2: Add Explore tab renderer**

Import `ROUTINE_CATEGORIES, FEATURED_ROUTINE` from data/routineLibrary.ts. Import FeaturedRoutineCard, CategoryRow.

```typescript
const renderExplore = () => (
  <>
    <FeaturedRoutineCard
      template={FEATURED_ROUTINE}
      onPress={() => router.push({ pathname: '/(screens)/routine-template', params: { templateId: FEATURED_ROUTINE.id } })}
    />
    {ROUTINE_CATEGORIES.map(cat => (
      <CategoryRow
        key={cat.id}
        title={cat.title}
        templates={cat.templates}
        onTemplatePress={(id) => router.push({ pathname: '/(screens)/routine-template', params: { templateId: id } })}
      />
    ))}
  </>
);
```

- [ ] **Step 3: Add Learn tab renderer**

Import all learn content and components. Render sections matching HTML exactly:
- Quick Tips (horizontal scroll of TipCards)
- Application Order (OrderDiagram)
- Ingredient Rules (ConflictRule cards)
- Ingredient Spotlights (horizontal scroll of IngredientSpotlight cards)
- Seasonal Guide (2x2 grid of SeasonalCards)
- Science Corner (ArticleCard list)

Each tappable item navigates to `/(screens)/article` with appropriate params.

- [ ] **Step 4: Move Stats into My Routines tab**

The current Stats tab becomes a section within My Routines:
```typescript
const renderRoutines = () => (
  <>
    {/* Existing routine cards */}
    ...
    {/* Stats section (collapsed under "Your Stats" header) */}
    <Text style={...}>Your Stats</Text>
    <StatsHero streak={streak.current_streak} />
    <StatsPeriodToggle ... />
    <StatCards ... />
  </>
);
```

- [ ] **Step 5: Wire segment switching**

Update `activeSegment` type to include 'explore' and 'learn'. Update the render switch:
```typescript
{activeSegment === 'today' && renderToday()}
{activeSegment === 'explore' && renderExplore()}
{activeSegment === 'routines' && renderRoutines()}
{activeSegment === 'learn' && renderLearn()}
```

---

### Task 8: Polish Today tab to match HTML mockup

**Files:**
- Modify: `jay-app/app/(screens)/routine.tsx`

- [ ] **Step 1: Match the HTML Today tab pixel-perfect**

Ensure:
- Active routine indicator with chevron (tappable → switches to My Routines)
- Streak + Adherence cards with gradient tints (orange/green)
- Day dots with proper states
- Progress ring with correct sizing (110px, stroke 7)
- Step rows: completed shows green timestamp, wait time pill ("⏱ Wait 1-2 min"), essential badge
- Complete All button: secondary style, changes text + color on complete
- "Tonight's note" conflict card (orange left border)
- Monthly cost row at bottom

---

### Task 9: Polish My Routines tab + Create modal to match HTML

**Files:**
- Modify: `jay-app/app/(screens)/routine.tsx`
- Modify: `jay-app/components/routine/sheets/CreateRoutineSheet.tsx`

- [ ] **Step 1: Match My Routines HTML**

- Active routines section with green-bordered cards + colored blur tint
- Saved routines section with "Saved" badge (no border)
- Card layout: name + period badge + description + metadata (steps · type · cost)

- [ ] **Step 2: Simplify Create modal to match HTML**

The HTML mockup shows a **single-page modal** (not 3-step wizard):
- Name input
- Description textarea
- Session grouped table (Morning/Afternoon/Evening/Night)
- Build method grouped table (Build with JAY / Use template / Build from scratch) with icons
- "Create Routine" button

Simplify the current 3-step wizard back to a single scrollable sheet matching the HTML.

---

### Task 10: Type-check and bundle test

- [ ] **Step 1: Run TypeScript check**
```bash
cd jay-app && npx tsc --noEmit
```

- [ ] **Step 2: Run Metro bundle**
```bash
npx expo export --platform ios
```

- [ ] **Step 3: Fix any errors**

---
