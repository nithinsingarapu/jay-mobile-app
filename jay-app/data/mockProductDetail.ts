export interface ProductDetailMock {
  match_percentage: number;
  jay_score: number;
  formula_safety: number;
  report_card: {
    ingredient_quality: number;
    formula_safety: number;
    value_for_money: number;
    brand_transparency: number;
    user_satisfaction: number;
    derm_endorsement: number;
  };
  jay_says: string;
  why_recommends: string[];
  positives: string[];
  limitations: string[];
  certifications: string[];
  skin_type_targets: string[];
  ingredients_detail: {
    name: string;
    concentration: string;
    efficacy: 'efficacious' | 'likely_efficacious' | 'functional';
    description: string;
  }[];
  safety_flags: { flag: string; status: string; safe: boolean }[];
  formula_richness: number;
  price_sizes: { size: string; platform: string; price: number; best_value: boolean }[];
  expert_opinions: {
    name: string;
    credentials: string;
    platform: string;
    verdict: 'positive' | 'mixed' | 'negative';
    quote: string;
  }[];
  clinical_studies: {
    name: string;
    source: string;
    finding: string;
    funding: 'independent' | 'brand-funded' | 'in-progress';
  }[];
  alternatives: {
    use_case: string;
    name: string;
    brand: string;
    price: string;
    benefits: string[];
    best_for: string;
    trade_off: string;
  }[];
}

// ── Default mock for any product not specifically mapped ──────────────────

const DEFAULT_MOCK: ProductDetailMock = {
  match_percentage: 78,
  jay_score: 7.5,
  formula_safety: 85,
  report_card: {
    ingredient_quality: 7.5,
    formula_safety: 8.0,
    value_for_money: 7.0,
    brand_transparency: 7.5,
    user_satisfaction: 7.8,
    derm_endorsement: 7.0,
  },
  jay_says:
    'A solid everyday product with a well-balanced formula. Nothing flashy, but it gets the job done without irritating your skin.',
  why_recommends: [
    'Clean ingredient list with no known irritants',
    'Good value for the quantity provided',
    'Suitable for most skin types without adjustment',
  ],
  positives: [
    'Lightweight, non-greasy texture',
    'Absorbs quickly into skin',
    'No strong fragrance',
    'Dermatologically tested',
  ],
  limitations: [
    'May not be potent enough for severe concerns',
    'Limited clinical backing compared to premium alternatives',
    'Packaging could be more hygienic',
  ],
  certifications: ['Dermatologically Tested', 'Cruelty-Free'],
  skin_type_targets: ['Normal', 'Combination', 'Oily'],
  ingredients_detail: [
    { name: 'Niacinamide', concentration: '2-5%', efficacy: 'efficacious', description: 'Brightens skin tone and minimises pore appearance.' },
    { name: 'Glycerin', concentration: '3-8%', efficacy: 'functional', description: 'Humectant that draws moisture into the skin.' },
    { name: 'Hyaluronic Acid', concentration: '0.5-1%', efficacy: 'likely_efficacious', description: 'Provides hydration and plumps fine lines.' },
  ],
  safety_flags: [
    { flag: 'Fragrance', status: 'Not detected', safe: true },
    { flag: 'Parabens', status: 'Not detected', safe: true },
    { flag: 'SLS / SLES', status: 'Not detected', safe: true },
    { flag: 'Denatured Alcohol', status: 'Not detected', safe: true },
  ],
  formula_richness: 72,
  price_sizes: [
    { size: '50 ml', platform: 'Amazon', price: 399, best_value: false },
    { size: '50 ml', platform: 'Nykaa', price: 375, best_value: true },
  ],
  expert_opinions: [
    {
      name: 'Dr. Vanita Rattan',
      credentials: 'Cosmetic Formulator',
      platform: 'YouTube',
      verdict: 'positive',
      quote: 'A sensible formulation that avoids gimmicks — good for beginners.',
    },
  ],
  clinical_studies: [
    {
      name: 'Niacinamide Efficacy at 5%',
      source: 'Journal of Cosmetic Dermatology, 2020',
      finding: 'Significant improvement in hyperpigmentation after 8 weeks of daily use.',
      funding: 'independent',
    },
  ],
  alternatives: [
    {
      use_case: 'Budget pick',
      name: 'Niacinamide 10% Serum',
      brand: 'Minimalist',
      price: '₹349',
      benefits: ['Higher niacinamide concentration', 'Zinc PCA for oil control'],
      best_for: 'Oily, acne-prone skin',
      trade_off: 'Can cause tingling at higher concentration',
    },
  ],
};

