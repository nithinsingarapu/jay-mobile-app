# JAY — Product Screen Architecture
## Revised Structure Based on Research Report Data

---

## OVERVIEW

This document defines the complete pixel-level architecture of the JAY product screen — every section, every data field, its source in the research pipeline, its placement, and display rules.

**Design System Reference**
- Font: Outfit (all UI text) · Theater Bold Condensed (logo only)
- Palette: Black `#000000` · White `#FFFFFF` · Grey scale: `#F5F5F5` `#E0E0E0` `#BDBDBD` `#757575` `#424242` `#212121`
- No shadows · No accent colors · No decorative gradients
- Border radius: 8px (cards) · 4px (tags/chips) · 0px (bars/dividers)
- Base unit: 4px grid

---

## SCREEN LAYOUT — TOP TO BOTTOM

```
┌────────────────────────────────────────┐
│  HEADER ZONE (sticky top)              │  ← Always visible on scroll
│  PRODUCT IDENTITY ZONE                 │  ← Static, above the fold
│  SCORE BANNER                          │  ← JAY Overall Score
│  NAV TAB BAR (sticky below header)     │  ← Scrolls with page, sticks
│  ─────────────────────────────────── │
│  TAB CONTENT ZONE                      │  ← Changes per tab
└────────────────────────────────────────┘
```

Screen max-width: `390px` (mobile-first, iPhone 14 base)
Horizontal padding: `16px` both sides
Vertical rhythm: `24px` between major sections

---

## 1. HEADER ZONE
**Position:** Fixed top · Height: 48px · Background: `#FFFFFF` · Border-bottom: `1px solid #E0E0E0`

| Element | Content | Style |
|---|---|---|
| Back arrow (←) | Navigates to product list | 24px icon · `#000000` · left: 16px |
| Page title | "Product" | Outfit Medium 14px · centered · `#212121` |
| Bookmark icon | Save product | 24px icon · right: 16px · outline/filled state |

---

## 2. PRODUCT IDENTITY ZONE
**Position:** Below header · Padding: `16px` · Background: `#FFFFFF`

### 2A. Certification Tags
**Position:** Top of identity zone · Horizontal scroll row if overflow

- **Component:** Horizontal scrollable chip row
- **Chip style:** Height 24px · Padding `4px 8px` · Border `1px solid #E0E0E0` · Border-radius 4px · Outfit Regular 11px · `#424242`
- **Gap between chips:** 6px
- **Source:** `§01 Product & Brand Intelligence → Certifications`

Chips to display (in priority order):
```
Fragrance-Free  |  Paraben-Free  |  Sulfate-Free  |  Hypoallergenic
Non-Comedogenic  |  Dermatologist Tested  |  NEA Accepted (conditional)
```

Display rule: Show max 4 chips inline, rest scroll horizontally. Do NOT wrap to next line.

---

### 2B. Brand Name
**Position:** Below chips · Margin-top: 12px

- Font: Outfit SemiBold 12px · `#757575` · UPPERCASE · letter-spacing: 1.2px
- Content: `CETAPHIL · GALDERMA`
- Source: `§01 → Product Identification → Brand`

---

### 2C. Product Name
**Position:** Below brand · Margin-top: 4px

- Font: Outfit SemiBold 20px · `#000000` · line-height: 1.3
- Content: Full product name — `Cetaphil Gentle Skin Cleanser`
- Max 2 lines. Truncate with `...` on overflow.
- Source: Product metadata

---

### 2D. Product Meta Row
**Position:** Below product name · Margin-top: 10px
**Layout:** Horizontal flex row · gap: 12px · align-items: center

| Slot | Content | Style |
|---|---|---|
| Price | `₹1,299` | Outfit Bold 18px · `#000000` |
| Size tag | `8 fl oz` | Outfit Regular 12px · `#757575` |
| Platform badge | `Amazon` | 22px height · logo icon + text · border `1px solid #E0E0E0` · padding `2px 6px` · border-radius 4px |
| Savings tag | `Save ₹110` | Outfit Medium 11px · `#000000` · Background `#F5F5F5` · padding `2px 6px` · border-radius 4px |
| Star rating | `★ 4.7` | ★ in `#000000` filled · Outfit Regular 12px · `#424242` |
| Review count | `(61K)` | Outfit Regular 11px · `#BDBDBD` |

