# JAY — App Design Documentation

**Version:** Final  
**Last updated:** March 28, 2026  
**Platform:** iOS & Android (375×812pt baseline, iPhone 14)  
**Design tool output:** HTML high-fidelity mockups

---

## 1. Product overview

JAY is a personal AI skincare companion that helps users understand products, build routines, track skin over time, research ingredients, find affordable alternatives, and get quick opinionated help — without replacing a real dermatologist.

**Tagline:** Your Skin, Your Agent.

**Target audience:** Skincare-aware consumers aged 18–35 in India, ranging from beginners to enthusiasts, who want clarity on ingredients and marketing claims.

**Tone:** Supportive, clear, non-judgmental, science-aware without being cold. Where the app gives opinions (product verdicts, Cap or Slap), it feels like a knowledgeable friend plus structured research — not medical authority.

---

## 2. Design philosophy

The design follows five principles, in priority order:

1. **White-first clarity.** Pure white (#FFFFFF) backgrounds everywhere. No gradients, no tinted surfaces. Content earns attention through typography and spacing, not color.

2. **Monochromatic restraint.** The entire color system uses black, white, and five greys. No accent colors. This creates a luxury feel similar to high-end apparel brands — the absence of color *is* the premium signal.

3. **Typographic confidence.** Outfit (geometric sans-serif) at medium-semibold weights (500–600 for body, 600–700 for headlines). The JAY logo uses Theater Bold Condensed, a heavy condensed display face that anchors the brand.

4. **Surgical spacing.** 24px screen padding, 14px between list items, 10–12px between cards. Nothing feels cramped, nothing feels wasteful.

5. **Content over chrome.** No decorative elements, no illustrations, no colored badges. Cards use 0.5px borders instead of shadows. Progress bars are 4px thin. Every pixel serves information.

---

## 3. Color system

| Token | Hex | Usage |
|-------|-----|-------|
| Black | #000000 | Primary text, headlines, buttons, active icons, JAY avatar |
| Dark grey | #333333 | Strong secondary text, calendar "good" dots |
| Mid grey | #666666 | Body text, secondary labels |
| Light grey | #999999 | Tertiary text, placeholders, timestamps, category labels |
| Border grey | #E5E5E5 | Card borders, dividers, input borders |
| Surface | #F5F5F5 | Input backgrounds, icon circles, tag fills |
| White | #FFFFFF | Page background, card backgrounds |

### Status indicators (minimal)

| State | Treatment |
|-------|-----------|
| SLAP (positive verdict) | Black badge with white text |
| CAP (negative verdict) | #888 grey badge with white text |
| Completed step | Black filled circle with white checkmark |
| Incomplete step | #E5E5E5 border circle, empty |
| Good skin day | #333 dot |
| Okay skin day | #999 dot |
| Bad skin day | #CCC dot |
| Save amount | Black text, font-weight 600 |

### Rules

- No accent colors anywhere in the UI.
- Color is reserved exclusively for content (editorial card backgrounds, product images when added).
- The editorial "For You" cards use dark backgrounds (#1A2A3A and similar) as a design element — these are content, not UI chrome.
- All interactive states (press, focus, hover) use opacity changes, not color changes.

---

## 4. Typography

**Primary font:** Outfit (Google Fonts)  
**Logo font:** Theater Bold Condensed (1001fonts.com/theater-font.html) — web fallback: Arial Black, Impact

| Style | Weight | Size | Usage |
|-------|--------|------|-------|
| Page title | 600 | 24px | Screen titles (Home greeting, Discover, Diary, Intelligence, Community) |
| Section title | 600 | 18px | Section headers (Today's routine, For you, Cap or slap, Insights) |
| Card title | 600 | 15px | Product names, entry titles, post author names |
| Body | 400–500 | 14px | Chat messages, descriptions, article text |
| Secondary | 400–500 | 13px | Metadata, subtitles, prices, supporting text |
| Small | 400–500 | 12px | Timestamps, read times, tag text |
| Micro label | 600 | 10px | ALL-CAPS category labels (STEP 1, BEST MATCH, EXPLORE, etc.) with 1.5–2.5px letter-spacing |
| JAY logo | 900 | Variable | Theater Bold Condensed, used only for "JAY" wordmark and "J" avatar |
| Score | 700 | 20–24px | Numerical scores (8.4, 78, 42, ₹549) with negative letter-spacing |
| Savings | 700 | 40px | Large monetary values (₹3,951) as visual hero |

### Rules

- Maximum two font weights visible on any screen at once (typically 400 + 600).
- ALL-CAPS is reserved for micro labels only — never for headlines or buttons.
- Negative letter-spacing (-0.2px to -0.5px) on headlines and scores for tightness.
- Wide letter-spacing (1.5–2.5px) on micro labels for readability at small sizes.
- Line height: 1.2 for headlines, 1.5–1.6 for body text.

---

## 5. Layout and spacing

| Token | Value | Usage |
|-------|-------|-------|
| Screen padding | 24px left/right | Consistent on every screen |
| Section gap | 28px | Between major sections |
| Card padding | 14px | Internal card padding |
| Card gap | 10–12px | Between cards in lists/carousels |
| List item padding | 15–16px top/bottom | Menu rows, module rows |
| Border radius — cards | 14px | All card elements |
| Border radius — buttons | 12px | Primary and secondary buttons |
| Border radius — pills | 100px | Chips, tags, AM/PM toggles |
| Border radius — phone frame | 48px | Device mockup outer frame |
| Tab bar height | 84px | Including safe area |

### Grid patterns

- **Quick actions:** 4-column grid, 48px circular icons with labels below
- **Routine steps:** Horizontal scroll carousel, 128px min-width cards
- **Editorial cards:** Horizontal scroll, 236px min-width cards
- **Verdict cards:** Vertical stack or 2-column side-by-side
- **Menu sections:** Full-width list with 0.5px dividers between rows

---

## 6. Component library

### Primary button

```
Background: #000000
Text: #FFFFFF, 14px, weight 600
Padding: 14px vertical
Border radius: 12px
Full-width by default
```

### Secondary / outline button

```
Background: transparent
Border: 0.5px solid #E5E5E5
Text: #000000, 14px, weight 600
Padding: 14px vertical
Border radius: 12px
```

### Chip / tag (inactive)

```
Border: 0.5px solid #E5E5E5
Background: transparent
Text: #000000, 12px, weight 500
Padding: 7px 16px
Border radius: 100px (pill)
```

### Chip / tag (active)

```
Background: #000000
Text: #FFFFFF, 12px, weight 600
Padding: 7px 16px
Border radius: 100px
```

### Card

```
Background: #FFFFFF
Border: 0.5px solid #E5E5E5
Border radius: 14px
Padding: 14px
No shadow
```

### Search input

```
Background: #F5F5F5
Border radius: 12px
Padding: 13px 16px
Text: 14px, weight 400
Placeholder color: #CCCCCC
Icon: 16px magnifying glass, stroke #999
```

### Menu row

```
Padding: 15px top/bottom
Border bottom: 0.5px solid #E5E5E5 (except last item)
Left: Label text, 15px, weight 500
Right: Chevron icon, stroke #CCC, 14×14px
```

### Score badge

```
Font: 20–24px, weight 700, letter-spacing -0.5px
Color: #000 (positive) or #CCC (negative)
No background — the number itself is the element
```

### Progress bar

```
Track: #F2F2F2, 4px height, border-radius 2px
Fill: #000000
Animated fill on load (optional)
```

### Completion circle

```
Completed: 20–22px circle, #000 background, white checkmark SVG inside
Incomplete: 20–22px circle, 1.5px #E5E5E5 border, empty
```

### Tab bar

```
Background: rgba(255,255,255,0.94) with backdrop-filter blur(24px)
Border top: 0.5px solid #E5E5E5
Height: 84px (including safe area)
5 tabs evenly spaced
Active tab: filled icon (opacity 1) + label in #000 weight 600
Inactive tab: outlined icon (opacity 0.3) + label in #999 weight 500
Center JAY tab: 42px black circle, elevated -8px, white "J" inside
```

### Chat bubble — JAY (left-aligned)

```
Background: #F5F5F5
Border radius: 2px 16px 16px 16px (sharp top-left for "tail" effect)
Padding: 14px 16px
Max width: 260px
Text: 14px, weight 400, line-height 1.6
Avatar: 28px black circle with white "J" in Theater Bold
Timestamp below: 11px, #CCC, weight 500
```

### Chat bubble — User (right-aligned)

```
Background: #000000
Text color: #FFFFFF
Border radius: 16px 2px 16px 16px (sharp top-right)
Padding: 14px 16px
Max width: 252px
```

### Verdict badge (inline in chat)

```
Container: 0.5px border #E5E5E5, border-radius 10px, padding 12px, white background
Badge pill: #000 background (SLAP) or #888 (CAP), white text, 10px, weight 700, letter-spacing 1px
```

---

## 7. Navigation

### Bottom tab bar (5 tabs)

| Position | Label | Icon style | Destination |
|----------|-------|------------|-------------|
| 1 | Home | House (filled when active) | Home launchpad |
| 2 | Discover | Compass | Discover feed |
| 3 | JAY | Black circle with "J" logo, elevated | Ask JAY chat |
| 4 | Diary | Calendar | Skin diary |
| 5 | Profile | Person | User profile |

### Navigation patterns

- **Tab screens** (Home, Discover, Ask JAY, Diary, Profile): Tab bar visible, no back button.
- **Inner screens** (Research, Routine, Dupe Finder, Cap or Slap, Diet Planner, Dermatologist, Intelligence): Tab bar hidden. Top bar shows back arrow (left) + screen title in micro-label style (10px, uppercase, letter-spacing 2.5px).
- **Transitions:** iOS push (slide from right) for depth navigation. Crossfade for tab switches.
- **Bottom sheets:** Used for filters, product search, confirmations. 0.5px border, 16px top radius.

---

## 8. Screen inventory

### 8.1 Onboarding — Welcome

Full-screen centered layout. JAY logo (Theater Bold, 44px) as hero. Tagline "Your Skin, Your Agent." below. Brief description paragraph. Primary "Begin" button. Secondary "Sign in" text link. Pagination: 4-step horizontal bar indicators (active = 22px black bar, inactive = 8px #E5E5E5 bar).

### 8.2 Onboarding — Skin Quiz

Progress bar at top (3px height, black fill). Question card with number ("1 of 5") in micro label, question text in 24px weight 600, answer options as tappable cards (2-column grid, 0.5px border, selected = black fill + white text). Continue button at bottom.

**Questions:** Skin type → Skin concerns → Routine complexity → Monthly budget → Motivation for joining.

### 8.3 Home (Launchpad)

The command center. Top to bottom:

1. **Header:** Greeting ("Good morning, Priya.") 24px weight 600. Notification bell (with optional dot) + avatar circle (36px, black, white initial).
2. **Search bar:** #F5F5F5 background, placeholder text, search icon.
3. **Skin health card:** Score ring (64px SVG circle, black stroke, number centered), health label, trend text, streak info.
4. **Quick actions grid:** 4×2 grid of circular icon tiles (48px, #F5F5F5 background) with labels. Features: Ask JAY, Scan, Research, Dupes, Routine, Insights, Diet, Community.
5. **Today's routine:** AM/PM pill toggle + horizontal scroll of step cards (step number, product name, brand, completion circle).
6. **For you:** Horizontal scroll of editorial cards (dark background with white text, or light with dark text).
7. **Insight nudge:** Inline text with dot indicator and "View insight →" link.
8. **Cap or slap:** Two side-by-side verdict cards with SLAP/CAP badges and scores.

### 8.4 Discover (Feed)

Title "Discover" at top. Horizontal filter chips (All, Trending, Ingredients, Routines, Myths). Featured article card (dark background, large, full-width). Article list below: each row has a 72px colored thumbnail placeholder, title, read time and category.

### 8.5 Ask JAY (Chat)

Header: JAY logo (Theater Bold, 22px) centered + subtitle "Your skincare expert." Chat area with alternating JAY (left, #F5F5F5 bubbles) and user (right, black bubbles) messages. JAY responses support inline verdict cards (SLAP/CAP badges in bordered containers) and recommendation callouts (left border accent with structured content). Suggested prompts as pill chips below latest message. Fixed input bar at bottom with text field and send button.

### 8.6 Diary (Calendar View)

Title + "Add entry" button. Month navigator with arrows. Calendar grid: 7-column, day numbers with colored dots below (three grey shades for good/okay/bad). Today highlighted with black filled circle. Below calendar: recent entries as cards (date block + emoji + mood label + tag chips).

### 8.7 Routine (Overview)

Back arrow + title. AM/PM segmented toggle (full-width, black active segment). Vertical step list with connecting line: numbered circles (black = completed, border = pending) on the left, step cards on the right showing category label, product name, usage instructions, and completion circle. Optional "wait time" chip between steps. Bottom actions: Edit routine (outline) + Generate new (primary). "Get AI help" text link below.

### 8.8 Dupe Finder

Back arrow + title. Original product section: avatar circle placeholder + product name + key ingredients + price. Ranked dupe cards below, each showing: match rank label (BEST MATCH / STRONG / GOOD), match percentage badge (black for best, grey for others), product name, brand, price with strikethrough original and "Save ₹X" callout, progress bar showing ingredient match, action buttons (Full research + Add to routine). Bottom hero: large savings number (40px, weight 700) with match percentage.

### 8.9 Jay Research (Overview)

Back arrow + title. Product hero: circular placeholder, product name (22px), brand, price, JAY Score (32px number + label), recommendation text. Research modules as a vertical list: each module shows status indicator (filled circle = done, diamond = in progress, empty circle = pending), module name, description, and time estimate. Bottom actions: Add to routine (primary), Find dupes + Cap or slap (two outline buttons side by side).

### 8.10 Intelligence (Dashboard)

Title at top. Summary card: "This week" label, "6 out of 7 good skin days" headline, 7-segment bar visualization (filled = good, lighter = okay), trend indicator. Insights list: cards with dot indicator + title + one-line description. Routine adherence: 7-bar vertical chart (Mon–Sun), overall percentage below (20px, weight 700).

### 8.11 Community (Feed)

Title + "New post" button. Filter chips (Latest, Popular, Questions, Progress). Post cards: avatar circle + username + timestamp, post body text, tag chips, engagement counts (heart + comment icons with numbers). Posts separated by 0.5px dividers.

### 8.12 Cap or Slap (Verdict Feed)

Back arrow + title. Filter chips (All, Products, Trends, Remedies). Verdict cards: full-width with image area (colored placeholder, badge overlay), product name + brand, score (large number, black for SLAP, grey for CAP), one-line rationale, "Read full verdict →" link.

### 8.13 Diet Planner

Back arrow + title. "Optimizing for" section with selectable chips. Three meal cards (Breakfast, Lunch, Dinner): each shows meal type label, dish name, description, nutrient tag chips. Water intake tracker with circular SVG progress ring. "Generate new plan" outline button.

### 8.14 Dermatologist

Back arrow + title. Hero card: "When should you see a dermatologist?" with description. Conditions grid (2×2): emoji + condition name per cell. Location search input + filter chips (Acne specialist, Cosmetic, Teleconsult). FAQ accordion: expandable question rows with chevron icons.

### 8.15 Profile

Profile hero: avatar circle (72px, black, white initial), name (22px), skin type tag chips, member-since date. Stats row: 3-column bordered container showing entries count, streak count, products count (each as large number + micro label). Level card: title + points progress + 4px progress bar (black fill). Settings menu organized in sections (Skincare, Achievements, Settings) with standard menu rows.

---

## 9. Iconography

- **Style:** Outlined, 1.5px stroke, rounded caps and joins
- **Size:** 19–22px in UI, consistent bounding box
- **Source:** Custom SVG, styled to match the system (no icon library dependency)
- **Active state:** Filled variant, full opacity
- **Inactive state:** Outlined variant, 0.3 opacity
- **Color:** Always black (#000) stroke or fill — never colored

---

## 10. Micro-interactions and motion

| Interaction | Spec |
|-------------|------|
| Screen transition | iOS push (slide from right, 0.3s ease) |
| Tab switch | Crossfade 0.2s |
| Card press | Scale to 0.98, 0.15s ease |
| Button press | Opacity 0.85, 0.1s ease |
| Checkbox fill | Circle fills black, checkmark draws in 0.3s |
| Score reveal | Number counts from 0 to value, 0.8s ease-out |
| Progress bar | Fills from 0 to target width, 0.5s ease-out |
| Bottom sheet | Slide up with spring physics, background dims to 50% black |
| Pull to refresh | JAY "J" rotates subtly, then settles |

---

## 11. Accessibility

- All interactive elements: minimum 44×44px touch target
- Color contrast: all text meets WCAG AA (monochrome system inherently passes)
- Screen reader labels on all icons and interactive elements
- Support for Dynamic Type (iOS) and font scaling (Android)
- Reduce Motion: disable all non-essential animations
- No color-only indicators — all states use shape (filled vs outline circles) plus color

---

## 12. Files delivered

| File | Description |
|------|-------------|
| `JAY_Final.html` | High-fidelity mockups of all 13 screens, scrollable at real iPhone dimensions. Open in Chrome for best rendering. |
| `JAY_Documentation.md` | This file — complete design system, component specs, and screen-by-screen breakdown. |

---

## 13. Implementation notes

### Font loading

```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

The Theater Bold Condensed font must be downloaded from [1001fonts.com/theater-font.html](https://www.1001fonts.com/theater-font.html) and installed locally or served as a webfont. The HTML mockups use Arial Black / Impact as fallback, which renders similarly.

### CSS variables (for implementation)

```css
--color-bg: #FFFFFF;
--color-surface: #F5F5F5;
--color-text-primary: #000000;
--color-text-secondary: #666666;
--color-text-tertiary: #999999;
--color-text-hint: #CCCCCC;
--color-border: #E5E5E5;
--font-sans: 'Outfit', system-ui, -apple-system, sans-serif;
--font-logo: 'Theater', 'Arial Black', 'Impact', sans-serif;
--radius-card: 14px;
--radius-button: 12px;
--radius-pill: 100px;
--spacing-screen: 24px;
--spacing-section: 28px;
--spacing-card: 14px;
```

### Tab bar implementation

The center JAY tab uses a negative margin-top (-8px) to float above the bar. The background uses `backdrop-filter: blur(24px)` with 94% white opacity for the frosted glass effect.

### Responsive considerations

The design targets 375px width (iPhone 14 baseline). For larger phones (iPhone Pro Max at 430px), content stretches naturally with the 24px padding. For tablets, consider a centered max-width container of 430px with additional whitespace on sides.

---

*End of documentation.*