// ── Product-specific mocks ───────────────────────────────────────────────

const CERAVE_MOCK: ProductDetailMock = {
  match_percentage: 92,
  jay_score: 9.1,
  formula_safety: 96,
  report_card: {
    ingredient_quality: 9.2,
    formula_safety: 9.5,
    value_for_money: 8.5,
    brand_transparency: 9.0,
    user_satisfaction: 9.2,
    derm_endorsement: 9.8,
  },
  jay_says:
    'Gold standard for barrier repair. CeraVe\'s MVE technology delivers ceramides over 24 hours — one of the few drugstore brands backed by serious dermatological research.',
  why_recommends: [
    'Contains 3 essential ceramides (1, 3, 6-II) that mirror your skin\'s natural lipid barrier',
    'MVE delivery system provides sustained hydration for up to 24 hours',
    'Developed with dermatologists; recommended by more derms than any other moisturiser in the US',
  ],
  positives: [
    'Restores and maintains skin barrier',
    'Non-comedogenic and fragrance-free',
    'Suitable for eczema-prone skin',
    'Contains hyaluronic acid for added hydration',
    'Available in multiple sizes for testing',
  ],
  limitations: [
    'Can feel heavy on very oily skin in humid climates',
    'The lotion version may not be hydrating enough for very dry skin',
    'International pricing is higher in India vs. the US',
  ],
  certifications: ['National Eczema Association Seal of Acceptance', 'Fragrance-Free', 'Non-Comedogenic'],
  skin_type_targets: ['Dry', 'Normal', 'Sensitive', 'Eczema-Prone'],
  ingredients_detail: [
    { name: 'Ceramide NP', concentration: '1-3%', efficacy: 'efficacious', description: 'Restores the skin\'s natural barrier and prevents transepidermal water loss.' },
    { name: 'Ceramide AP', concentration: '1-3%', efficacy: 'efficacious', description: 'Works synergistically with other ceramides to strengthen the lipid barrier.' },
    { name: 'Ceramide EOP', concentration: '0.5-1%', efficacy: 'efficacious', description: 'Helps maintain the structural integrity of the skin barrier.' },
    { name: 'Hyaluronic Acid', concentration: '0.5-1%', efficacy: 'efficacious', description: 'Attracts and retains moisture in the upper layers of skin.' },
    { name: 'Niacinamide', concentration: '2-4%', efficacy: 'efficacious', description: 'Calms inflammation and strengthens the barrier.' },
    { name: 'Cholesterol', concentration: '0.5-1%', efficacy: 'functional', description: 'Essential lipid component that supports ceramide function.' },
  ],
  safety_flags: [
    { flag: 'Fragrance', status: 'Free', safe: true },
    { flag: 'Parabens', status: 'Free', safe: true },
    { flag: 'SLS / SLES', status: 'Free', safe: true },
    { flag: 'Drying Alcohol', status: 'Free', safe: true },
    { flag: 'Essential Oils', status: 'Free', safe: true },
  ],
  formula_richness: 88,
  price_sizes: [
    { size: '236 ml', platform: 'Amazon India', price: 1099, best_value: false },
    { size: '236 ml', platform: 'Nykaa', price: 999, best_value: true },
    { size: '473 ml', platform: 'Amazon India', price: 1799, best_value: false },
    { size: '539 g (Tub)', platform: 'iHerb', price: 1450, best_value: true },
  ],
  expert_opinions: [
    {
      name: 'Dr. Dray',
      credentials: 'Board-Certified Dermatologist',
      platform: 'YouTube',
      verdict: 'positive',
      quote: 'CeraVe is the brand I recommend to patients more than any other — the ceramide complex genuinely repairs the barrier.',
    },
    {
      name: 'Dr. Shereene Idriss',
      credentials: 'Board-Certified Dermatologist',
      platform: 'Instagram',
      verdict: 'positive',
      quote: 'If your barrier is compromised, CeraVe moisturising cream is the simplest fix. Nothing fancy, just effective.',
    },
    {
      name: 'Hyram Yarbro',
      credentials: 'Skincare Educator',
      platform: 'YouTube',
      verdict: 'positive',
      quote: 'CeraVe is the gold standard of affordable moisturisers. The MVE technology genuinely sets it apart.',
    },
  ],
  clinical_studies: [
    {
      name: 'Ceramide-Containing Moisturisers for Atopic Dermatitis',
      source: 'Journal of Clinical and Aesthetic Dermatology, 2018',
      finding: 'Ceramide-based moisturisers significantly improve skin barrier function and reduce TEWL by 30% after 4 weeks.',
      funding: 'independent',
    },
    {
      name: 'MVE Delivery Technology',
      source: 'L\'Oréal Research Labs, 2019',
      finding: 'Multi-vesicular emulsion technology shows sustained ceramide release over 24 hours compared to standard emulsions.',
      funding: 'brand-funded',
    },
  ],
  alternatives: [
    {
      use_case: 'Budget alternative',
      name: 'Moisturising Cream',
      brand: 'Cetaphil',
      price: '₹550',
      benefits: ['Gentle formula', 'Widely available', 'Fragrance-free'],
      best_for: 'Sensitive skin on a budget',
      trade_off: 'No ceramides — provides hydration without barrier repair',
    },
    {
      use_case: 'Indian alternative',
      name: 'Ceramide Moisturiser',
      brand: 'Bioderma Atoderm',
      price: '₹899',
      benefits: ['Contains ceramides', 'Niacinamide included', 'Made for Indian climate'],
      best_for: 'Those who want ceramides at a lower price',
      trade_off: 'Lighter formula — may not be enough for very dry skin',
    },
  ],
};

