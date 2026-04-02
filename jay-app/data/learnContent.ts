export interface Tip {
  id: string;
  emoji: string;
  title: string;
  body: string;
  bgColor: string;
}

export interface IngredientSpotlight {
  id: string;
  emoji: string;
  name: string;
  subtitle: string;
  description: string;
  concentrations: string;
  pairsWith: string[];
  avoidWith: string[];
}

export interface ConflictDisplay {
  type: 'never' | 'caution' | 'synergy';
  label: string;
  ingredients: string;
  color: string;
}

export interface SeasonalGuide {
  id: string;
  emoji: string;
  name: string;
  summary: string;
  fullContent: string;
}

export interface ScienceArticle {
  id: string;
  title: string;
  subtitle: string;
  readTime: string;
  gradient: [string, string];
  body: string;
}

export const TIPS: Tip[] = [
  { id: 't1', emoji: '💡', title: 'Thinnest to thickest', body: 'Always layer water-based products before oil-based. Serums before creams.', bgColor: 'rgba(10,132,255,0.12)' },
  { id: 't2', emoji: '☀️', title: '2 finger-lengths of SPF', body: "That's how much sunscreen you need for your face. Reapply every 2 hours outdoors.", bgColor: 'rgba(255,159,10,0.12)' },
  { id: 't3', emoji: '🌙', title: 'Retinol = PM only', body: 'It degrades in sunlight and makes your skin photosensitive. Always at night.', bgColor: 'rgba(191,90,242,0.12)' },
  { id: 't4', emoji: '⏱', title: 'Wait between actives', body: 'Give vitamin C and other actives 1-2 minutes to absorb before layering.', bgColor: 'rgba(48,209,88,0.12)' },
  { id: 't5', emoji: '🧪', title: 'Patch test new products', body: 'Test on inner forearm for 7-10 days before applying to your face.', bgColor: 'rgba(255,69,58,0.12)' },
  { id: 't6', emoji: '🧴', title: 'Double cleanse at night', body: 'Oil cleanser first to remove makeup and SPF, then water cleanser for skin.', bgColor: 'rgba(94,92,230,0.12)' },
  { id: 't7', emoji: '💧', title: 'Damp skin absorbs better', body: 'Apply toner and serums on slightly damp skin for better penetration.', bgColor: 'rgba(100,210,255,0.12)' },
  { id: 't8', emoji: '✨', title: 'Exfoliate 2-3x/week max', body: 'Over-exfoliation damages your barrier. Less is more with AHAs and BHAs.', bgColor: 'rgba(255,214,10,0.12)' },
  { id: 't9', emoji: '🏠', title: 'SPF even indoors', body: 'UVA rays penetrate windows. If there is daylight, wear SPF.', bgColor: 'rgba(255,159,10,0.12)' },
  { id: 't10', emoji: '⚠️', title: "Don't mix retinol + AHA", body: 'Both exfoliate through different mechanisms. Together they can destroy your barrier.', bgColor: 'rgba(255,69,58,0.12)' },
  { id: 't11', emoji: '💎', title: 'Niacinamide is universal', body: 'Works for acne, aging, pigmentation, and sensitivity. Safe for all skin types.', bgColor: 'rgba(48,209,88,0.12)' },
  { id: 't12', emoji: '🧱', title: 'Ceramides repair barriers', body: 'Look for ceramide NP, AP, and EOP in your moisturizer for barrier repair.', bgColor: 'rgba(10,132,255,0.12)' },
];

export const AM_ORDER = ['Cleanser', 'Toner', 'Serum', 'Eye Cream', 'Moisturizer', 'Sunscreen ☀️'];
export const PM_ORDER = ['Oil Cleanser', 'Water Cleanser', 'Toner', 'Serum / Treatment', 'Eye Cream', 'Moisturizer', 'Face Oil / Mask 🌙'];