Source: `§03 User Review Synthesis → Aggregate Ratings` + live price data

---

### 2E. Skin Type Targets
**Position:** Below meta row · Margin-top: 10px
**Layout:** Horizontal chip row (non-scrollable, wrap allowed)

- Chip style: Height 24px · Padding `4px 10px` · Border-radius 4px · Background `#F5F5F5` · Outfit Regular 11px · `#424242`
- Content: Derived from `§01 → Target Skin Type`

```
Dry Skin  |  Normal Skin  |  Sensitive Skin
```

---

## 3. SCORE BANNER
**Position:** Below identity zone · Full width · Margin-top: 0 · No horizontal padding (edge-to-edge)
**Height:** 72px · Background: `#000000`

**Layout:** Flex row · justify-content: space-around · align-items: center · padding: `0 24px`

| Slot | Label | Value | Source |
|---|---|---|---|
| 1 | JAY Score | `9/10` | `§08 Report Card → Overall Score` |
| 2 | Formula Safety | `10/10` | `§08 Report Card → Formula Safety` |
| 3 | Derm Endorsed | `10/10` | `§08 Report Card → Derm Endorsement` |

Each slot:
- Value: Outfit Bold 22px · `#FFFFFF`
- Label: Outfit Regular 10px · `#BDBDBD` · UPPERCASE · letter-spacing: 0.8px
- Divider between slots: `1px solid #424242` vertical

---

## 4. NAV TAB BAR
**Position:** Sticky below header (top: 48px) · Z-index: 100
**Height:** 44px · Background: `#FFFFFF` · Border-bottom: `1px solid #E0E0E0`
**Layout:** Horizontal scroll · no wrap · padding: `0 16px` · gap: 0

| Tab | Label | Icon |
|---|---|---|
| 1 | Overview | — |
| 2 | Ingredients | — |
| 3 | Prices | — |
| 4 | Experts | — |
| 5 | Alternatives | — |

Tab style (inactive): Outfit Medium 13px · `#757575` · padding `0 14px` · height 44px
Tab style (active): Outfit Medium 13px · `#000000` · bottom border `2px solid #000000`
Tab transition: `0.15s` color + border on tap

---

## 5. TAB CONTENT — OVERVIEW

### 5A. JAY Says
**Position:** First element in Overview · Margin-top: 20px

- Label: `JAY SAYS` · Outfit Medium 10px · `#757575` · UPPERCASE · letter-spacing: 1px
- Quote text: Outfit Medium 15px · `#000000` · line-height: 1.5 · Italic style
- Left border accent: `3px solid #000000` · padding-left: 12px
- Background: `#F5F5F5` · border-radius: 8px · padding: `14px 14px 14px 18px`
- Source: `§00 TL;DR → Executive Summary` (condensed to 1–2 lines, JAY-voice)

Example:
> *"A dermatology staple for a reason — gentle enough for rosacea and eczema, hydrating enough to skip the moisturiser on good days."*

---

### 5B. Six-Dimension Report Card
**Position:** Below JAY Says · Margin-top: 20px

- Section title: `REPORT CARD` · Outfit Medium 10px · `#757575` · UPPERCASE · letter-spacing: 1px
- Layout: 2-column grid · gap: 10px · each cell: `border: 1px solid #E0E0E0` · border-radius: 8px · padding: `12px`

Each cell:
| Element | Style |
|---|---|
| Score value | Outfit Bold 24px · `#000000` |
| `/10` suffix | Outfit Regular 12px · `#BDBDBD` |
| Dimension label | Outfit Regular 11px · `#757575` · UPPERCASE · letter-spacing: 0.8px · margin-top: 2px |
| Score bar | Full-width · height 3px · Background `#E0E0E0` · filled portion `#000000` · border-radius 2px · margin-top: 8px |

Six cells (left-to-right, top-to-bottom):
```
Ingredient Quality  9/10
Formula Safety      10/10
Value for Money     9/10
Brand Transparency  8/10
User Satisfaction   9/10
Derm Endorsement    10/10
```
Source: `§08 Report Card`