const MINIMALIST_VITAMIN_C_MOCK: ProductDetailMock = {
  match_percentage: 85,
  jay_score: 8.4,
  formula_safety: 90,
  report_card: {
    ingredient_quality: 8.8,
    formula_safety: 8.5,
    value_for_money: 9.2,
    brand_transparency: 9.5,
    user_satisfaction: 8.0,
    derm_endorsement: 7.5,
  },
  jay_says:
    'One of the best value Vitamin C serums in India. Minimalist uses ethyl ascorbic acid — more stable than L-AA — so you don\'t need to refrigerate it. Great transparency with full concentrations disclosed.',
  why_recommends: [
    'Uses Ethyl Ascorbic Acid (stable derivative) — less oxidation risk than L-Ascorbic Acid',
    'Full ingredient concentrations disclosed on packaging — rare for Indian brands',
    'Exceptional value at under ₹400 for a 30ml serum',
  ],
  positives: [
    'Visible brightening within 3-4 weeks',
    'Stable formulation with long shelf life',
    'Lightweight, water-based texture',
    'No pilling under sunscreen',
    'Fragrance-free',
  ],
  limitations: [
    'Ethyl ascorbic acid is less potent than pure L-Ascorbic Acid',
    'Some users report mild stinging on first use',
    'Not ideal for very sensitive or rosacea-prone skin without patch testing',
  ],
  certifications: ['Cruelty-Free', 'Fragrance-Free', 'Dermatologically Tested'],
  skin_type_targets: ['Normal', 'Combination', 'Oily', 'Dull Skin'],
  ingredients_detail: [
    { name: 'Ethyl Ascorbic Acid', concentration: '10%', efficacy: 'efficacious', description: 'Stable Vitamin C derivative that inhibits melanin production and boosts collagen.' },
    { name: 'Acetyl Glucosamine', concentration: '1%', efficacy: 'likely_efficacious', description: 'Supports Vitamin C\'s brightening action by inhibiting tyrosinase.' },
    { name: 'Ferulic Acid', concentration: '0.5%', efficacy: 'efficacious', description: 'Antioxidant that stabilises Vitamin C and enhances UV protection.' },
  ],
  safety_flags: [
    { flag: 'Fragrance', status: 'Free', safe: true },
    { flag: 'Parabens', status: 'Free', safe: true },
    { flag: 'SLS / SLES', status: 'Free', safe: true },
    { flag: 'Drying Alcohol', status: 'Free', safe: true },
  ],
  formula_richness: 75,
  price_sizes: [
    { size: '30 ml', platform: 'Minimalist Website', price: 349, best_value: true },
    { size: '30 ml', platform: 'Amazon India', price: 369, best_value: false },
    { size: '30 ml', platform: 'Nykaa', price: 349, best_value: true },
  ],
  expert_opinions: [
    {
      name: 'Dr. Geeta Fazalbhoy',
      credentials: 'Dermatologist, Mumbai',
      platform: 'Consult',
      verdict: 'positive',
      quote: 'Minimalist has done a great job with this formulation — stable, effective, and honestly priced.',
    },
    {
      name: 'Shreya Jain',
      credentials: 'Beauty Creator',
      platform: 'YouTube',
      verdict: 'positive',
      quote: 'This is the Vitamin C serum I keep coming back to. No irritation, visible glow, and under ₹400.',
    },
  ],
  clinical_studies: [
    {
      name: 'Ethyl Ascorbic Acid vs L-Ascorbic Acid Stability',
      source: 'International Journal of Cosmetic Science, 2021',
      finding: 'Ethyl ascorbic acid retains 95% potency after 12 months at room temperature versus 50% for L-AA.',
      funding: 'independent',
    },
  ],
  alternatives: [
    {
      use_case: 'More potent option',
      name: 'C E Ferulic',
      brand: 'SkinCeuticals',
      price: '₹13,500',
      benefits: ['15% pure L-Ascorbic Acid', 'Gold-standard clinical evidence', 'Enhanced photoprotection'],
      best_for: 'Those with budget for premium and need maximum potency',
      trade_off: '35x the price — diminishing returns for most people',
    },
    {
      use_case: 'Sensitive skin option',
      name: 'Vitamin C 10% Face Serum',
      brand: 'Plum',
      price: '₹475',
      benefits: ['Contains Kakadu Plum extract', 'Soothing formula', 'Pleasant texture'],
      best_for: 'Sensitive skin that reacts to synthetic Vitamin C',
      trade_off: 'Plant-derived Vitamin C is less concentrated',
    },
  ],
};