export const CONFLICTS: ConflictDisplay[] = [
  { type: 'never', label: 'Never combine', ingredients: 'Retinol + Benzoyl Peroxide', color: '#FF453A' },
  { type: 'never', label: 'Never combine', ingredients: 'Retinol + AHA/BHA', color: '#FF453A' },
  { type: 'never', label: 'Never combine', ingredients: 'Retinol + Vitamin C (same routine)', color: '#FF453A' },
  { type: 'never', label: 'Never combine', ingredients: 'Vitamin C + Benzoyl Peroxide', color: '#FF453A' },
  { type: 'never', label: 'Never combine', ingredients: 'AHA + BHA (at same time)', color: '#FF453A' },
  { type: 'caution', label: 'Use with caution', ingredients: 'Niacinamide + Low pH Acids', color: '#FF9F0A' },
  { type: 'caution', label: 'Use with caution', ingredients: 'Vitamin C + AHA', color: '#FF9F0A' },
  { type: 'synergy', label: 'Great together', ingredients: 'Vitamin C + Vitamin E + Ferulic Acid', color: '#30D158' },
  { type: 'synergy', label: 'Great together', ingredients: 'Retinol + Niacinamide + Ceramides', color: '#30D158' },
  { type: 'synergy', label: 'Great together', ingredients: 'Hyaluronic Acid + Niacinamide', color: '#30D158' },
];