---

### 5C. Why JAY Recommends
**Position:** Below Report Card · Margin-top: 24px

- Section title: `WHY JAY RECOMMENDS` · Outfit Medium 10px · `#757575` · UPPERCASE · letter-spacing: 1px
- Layout: Vertical list · gap: 10px

Each item:
- `✓` checkmark in `#000000` 14px · Outfit Regular 13px · `#212121` · line-height: 1.5
- Max 5 items
- Source: `§03 User Review Synthesis → Top 5 Positives` + `§02 Ingredient Analysis → Formula Quality Verdict`

Items:
```
✓ Clinically proven non-stripping — TEWL unchanged in rosacea study (Draelos, 2006)
✓ Triple humectant complex (Glycerin + Panthenol + Pantolactone) actively prevents dryness
✓ Niacinamide repairs barrier, reduces redness & hyperpigmentation
✓ One of the mildest surfactants available (Sodium Cocoyl Isethionate — no SLS/SLES)
✓ Safe alongside strong actives — tretinoin, benzoyl peroxide, AHAs/BHAs
```

---

### 5D. Things to Know
**Position:** Below Why JAY Recommends · Margin-top: 24px

- Section title: `THINGS TO KNOW` · Outfit Medium 10px · `#757575` · UPPERCASE · letter-spacing: 1px
- Two sub-sections: Positives + Limitations

**Positives** (collapsed to 3, expandable):
- `+` prefix · Outfit Regular 13px · `#000000` · gap: 8px

**Limitations** (all shown):
- `—` prefix · Outfit Regular 13px · `#424242` · gap: 8px

Source: `§03 → Top 5 Positives` and `§03 → Top 5 Negatives`

Positives:
```
+ Suitable for rosacea, eczema, psoriasis, perioral dermatitis
+ Can be used as body wash, baby cleanser, or light makeup remover
+ Fragrance-free & non-comedogenic — safe for acne-prone skin on actives
```

Limitations:
```
— Does not foam or lather — may not feel "clean enough" for oily skin
— Not sufficient for heavy makeup or waterproof SPF — double cleanse required
— 2021 reformulation concerns among long-term users (thinner, occasional irritation)
— Cruelty-free status unconfirmed — sold in China, no Leaping Bunny certification
```

---

### 5E. Claims Verification
**Position:** Below Things to Know · Margin-top: 24px

- Section title: `CLAIMS AUDIT` · Outfit Medium 10px · `#757575` · UPPERCASE · letter-spacing: 1px
- Layout: Vertical list · gap: 10px · each item in `border: 1px solid #E0E0E0` · border-radius: 8px · padding: `12px`

Each claim item:
| Element | Style |
|---|---|
| Verdict badge | `Clinically Verified` = black filled pill · `Partially Verified` = `#F5F5F5` outlined pill · Outfit Medium 10px |
| Claim text | Outfit Regular 13px · `#212121` · line-height: 1.4 |
| One-line evidence | Outfit Regular 11px · `#757575` · margin-top: 4px |

Source: `§05 Claims Verification`

Claims:
```
[Clinically Verified]   Clinically proven to cleanse while hydrating
                        → Rosacea TEWL study (Draelos 2006); 550+ Galderma studies

[Partially Verified]    48-hour continuous hydration (wipe-off method)
                        → Ingredient profile supports it; no independent duration data

[Clinically Verified]   Preserves skin's natural moisture barrier
                        → No increase in TEWL; Niacinamide + Panthenol documented

[Clinically Verified]   Formulated with Micellar Technology
                        → Confirmed by official product descriptions

[Clinically Verified]   Dermatologist-backed Niacinamide, Panthenol & Glycerin blend
                        → Individually and collectively endorsed by clinical research
```

---

### 5F. Usage Protocol
**Position:** Below Claims Audit · Margin-top: 24px

- Section title: `HOW TO USE` · Outfit Medium 10px · `#757575` · UPPERCASE · letter-spacing: 1px
- Layout: Vertical numbered steps · gap: 10px