const MINIMALIST_NIACINAMIDE_MOCK: ProductDetailMock = {
  match_percentage: 88,
  jay_score: 8.7,
  formula_safety: 93,
  report_card: {
    ingredient_quality: 9.0,
    formula_safety: 9.2,
    value_for_money: 9.5,
    brand_transparency: 9.5,
    user_satisfaction: 8.5,
    derm_endorsement: 8.0,
  },
  jay_says:
    'The best budget niacinamide serum in India, hands down. 10% concentration with zinc — targets oiliness and pores. Minimalist lists exact concentrations on the box, which is refreshingly honest.',
  why_recommends: [
    '10% Niacinamide is the clinically proven concentration for oil control and pore reduction',
    'Zinc PCA addition controls sebum production — works synergistically with niacinamide',
    'Best price-to-performance ratio in the Indian niacinamide market',
  ],
  positives: [
    'Noticeable oil reduction within 1-2 weeks',
    'Minimises pore appearance over time',
    'Layers well under moisturiser and sunscreen',
    'No fragrance or unnecessary additives',
    'Full concentration transparency',
  ],
  limitations: [
    '10% may cause flushing in sensitive skin — start with alternate-day use',
    'Watery texture can feel like it does nothing on first application',
    'Not a standalone moisturiser — you still need one on top',
  ],
  certifications: ['Cruelty-Free', 'Fragrance-Free', 'Vegan'],
  skin_type_targets: ['Oily', 'Combination', 'Acne-Prone'],
  ingredients_detail: [
    { name: 'Niacinamide', concentration: '10%', efficacy: 'efficacious', description: 'Reduces sebum production, improves skin texture, and fades post-acne marks.' },
    { name: 'Zinc PCA', concentration: '1%', efficacy: 'efficacious', description: 'Antibacterial and sebum-regulating — complements niacinamide for acne-prone skin.' },
    { name: 'Hyaluronic Acid', concentration: '0.5%', efficacy: 'functional', description: 'Provides lightweight hydration without adding oiliness.' },
  ],
  safety_flags: [
    { flag: 'Fragrance', status: 'Free', safe: true },
    { flag: 'Parabens', status: 'Free', safe: true },
    { flag: 'SLS / SLES', status: 'Free', safe: true },
    { flag: 'Silicones', status: 'Free', safe: true },
  ],
  formula_richness: 68,
  price_sizes: [
    { size: '30 ml', platform: 'Minimalist Website', price: 299, best_value: true },
    { size: '30 ml', platform: 'Amazon India', price: 315, best_value: false },
    { size: '30 ml', platform: 'Nykaa', price: 299, best_value: true },
  ],
  expert_opinions: [
    {
      name: 'Dr. Jaishree Sharad',
      credentials: 'Celebrity Dermatologist, Mumbai',
      platform: 'Instagram',
      verdict: 'positive',
      quote: 'Niacinamide at 10% with zinc is a great combo for oily Indian skin. Minimalist has nailed the formula.',
    },
  ],
  clinical_studies: [
    {
      name: 'Topical Niacinamide for Sebum Reduction',
      source: 'Dermatologic Therapy, 2017',
      finding: '2% niacinamide reduced sebum by 23% — at 10%, effect is more pronounced with minimal side effects.',
      funding: 'independent',
    },
  ],
  alternatives: [
    {
      use_case: 'Gentler option',
      name: 'Niacinamide 5% Serum',
      brand: 'The Ordinary',
      price: '₹590',
      benefits: ['Lower concentration reduces flushing risk', 'Zinc included'],
      best_for: 'Sensitive skin starting niacinamide',
      trade_off: 'Lower concentration means slower results',
    },
  ],
};