export const INGREDIENT_SPOTLIGHTS: IngredientSpotlight[] = [
  {
    id: 'retinol', emoji: '🔶', name: 'Retinol', subtitle: 'The gold standard',
    description: 'Retinol is a derivative of vitamin A and the most studied anti-aging ingredient in dermatology. It accelerates cell turnover, stimulates collagen production, and fades hyperpigmentation by promoting the shedding of damaged surface cells and the generation of new ones beneath.\n\nIt works by binding to retinoid receptors in skin cells, triggering a cascade of gene expression changes that normalize cell behavior. This is why retinol helps with such a wide range of concerns — from acne to wrinkles to dark spots.\n\nStart with 0.025-0.05% and build tolerance over 4-6 weeks before increasing. Use only at night. Always pair with SPF the next morning. The gold standard for long-term skin health.',
    concentrations: '0.025% (beginner) → 0.05% → 0.1% → 0.3% → 0.5% → 1.0% (advanced)',
    pairsWith: ['Niacinamide', 'Ceramides', 'Hyaluronic Acid', 'Peptides'],
    avoidWith: ['AHA/BHA', 'Benzoyl Peroxide', 'Vitamin C (same routine)'],
  },
  {
    id: 'vitamin_c', emoji: '🍊', name: 'Vitamin C', subtitle: 'Antioxidant shield',
    description: "L-Ascorbic Acid is the most bioavailable form of vitamin C for skin. It neutralizes free radicals from UV exposure and pollution, inhibits melanin production to fade dark spots, and stimulates collagen synthesis for firmer skin.\n\nThe key is formulation: vitamin C needs a low pH (2.5-3.5) to penetrate skin effectively. It's inherently unstable and degrades when exposed to light, air, or heat — which is why packaging matters. Look for dark, airtight bottles.\n\nOptimal concentration is 10-20%. Below 10% may not be effective; above 20% causes irritation without added benefit. The combination of 15% vitamin C + 1% vitamin E + 0.5% ferulic acid (the SkinCeuticals CE Ferulic formula) is considered the gold standard.",
    concentrations: '10% (sensitive skin) → 15% (standard) → 20% (max effective)',
    pairsWith: ['Vitamin E', 'Ferulic Acid', 'SPF', 'Hyaluronic Acid'],
    avoidWith: ['Benzoyl Peroxide', 'Copper Peptides', 'Niacinamide (debated)'],
  },
  {
    id: 'niacinamide', emoji: '💎', name: 'Niacinamide', subtitle: 'The all-rounder',
    description: "Niacinamide (vitamin B3) is one of the most versatile ingredients in skincare. At 2-5%, it strengthens the skin barrier by boosting ceramide production. At 5-10%, it regulates sebum production, reduces pore appearance, fades hyperpigmentation, and has anti-inflammatory properties.\n\nUnlike many actives, niacinamide is well-tolerated by virtually all skin types including sensitive skin. It works at a neutral pH, so it plays well with most other ingredients. The old claim that niacinamide and vitamin C can't be combined has been debunked — modern formulations are stable together.\n\nIt's also one of the few ingredients with strong evidence for reducing transepidermal water loss (TEWL), making it a quiet hero for barrier health.",
    concentrations: '2-5% (barrier support) → 5-10% (sebum control, brightening)',
    pairsWith: ['Hyaluronic Acid', 'Retinol', 'Ceramides', 'Zinc', 'Salicylic Acid'],
    avoidWith: ['Very low pH products (below pH 3.5)'],
  },
  {
    id: 'hyaluronic_acid', emoji: '💧', name: 'Hyaluronic Acid', subtitle: 'The hydrator',
    description: "Hyaluronic acid is a glycosaminoglycan naturally present in skin that can hold up to 1000 times its weight in water. As a humectant, it draws moisture from the environment and deeper skin layers to the surface, plumping and hydrating.\n\nMolecular weight matters: high molecular weight HA (>1000 kDa) sits on the surface forming a moisture barrier. Low molecular weight HA (<50 kDa) penetrates deeper but can cause irritation in some people. Multi-weight formulas offer the best of both.\n\nApply to damp skin — in dry environments, HA can actually pull water from your skin if there's no external moisture to draw from. Always seal with a moisturizer or occlusive on top.",
    concentrations: '0.1-2% (most products). Higher is not better — can feel sticky.',
    pairsWith: ['Niacinamide', 'Vitamin C', 'Ceramides', 'Peptides'],
    avoidWith: [],
  },
  {
    id: 'ahas_bhas', emoji: '⚗️', name: 'AHAs & BHAs', subtitle: 'The exfoliators',
    description: "Alpha hydroxy acids (glycolic, lactic, mandelic) are water-soluble and work on the skin surface by dissolving the bonds between dead cells. Beta hydroxy acid (salicylic acid) is oil-soluble and penetrates into pores, making it ideal for acne.\n\nGlycolic acid is the smallest AHA molecule — most effective but also most irritating. Lactic acid is gentler and also hydrating. Mandelic acid is the gentlest, good for sensitive and darker skin tones (less risk of post-inflammatory hyperpigmentation).\n\nBHAs (salicylic acid at 0.5-2%) are anti-inflammatory and comedolytic — they dissolve the oil and dead skin clogging pores. pH must be 3-4 for effectiveness. Don't combine with retinol. Limit to 2-3 times per week.",
    concentrations: 'Glycolic 5-10%, Lactic 5-10%, Mandelic 10%, Salicylic 0.5-2%',
    pairsWith: ['Niacinamide (after)', 'Hyaluronic Acid (after)'],
    avoidWith: ['Retinol', 'Other exfoliants', 'Benzoyl Peroxide'],
  },
  {
    id: 'ceramides', emoji: '🧱', name: 'Ceramides', subtitle: 'Barrier builders',
    description: "Ceramides are lipids that make up 50% of the skin barrier's mortar (the intercellular lipid matrix between corneocytes). The ideal ratio for barrier repair is 3:1:1 — three parts ceramides to one part cholesterol to one part fatty acids.\n\nWhen the barrier is damaged (from over-exfoliation, harsh cleansers, or environmental stress), ceramide levels drop and transepidermal water loss increases. Replenishing ceramides topically has been shown to restore barrier function in 2-4 weeks.\n\nLook for ceramide NP, AP, and EOP in ingredient lists. They work best in combination with cholesterol and fatty acids — which is why CeraVe and similar brands include all three. Plant-derived ceramides (phytosphingosine) also work well.",
    concentrations: 'Effective at low concentrations (0.5-1%). Ratio matters more than amount.',
    pairsWith: ['Cholesterol', 'Fatty Acids', 'Niacinamide', 'Hyaluronic Acid'],
    avoidWith: [],
  },
  {
    id: 'spf', emoji: '☀️', name: 'SPF', subtitle: 'The non-negotiable',
    description: "Sunscreen is the single most effective anti-aging product. UV radiation causes 80% of visible skin aging (photoaging) — wrinkles, dark spots, loss of elasticity. SPF 30 blocks 97% of UVB rays; SPF 50 blocks 98%.\n\nThere are two types: chemical (organic) filters absorb UV and convert it to heat — examples include avobenzone, octinoxate, homosalate. Mineral (inorganic) filters physically reflect UV — zinc oxide and titanium dioxide. Mineral is preferred for sensitive skin and is reef-safe.\n\nThe most important factor is application amount: 1/4 teaspoon for face (2 finger-lengths), applied 15 minutes before sun exposure. Reapply every 2 hours, or immediately after swimming/sweating. No sunscreen is waterproof — only water-resistant for 40-80 minutes.",
    concentrations: 'SPF 30 minimum. SPF 50 preferred. PA++++ for UVA protection.',
    pairsWith: ['Vitamin C (underneath)', 'Niacinamide', 'Antioxidants'],
    avoidWith: [],
  },
];