Each step:
- Step number: Outfit Bold 12px · `#FFFFFF` · Background `#000000` · 20x20px circle
- Step text: Outfit Regular 13px · `#212121` · line-height: 1.5 · margin-left: 10px

Source: `§07 Usage Protocol`

```
1. Apply a generous amount to palm
2. On wet skin → massage in circular motions, rinse off
   OR on dry skin → massage, wipe with soft cloth (for 48hr hydration claim)
3. Use AM and PM — gentle enough for multiple daily uses
4. Apply before toner, serum, treatment, and moisturiser
5. For heavy makeup/waterproof SPF → oil cleanse first, use this as second cleanse
```

Patch test callout (inline card below steps):
- Background: `#F5F5F5` · border-radius: 8px · padding: `10px 12px`
- Icon: ⚠ · Outfit Regular 12px · `#424242`
- Text: `If you're new to the 2021 formula or have reactive skin, patch test behind ear for 24–48 hrs before full-face use.`

---

### 5G. Brand Transparency Card
**Position:** Below Usage Protocol · Margin-top: 24px · Margin-bottom: 32px

- Section title: `BRAND INTEL` · Outfit Medium 10px · `#757575` · UPPERCASE · letter-spacing: 1px
- Layout: Single card · `border: 1px solid #E0E0E0` · border-radius: 8px · padding: `16px`