const LA_SHIELD_MOCK: ProductDetailMock = {
  match_percentage: 90,
  jay_score: 8.8,
  formula_safety: 92,
  report_card: {
    ingredient_quality: 8.5,
    formula_safety: 9.0,
    value_for_money: 9.0,
    brand_transparency: 8.0,
    user_satisfaction: 8.8,
    derm_endorsement: 9.0,
  },
  jay_says:
    'The best affordable sunscreen for Indian skin. La Shield Fisico is a mineral sunscreen with SPF 50 that doesn\'t leave a white cast on medium-to-deep skin tones — a rare find at this price.',
  why_recommends: [
    'Mineral (physical) UV filters — gentle on sensitive and acne-prone skin',
    'SPF 50+ PA+++ broad-spectrum protection',
    'Minimal white cast compared to other mineral sunscreens at this price',
  ],
  positives: [
    'No chemical UV filters — ideal for reactive skin',
    'Matte finish suitable for oily skin in Indian humidity',
    'Works well as a makeup base',
    'Backed by Glenmark Pharmaceuticals',
    'Affordable for daily reapplication',
  ],
  limitations: [
    'Slight white cast on very deep skin tones',
    'Can feel drying without a moisturiser underneath',
    'Small tube size (50g) — runs out fast with proper application',
  ],
  certifications: ['Dermatologically Tested', 'Non-Comedogenic'],
  skin_type_targets: ['Oily', 'Combination', 'Sensitive', 'Acne-Prone'],
  ingredients_detail: [
    { name: 'Zinc Oxide', concentration: '20-25%', efficacy: 'efficacious', description: 'Broad-spectrum UVA/UVB protection with anti-inflammatory properties.' },
    { name: 'Titanium Dioxide', concentration: '5-10%', efficacy: 'efficacious', description: 'Reflects UV radiation — particularly effective against UVB rays.' },
    { name: 'Dimethicone', concentration: '3-5%', efficacy: 'functional', description: 'Provides smooth application and matte finish.' },
  ],
  safety_flags: [
    { flag: 'Chemical UV Filters', status: 'Free', safe: true },
    { flag: 'Fragrance', status: 'Minimal', safe: true },
    { flag: 'Parabens', status: 'Free', safe: true },
    { flag: 'Oxybenzone', status: 'Free', safe: true },
  ],
  formula_richness: 65,
  price_sizes: [
    { size: '50 g', platform: 'Amazon India', price: 450, best_value: false },
    { size: '50 g', platform: 'PharmEasy', price: 410, best_value: true },
    { size: '50 g', platform: 'Nykaa', price: 449, best_value: false },
  ],
  expert_opinions: [
    {
      name: 'Dr. Rasya Dixit',
      credentials: 'Dermatologist, Bangalore',
      platform: 'YouTube',
      verdict: 'positive',
      quote: 'La Shield Fisico is what I recommend to patients who want mineral sunscreen without spending a fortune.',
    },
    {
      name: 'Dr. Suchitra',
      credentials: 'Dermatologist',
      platform: 'Instagram',
      verdict: 'positive',
      quote: 'For acne-prone skin that reacts to chemical filters, La Shield is a no-brainer.',
    },
  ],
  clinical_studies: [
    {
      name: 'Zinc Oxide Broad-Spectrum Protection',
      source: 'Photodermatology, 2019',
      finding: 'Zinc oxide provides superior UVA1 protection compared to most chemical filters.',
      funding: 'independent',
    },
  ],
  alternatives: [
    {
      use_case: 'No white cast alternative',
      name: 'Ultra Matte Gel SPF 50',
      brand: 'Re\'equil',
      price: '₹695',
      benefits: ['Zero white cast', 'Gel texture', 'Water-resistant'],
      best_for: 'Deep skin tones wanting zero white cast',
      trade_off: 'Uses chemical filters — not suitable for very sensitive skin',
    },
    {
      use_case: 'Premium mineral option',
      name: 'UV Clear SPF 46',
      brand: 'EltaMD',
      price: '₹3,200',
      benefits: ['Niacinamide infused', 'Truly invisible', 'Derm-favourite'],
      best_for: 'Those willing to invest for the best mineral sunscreen',
      trade_off: '7x the price with minimal practical improvement for most users',
    },
  ],
};