export const SEASONAL_GUIDES: SeasonalGuide[] = [
  {
    id: 'summer', emoji: '☀️', name: 'Summer', summary: 'Gel moisturizers, matte SPF, lighter everything. More exfoliation.',
    fullContent: "Summer means higher UV index, more sweating, and increased sebum production. Switch to lightweight, gel-based moisturizers and water-based serums. Your SPF should be at least 50 with PA++++ and ideally matte-finish to prevent the greasy look.\n\nExfoliation can increase slightly (AHA 2-3x/week) since skin cell turnover naturally speeds up in warm weather. But be careful — more exfoliation means more sun sensitivity. Double down on antioxidant serums (vitamin C) for photoprotection.\n\nMist with thermal water throughout the day. Consider switching to a foam or gel cleanser if you normally use cream.",
  },
  {
    id: 'winter', emoji: '❄️', name: 'Winter', summary: 'Rich creams, facial oils, humidifier. Less exfoliation, more barrier.',
    fullContent: "Cold air holds less moisture, and indoor heating strips humidity further. Your skin barrier is under siege. Switch to cream cleansers, rich moisturizers with ceramides and fatty acids, and add a facial oil as the last step before bed.\n\nReduce exfoliation frequency — your barrier is already stressed. Focus on hydrating actives: hyaluronic acid (on damp skin), glycerin, squalane. A humidifier in your bedroom makes a bigger difference than any product.\n\nDon't skip SPF just because it's cloudy. UV rays penetrate clouds and reflect off snow.",
  },
  {
    id: 'monsoon', emoji: '🌧️', name: 'Monsoon', summary: 'Anti-fungal focus. Lightweight, non-comedogenic. Double cleanse daily.',
    fullContent: "High humidity during monsoon means more sweat, more sebum, and a higher risk of fungal acne (Malassezia). Switch to lightweight, non-comedogenic products. Avoid heavy oils and occlusives that can trap moisture and feed fungus.\n\nDouble cleanse every night — the humidity makes dirt and bacteria stick to skin more aggressively. Use salicylic acid 2x/week to keep pores clear. If you're prone to fungal acne, look for products labeled fungal-acne-safe.\n\nSPF remains essential — UV index can be high even through cloud cover. Choose a water-resistant formula.",
  },
  {
    id: 'urban', emoji: '🏙️', name: 'Urban / Pollution', summary: 'Anti-pollution serums, ectoin, double cleanse, antioxidant layering.',
    fullContent: "Particulate matter (PM2.5), ozone, and nitrogen dioxide generate free radicals that penetrate skin and accelerate aging. City dwellers age faster than rural populations — studies show a 20-30% increase in dark spots for high-pollution exposure.\n\nDefense strategy: Layer antioxidants. Vitamin C in the morning, niacinamide, and consider ectoin — a newer ingredient that protects cell membranes from environmental stress. Double cleanse every night to remove pollution particles.\n\nPhysical barriers help too: mineral SPF creates a literal shield on skin's surface. Some Asian sunscreens now include anti-pollution filters alongside UV filters.",
  },
];