Content rows (label + value):
| Label | Value | Source |
|---|---|---|
| Full INCI Published | ✓ Yes | `§01 → Transparency` |
| Clinical Data | ✓ 550+ studies · 32,000+ patients | `§04` |
| Ingredient Concentrations | ✗ Proprietary | `§01 → Transparency` |
| Cruelty-Free | ⚠ Conflicting — sold in China | `§01 → Certifications` |
| Vegan | ⚠ Not certified by third party | `§01 → Certifications` |
| FDA Warnings / Recalls | ✓ None identified | `§04 → Regulatory` |
| Manufacturing | Canada (Baie-D'Urfé) | `§01 → Product ID` |

Row style: Outfit Regular 12px · label `#757575` · value `#212121` · border-bottom `1px solid #F5F5F5` between rows · padding `8px 0`

---

## 6. TAB CONTENT — INGREDIENTS

### 6A. Formula Quality Score
**Position:** Top of Ingredients tab
- Large banner: `Formula Richness 8/10` · Outfit Bold 32px `#000000` centered
- Sub-text: Outfit Regular 12px `#757575` · `"Well-engineered for its target audience — mild surfactant, triple humectant, genuine actives."`
- Source: `§02 → Formula Quality Verdict`

---

### 6B. Full INCI Display
**Position:** Below formula score · Margin-top: 16px

- Label: `FULL INCI` · Outfit Medium 10px · `#757575` · UPPERCASE
- INCI text block: Outfit Regular 12px · `#424242` · line-height: 1.8 · `#F5F5F5` background · padding `12px` · border-radius 8px
- Ingredients are **tappable** — tap to jump to that ingredient's detail card below
- Source: `§01 → Full INCI List`

```
Aqua, Glycerin, Cetearyl Alcohol, Panthenol, Niacinamide, Pantolactone,
Xanthan Gum, Sodium Cocoyl Isethionate, Sodium Benzoate, Citric Acid
```

---

### 6C. Ingredient Detail Cards
**Position:** Below INCI · Margin-top: 20px · Vertical list · gap: 10px

Each card: `border: 1px solid #E0E0E0` · border-radius: 8px · padding: `14px`

Card anatomy:
| Row | Content | Style |
|---|---|---|
| Top row | Ingredient name + INCI number badge | Name: Outfit SemiBold 14px `#000000` · Badge: Outfit Medium 10px `#FFFFFF` bg `#000000` 18px circle |
| Sub-row | Est. concentration range | Outfit Regular 11px `#757575` |
| Efficacy badge | `Efficacious` / `Likely Efficacious` | Filled black pill = Efficacious · Outlined = Likely · Outfit Medium 10px |
| Role text | Efficacy role + clinical evidence summary | Outfit Regular 12px `#424242` line-height 1.5 |

Source: `§02 → Supporting Ingredients table`

10 cards in INCI order:
```
1. Aqua            ~90–95%   Primary solvent
2. Glycerin        5–10%     [Efficacious] Humectant — draws moisture, supports epidermal barrier
3. Cetearyl Alc.   1–5%      [Efficacious] Fatty alcohol emollient — non-drying, non-comedogenic in rinse-off
4. Panthenol       1–3%      [Efficacious] Pro-B5 — humectant, barrier repair, reduces redness
5. Niacinamide     0.5–2%    [Efficacious] Barrier repair, TEWL reduction, anti-inflammatory, antioxidant
6. Pantolactone    0.5–2%    [Likely Efficacious] B5 lactone form — humectant, fewer standalone studies
7. Xanthan Gum     0.1–0.5%  [Efficacious] Rheology modifier — texture + emulsion stability
8. Sod. Cocoyl Iso.5–15%    [Efficacious] Mildest surfactant class — gentle cleansing, coconut-derived
9. Sodium Benzoate 0.1–0.5%  [Efficacious] Preservative — safe at concentration, no endocrine disruption
10. Citric Acid    0.1–0.5%  [Efficacious] pH adjuster (5.5–6.5) + chelating agent
```

---

### 6D. Safety Flags Panel
**Position:** Below ingredient cards · Margin-top: 20px

- Section title: `SAFETY FLAGS` · Outfit Medium 10px · `#757575` · UPPERCASE
- Layout: Single card · border: 1px solid #E0E0E0 · border-radius: 8px · padding: `14px`
- Rows: 5 flags · each row: label (Outfit Regular 12px `#757575`) + result (Outfit Regular 12px `#212121`) + status icon
- Status icons: `✓` for safe, `⚠` for caution, `✗` for concern

Source: `§02 → Ingredient Conflicts & Safety`

```
✓ pH Incompatibilities     None — Niacinamide stable at pH 5–7
✓ Chemical Deactivation    None — no reactive ingredient pairings
✓ Irritation Stacking      Very Low — humectants counter mild surfactant drying
✓ Comedogenicity           Very Low — especially in rinse-off use
✓ Endocrine Disruption     None flagged (EU ECHA, FDA)
✓ Pregnancy / Nursing      Safe — all ingredients are common cosmetic excipients
```

---

## 7. TAB CONTENT — PRICES

### 7A. Best Pick Banner
**Position:** Top of Prices tab
- Highlighted card: Background `#000000` · border-radius 8px · padding `16px`
- `BEST VALUE PICK` label: Outfit Medium 10px `#BDBDBD` UPPERCASE
- Platform logo (Amazon/Nykaa/etc.) white version
- Price: Outfit Bold 28px `#FFFFFF`
- Size: Outfit Regular 12px `#BDBDBD`
- Per fl oz price: Outfit Regular 11px `#757575`
- `Shop Now →` CTA: Outfit Medium 13px `#FFFFFF` · underline on tap

---

### 7B. All Available Sizes
**Position:** Below best pick · Margin-top: 16px

- Section title: `ALL SIZES` · Outfit Medium 10px · `#757575` · UPPERCASE
- Layout: Vertical list · gap: 8px · each row: `border: 1px solid #E0E0E0` · border-radius 8px · padding `12px` · horizontal flex

Each row:
| Left | Center | Right |
|---|---|---|
| Size (Outfit Medium 13px `#000000`) | Platform badge | Price (Outfit Bold 14px `#000000`) + per-oz (Outfit Regular 11px `#757575`) |

Source: `§01 → Available Sizes`

```
2 fl oz    Amazon    ₹XXX   (~₹XX/fl oz)
4 fl oz    Amazon    ₹XXX
8 fl oz    Amazon    ₹1,299  ← Best Value
16 fl oz   Amazon    ₹XXX
20 fl oz   Amazon    ₹XXX
1 L        Amazon    ₹XXX
```

---

## 8. TAB CONTENT — EXPERTS

### 8A. Dermatologist Opinion Cards
**Position:** Top of Experts tab · Vertical list · gap: 12px

- Section title: `DERMATOLOGIST OPINIONS` · Outfit Medium 10px · `#757575` · UPPERCASE

Each card: border 1px solid `#E0E0E0` · border-radius 8px · padding `14px`

Card anatomy:
| Element | Style |
|---|---|
| Expert name | Outfit SemiBold 13px `#000000` |
| Credentials | Outfit Regular 11px `#757575` |
| Platform badge | YouTube / NBC etc. · 11px text in outlined pill |
| Verdict badge | `Positive` = black filled · `Mixed` = outlined · Outfit Medium 10px |
| Key point | Outfit Regular 12px `#424242` · line-height 1.5 · italic |

Source: `§04 → Expert Opinions Summary`

7 cards:
```
Dr. Dray (MD, FAAD) · YouTube · [Positive]
"Highly recommends new formulation for dry/sensitive/irritated skin; double-cleanse needed for waterproof SPF."

Dr. Somji (Dermatologist) · YouTube · [Positive]
"Big favourite. Defends against 5 signs of sensitivity. Highlights Niacinamide for barrier repair."

Dr. Muneeza Muhammad · YouTube Shorts · [Positive]
"Loves it for normal to dry sensitive skin. Recommends as AM and PM cleanser."

Dr. Jenny Liu (Dermatologist) · YouTube · [Positive]
"Multi-purpose — good for dry, cracked hands with frequent washing."

Dr. Sapna Palep (MD, FAAD) · The Zoe Report · [Positive]
"Recommends for acne, rosacea, eczema. Best as a reset for flare-ups vs. chronic eczema solution."

Dr. Jennifer MacGregor (MD) · NBC News · [Positive]
"Dissolves dirt/oil/most makeup without stripping. Fatty alcohols coat and protect skin cells."

James Welsh (Reviewer) · YouTube · [Mixed]
"Initially positive; later found it over-cleansing for dehydrated skin after extended use."
```

---

### 8B. Clinical Studies
**Position:** Below derm cards · Margin-top: 24px

- Section title: `CLINICAL EVIDENCE` · Outfit Medium 10px · `#757575` · UPPERCASE
- Layout: Vertical list · gap: 12px

Each study card: Background `#F5F5F5` · border-radius 8px · padding `14px`

| Element | Style |
|---|---|
| Study name | Outfit SemiBold 12px `#000000` |
| Source + Year | Outfit Regular 11px `#757575` |
| Key finding | Outfit Regular 12px `#424242` · line-height 1.5 |
| Funding note | `Brand-funded` or `Independent` · Outfit Regular 10px `#BDBDBD` · italic |

Source: `§04 → Published Clinical Studies`

```
Rosacea Skin Barrier Study · Draelos, 2006 · Cutis
→ No increase in TEWL vs. Dove bar. Significant rosacea severity reduction.
[Independent — published journal]

48-Hour Hydration Study · 2025 · J. Clinical and Aesthetic Dermatology
→ 28% less water loss with Cetaphil users. Glycerin maintains hydration through micellar cleanse.
[Brand-associated]

Galderma Clinical Programme · 550+ studies · 32,000+ patients
→ Supports 5 signs of sensitivity claims. Confirms Niacinamide–Panthenol–Glycerin efficacy.
[Brand-funded]

Adjuvant Psoriasis Regimen Study · NCT06357221 · Expected July 2025
→ Ongoing 8-week study examining Gentle Skin Cleanser + Moisturising Cream as adjunct to Rx therapy.
[Brand-funded · In progress]
```

---

## 9. TAB CONTENT — ALTERNATIVES

### 9A. Alternatives Header
**Position:** Top of Alternatives tab
- Context text: Outfit Regular 13px `#424242` · line-height 1.5
- `"Cetaphil is excellent for its target demographic. Consider these only if you need better makeup removal or prefer a foaming cleanse."`

---

### 9B. Alternative Product Cards
**Position:** Below header · Vertical list · gap: 16px · Margin-top: 16px

Each card: border 1px solid `#E0E0E0` · border-radius 8px · padding `16px`

Card anatomy:
| Element | Style |
|---|---|
| Use-case label | `For More Effective Makeup Removal` · Outfit Medium 10px `#757575` UPPERCASE |
| Product name | Outfit SemiBold 14px `#000000` |
| Brand | Outfit Regular 11px `#757575` |
| Price + size | Outfit Medium 13px `#000000` + per-oz vs. Cetaphil |
| Why Better | Outfit Regular 12px `#424242` · line-height 1.5 · `+` prefixed bullet points |
| Best For | Outfit Regular 11px `#757575` |
| Trade-offs | `—` prefixed · Outfit Regular 11px `#757575` · italic |
| `Compare →` | Outfit Medium 12px `#000000` · underline · right-aligned |

Source: `§06 → Better Alternatives`

3 alternative cards:

```
[ALT 1] FOR MORE EFFECTIVE MAKEUP REMOVAL
La Roche-Posay Toleriane Hydrating Gentle Facial Cleanser
~₹XXX / 13.52 fl oz (cheaper per fl oz than Cetaphil)
+ Also derm-recommended for dry and sensitive skin
+ Ceramide-3 for enhanced barrier repair vs. Cetaphil
+ Slightly more effective on light-to-moderate makeup
Best For: Normal to dry sensitive skin; light-to-moderate makeup wearers
— Similar non-foaming texture. Higher bottle price.

[ALT 2] FOR A GENTLE FOAMING CLEANSE
CeraVe Hydrating Cream-to-Foam Cleanser
~₹XXX / 16 fl oz (significantly cheaper per fl oz)
+ Cream-to-foam — solves Cetaphil's top complaint (no lather)
+ Three essential ceramides + hyaluronic acid + amino acids
+ Addresses barrier repair while delivering foam experience
Best For: Normal to dry skin who want foam without stripping
— Slightly less rich for extremely dry skin than Cetaphil

[ALT 3] CLINICALLY SUPERIOR MINIMALIST FORMULA
Vanicream Gentle Facial Cleanser
~₹XXX / 8 fl oz (slightly cheaper)
+ Further "free-from" list than Cetaphil (dyes, fragrance, parabens, sulfates)
+ Ideal for extensive allergies, contact dermatitis, or severe eczema
+ Dermatologist-recommended simplicity
Best For: Extremely sensitive, allergy-prone, or reactive skin
— No Niacinamide or Panthenol — fewer active skincare benefits
```

---

## 10. GLOBAL RULES

### Scroll Behavior
- Header (48px): fixed · always visible
- Nav tab bar (44px): sticky at `top: 48px`
- Score banner: static · scrolls away
- Tab content: free scroll

### Data States
| State | Behavior |
|---|---|
| Loading | Skeleton shimmer on all cards — `#F5F5F5` animated background |
| No data for a field | Field hidden entirely — never show empty labels |
| Score = null | Replace score display with `—` |
| No alternatives | Hide Alternatives tab entirely |

### Expandable Sections
- "Why JAY Recommends" — shows 3 items, `+ Show more` in Outfit Regular 12px `#757575`
- "Things to Know" positives — shows 3 items, expandable
- Clinical Studies — shows first 2, `+ 2 more studies` expandable

### Typography Scale
| Use | Font | Size | Weight | Color |
|---|---|---|---|---|
| Section titles | Outfit | 10px | Medium | #757575 UPPERCASE |
| Body text | Outfit | 12–13px | Regular | #212121 |
| Sub-text / meta | Outfit | 11px | Regular | #757575 |
| Score values | Outfit | 22–32px | Bold | #000000 |
| Product name | Outfit | 20px | SemiBold | #000000 |
| Price | Outfit | 18px | Bold | #000000 |
| Brand name | Outfit | 12px | SemiBold | #757575 UPPERCASE |
| Tags / chips | Outfit | 11px | Regular | #424242 |
| CTA text | Outfit | 12–13px | Medium | #000000 |

### Spacing Reference
| Token | Value |
|---|---|
| Section gap (major) | 24px |
| Section gap (minor) | 16px |
| Card internal padding | 14–16px |
| Chip padding | 4px 8px |
| Screen horizontal padding | 16px |
| Bottom safe area | 32px |

---

*Document generated from JAY Research pipeline — Cetaphil Gentle Skin Cleanser report.*
*All section references (§01–§08) map directly to the 8-stage research report structure.*