const DOT_KEY_MOCK: ProductDetailMock = {
  match_percentage: 76,
  jay_score: 7.2,
  formula_safety: 80,
  report_card: {
    ingredient_quality: 7.0,
    formula_safety: 7.5,
    value_for_money: 7.0,
    brand_transparency: 6.5,
    user_satisfaction: 8.0,
    derm_endorsement: 5.5,
  },
  jay_says:
    'Dot & Key makes skincare fun with vibrant packaging and pleasant textures. The formulations are decent but lean more towards sensorial experience than clinical potency. Good for skincare beginners.',
  why_recommends: [
    'Approachable textures that make routine-building enjoyable',
    'Wide availability across Indian e-commerce platforms',
    'Good option for skincare newcomers who value experience alongside results',
  ],
  positives: [
    'Attractive, Instagram-worthy packaging',
    'Pleasant textures and mild scents',
    'Widely available on Nykaa, Amazon, Flipkart',
    'Good range covering multiple skin concerns',
  ],
  limitations: [
    'Contains fragrance in most products',
    'Ingredient concentrations not disclosed',
    'Marketing claims sometimes overstate clinical efficacy',
    'Premium pricing for what the formulation offers',
  ],
  certifications: ['Cruelty-Free'],
  skin_type_targets: ['Normal', 'Combination', 'Dry'],
  ingredients_detail: [
    { name: 'Vitamin C (Ascorbyl Glucoside)', concentration: 'Undisclosed', efficacy: 'likely_efficacious', description: 'Gentle Vitamin C derivative for mild brightening.' },
    { name: 'Hyaluronic Acid', concentration: 'Undisclosed', efficacy: 'likely_efficacious', description: 'Provides surface-level hydration.' },
    { name: 'Niacinamide', concentration: 'Undisclosed', efficacy: 'likely_efficacious', description: 'Supports barrier and evens skin tone — concentration may be below clinical threshold.' },
  ],
  safety_flags: [
    { flag: 'Fragrance', status: 'Present', safe: false },
    { flag: 'Parabens', status: 'Free', safe: true },
    { flag: 'SLS / SLES', status: 'Free', safe: true },
    { flag: 'Essential Oils', status: 'Present in some products', safe: false },
  ],
  formula_richness: 60,
  price_sizes: [
    { size: '50 ml', platform: 'Nykaa', price: 595, best_value: true },
    { size: '50 ml', platform: 'Amazon India', price: 620, best_value: false },
  ],
  expert_opinions: [
    {
      name: 'Dr. Vanita Rattan',
      credentials: 'Cosmetic Formulator',
      platform: 'YouTube',
      verdict: 'mixed',
      quote: 'Pretty packaging but I\'d like to see concentration disclosures. You\'re paying for the experience more than the actives.',
    },
  ],
  clinical_studies: [
    {
      name: 'Ascorbyl Glucoside Brightening',
      source: 'Skin Pharmacology and Physiology, 2019',
      finding: 'Ascorbyl glucoside shows moderate brightening at 2%+ concentration — unclear if Dot & Key reaches this threshold.',
      funding: 'independent',
    },
  ],
  alternatives: [
    {
      use_case: 'More transparent alternative',
      name: 'Vitamin C 10% Serum',
      brand: 'Minimalist',
      price: '₹349',
      benefits: ['Full concentration disclosed', 'Clinical-grade ingredients', 'Lower price'],
      best_for: 'Those who prioritise efficacy and transparency over experience',
      trade_off: 'Less luxurious texture and packaging',
    },
  ],
};