export const SCIENCE_ARTICLES: ScienceArticle[] = [
  {
    id: 'skin_barrier', title: 'How the Skin Barrier Works', subtitle: 'Dermatology basics',
    readTime: '3 min read', gradient: ['#1a2a3a', '#0a1520'],
    body: "The stratum corneum — the outermost layer of your epidermis — is your skin's primary barrier. Think of it as a brick wall: corneocytes (dead skin cells) are the bricks, and a lipid matrix of ceramides, cholesterol, and fatty acids is the mortar.\n\nEvery skincare routine either strengthens or weakens this wall. Moisturizers with ceramides reinforce the mortar. Retinoids accelerate brick replacement. AHAs dissolve the old mortar to reveal fresher bricks underneath.\n\nWhen the barrier is compromised — from over-exfoliation, harsh cleansers, or environmental damage — water escapes (transepidermal water loss), irritants penetrate, and inflammation follows. That tight, stinging feeling after washing? That's barrier damage.\n\nThe fix? Stop all actives. Use only a gentle cleanser, a ceramide-dominant moisturizer (3:1:1 ratio of ceramides, cholesterol, and fatty acids), and mineral sunscreen. Your barrier typically recovers in 2-6 weeks.",
  },
  {
    id: 'fitzpatrick', title: 'Fitzpatrick Types Explained', subtitle: 'Understanding your skin',
    readTime: '4 min read', gradient: ['#2a1a20', '#1a0a10'],
    body: "The Fitzpatrick scale classifies skin into six types based on melanin content and UV response. Type I (very fair, always burns, never tans) through Type VI (deeply pigmented, never burns). Most South Asians fall into Types III-V.\n\nYour Fitzpatrick type affects which treatments are safe. Darker skin types (IV-VI) have higher risk of post-inflammatory hyperpigmentation (PIH) from aggressive treatments like chemical peels, lasers, and even certain actives. Gentler acids (mandelic, azelaic) are preferred. Retinol should be started at lower concentrations.\n\nThe scale also influences sunscreen needs. While darker skin has more inherent UV protection (approximately SPF 8-13 from melanin), it's not enough to prevent photoaging or hyperpigmentation. Everyone needs daily SPF regardless of skin tone.",
  },
  {
    id: 'routine_order', title: 'Why Routine Order Matters', subtitle: 'The science of layering',
    readTime: '3 min read', gradient: ['#1a2a1a', '#0a1a0a'],
    body: "The biophysics of skincare layering follows one core principle: thin to thick, water to oil. Lighter, water-based products have smaller molecules that need to reach skin first. Heavier, oil-based products create an occlusive barrier that would block lighter products applied after.\n\nMolecular weight determines penetration depth. Small molecules (<500 Daltons) can pass through the stratum corneum. This is why most active ingredients are formulated as small molecules — retinol (286 Da), salicylic acid (138 Da), niacinamide (122 Da) all penetrate well.\n\nOcclusives (petroleum jelly, dimethicone, heavy creams) work by creating a physical barrier that reduces transepidermal water loss by up to 98%. This is why they go last — they seal everything underneath. Applying them first would prevent any subsequent products from penetrating.",
  },
];

export function getSpotlightById(id: string): IngredientSpotlight | undefined {
  return INGREDIENT_SPOTLIGHTS.find(s => s.id === id);
}
