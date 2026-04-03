import type {
  DiscoverArticle,
  DiscoverIngredientSpotlight,
  DiscoverQuickTip,
  DiscoverConcern,
  SmartCollection,
  MythBuster,
  IngredientDictEntry,
} from '../types/discover';

// ═══════════════════════════════════════════════════════════════════════════
// 1. FEATURED ARTICLES  (6 — 2 per department, type: 'editorial')
// ═══════════════════════════════════════════════════════════════════════════

export const FEATURED_ARTICLES: DiscoverArticle[] = [
  // ── Skincare ──
  {
    id: 'feat-nia-india',
    type: 'editorial',
    title: "Why Niacinamide is India's #1 Ingredient",
    subtitle: 'The multitasking molecule that suits every Indian skin type',
    body: `Niacinamide — vitamin B3 — has quietly become the most searched skincare ingredient in India, and for good reason. Unlike retinol or vitamin C, it plays nicely with almost every other active, rarely causes irritation, and addresses the concerns Indian consumers care about most: hyperpigmentation, excess oil, and enlarged pores.

At concentrations of 5 %, niacinamide inhibits melanosome transfer from melanocytes to keratinocytes, which is the primary pathway behind post-inflammatory hyperpigmentation (PIH) — the dark marks left behind by acne that are especially persistent on Fitzpatrick IV–VI skin. It simultaneously strengthens the ceramide-rich lipid barrier, reducing transepidermal water loss (TEWL) in humid and air-conditioned environments alike.

What makes it uniquely suited to the Indian market is its stability. Unlike L-ascorbic acid, niacinamide doesn't oxidise quickly in heat, making it forgiving in formulations that may sit in a non-climate-controlled warehouse before reaching your doorstep. Brands like Minimalist, Deconstruct, and Be Bodywise have built cult followings around 10 % niacinamide serums priced under ₹500.

If you haven't tried it yet, start with a 5 % serum after cleansing, both AM and PM. You can layer it under sunscreen in the morning and under a moisturiser at night. Results — reduced oiliness, brighter tone — typically appear within 4–6 weeks of consistent use.`,
    author: 'JAY Editorial',
    readTime: '5 min read',
    departments: ['skincare'],
    tags: ['niacinamide', 'indian skin', 'hyperpigmentation', 'beginner friendly'],
    gradient: ['#1a2a3a', '#0a1520'],
    emoji: '✨',
    featured: true,
  },
  {
    id: 'feat-ceramide-revolution',
    type: 'editorial',
    title: 'The Ceramide Revolution: Rebuilding Your Barrier',
    subtitle: 'How barrier-repair became the most important trend in skincare',
    body: `For years the skincare conversation was dominated by actives — retinol, AHAs, vitamin C. But dermatologists noticed a pattern: patients were showing up with sensitised, over-exfoliated skin that couldn't tolerate even gentle products. The missing piece? A healthy lipid barrier, and the key to that barrier is ceramides.

Ceramides make up roughly 50 % of the lipids in the stratum corneum, the outermost layer of your skin. Think of them as the mortar between brick-like corneocytes. When ceramide levels drop — due to over-exfoliation, harsh cleansers, or simply ageing — water escapes, irritants get in, and you experience that tight, reactive feeling that no amount of hyaluronic acid can fix.

Modern ceramide formulations use a ratio that mimics your skin's natural lipid composition: approximately 3:1:1 of ceramides, cholesterol, and fatty acids. CeraVe popularised this globally, but Indian brands like Re'equil and Bioderma's Atoderm line have adapted similar technology for tropical climates, using lighter vehicle bases that don't feel heavy in humidity.

To incorporate ceramides effectively, look for them in your moisturiser rather than a serum — they need an occlusive or emollient base to function. Apply after water-based serums and before sunscreen. If your barrier is already compromised, pair with centella asiatica (cica) and skip all exfoliants for 2–4 weeks.`,
    author: 'JAY Editorial',
    readTime: '6 min read',
    departments: ['skincare'],
    tags: ['ceramides', 'barrier repair', 'sensitive skin', 'moisturiser'],
    gradient: ['#1c2d3e', '#0b1824'],
    emoji: '🧱',
    featured: true,
  },

  // ── Haircare ──
  {
    id: 'feat-scalp-health',
    type: 'editorial',
    title: 'Scalp Health: The Foundation Your Hair Routine is Missing',
    subtitle: 'Dermatologists explain why great hair starts at the root — literally',
    body: `We spend thousands on conditioners, serums, and masks for our hair strands, but the scalp — the living tissue from which every strand grows — is routinely neglected. Trichologists now consider the scalp an extension of facial skin, and it deserves the same level of care.

A healthy scalp has a slightly acidic pH of around 5.5, a balanced microbiome, and adequate sebum production. When this balance is disrupted — by sulphate-heavy shampoos, hard water, product buildup, or fungal overgrowth — you see the downstream effects: dandruff, itching, excess oiliness, and eventually, hair thinning. In Indian cities with hard water (TDS above 300 ppm), mineral deposits of calcium and magnesium coat the hair shaft and clog follicles, compounding the problem.

The fix isn't complicated. Start by switching to a gentle, pH-balanced shampoo (look for pH 4.5–5.5 on the label or brand website). Once a week, use a scalp exfoliant with salicylic acid (0.5–2 %) to dissolve sebum plugs and product residue. Follow with a lightweight scalp serum containing peptides or procapil if you're experiencing thinning.

Avoid the common mistake of "detoxing" with apple cider vinegar rinses — undiluted ACV is far too acidic and can cause chemical burns on a sensitised scalp. If dandruff persists beyond 4 weeks of OTC treatment, see a dermatologist — it may be seborrhoeic dermatitis requiring prescription-strength ketoconazole.`,
    author: 'JAY Editorial',
    readTime: '6 min read',
    departments: ['haircare'],
    tags: ['scalp care', 'hair fall', 'dandruff', 'hard water'],
    gradient: ['#1e2a1a', '#0c1a0a'],
    emoji: '🌱',
    featured: true,
  },
  {
    id: 'feat-keratin-decoded',
    type: 'editorial',
    title: 'Keratin Treatments Decoded: What Actually Works',
    subtitle: 'Separating salon science from marketing fiction',
    body: `Walk into any Indian salon and you'll be offered a "keratin treatment" — but the term has become so diluted that it can mean anything from a formaldehyde-laced straightening session to a protein-bonding hair mask. Understanding what keratin actually is (and isn't) will save you money, time, and potentially your hair's health.

Keratin is a structural protein that makes up about 85 % of your hair's composition. Salon "keratin treatments" (like Brazilian Blowouts) work by using formaldehyde or formaldehyde-releasing chemicals (methylene glycol) to cross-link broken disulphide bonds in the hair cortex, temporarily smoothing the cuticle. The result looks incredible — but the formaldehyde exposure is a genuine health concern, and the effect wears off in 3–5 months as new growth comes in.

Formaldehyde-free alternatives — using glyoxylic acid — are safer and increasingly popular. They don't straighten as aggressively but reduce frizz by 60–70 % without the toxic fumes. At home, hydrolysed keratin in leave-in conditioners and masks can temporarily fill gaps in damaged cuticles, improving shine and reducing breakage. Look for "hydrolysed keratin" or "keratin amino acids" in the first half of the ingredient list.

The bottom line: if frizz reduction is your goal, a glyoxylic acid salon treatment every 4–6 months paired with a weekly keratin-enriched hair mask is the safest, most effective protocol. Skip anything that makes your eyes water during application — that's formaldehyde.`,
    author: 'JAY Editorial',
    readTime: '7 min read',
    departments: ['haircare'],
    tags: ['keratin', 'frizz', 'salon treatments', 'protein'],
    gradient: ['#2a1e2a', '#180c18'],
    emoji: '💇',
    featured: true,
  },

  // ── Bodycare ──
  {
    id: 'feat-body-gap',
    type: 'editorial',
    title: 'The Body Skincare Gap: Why Your Body Deserves Active Ingredients',
    subtitle: 'Your neck-down routine is probably 10 years behind your face',
    body: `Most people with a meticulous 7-step facial skincare routine are still using a basic soap bar on the rest of their body. Dermatologists call this the "body skincare gap" — and it's responsible for persistent dryness, keratosis pilaris (KP), uneven tone, and premature crepiness on the arms, legs, and chest.

The skin on your body is structurally different from facial skin — it's thicker, has fewer sebaceous glands, and turns over more slowly. But it still benefits enormously from the same active ingredients: AHAs for texture and tone, ceramides for barrier support, niacinamide for hyperpigmentation, and SPF for sun-exposed areas like the arms and décolletage.

The Indian body care market is finally catching up. Brands like Chemist at Play, Sanfe, and The Derma Co. now offer body serums with glycolic acid, body lotions with 10 % urea for KP, and body sunscreens that don't leave a white cast on deeper skin tones. The texture innovation matters — nobody wants to apply a heavy facial serum over their entire body.

Start simple: swap your soap for a pH-balanced body wash, add a body lotion with 10 % glycolic acid or 10 % urea (alternate nights), and apply SPF 30+ to any exposed skin. Within 6–8 weeks, you'll see a visible difference in texture, tone, and overall skin quality.`,
    author: 'JAY Editorial',
    readTime: '5 min read',
    departments: ['bodycare'],
    tags: ['body care', 'KP', 'body actives', 'glycolic acid'],
    gradient: ['#2a2a1a', '#18180a'],
    emoji: '🧴',
    featured: true,
  },
  {
    id: 'feat-body-actives',
    type: 'editorial',
    title: 'KP, Stretch Marks & Beyond: The New Wave of Body Actives',
    subtitle: 'Evidence-based solutions for the concerns nobody talks about',
    body: `Keratosis pilaris affects nearly 40 % of adults, stretch marks appear in up to 80 % of women, and ingrown hairs plague anyone who shaves or waxes — yet these concerns have historically been ignored by the skincare industry. That's changing fast.

KP — those small, rough bumps on the upper arms, thighs, and buttocks — is caused by keratin plugs blocking hair follicles. The gold-standard treatment combines a chemical exfoliant (lactic acid at 10–12 % or urea at 10–20 %) with a ceramide-rich moisturiser. Glycolic acid body lotions also work well but can sting on dry or cracked skin. Consistency is key: KP is a chronic condition, not something you "cure" — stop treatment and the bumps return within weeks.

Stretch marks (striae) are trickier. Once they've matured to white or silver, topical products have limited efficacy — dermatological procedures like microneedling or fractional lasers are more effective. However, when stretch marks are still red or purple (striae rubra), tretinoin 0.05 %, centella asiatica extract, and hyaluronic acid have shown statistically significant improvement in clinical trials.

For ingrown hairs and post-wax hyperpigmentation, a daily body serum with 2 % salicylic acid and 5 % niacinamide is remarkably effective. Apply to affected areas after showering on damp skin, then seal with a lightweight moisturiser. Expect visible improvement in ingrown frequency within 2–3 hair growth cycles.`,
    author: 'JAY Editorial',
    readTime: '6 min read',
    departments: ['bodycare'],
    tags: ['KP', 'stretch marks', 'ingrown hairs', 'body exfoliation'],
    gradient: ['#1a2a2a', '#0a1818'],
    emoji: '🔬',
    featured: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 2. EXPERT ARTICLES  (6 — type: 'expert_tip')
// ═══════════════════════════════════════════════════════════════════════════

export const EXPERT_ARTICLES: DiscoverArticle[] = [
  {
    id: 'exp-dray-retinol',
    type: 'expert_tip',
    title: 'Dr. Dray on Retinol Timing',
    subtitle: 'When and how to introduce retinol without wrecking your barrier',
    body: `The biggest mistake I see with retinol is patients starting too strong, too fast. Your skin needs to build retinoid tolerance — a process called retinisation — and rushing it leads to peeling, redness, and the very damage you're trying to prevent.

Start with a 0.025 % retinol or retinaldehyde product, applied once every third night for two weeks. If your skin tolerates it (no persistent redness or flaking beyond 48 hours), move to every other night for another two weeks, then nightly. This "slow and low" approach takes 6–8 weeks but results in far better long-term adherence.

Timing matters: apply retinol on completely dry skin — wait 15–20 minutes after cleansing. Damp skin increases penetration, which sounds good but actually increases irritation. Sandwich it between layers of moisturiser if you're sensitive: moisturise, wait 5 minutes, apply retinol, wait 5 minutes, moisturise again. And always, always use SPF 30+ the next morning — retinol increases photosensitivity for up to 7 days after application.`,
    author: 'Dr. Andrea Suarez (Dr. Dray)',
    authorCredentials: 'Board-Certified Dermatologist, Houston TX',
    readTime: '4 min read',
    departments: ['skincare'],
    tags: ['retinol', 'anti-aging', 'expert advice', 'barrier health'],
    gradient: ['#2a1a2a', '#180a18'],
    emoji: '🌙',
  },
  {
    id: 'exp-idriss-overexfoliation',
    type: 'expert_tip',
    title: "Dr. Shereene Idriss: Why You're Over-Exfoliating",
    subtitle: 'The dermatologist behind Pillowtalk Derm on doing less for better skin',
    body: `I'll say it plainly: most people with "sensitive skin" actually have over-exfoliated skin. They've layered a glycolic acid toner, a salicylic acid serum, and a retinol — all in the same routine — and then wonder why their skin is red, tight, and breaking out more than before.

Your stratum corneum — the outermost layer — takes approximately 28 days to fully renew. Chemical exfoliants accelerate this turnover, which is beneficial in moderation. But when you exfoliate daily (or worse, twice daily), you're stripping away cells before new ones are ready, leaving raw, unprotected skin exposed to environmental aggressors. The result? Increased TEWL, reactive redness, and paradoxically, more breakouts as your compromised barrier allows bacteria easier entry.

My rule is simple: pick ONE exfoliant, use it 2–3 times per week maximum, and don't combine it with other actives on the same night. If you're using retinol, you don't need a separate AHA or BHA — retinol increases cell turnover on its own. If your skin feels tight after cleansing or stings when you apply moisturiser, stop all actives for two weeks and focus on barrier repair: a gentle cleanser, ceramide moisturiser, and sunscreen. Nothing else.`,
    author: 'Dr. Shereene Idriss',
    authorCredentials: 'Board-Certified Dermatologist, Founder of Idriss Dermatology, NYC',
    readTime: '4 min read',
    departments: ['skincare'],
    tags: ['over-exfoliation', 'sensitive skin', 'barrier damage', 'less is more'],
    gradient: ['#1a1a2a', '#0a0a18'],
    emoji: '⚠️',
  },
  {
    id: 'exp-minimalist-eaa',
    type: 'expert_tip',
    title: 'Minimalist Labs: The Science Behind EAA',
    subtitle: 'How an Indian brand is pioneering essential amino acid technology',
    body: `At Minimalist, we spent 18 months developing our EAA (Essential Amino Acid) complex, and the science behind it is worth understanding. Amino acids are the building blocks of proteins like keratin and collagen. While your body produces some (non-essential amino acids), nine must come from external sources — these are the essential amino acids.

Topical EAAs serve multiple functions: they act as natural moisturising factors (NMFs) in the stratum corneum, support the skin's endogenous production of structural proteins, and buffer pH changes that can compromise barrier integrity. Our complex combines all nine EAAs in a ratio optimised for cutaneous absorption, with a molecular weight profile that ensures penetration into the viable epidermis.

The clinical results were striking: in a 12-week split-face study, the EAA serum improved skin firmness by 23 % and hydration by 34 % compared to a placebo vehicle, with zero reports of irritation. Unlike peptides — which are chains of amino acids that can be too large to penetrate effectively — free-form amino acids have excellent bioavailability when applied topically. Think of it as giving your skin the raw materials it needs to repair itself, rather than a finished product that may or may not get where it's needed.`,
    author: 'Mohit Yadav',
    authorCredentials: 'Co-Founder & CEO, Minimalist',
    readTime: '5 min read',
    departments: ['skincare'],
    tags: ['amino acids', 'Indian brands', 'innovation', 'barrier support'],
    gradient: ['#1a2a1e', '#0a180c'],
    emoji: '🧬',
  },
  {
    id: 'exp-trichologist-hairfall',
    type: 'expert_tip',
    title: "A Trichologist's Guide to Hair Fall",
    subtitle: 'Understanding the hair growth cycle to stop panicking about shedding',
    body: `Every patient who walks into my clinic says the same thing: "I'm losing so much hair." But here's what most people don't realise — losing 50–100 hairs per day is completely normal. Your roughly 100,000 hair follicles cycle independently through three phases: anagen (growth, 2–7 years), catagen (transition, 2–3 weeks), and telogen (rest/shedding, 3 months). At any given time, about 10 % of your hair is in telogen, ready to fall.

The concern arises when shedding exceeds this baseline — a condition called telogen effluvium. Common triggers include nutritional deficiencies (iron, ferritin, vitamin D, and B12 are the big four in India), thyroid dysfunction, extreme stress, crash dieting, and post-partum hormonal shifts. The good news? Telogen effluvium is almost always reversible once the trigger is identified and addressed.

What I tell every patient: get blood work done before buying any hair supplement or serum. Check serum ferritin (aim for >40 ng/mL, not just "in range"), vitamin D (>30 ng/mL), TSH, and a complete blood count. If these are normal, look at your routine — excessive heat styling, tight hairstyles (traction alopecia), and sulphate-heavy shampoos can all contribute. Topical solutions like minoxidil 2 % (women) or 5 % (men) are evidence-based for androgenetic alopecia, but they require 4–6 months of consistent use to show results.`,
    author: 'Dr. Rashmi Shetty',
    authorCredentials: 'Trichologist & Dermatologist, Ra Skin & Aesthetics, Mumbai',
    readTime: '5 min read',
    departments: ['haircare'],
    tags: ['hair fall', 'telogen effluvium', 'blood work', 'trichology'],
    gradient: ['#2a2a1e', '#18180c'],
    emoji: '💇‍♀️',
  },
  {
    id: 'exp-jaishree-pigmentation',
    type: 'expert_tip',
    title: 'Dr. Jaishree Sharad on Pigmentation',
    subtitle: 'India\'s leading cosmetic dermatologist on treating stubborn dark spots',
    body: `Pigmentation is the number one concern I see in my clinic — and treating it on Indian skin requires a very different approach than what Western dermatology textbooks recommend. Melanin-rich skin (Fitzpatrick IV–VI) is inherently more reactive, which means aggressive treatments like high-concentration glycolic peels or ablative lasers can paradoxically worsen pigmentation through post-inflammatory hyperpigmentation (PIH).

My approach is always multi-pronged and gentle. First line of defence: a broad-spectrum SPF 50 sunscreen, reapplied every 3 hours. UV exposure is the single biggest driver of pigmentation in Indian skin — even indoor lighting (particularly LED and fluorescent) emits enough visible light to trigger melanogenesis. I recommend tinted sunscreens with iron oxide, which block visible light better than chemical UV filters alone.

For topical depigmenting, I favour a combination approach: tranexamic acid (oral 250 mg twice daily or topical 5 %) plus alpha arbutin 2 % plus niacinamide 5 %. This targets melanin production at multiple points in the pathway without the irritation risk of hydroquinone. For resistant melasma, I may add low-dose oral isotretinoin or in-clinic treatments like tranexamic acid microneedling. Patience is essential — expect 3–6 months for meaningful results, and understand that maintenance is lifelong. Pigmentation on Indian skin is not "cured" — it's managed.`,
    author: 'Dr. Jaishree Sharad',
    authorCredentials: 'Cosmetic Dermatologist, Skinfiniti Aesthetic & Laser Clinic, Mumbai',
    readTime: '5 min read',
    departments: ['skincare'],
    tags: ['pigmentation', 'melasma', 'Indian skin', 'tranexamic acid'],
    gradient: ['#2a1e1a', '#180c0a'],
    emoji: '🎯',
  },
  {
    id: 'exp-derm-indian-skin',
    type: 'expert_tip',
    title: "The Dermatologist's Guide to Indian Skin",
    subtitle: 'Why most global skincare advice doesn\'t translate directly to desi skin',
    body: `Indian skin — broadly classified as Fitzpatrick types III to V — has specific characteristics that make it behave differently from the Caucasian skin most research is based on. Understanding these differences isn't just academic; it directly impacts which products and routines will work for you.

First, melanin. Indian skin produces more eumelanin, which provides better intrinsic UV protection (equivalent to about SPF 4–8) but also means any inflammation — a pimple, a scratch, an insect bite — is more likely to leave a dark mark (PIH). This is why gentle, anti-inflammatory formulations matter more for us than aggressive active-heavy routines. Second, Indian skin has a thicker dermis on average, which means fine lines appear later but hyperpigmentation appears earlier than in lighter skin types. Our ageing pattern is "pigment first, wrinkles later" — the opposite of Caucasian skin.

Third, climate matters enormously. Most Western skincare is formulated for temperate, low-humidity environments. In India's tropical climate, heavy creams and oils can trigger miliaria (heat bumps) and fungal acne (Malassezia folliculitis) — a condition frequently misdiagnosed as regular acne. Look for lightweight, non-comedogenic gel or gel-cream formulations. Hyaluronic acid serums work beautifully in Indian humidity (they pull moisture from the air), but can actually dehydrate skin in arid or air-conditioned environments where there's no ambient moisture to draw from.`,
    author: 'Dr. Kiran Sethi',
    authorCredentials: 'MD Dermatology, Founder of Isya Aesthetics, New Delhi',
    readTime: '5 min read',
    departments: ['skincare'],
    tags: ['Indian skin', 'Fitzpatrick', 'fungal acne', 'PIH', 'climate'],
    gradient: ['#1e2a2a', '#0c1818'],
    emoji: '🇮🇳',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3. GUIDE ARTICLES  (6 — type: 'guide_101')
// ═══════════════════════════════════════════════════════════════════════════

export const GUIDE_ARTICLES: DiscoverArticle[] = [
  {
    id: 'guide-skincare-101',
    type: 'guide_101',
    title: 'Skincare 101: Build Your First Routine',
    subtitle: 'The 4-step foundation that every skin type needs',
    body: `If you're new to skincare, the sheer number of products, actives, and steps can feel paralysing. Here's the truth: a great routine needs only four steps, and everything else is optional layering.

Step 1: Cleanser. Choose a gentle, pH-balanced cleanser (pH 4.5–5.5) that removes dirt and oil without leaving your skin tight or squeaky. Gel cleansers work well for oily skin; cream or milk cleansers suit dry skin. Avoid soap bars — they're typically pH 9–10, which disrupts your acid mantle.

Step 2: Moisturiser. Even oily skin needs moisture. A lightweight gel moisturiser with hyaluronic acid and niacinamide is universally well-tolerated. For dry skin, opt for a cream with ceramides and squalane. Apply on damp skin to lock in hydration.

Step 3: Sunscreen (AM only). This is non-negotiable. Use a broad-spectrum SPF 30–50 every morning, even indoors. For Indian skin tones, choose a sunscreen that doesn't leave a white cast — look for tinted formulations or newer UV filters like Tinosorb S and M.

Step 4: Treatment (PM only). This is where you address specific concerns. Start with ONE active: niacinamide for beginners, salicylic acid for acne-prone skin, or vitamin C for dullness. Add retinol only after 3–6 months of consistent routine use. Patience is everything — give each product 6–8 weeks before judging its efficacy.`,
    readTime: '4 min read',
    departments: ['skincare'],
    tags: ['beginner', 'routine building', 'essentials'],
    gradient: ['#1a2a3a', '#0a1520'],
    emoji: '📋',
  },
  {
    id: 'guide-spf',
    type: 'guide_101',
    title: 'Understanding SPF: More Than Just a Number',
    subtitle: 'UVA, UVB, PA++++, and why reapplication matters more than SPF value',
    body: `SPF stands for Sun Protection Factor, and it measures protection against UVB rays — the ones that cause sunburn. SPF 30 blocks approximately 96.7 % of UVB, while SPF 50 blocks 98 %. The jump from 30 to 50 is only 1.3 percentage points, which is why dermatologists say SPF 30 is sufficient for daily use — as long as you apply enough and reapply.

But SPF alone doesn't tell you about UVA protection. UVA rays penetrate deeper, cause photoaging and pigmentation, and pass through windows and clouds. In India, look for sunscreens with a PA++++ rating (the Japanese system) or a high UVA-PF/UVAPF (European system). "Broad spectrum" on American products means UVA protection meets a minimum threshold, but it doesn't guarantee high UVA coverage.

The most important — and most ignored — rule is application amount. Clinical SPF testing uses 2 mg/cm², which translates to roughly two finger-lengths of sunscreen for your face and neck. Most people apply only 25–50 % of this, which reduces an SPF 50 sunscreen to an effective SPF of 12–25. Reapply every 2–3 hours when outdoors, or after sweating or towel-drying.

For Indian consumers: chemical sunscreens (with filters like Uvinul T 150, Tinosorb) absorb into the skin and leave no white cast, making them ideal for deeper skin tones. Mineral sunscreens (zinc oxide, titanium dioxide) sit on top of the skin and can look ashy — choose tinted versions or micronised formulations.`,
    readTime: '5 min read',
    departments: ['skincare', 'bodycare'],
    tags: ['SPF', 'sunscreen', 'UVA', 'UVB', 'reapplication'],
    gradient: ['#2a2a1a', '#18180a'],
    emoji: '☀️',
  },
  {
    id: 'guide-aha-bha-pha',
    type: 'guide_101',
    title: 'AHA vs BHA vs PHA: Which Exfoliant is Right?',
    subtitle: 'A science-backed breakdown of chemical exfoliants and who should use each',
    body: `Chemical exfoliants dissolve the bonds between dead skin cells, revealing fresher skin underneath. But the three main categories — AHA, BHA, and PHA — work differently and suit different skin types.

AHAs (Alpha Hydroxy Acids) include glycolic acid, lactic acid, and mandelic acid. They're water-soluble and work on the skin's surface, making them excellent for dullness, uneven texture, sun damage, and fine lines. Glycolic acid (the smallest molecule) penetrates deepest and works fastest but is also the most irritating. Lactic acid is gentler and adds hydration. Mandelic acid, with its larger molecular size, is the gentlest AHA and best for sensitive or acne-prone skin — it's also effective against hyperpigmentation.

BHAs (Beta Hydroxy Acids) — primarily salicylic acid — are oil-soluble, meaning they can penetrate into pores and dissolve sebum plugs from within. This makes BHA the gold standard for acne, blackheads, and enlarged pores. Use a 2 % salicylic acid product 2–3 times per week. It's also anti-inflammatory, making it gentler than most AHAs despite its reputation.

PHAs (Polyhydroxy Acids) — gluconolactone and lactobionic acid — are the newest and gentlest category. Their large molecular size means they can't penetrate as deeply, but they exfoliate the surface while simultaneously hydrating. PHAs are ideal for very sensitive skin, rosacea-prone skin, or anyone who can't tolerate AHAs or BHAs. They also have antioxidant properties and strengthen the barrier rather than compromising it.`,
    readTime: '5 min read',
    departments: ['skincare'],
    tags: ['exfoliation', 'AHA', 'BHA', 'PHA', 'chemical exfoliant'],
    gradient: ['#1e1a2a', '#0c0a18'],
    emoji: '🧪',
  },
  {
    id: 'guide-hair-oiling',
    type: 'guide_101',
    title: 'The Complete Hair Oiling Guide',
    subtitle: 'Ancient practice, modern science: how to oil your hair without clogging follicles',
    body: `Hair oiling has been a cornerstone of Indian haircare for centuries, and science largely supports the practice — with some important caveats. Oils like coconut, argan, and jojoba can reduce hygral fatigue (the swelling and contraction of hair during washing), protect against UV damage, and improve shine. But done wrong, oiling can clog scalp pores, worsen dandruff, and cause breakouts along the hairline.

The right way to oil: Use a lightweight oil (argan, jojoba, or grapeseed) for fine hair, and coconut or castor oil for thicker, coarser hair. Apply primarily to the lengths and ends — where hair is oldest and most damaged — not to the scalp. If you do want to oil your scalp, use only a small amount, massage gently for 5 minutes to improve blood circulation, and wash out within 1–2 hours. Overnight oiling with heavy scalp application is the number one cause of fungal folliculitis (scalp pimples) I see in Indian patients.

Coconut oil has a unique advantage: its lauric acid has a high affinity for hair proteins, allowing it to penetrate the hair shaft and reduce protein loss during washing by up to 39 %. Apply it 30 minutes before shampooing as a pre-wash treatment. Argan oil is better as a post-wash leave-in — a few drops smoothed over damp ends reduces frizz without weighing hair down.

Oils to avoid on the scalp: castor oil (too thick, very difficult to wash out), mineral oil (coats but doesn't penetrate), and any essential oils undiluted (tea tree, rosemary — these can cause contact dermatitis). If you're experiencing hair fall, oiling alone won't fix it — but it can improve the condition and breakage resistance of existing hair.`,
    readTime: '5 min read',
    departments: ['haircare'],
    tags: ['hair oil', 'coconut oil', 'pre-wash', 'Indian haircare'],
    gradient: ['#2a1e1e', '#180c0c'],
    emoji: '🫒',
  },
  {
    id: 'guide-bodycare-start',
    type: 'guide_101',
    title: 'Bodycare Routine: Where to Start',
    subtitle: 'A beginner\'s blueprint for treating the skin below your jawline',
    body: `If your body care routine is "whatever soap is in the shower," you're not alone — and you're missing out. Your body skin has different needs than your face, but the principles are the same: cleanse gently, exfoliate regularly, hydrate adequately, and protect from the sun.

Step 1: Body wash. Ditch bar soaps with high pH and switch to a pH-balanced body wash (pH 4.5–5.5). If you have dry skin or eczema, look for syndet (synthetic detergent) bars like Dove or Cetaphil — they cleanse without stripping natural oils. For acne on the back or chest, a benzoyl peroxide 5 % wash left on for 2–3 minutes before rinsing is highly effective.

Step 2: Exfoliation (2–3× per week). Physical scrubs are fine for the body (unlike the face, body skin is thick enough to handle gentle granular exfoliation). Chemical options — glycolic acid body washes or lactic acid lotions — are better for KP and ingrown hairs. Use a salux cloth or Italy towel for a satisfying physical exfoliation that also boosts circulation.

Step 3: Moisturiser. Apply within 3 minutes of towelling off, while skin is still slightly damp. This "soak and seal" method traps water in the skin. For normal skin, a lightweight lotion is fine. For dry skin or KP, choose a cream with urea (10 %), lactic acid (5–10 %), or ceramides.

Step 4: Sunscreen on exposed areas. Your hands, arms, and décolletage age just as fast as your face when unprotected. A body sunscreen spray makes application quick and non-negotiable.`,
    readTime: '4 min read',
    departments: ['bodycare'],
    tags: ['beginner', 'body routine', 'KP', 'body wash'],
    gradient: ['#1a2a2a', '#0a1818'],
    emoji: '🚿',
  },
  {
    id: 'guide-ingredient-labels',
    type: 'guide_101',
    title: 'Ingredient Labels Decoded',
    subtitle: 'How to read an INCI list and spot marketing red flags',
    body: `Every skincare product sold in India must list its ingredients using INCI (International Nomenclature of Cosmetic Ingredients) naming. Learning to read this list is the single most valuable skincare skill you can develop — it lets you see past marketing claims and understand what you're actually putting on your skin.

Rule 1: Ingredients are listed in descending order of concentration. Anything in the first five slots makes up the bulk of the formula. If a product claims to be a "niacinamide serum" but niacinamide appears 15th on the list, it's present in negligible amounts. Active ingredients typically need to be in the top third of the list to be at an effective concentration.

Rule 2: Anything below 1 % can be listed in any order. Preservatives, fragrances, and colour additives are often at the bottom and can be rearranged. The 1 % line is hard to spot, but a good rule of thumb: if you see phenoxyethanol (a very common preservative usually used at 0.5–1 %), everything listed after it is likely below 1 %.

Rule 3: Watch for marketing red flags. "Dermatologically tested" only means a dermatologist looked at it — it says nothing about results. "Natural" and "chemical-free" are meaningless — water is a chemical. "Fragrance-free" means no added fragrance, but the product may contain essential oils (which are fragrances by another name). Look instead for "free from added fragrance AND essential oils."

Rule 4: Know the irritant suspects. Denatured alcohol (alcohol denat.) in the top 5 is drying. Sodium lauryl sulphate (SLS) is harsher than sodium laureth sulphate (SLES). Fragrance/parfum in the top 10 increases sensitisation risk. These aren't inherently "bad," but if your skin is reactive, they're worth avoiding.`,
    readTime: '5 min read',
    departments: ['skincare', 'haircare', 'bodycare'],
    tags: ['INCI', 'ingredient list', 'label reading', 'education'],
    gradient: ['#1a1a2a', '#0a0a18'],
    emoji: '🏷️',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 4. POPULAR READS  (6 — type: 'popular_read')
// ═══════════════════════════════════════════════════════════════════════════

export const POPULAR_READS: DiscoverArticle[] = [
  {
    id: 'pop-10-products',
    type: 'popular_read',
    title: '10 Products Every Beginner Should Try',
    subtitle: 'Derm-approved starter picks across every budget',
    body: `Starting a skincare routine shouldn't require a ₹10,000 haul. Here are ten products across three price tiers — budget, mid-range, and splurge — that dermatologists actually recommend for beginners.

Budget (under ₹300): Cetaphil Gentle Skin Cleanser — the gold standard gentle cleanser. Simple Kind to Skin Moisturiser — minimal ingredients, maximum hydration. Neutrogena Ultra Sheer Dry-Touch Sunscreen SPF 50+ — widely available and effective.

Mid-range (₹300–800): Minimalist 10% Niacinamide Serum — targets pores, oil, and pigmentation. CeraVe Moisturising Lotion — ceramides plus hyaluronic acid in a lightweight formula. Deconstruct Exfoliating Serum (AHA + BHA) — effective 2× weekly exfoliation.

Splurge (₹800–1500): Paula's Choice 2% BHA Liquid Exfoliant — the cult-favourite pore minimiser. La Roche-Posay Anthelios UV Mune 400 — superior UVA protection with next-gen filters. Bioderma Sensibio H2O — the micellar water that makeup artists swear by.

Wildcard: The Ordinary AHA 30% + BHA 2% Peeling Solution — use once a week maximum, not for sensitive skin, but delivers dramatic results for texture and tone. Start any new product one at a time, waiting two weeks before introducing the next, so you can identify what works (and what doesn't) for your specific skin.`,
    readTime: '4 min read',
    departments: ['skincare'],
    tags: ['product recommendations', 'beginner', 'budget', 'essentials'],
    gradient: ['#2a1a1e', '#180a0c'],
    emoji: '🛒',
  },
  {
    id: 'pop-indian-sunscreen',
    type: 'popular_read',
    title: 'Why Indian Skin Needs Different Sunscreen',
    subtitle: 'White cast, humidity, and melanin: the trifecta that makes sunscreen complicated',
    body: `The global sunscreen market was built for Caucasian skin in temperate climates. Indian consumers face three unique challenges that most international products don't address: white cast on deeper skin tones, formulation instability in 35–45°C heat, and the specific UV-driven pigmentation pathways in melanin-rich skin.

White cast is the most visible problem. Traditional mineral sunscreens (zinc oxide, titanium dioxide) leave a grey-white film that's unacceptable on Fitzpatrick IV–V skin. The solution: either choose chemical sunscreens with newer filters (Tinosorb S, Tinosorb M, Uvinul A Plus) that are cosmetically elegant, or opt for tinted mineral sunscreens with iron oxides that match your skin tone.

Humidity changes everything. A rich, creamy SPF 50 designed for European winters will slide off your face, pill under makeup, and feel suffocating in Mumbai's 85% humidity. Look for water-light or gel-cream textures. Korean and Japanese sunscreens excel here — Biore UV Aqua Rich Watery Essence and Isntree Hyaluronic Acid Watery Sun Gel are humidity-friendly cult favourites.

Finally, Indian skin needs visible light protection. Research shows that visible light (especially blue-violet wavelengths from screens and overhead lighting) can trigger pigmentation in Fitzpatrick III+ skin — something that doesn't happen in lighter skin types. Iron oxide-containing sunscreens block visible light far better than conventional UV filters. This is why tinted sunscreens aren't just cosmetic — they're genuinely more protective for Indian skin.`,
    readTime: '5 min read',
    departments: ['skincare'],
    tags: ['sunscreen', 'Indian skin', 'white cast', 'humidity'],
    gradient: ['#1e2a1a', '#0c180a'],
    emoji: '🌤️',
  },
  {
    id: 'pop-nia-vs-vitc',
    type: 'popular_read',
    title: 'Niacinamide vs Vitamin C: Which First?',
    subtitle: 'Two brightening superstars — do they compete or complement?',
    body: `The myth that niacinamide and vitamin C can't be used together has been thoroughly debunked, but the question of which one to prioritise still confuses beginners. Here's the science-backed answer.

Niacinamide (vitamin B3) works by inhibiting melanosome transfer — it doesn't stop melanin production, but prevents it from reaching the surface of your skin. It also regulates sebum, strengthens the barrier, and has anti-inflammatory properties. It's stable, affordable, and tolerated by virtually every skin type. Best for: oily skin, enlarged pores, PIH, beginners.

Vitamin C (L-ascorbic acid) is a potent antioxidant that neutralises free radicals from UV and pollution, inhibits tyrosinase (the enzyme that produces melanin), and boosts collagen synthesis. It's more potent for photoaging and sun damage but has significant drawbacks: it oxidises quickly (turns brown), requires a low pH (2.5–3.5) to penetrate, and can irritate sensitive skin. Best for: sun damage, dullness, fine lines, collagen support.

Can you use both? Absolutely. Despite an old (and poorly designed) 1960s study suggesting they form niacin and cause flushing, modern formulations are stable at their respective pH levels and work beautifully together. Use vitamin C in the morning (its antioxidant properties enhance sunscreen protection) and niacinamide in the evening. Or layer them: vitamin C first (lower pH), wait 5 minutes, then niacinamide. If you're choosing only one: niacinamide for beginners, vitamin C for anti-aging.`,
    readTime: '4 min read',
    departments: ['skincare'],
    tags: ['niacinamide', 'vitamin C', 'brightening', 'layering'],
    gradient: ['#2a2a1e', '#18180c'],
    emoji: '⚡',
  },
  {
    id: 'pop-budget-skincare',
    type: 'popular_read',
    title: 'Budget Skincare Under ₹500 That Actually Works',
    subtitle: 'Dermatologists confirm: expensive doesn\'t mean effective',
    body: `The most effective skincare ingredients — niacinamide, salicylic acid, glycerin, ceramides — are cheap to manufacture. The price difference between a ₹200 and ₹2,000 product often comes down to packaging, marketing, and brand positioning, not formula quality. Here's proof.

Cleanser: Simple Refreshing Facial Wash Gel (₹250) — 0 % soap, 0 % fragrance, pH 5.5. It's the same caliber as Cetaphil at half the price. For acne-prone skin, Cipla Saslic DS Foaming Face Wash with 2% salicylic acid (₹200) — a pharma brand with no marketing budget and no nonsense.

Serum: Minimalist 10% Niacinamide (₹349) — clinically tested, transparent ingredient listing, and effective at reducing oil and hyperpigmentation within 6 weeks. For vitamin C, try Plum 15% Vitamin C Serum (₹499) — uses ethyl ascorbic acid (a stable derivative) with kakadu plum.

Moisturiser: Nivea Crème (₹150 for 60ml) — dermatologists have long recommended this for dry skin. It's rich, occlusive, and contains glycerin and mineral oil in a well-balanced formula. For oily skin, Neutrogena Oil-Free Moisturiser (₹350) — lightweight, non-comedogenic.

Sunscreen: Re'equil Ultra Matte Dry Touch SPF 50 PA++++ (₹490) — one of the best sunscreens made in India, with modern UV filters and zero white cast. The pharmacy equivalent: UV Doux SPF 50 (₹450) — recommended by dermatologists nationwide.`,
    readTime: '4 min read',
    departments: ['skincare'],
    tags: ['budget', 'affordable', 'Indian brands', 'product picks'],
    gradient: ['#1a2a1a', '#0a180a'],
    emoji: '💰',
  },
  {
    id: 'pop-serum-vs-oil',
    type: 'popular_read',
    title: 'Hair Serum vs Hair Oil: The Real Difference',
    subtitle: 'They look similar, feel similar, but do very different things',
    body: `Hair serums and hair oils sit side by side on the shelf and are often used interchangeably, but they serve distinct purposes and work best at different times in your routine.

Hair oils (coconut, argan, jojoba, castor) are lipids — they penetrate or coat the hair shaft depending on their molecular weight. Coconut oil, with its small lauric acid molecules, actually penetrates the cortex and reduces protein loss. Argan and jojoba sit on the cuticle, smoothing it and adding shine. Oils are best used as pre-wash treatments (30 min before shampooing) or sparingly on dry ends. They nourish, but they can weigh hair down and attract dust if over-applied.

Hair serums are typically silicone-based (dimethicone, cyclomethicone) with added vitamins or proteins. They coat the hair shaft in a thin, non-greasy film that protects against heat damage (up to 230°C), reduces frizz, and adds instant shine without penetrating the hair. Serums are best applied to damp hair after washing, focused on the mid-lengths and ends.

The verdict: use oil as a pre-wash treatment for nourishment, and serum as a post-wash finishing product for protection and shine. If you can only pick one: oil for dry, damaged hair that needs repair; serum for frizzy, heat-styled hair that needs protection. And a universal rule — never apply either directly to the scalp, or you'll clog follicles and invite buildup.`,
    readTime: '4 min read',
    departments: ['haircare'],
    tags: ['hair serum', 'hair oil', 'comparison', 'frizz'],
    gradient: ['#1e1a2a', '#0c0a18'],
    emoji: '💧',
  },
  {
    id: 'pop-clean-beauty',
    type: 'popular_read',
    title: 'The Truth About \'Clean Beauty\'',
    subtitle: 'Why "clean" is a marketing term, not a scientific one',
    body: `"Clean beauty" has no legal or scientific definition. Unlike "organic" (regulated by USDA/FSSAI) or "SPF 50" (tested to ISO standards), "clean" means whatever a brand decides it means. And this ambiguity is costing consumers both money and results.

The clean beauty movement's core claim — that synthetic chemicals are harmful and natural ingredients are safer — is scientifically unfounded. Formaldehyde occurs naturally in apples and pears. Arsenic is natural. Poison ivy is natural. Meanwhile, some of the most effective, safest skincare ingredients (niacinamide, hyaluronic acid, ceramides, mineral sunscreens) are synthesised in labs because lab synthesis allows for purity, consistency, and stability that nature can't match.

The real concerns — which the clean beauty movement gets right, even if for the wrong reasons — are fragrance sensitivity, endocrine disruptors, and allergens. But these are nuanced, ingredient-specific issues that require scientific evaluation, not blanket "chemical-free" marketing. Parabens, for instance, were vilified based on a single, poorly designed 2004 study that has been thoroughly refuted by subsequent research. They remain one of the safest, most effective preservative systems available.

What should you do? Ignore "clean" labels and focus on what matters: a product's full ingredient list, its pH, clinical testing data, and whether its claims are backed by peer-reviewed research. A ₹200 pharmacy moisturiser with "scary" ingredients like mineral oil and dimethicone will almost certainly outperform a ₹2,000 "clean" cream with trendy botanicals that haven't been tested for efficacy.`,
    readTime: '5 min read',
    departments: ['skincare', 'haircare', 'bodycare'],
    tags: ['clean beauty', 'myths', 'marketing', 'science'],
    gradient: ['#2a1e2a', '#180c18'],
    emoji: '🌿',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 5. INGREDIENT SPOTLIGHTS  (8)
// ═══════════════════════════════════════════════════════════════════════════

export const INGREDIENT_SPOTLIGHTS: DiscoverIngredientSpotlight[] = [
  {
    id: 'spot-niacinamide',
    ingredientName: 'Niacinamide',
    emoji: '✨',
    tagline: 'The multitasker your skin actually needs',
    summary:
      'Niacinamide (vitamin B3) regulates sebum production, fades post-inflammatory hyperpigmentation, and strengthens the skin barrier by boosting ceramide synthesis. Effective at 5–10 % concentration with visible results in 4–8 weeks.',
    departments: ['skincare'],
  },
  {
    id: 'spot-retinol',
    ingredientName: 'Retinol',
    emoji: '🌙',
    tagline: 'The gold standard of anti-aging',
    summary:
      'Retinol (vitamin A) accelerates cell turnover, stimulates collagen production, and reduces fine lines, acne, and hyperpigmentation. Start low (0.025 %) and slow (every 3rd night) to build tolerance before increasing frequency.',
    departments: ['skincare'],
  },
  {
    id: 'spot-vitc',
    ingredientName: 'Vitamin C',
    emoji: '🍊',
    tagline: 'Your morning antioxidant shield',
    summary:
      'L-ascorbic acid is the most potent topical antioxidant, neutralising free radicals from UV exposure and pollution while inhibiting melanin production. Look for stable formulations at 10–20 % with vitamin E and ferulic acid for maximum efficacy.',
    departments: ['skincare'],
  },
  {
    id: 'spot-ha',
    ingredientName: 'Hyaluronic Acid',
    emoji: '💦',
    tagline: 'Holds 1,000× its weight in water',
    summary:
      'Hyaluronic acid is a glycosaminoglycan naturally present in skin that acts as a humectant, drawing moisture from the environment into the epidermis. Multi-molecular weight formulations (high + low MW) hydrate both the surface and deeper layers for plump, dewy skin.',
    departments: ['skincare'],
  },
  {
    id: 'spot-salicylic',
    ingredientName: 'Salicylic Acid',
    emoji: '🧫',
    tagline: 'The only BHA that goes inside your pores',
    summary:
      'Salicylic acid is oil-soluble, allowing it to penetrate into pores and dissolve the sebum and dead skin that cause blackheads and acne. At 2 % concentration, it also has anti-inflammatory properties that reduce redness and swelling around breakouts.',
    departments: ['skincare'],
  },
  {
    id: 'spot-ceramides',
    ingredientName: 'Ceramides',
    emoji: '🧱',
    tagline: 'The mortar that holds your skin together',
    summary:
      'Ceramides are lipids that make up over 50 % of the skin barrier, preventing water loss and protecting against environmental damage. Topical ceramides (especially ceramide NP, AP, and EOP) in a 3:1:1 ratio with cholesterol and fatty acids restore compromised barriers.',
    departments: ['skincare'],
  },
  {
    id: 'spot-biotin',
    ingredientName: 'Biotin',
    emoji: '💊',
    tagline: 'The B-vitamin behind stronger hair and nails',
    summary:
      'Biotin (vitamin B7) is a cofactor in keratin production, the primary structural protein in hair and nails. While deficiency clearly causes hair thinning, supplementation above adequate intake (30 mcg/day) shows limited evidence — check blood levels before megadosing.',
    departments: ['haircare'],
  },
  {
    id: 'spot-keratin',
    ingredientName: 'Keratin',
    emoji: '💇',
    tagline: 'The protein your hair is made of',
    summary:
      'Keratin is the structural protein comprising 85 % of the hair shaft. Hydrolysed keratin in topical products temporarily fills gaps in the damaged cuticle, reducing breakage by up to 40 % and improving elasticity, shine, and manageability after a single application.',
    departments: ['haircare'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 6. QUICK TIPS  (8)
// ═══════════════════════════════════════════════════════════════════════════

export const QUICK_TIPS: DiscoverQuickTip[] = [
  {
    id: 'tip-spf-reapply',
    emoji: '☀️',
    title: 'Reapply SPF every 2–3 hours',
    body: 'Sunscreen degrades with UV exposure. Even the best SPF 50 drops below effective protection after 2 hours outdoors. Set a phone reminder or keep a compact sunscreen in your bag.',
    bgColor: 'rgba(255, 179, 64, 0.12)',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'tip-layering-order',
    emoji: '📋',
    title: 'Layer thinnest to thickest',
    body: 'Apply products in order of viscosity: toner → essence → serum → moisturiser → oil → SPF (AM). Thicker products create a barrier that prevents thinner ones from absorbing.',
    bgColor: 'rgba(100, 210, 255, 0.12)',
    departments: ['skincare'],
  },
  {
    id: 'tip-retinol-timing',
    emoji: '🌙',
    title: 'Retinol goes on dry skin only',
    body: 'Wait 15–20 minutes after cleansing before applying retinol. Damp skin increases absorption and irritation. If you\'re sensitive, buffer with moisturiser on both sides.',
    bgColor: 'rgba(180, 130, 255, 0.12)',
    departments: ['skincare'],
  },
  {
    id: 'tip-double-cleanse',
    emoji: '🧴',
    title: 'Double cleanse at night, not morning',
    body: 'Use an oil/balm cleanser first to dissolve sunscreen and makeup, then a water-based cleanser. In the morning, a gentle water rinse or single cleanse is enough — no need to strip overnight recovery.',
    bgColor: 'rgba(130, 220, 180, 0.12)',
    departments: ['skincare'],
  },
  {
    id: 'tip-patch-test',
    emoji: '🧪',
    title: 'Always patch test new actives',
    body: 'Apply a small amount behind your ear or on your inner forearm for 24–48 hours before using on your face. This simple step prevents full-face reactions to ingredients your skin doesn\'t tolerate.',
    bgColor: 'rgba(255, 130, 130, 0.12)',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'tip-hair-oiling',
    emoji: '🫒',
    title: 'Oil lengths, not scalp',
    body: 'Apply hair oil to mid-lengths and ends where hair is oldest and driest. Heavy scalp oiling clogs follicles and worsens dandruff. If you oil the scalp, wash it out within 1–2 hours.',
    bgColor: 'rgba(200, 170, 110, 0.12)',
    departments: ['haircare'],
  },
  {
    id: 'tip-body-exfoliation',
    emoji: '🧽',
    title: 'Exfoliate your body 2–3× per week',
    body: 'Body skin is thicker than facial skin and can handle more exfoliation. Use a glycolic acid body wash or a salux cloth to prevent ingrown hairs, KP bumps, and rough texture on arms and legs.',
    bgColor: 'rgba(255, 180, 200, 0.12)',
    departments: ['bodycare'],
  },
  {
    id: 'tip-ingredient-storage',
    emoji: '🧊',
    title: 'Store vitamin C in the fridge',
    body: 'L-ascorbic acid oxidises rapidly in heat and light. Refrigerating your vitamin C serum extends its potency by 2–3 months. If it turns dark orange or brown, it\'s oxidised — replace it.',
    bgColor: 'rgba(140, 200, 255, 0.12)',
    departments: ['skincare'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 7. CONCERNS  (10)
// ═══════════════════════════════════════════════════════════════════════════

export const CONCERNS: DiscoverConcern[] = [
  { id: 'concern-acne', name: 'acne', emoji: '🔴', color: '#FF453A', departments: ['skincare'] },
  { id: 'concern-dullness', name: 'dullness', emoji: '😶', color: '#FF9F0A', departments: ['skincare'] },
  { id: 'concern-hyperpigmentation', name: 'hyperpigmentation', emoji: '🎯', color: '#BF5AF2', departments: ['skincare'] },
  { id: 'concern-dryness', name: 'dryness', emoji: '🏜️', color: '#FF6961', departments: ['skincare'] },
  { id: 'concern-oiliness', name: 'oiliness', emoji: '💧', color: '#30D158', departments: ['skincare'] },
  { id: 'concern-sensitivity', name: 'sensitivity', emoji: '🌸', color: '#FF375F', departments: ['skincare'] },
  { id: 'concern-fine-lines', name: 'fine lines', emoji: '〰️', color: '#64D2FF', departments: ['skincare'] },
  { id: 'concern-dehydration', name: 'dehydration', emoji: '💦', color: '#0A84FF', departments: ['skincare'] },
  { id: 'concern-hair-fall', name: 'hair fall', emoji: '💇', color: '#AC8E68', departments: ['haircare'] },
  { id: 'concern-dandruff', name: 'dandruff', emoji: '❄️', color: '#8E8E93', departments: ['haircare'] },
];

// ═══════════════════════════════════════════════════════════════════════════
// 8. SMART COLLECTIONS  (5)
// ═══════════════════════════════════════════════════════════════════════════

export const SMART_COLLECTIONS: SmartCollection[] = [
  {
    id: 'coll-derm-approved',
    name: 'Derm Approved',
    emoji: '🩺',
    description: 'Pharmaceutical and dermatologist-grade brands trusted by skin experts',
    departments: ['skincare', 'haircare', 'bodycare'],
    filter: { brandTiers: ['derm_grade', 'pharma'] },
  },
  {
    id: 'coll-under-500',
    name: 'Under ₹500',
    emoji: '💰',
    description: 'Effective skincare that won\'t break the bank — quality at every price point',
    departments: ['skincare', 'haircare', 'bodycare'],
    filter: { maxPrice: 500, sortBy: 'price_asc' },
  },
  {
    id: 'coll-fragrance-free',
    name: 'Fragrance-Free',
    emoji: '🍃',
    description: 'Zero added fragrance or essential oils — ideal for sensitive and reactive skin',
    departments: ['skincare', 'haircare', 'bodycare'],
    filter: { formulationFlags: { fragrance_free: true } },
  },
  {
    id: 'coll-top-rated',
    name: 'Top Rated',
    emoji: '⭐',
    description: 'Products rated 4.0+ by the JAY community — crowd-tested and approved',
    departments: ['skincare', 'haircare', 'bodycare'],
    filter: { minRating: 4.0, sortBy: 'rating' },
  },
  {
    id: 'coll-pregnancy-safe',
    name: 'Pregnancy Safe',
    emoji: '🤰',
    description: 'Formulas free from retinoids, high-dose salicylic acid, and other pregnancy no-gos',
    departments: ['skincare', 'haircare', 'bodycare'],
    filter: { pregnancySafe: true },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 9. MYTH BUSTERS  (6)
// ═══════════════════════════════════════════════════════════════════════════

export const MYTH_BUSTERS: MythBuster[] = [
  {
    id: 'myth-expensive',
    myth: 'You need expensive products for good skin',
    truth:
      'The most effective ingredients (niacinamide, glycerin, salicylic acid, ceramides) are inexpensive to formulate. A ₹200 pharma moisturiser can outperform a ₹5,000 luxury cream. Focus on ingredients and concentration, not price tags.',
    emoji: '💸',
    departments: ['skincare', 'haircare', 'bodycare'],
  },
  {
    id: 'myth-oily-moisturise',
    myth: "Oily skin doesn't need moisturiser",
    truth:
      'Skipping moisturiser on oily skin can actually increase oil production — your skin overcompensates for the lack of hydration. Use a lightweight, oil-free gel moisturiser with hyaluronic acid. Your skin produces oil (sebum) and hydration (water) through separate pathways.',
    emoji: '💧',
    departments: ['skincare'],
  },
  {
    id: 'myth-natural-safer',
    myth: 'Natural ingredients are always safer',
    truth:
      'Poison ivy, arsenic, and formaldehyde are all natural. Essential oils are a leading cause of contact dermatitis. Lab-synthesised ingredients like niacinamide and hyaluronic acid offer superior purity, stability, and safety over their natural counterparts.',
    emoji: '🌿',
    departments: ['skincare', 'haircare', 'bodycare'],
  },
  {
    id: 'myth-cloudy-spf',
    myth: "You don't need SPF on cloudy days",
    truth:
      'Up to 80 % of UV radiation penetrates cloud cover. UVA rays (which cause aging and pigmentation) are present at relatively constant levels year-round, regardless of weather. Wear SPF 30+ daily — even indoors if you sit near windows.',
    emoji: '☁️',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'myth-pores',
    myth: 'Pores can open and close',
    truth:
      'Pores are not muscles — they cannot physically open or close. Steam and warm water soften the sebum inside pores, making them easier to clean, but they don\'t "open." Cold water doesn\'t "close" them either. Pore size is determined by genetics, oil production, and age.',
    emoji: '🔍',
    departments: ['skincare'],
  },
  {
    id: 'myth-water-hydration',
    myth: 'Drinking water hydrates your skin',
    truth:
      'Unless you are clinically dehydrated, drinking extra water has negligible impact on skin hydration. Water you drink is distributed to vital organs first; very little reaches the epidermis. Topical humectants (hyaluronic acid, glycerin) and occlusives (ceramides, squalane) are far more effective.',
    emoji: '🚰',
    departments: ['skincare'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 10. INGREDIENT DICTIONARY  (20, A–Z)
// ═══════════════════════════════════════════════════════════════════════════

export const INGREDIENT_DICTIONARY: IngredientDictEntry[] = [
  {
    id: 'dict-allantoin',
    name: 'Allantoin',
    emoji: '🩹',
    category: 'Skin Protectant',
    oneLiner: 'A gentle, non-irritating compound that promotes wound healing, soothes irritation, and softens the stratum corneum for smoother skin texture.',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'dict-alpha-arbutin',
    name: 'Alpha Arbutin',
    emoji: '🎯',
    category: 'Brightening Agent',
    oneLiner: 'A stable, water-soluble tyrosinase inhibitor derived from bearberry that fades hyperpigmentation without the irritation risks of hydroquinone.',
    departments: ['skincare'],
  },
  {
    id: 'dict-azelaic-acid',
    name: 'Azelaic Acid',
    emoji: '🧬',
    category: 'Multi-Functional Active',
    oneLiner: 'A dicarboxylic acid that treats acne, rosacea, and hyperpigmentation simultaneously — anti-inflammatory, antibacterial, and melanin-inhibiting at 15–20 % concentration.',
    departments: ['skincare'],
  },
  {
    id: 'dict-biotin',
    name: 'Biotin',
    emoji: '💊',
    category: 'Vitamin',
    oneLiner: 'Vitamin B7, a cofactor in keratin production essential for hair and nail strength — effective for deficiency-related thinning but limited evidence for supplementation beyond adequate intake.',
    departments: ['haircare'],
  },
  {
    id: 'dict-centella',
    name: 'Centella Asiatica',
    emoji: '🌱',
    category: 'Soothing / Barrier Repair',
    oneLiner: 'Also known as cica or gotu kola, its active compounds (madecassoside, asiaticoside) calm inflammation, accelerate wound healing, and boost collagen synthesis.',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'dict-ceramides',
    name: 'Ceramides',
    emoji: '🧱',
    category: 'Barrier Lipid',
    oneLiner: 'Essential lipids making up 50 % of the skin barrier — topical application in a 3:1:1 ratio with cholesterol and fatty acids restores compromised barriers and reduces transepidermal water loss.',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'dict-glycerin',
    name: 'Glycerin',
    emoji: '💧',
    category: 'Humectant',
    oneLiner: 'One of the most effective and well-studied humectants — draws water into the stratum corneum, improves skin flexibility, and enhances the penetration of other active ingredients.',
    departments: ['skincare', 'haircare', 'bodycare'],
  },
  {
    id: 'dict-glycolic-acid',
    name: 'Glycolic Acid',
    emoji: '⚗️',
    category: 'Exfoliant (AHA)',
    oneLiner: 'The smallest alpha hydroxy acid with the deepest penetration — dissolves dead cell bonds to improve texture, fade sun damage, and stimulate collagen at concentrations of 5–10 %.',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'dict-hyaluronic-acid',
    name: 'Hyaluronic Acid',
    emoji: '💦',
    category: 'Humectant',
    oneLiner: 'A glycosaminoglycan that holds up to 1,000× its weight in water — multi-molecular weight formulations hydrate both the skin surface (high MW) and deeper layers (low MW).',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'dict-kojic-acid',
    name: 'Kojic Acid',
    emoji: '🍄',
    category: 'Brightening Agent',
    oneLiner: 'A fungal metabolite that chelates copper in tyrosinase, inhibiting melanin production — effective for melasma and dark spots at 1–2 %, but can be sensitising and unstable without dipalmitate form.',
    departments: ['skincare'],
  },
  {
    id: 'dict-lactic-acid',
    name: 'Lactic Acid',
    emoji: '🥛',
    category: 'Exfoliant (AHA)',
    oneLiner: 'A gentler AHA than glycolic acid that exfoliates while boosting ceramide production and hydration — ideal for sensitive skin and KP at 5–12 % concentration.',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'dict-mandelic-acid',
    name: 'Mandelic Acid',
    emoji: '🫧',
    category: 'Exfoliant (AHA)',
    oneLiner: 'A large-molecule AHA derived from almonds — penetrates slowly for minimal irritation, making it the safest chemical exfoliant for dark skin tones prone to PIH.',
    departments: ['skincare'],
  },
  {
    id: 'dict-niacinamide',
    name: 'Niacinamide',
    emoji: '✨',
    category: 'Multi-Functional Active',
    oneLiner: 'Vitamin B3 that regulates sebum, fades pigmentation, strengthens the barrier, and reduces inflammation — effective at 5 % with virtually no irritation potential.',
    departments: ['skincare'],
  },
  {
    id: 'dict-panthenol',
    name: 'Panthenol',
    emoji: '🩹',
    category: 'Humectant / Emollient',
    oneLiner: 'Provitamin B5 that attracts and retains moisture, accelerates epithelial healing, and reduces inflammation — a cornerstone ingredient in post-procedure and sensitive skin care.',
    departments: ['skincare', 'haircare', 'bodycare'],
  },
  {
    id: 'dict-retinol',
    name: 'Retinol',
    emoji: '🌙',
    category: 'Cell Turnover / Anti-Aging',
    oneLiner: 'Vitamin A derivative that accelerates cell turnover, stimulates collagen, and treats acne, fine lines, and pigmentation — the most evidence-backed anti-aging ingredient available.',
    departments: ['skincare'],
  },
  {
    id: 'dict-salicylic-acid',
    name: 'Salicylic Acid',
    emoji: '🧫',
    category: 'Exfoliant (BHA)',
    oneLiner: 'The only oil-soluble beta hydroxy acid — penetrates pores to dissolve sebum plugs and dead skin, making it the gold standard for acne, blackheads, and congestion at 0.5–2 %.',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'dict-squalane',
    name: 'Squalane',
    emoji: '🫧',
    category: 'Emollient',
    oneLiner: 'A hydrogenated, stable form of squalene (naturally found in human sebum) that mimics skin lipids, providing non-comedogenic moisture and reinforcing the barrier without greasiness.',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'dict-tranexamic-acid',
    name: 'Tranexamic Acid',
    emoji: '🎯',
    category: 'Brightening Agent',
    oneLiner: 'Originally a blood-clotting medication, topical tranexamic acid (3–5 %) inhibits the plasminogen/UV pathway to reduce melanin production — rapidly becoming the treatment of choice for stubborn melasma.',
    departments: ['skincare'],
  },
  {
    id: 'dict-urea',
    name: 'Urea',
    emoji: '🧴',
    category: 'Humectant / Keratolytic',
    oneLiner: 'A natural moisturising factor (NMF) that hydrates at low concentrations (5–10 %) and exfoliates at high concentrations (20–40 %) — the dermatologist\'s secret weapon for KP, calluses, and severe dryness.',
    departments: ['skincare', 'bodycare'],
  },
  {
    id: 'dict-zinc-pca',
    name: 'Zinc PCA',
    emoji: '⚡',
    category: 'Sebum Regulator',
    oneLiner: 'The zinc salt of pyrrolidone carboxylic acid — regulates sebum production, has antimicrobial properties against acne-causing bacteria, and supports scalp health in anti-dandruff formulations.',
    departments: ['skincare', 'haircare'],
  },
];