const PLUM_GREEN_TEA_MOCK: ProductDetailMock = {
  match_percentage: 80,
  jay_score: 7.8,
  formula_safety: 86,
  report_card: {
    ingredient_quality: 7.5,
    formula_safety: 8.2,
    value_for_money: 8.0,
    brand_transparency: 7.5,
    user_satisfaction: 8.2,
    derm_endorsement: 6.5,
  },
  jay_says:
    'Plum\'s Green Tea range is a reliable choice for oily and acne-prone skin. The formulations are clean and the brand\'s vegan commitment is genuine. Not the most potent, but consistently well-received.',
  why_recommends: [
    'Green tea extract is a proven antioxidant and anti-inflammatory ingredient',
    '100% vegan and cruelty-free — certified by PETA',
    'Well-suited for oily Indian skin types in humid climates',
  ],
  positives: [
    'Lightweight, oil-free formulations',
    'Contains real green tea extracts with antioxidant benefits',
    'Matte finish ideal for humid conditions',
    'Vegan and cruelty-free certified',
    'Pleasant, subtle green tea scent',
  ],
  limitations: [
    'Contains natural fragrance — may still sensitise reactive skin',
    'Green tea alone won\'t treat active acne — complementary actives needed',
    'Some products in the range contain silicones',
  ],
  certifications: ['PETA Certified Vegan', 'Cruelty-Free', 'Paraben-Free'],
  skin_type_targets: ['Oily', 'Combination', 'Acne-Prone'],
  ingredients_detail: [
    { name: 'Green Tea Extract', concentration: '2-5%', efficacy: 'likely_efficacious', description: 'Rich in EGCG — reduces sebum, provides antioxidant protection, and calms inflammation.' },
    { name: 'Glycolic Acid', concentration: '1-2%', efficacy: 'likely_efficacious', description: 'Mild chemical exfoliation to unclog pores and improve texture.' },
    { name: 'Salicylic Acid', concentration: '0.5-1%', efficacy: 'efficacious', description: 'BHA that penetrates pores to reduce breakouts.' },
  ],
  safety_flags: [
    { flag: 'Fragrance', status: 'Natural fragrance present', safe: false },
    { flag: 'Parabens', status: 'Free', safe: true },
    { flag: 'SLS / SLES', status: 'Free', safe: true },
    { flag: 'Silicones', status: 'Present in some products', safe: true },
  ],
  formula_richness: 70,
  price_sizes: [
    { size: '100 ml', platform: 'Plum Website', price: 375, best_value: true },
    { size: '100 ml', platform: 'Nykaa', price: 375, best_value: true },
    { size: '100 ml', platform: 'Amazon India', price: 399, best_value: false },
  ],
  expert_opinions: [
    {
      name: 'Dr. Kiran Sethi',
      credentials: 'Dermatologist, Delhi',
      platform: 'Instagram',
      verdict: 'positive',
      quote: 'The green tea face wash is one of the better drugstore options for oily skin. Good cleansing without over-stripping.',
    },
    {
      name: 'Malvika Sitlani',
      credentials: 'Beauty Creator',
      platform: 'YouTube',
      verdict: 'positive',
      quote: 'Plum Green Tea is my go-to recommendation for friends starting a skincare routine on a budget.',
    },
  ],
  clinical_studies: [
    {
      name: 'EGCG and Sebum Regulation',
      source: 'Journal of Investigative Dermatology, 2016',
      finding: 'Topical EGCG from green tea reduced sebum production by 27% and improved acne lesion counts after 8 weeks.',
      funding: 'independent',
    },
  ],
  alternatives: [
    {
      use_case: 'Stronger acne control',
      name: 'Salicylic Acid 2% Face Wash',
      brand: 'Minimalist',
      price: '₹299',
      benefits: ['Higher BHA concentration', 'Clinically dosed', 'No fragrance'],
      best_for: 'Active acne that needs stronger exfoliation',
      trade_off: 'Can be drying — needs good moisturiser follow-up',
    },
    {
      use_case: 'Premium antioxidant',
      name: 'Green Tea Seed Serum',
      brand: 'Innisfree',
      price: '₹1,350',
      benefits: ['Concentrated green tea from Jeju Island', 'Elegant texture', 'Hydrating'],
      best_for: 'Those wanting premium Korean green tea skincare',
      trade_off: 'Higher price for a similar core ingredient',
    },
  ],
};

// ── Name pattern matching ────────────────────────────────────────────────

const PRODUCT_MOCKS: { pattern: RegExp; mock: ProductDetailMock }[] = [
  { pattern: /cerave/i, mock: CERAVE_MOCK },
  { pattern: /minimalist.*vitamin\s*c/i, mock: MINIMALIST_VITAMIN_C_MOCK },
  { pattern: /minimalist.*niacinamide/i, mock: MINIMALIST_NIACINAMIDE_MOCK },
  { pattern: /la\s*shield/i, mock: LA_SHIELD_MOCK },
  { pattern: /dot\s*[&]\s*key/i, mock: DOT_KEY_MOCK },
  { pattern: /plum.*green\s*tea/i, mock: PLUM_GREEN_TEA_MOCK },
];

export function getProductMock(
  _productId: number,
  productName: string,
): ProductDetailMock {
  for (const { pattern, mock } of PRODUCT_MOCKS) {
    if (pattern.test(productName)) return mock;
  }
  return DEFAULT_MOCK;
}
