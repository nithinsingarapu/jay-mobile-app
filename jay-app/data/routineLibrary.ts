// ─── Routine Library ────────────────────────────────────────────
// 41 skincare routine templates across 6 categories

export interface RoutineTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  stepCount: string;
  category: 'core' | 'concern' | 'cultural' | 'trending' | 'life_stage' | 'body_zone';
  tags: string[];
  tintColor: string;
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

// ═══════════════════════════════════════════════════════════════
// CORE ROUTINES (5)
// ═══════════════════════════════════════════════════════════════

const essential_3step: RoutineTemplate = {
  id: 'essential_3step',
  name: 'Essential 3-Step',
  emoji: '🧴',
  description: 'Cleanse, moisturize, protect — the non-negotiable foundation.',
  difficulty: 'beginner',
  stepCount: '3',
  category: 'core',
  tags: ['minimal', 'daily', 'foundation'],
  tintColor: '#30D158',
  philosophy: 'Skincare doesn\'t need to be complicated. Three well-chosen products deliver 80% of results. Consistency beats complexity every time.',
  protocol: [
    { step: 1, name: 'Cleanse', description: 'Gentle gel or cream cleanser, 60 seconds.', color: '#64D2FF' },
    { step: 2, name: 'Moisturize', description: 'Lightweight lotion or cream for hydration and barrier support.', color: '#30D158' },
    { step: 3, name: 'Protect', description: 'Broad-spectrum SPF 30+ every morning, reapply every 2 hours.', color: '#FFD60A' },
  ],
  keyIngredients: ['Ceramides', 'Hyaluronic acid', 'Zinc oxide'],
  bestFor: ['Beginners', 'Minimal routines', 'Sensitive skin'],
  source: 'AAD (American Academy of Dermatology)',
};

const standard_4step: RoutineTemplate = {
  id: 'standard_4step',
  name: 'Standard 4-Step',
  emoji: '💧',
  description: 'Adds a targeted treatment serum to the essential trio.',
  difficulty: 'beginner',
  stepCount: '4',
  category: 'core',
  tags: ['standard', 'daily', 'serum'],
  tintColor: '#0A84FF',
  philosophy: 'One active serum layered between cleansing and moisturizing lets you address a specific concern without overcomplicating things.',
  protocol: [
    { step: 1, name: 'Cleanse', description: 'Water-based cleanser matched to your skin type.', color: '#64D2FF' },
    { step: 2, name: 'Treat', description: 'One targeted serum (vitamin C, niacinamide, or hyaluronic acid).', color: '#BF5AF2' },
    { step: 3, name: 'Moisturize', description: 'Barrier-supporting moisturizer with ceramides.', color: '#30D158' },
    { step: 4, name: 'Protect', description: 'SPF 30-50 broad-spectrum sunscreen (AM only).', color: '#FFD60A' },
  ],
  keyIngredients: ['Niacinamide', 'Vitamin C', 'Ceramides', 'SPF filters'],
  bestFor: ['Everyday use', 'Most skin types', 'Building a routine'],
  source: 'Dermatologist consensus',
};

const standard_5_6: RoutineTemplate = {
  id: 'standard_5_6',
  name: 'Standard 5-6 Step',
  emoji: '💧',
  description: 'Adds exfoliation and eye care for more complete coverage.',
  difficulty: 'intermediate',
  stepCount: '5-6',
  category: 'core',
  tags: ['intermediate', 'complete', 'exfoliation'],
  tintColor: '#5E5CE6',
  philosophy: 'Regular exfoliation accelerates cell turnover while a dedicated eye product addresses the thinnest skin on your face. Balance active nights with recovery.',
  protocol: [
    { step: 1, name: 'Cleanse', description: 'Double cleanse PM: oil-based first, then water-based.', color: '#64D2FF' },
    { step: 2, name: 'Exfoliate', description: 'AHA/BHA 2-3x per week in the evening.', color: '#FF9F0A' },
    { step: 3, name: 'Treat', description: 'Active serum (retinol, vitamin C, or peptides).', color: '#BF5AF2' },
    { step: 4, name: 'Eye Cream', description: 'Peptide or caffeine eye cream for fine lines and puffiness.', color: '#FF375F' },
    { step: 5, name: 'Moisturize', description: 'Rich cream PM, lightweight lotion AM.', color: '#30D158' },
    { step: 6, name: 'Protect', description: 'SPF 50 with PA++++ rating (AM only).', color: '#FFD60A' },
  ],
  keyIngredients: ['Glycolic acid', 'Retinol', 'Peptides', 'Caffeine', 'Squalane'],
  bestFor: ['Intermediate users', 'Anti-aging goals', 'Combination skin'],
  source: 'Evidence-based dermatology',
};

const extended_7_9: RoutineTemplate = {
  id: 'extended_7_9',
  name: 'Extended 7-9 Step',
  emoji: '🔬',
  description: 'A layered approach with toner, essences, and targeted treatments.',
  difficulty: 'intermediate',
  stepCount: '7-9',
  category: 'core',
  tags: ['advanced', 'layering', 'multi-step'],
  tintColor: '#BF5AF2',
  philosophy: 'Strategic layering of thin, hydrating layers delivers actives at multiple depths. Each product serves a distinct purpose — no redundancy.',
  protocol: [
    { step: 1, name: 'Oil Cleanse', description: 'Dissolve sunscreen, makeup, and sebum with a cleansing oil.', color: '#FFD60A' },
    { step: 2, name: 'Water Cleanse', description: 'Low-pH gel or foam cleanser to purify.', color: '#64D2FF' },
    { step: 3, name: 'Toner', description: 'Hydrating or pH-balancing toner, pat into skin.', color: '#30D158' },
    { step: 4, name: 'Essence', description: 'Lightweight ferment or hydrating essence for glow.', color: '#5E5CE6' },
    { step: 5, name: 'Serum', description: 'Concentrated active targeting your primary concern.', color: '#BF5AF2' },
    { step: 6, name: 'Eye Care', description: 'Targeted eye cream or gel, ring finger application.', color: '#FF375F' },
    { step: 7, name: 'Moisturize', description: 'Emollient cream to seal in layers.', color: '#30D158' },
  ],
  keyIngredients: ['Fermented extracts', 'Snail mucin', 'Centella asiatica', 'Propolis'],
  bestFor: ['Skincare enthusiasts', 'Dry or dehydrated skin', 'K-beauty fans'],
  source: 'K-beauty layering method',
};

const kbeauty_10: RoutineTemplate = {
  id: 'kbeauty_10',
  name: 'K-Beauty 10-Step',
  emoji: '✨',
  description: 'The legendary Korean full routine — maximum hydration layers.',
  difficulty: 'advanced',
  stepCount: '10',
  category: 'core',
  tags: ['k-beauty', 'full', 'glass-skin', 'hydration'],
  tintColor: '#FF9F0A',
  philosophy: 'Thin hydrating layers build on each other like lacquer, creating translucent, dewy "glass skin." Prevention over correction. Hydration is everything.',
  protocol: [
    { step: 1, name: 'Oil Cleanser', description: 'Emulsifying oil to melt away sunscreen and makeup.', color: '#FFD60A' },
    { step: 2, name: 'Water Cleanser', description: 'Low-pH foam or gel for a fresh base.', color: '#64D2FF' },
    { step: 3, name: 'Exfoliator', description: 'Gentle chemical exfoliant 1-2x per week.', color: '#FF9F0A' },
    { step: 4, name: 'Toner', description: 'Hydrating toner applied in 3-7 thin layers.', color: '#30D158' },
    { step: 5, name: 'Essence', description: 'Fermented essence for radiance and repair.', color: '#5E5CE6' },
    { step: 6, name: 'Serum / Ampoule', description: 'High-concentrate ampoule for targeted treatment.', color: '#BF5AF2' },
    { step: 7, name: 'Sheet Mask', description: 'Serum-soaked mask, 15-20 min, 2-3x per week.', color: '#FF375F' },
    { step: 8, name: 'Eye Cream', description: 'Nourishing eye cream with ginseng or peptides.', color: '#FF375F' },
    { step: 9, name: 'Moisturizer', description: 'Lightweight emulsion AM, richer cream PM.', color: '#30D158' },
    { step: 10, name: 'SPF / Sleeping Pack', description: 'SPF 50+ AM; occlusive sleeping mask PM.', color: '#FFD60A' },
  ],
  keyIngredients: ['Galactomyces ferment', 'Snail mucin', 'Ginseng', 'Rice extract', 'Green tea'],
  bestFor: ['Glass skin seekers', 'Dry / dehydrated skin', 'Skincare maximalists'],
  source: 'Korean beauty tradition',
};

// ═══════════════════════════════════════════════════════════════
// CONCERN-BASED ROUTINES (8)
// ═══════════════════════════════════════════════════════════════

const acne: RoutineTemplate = {
  id: 'acne',
  name: 'Acne-Fighting',
  emoji: '🩹',
  description: 'Targets breakouts with BHAs, benzoyl peroxide, and gentle care.',
  difficulty: 'intermediate',
  stepCount: '4-5',
  category: 'concern',
  tags: ['acne', 'breakouts', 'blemish', 'oily'],
  tintColor: '#FF375F',
  philosophy: 'Fight bacteria and unclog pores without nuking your barrier. Gentle consistency outperforms aggressive stripping every time.',
  protocol: [
    { step: 1, name: 'Gentle Cleanse', description: 'Non-foaming or low-pH cleanser — no harsh sulfates.', color: '#64D2FF' },
    { step: 2, name: 'BHA Treatment', description: '2% salicylic acid to dissolve pore congestion.', color: '#FF375F' },
    { step: 3, name: 'Spot Treat', description: 'Benzoyl peroxide 2.5% or hydrocolloid patches on active spots.', color: '#FF9F0A' },
    { step: 4, name: 'Oil-Free Moisturize', description: 'Lightweight gel cream with niacinamide.', color: '#30D158' },
    { step: 5, name: 'SPF', description: 'Non-comedogenic mineral or chemical SPF 30+.', color: '#FFD60A' },
  ],
  keyIngredients: ['Salicylic acid', 'Benzoyl peroxide', 'Niacinamide', 'Zinc', 'Tea tree oil'],
  bestFor: ['Oily / acne-prone skin', 'Teens and young adults', 'Hormonal breakouts'],
  source: 'AAD acne treatment guidelines',
};

const anti_aging: RoutineTemplate = {
  id: 'anti_aging',
  name: 'Anti-Aging',
  emoji: '⏳',
  description: 'Retinoids, peptides, and antioxidants to slow visible aging.',
  difficulty: 'intermediate',
  stepCount: '5-6',
  category: 'concern',
  tags: ['anti-aging', 'wrinkles', 'firmness', 'retinol'],
  tintColor: '#5E5CE6',
  philosophy: 'Prevention is easier than correction. Retinoids rebuild collagen, antioxidants neutralize free radicals, and SPF prevents 90% of photoaging.',
  protocol: [
    { step: 1, name: 'Gentle Cleanse', description: 'Cream or milky cleanser that won\'t strip lipids.', color: '#64D2FF' },
    { step: 2, name: 'Antioxidant Serum', description: 'Vitamin C 15-20% in the morning for photoprotection.', color: '#FFD60A' },
    { step: 3, name: 'Retinoid (PM)', description: 'Retinol 0.3-1% or tretinoin — start low, increase slowly.', color: '#BF5AF2' },
    { step: 4, name: 'Peptide Eye Cream', description: 'Matrixyl or copper peptides around the orbital bone.', color: '#FF375F' },
    { step: 5, name: 'Rich Moisturizer', description: 'Ceramide-rich cream to buffer retinoid dryness.', color: '#30D158' },
    { step: 6, name: 'SPF 50', description: 'High-protection broad-spectrum, reapply every 2 hours outdoors.', color: '#FFD60A' },
  ],
  keyIngredients: ['Retinol / Tretinoin', 'Vitamin C', 'Peptides', 'Hyaluronic acid', 'Niacinamide'],
  bestFor: ['Fine lines and wrinkles', 'Loss of firmness', 'Preventative care in your 20s+'],
  source: 'Peer-reviewed dermatology research',
};

const hyperpigmentation: RoutineTemplate = {
  id: 'hyperpigmentation',
  name: 'Hyperpigmentation',
  emoji: '🌗',
  description: 'Brightening actives to fade dark spots and even skin tone.',
  difficulty: 'intermediate',
  stepCount: '5',
  category: 'concern',
  tags: ['dark-spots', 'brightening', 'melasma', 'PIH'],
  tintColor: '#FFD60A',
  philosophy: 'Melanin suppression works best as a multi-pathway approach. Combine tyrosinase inhibitors with exfoliation and rigorous sun protection.',
  protocol: [
    { step: 1, name: 'Gentle Cleanse', description: 'Non-exfoliating cleanser to avoid irritation.', color: '#64D2FF' },
    { step: 2, name: 'Vitamin C Serum', description: 'L-ascorbic acid 10-20% AM to inhibit melanin synthesis.', color: '#FFD60A' },
    { step: 3, name: 'Brightening Treatment', description: 'Alpha arbutin, tranexamic acid, or azelaic acid PM.', color: '#BF5AF2' },
    { step: 4, name: 'Moisturize', description: 'Niacinamide-rich moisturizer to reduce melanin transfer.', color: '#30D158' },
    { step: 5, name: 'High SPF', description: 'SPF 50+ PA++++ — the single most important step.', color: '#FFD60A' },
  ],
  keyIngredients: ['Vitamin C', 'Alpha arbutin', 'Tranexamic acid', 'Azelaic acid', 'Niacinamide'],
  bestFor: ['Post-inflammatory hyperpigmentation', 'Melasma', 'Sun spots'],
  source: 'Dermatology pigmentation studies',
};

const rosacea: RoutineTemplate = {
  id: 'rosacea',
  name: 'Rosacea-Calming',
  emoji: '🌡️',
  description: 'Ultra-gentle routine to reduce redness and flare-ups.',
  difficulty: 'beginner',
  stepCount: '3-4',
  category: 'concern',
  tags: ['rosacea', 'redness', 'calming', 'gentle'],
  tintColor: '#FF9F0A',
  philosophy: 'Less is more. Avoid triggers, strengthen the barrier, and soothe inflammation. Never use physical scrubs or strong actives.',
  protocol: [
    { step: 1, name: 'Micellar Cleanse', description: 'Fragrance-free micellar water or gentle cream cleanser.', color: '#64D2FF' },
    { step: 2, name: 'Anti-Redness Serum', description: 'Azelaic acid 10-15% or centella asiatica serum.', color: '#30D158' },
    { step: 3, name: 'Barrier Cream', description: 'Thick, fragrance-free cream with ceramides and squalane.', color: '#BF5AF2' },
    { step: 4, name: 'Mineral SPF', description: 'Zinc oxide mineral sunscreen — less irritating than chemical.', color: '#FFD60A' },
  ],
  keyIngredients: ['Azelaic acid', 'Centella asiatica', 'Niacinamide', 'Zinc oxide'],
  bestFor: ['Rosacea subtypes 1-2', 'Chronic redness', 'Reactive skin'],
  source: 'National Rosacea Society guidelines',
};

const sensitive: RoutineTemplate = {
  id: 'sensitive',
  name: 'Sensitive Skin',
  emoji: '🌸',
  description: 'Minimal, fragrance-free routine to calm reactive skin.',
  difficulty: 'beginner',
  stepCount: '3',
  category: 'concern',
  tags: ['sensitive', 'fragrance-free', 'minimal', 'calming'],
  tintColor: '#FF375F',
  philosophy: 'Strip your routine down to essentials. Avoid fragrance, essential oils, and drying alcohols. Patch test everything for 48 hours.',
  protocol: [
    { step: 1, name: 'Cream Cleanse', description: 'Fragrance-free, non-foaming cream or oil cleanser.', color: '#64D2FF' },
    { step: 2, name: 'Soothe & Moisturize', description: 'Ceramide + oat-based moisturizer to repair and calm.', color: '#30D158' },
    { step: 3, name: 'Mineral SPF', description: 'Physical-only sunscreen with zinc oxide.', color: '#FFD60A' },
  ],
  keyIngredients: ['Colloidal oatmeal', 'Ceramides', 'Allantoin', 'Bisabolol'],
  bestFor: ['Easily irritated skin', 'Post-procedure recovery', 'Eczema-prone skin'],
  source: 'Dermatologist recommendations for reactive skin',
};

const barrier_repair: RoutineTemplate = {
  id: 'barrier_repair',
  name: 'Barrier Repair',
  emoji: '🛡️',
  description: 'Rebuild a damaged moisture barrier with lipid-rich care.',
  difficulty: 'beginner',
  stepCount: '3-4',
  category: 'concern',
  tags: ['barrier', 'repair', 'ceramides', 'recovery'],
  tintColor: '#30D158',
  philosophy: 'Stop all actives. Focus on the 3:1:1 ratio of ceramides, cholesterol, and fatty acids to mimic the skin\'s natural lipid matrix.',
  protocol: [
    { step: 1, name: 'Oil Cleanse Only', description: 'Single gentle oil cleanse — skip foaming cleansers entirely.', color: '#64D2FF' },
    { step: 2, name: 'Hydrating Toner', description: 'Alcohol-free toner with hyaluronic acid on damp skin.', color: '#5E5CE6' },
    { step: 3, name: 'Lipid Moisturizer', description: 'Ceramide + cholesterol + fatty acid cream (3:1:1 ratio).', color: '#30D158' },
    { step: 4, name: 'Occlusive Seal', description: 'Thin layer of petrolatum or squalane to lock moisture in.', color: '#FFD60A' },
  ],
  keyIngredients: ['Ceramides NP/AP/EOP', 'Cholesterol', 'Fatty acids', 'Petrolatum'],
  bestFor: ['Over-exfoliated skin', 'Retinoid damage', 'Winter dryness'],
  source: 'Skin barrier research (Elias & Feingold)',
};

const eczema: RoutineTemplate = {
  id: 'eczema',
  name: 'Eczema Care',
  emoji: '🧴',
  description: 'Soak-and-seal approach to manage atopic dermatitis flares.',
  difficulty: 'beginner',
  stepCount: '3',
  category: 'concern',
  tags: ['eczema', 'atopic', 'dry', 'soak-seal'],
  tintColor: '#64D2FF',
  philosophy: 'The soak-and-seal method traps water in the skin immediately after bathing. Avoid irritants, keep nails short, and moisturize relentlessly.',
  protocol: [
    { step: 1, name: 'Lukewarm Soak', description: '5-10 min lukewarm bath — no hot water, no soap on affected areas.', color: '#64D2FF' },
    { step: 2, name: 'Pat & Apply', description: 'Pat skin to damp, immediately apply thick emollient or rx cream.', color: '#30D158' },
    { step: 3, name: 'Seal', description: 'Petrolatum or healing ointment over the emollient to lock in moisture.', color: '#FFD60A' },
  ],
  keyIngredients: ['Colloidal oatmeal', 'Petrolatum', 'Ceramides', 'Shea butter'],
  bestFor: ['Atopic dermatitis', 'Chronic dry patches', 'Children and adults'],
  source: 'National Eczema Association soak-and-seal method',
};

const psoriasis: RoutineTemplate = {
  id: 'psoriasis',
  name: 'Psoriasis Support',
  emoji: '🩺',
  description: 'Gentle descaling and deep moisturizing for plaque psoriasis.',
  difficulty: 'intermediate',
  stepCount: '4',
  category: 'concern',
  tags: ['psoriasis', 'plaque', 'scaling', 'medicated'],
  tintColor: '#0A84FF',
  philosophy: 'Soften and remove scales gently before applying treatments. Never pick or scratch plaques. Combine emollients with prescribed therapies.',
  protocol: [
    { step: 1, name: 'Scale Softening', description: 'Apply salicylic acid 2-3% or urea 10% to loosen plaques.', color: '#FF9F0A' },
    { step: 2, name: 'Gentle Wash', description: 'Coal tar or medicated cleanser on affected areas.', color: '#64D2FF' },
    { step: 3, name: 'Treatment', description: 'Prescribed topical (corticosteroid or vitamin D analog).', color: '#BF5AF2' },
    { step: 4, name: 'Heavy Emollient', description: 'Thick ointment or balm to seal in medication and moisture.', color: '#30D158' },
  ],
  keyIngredients: ['Salicylic acid', 'Urea', 'Coal tar', 'Vitamin D analogs'],
  bestFor: ['Plaque psoriasis', 'Scalp psoriasis', 'Chronic scaling conditions'],
  source: 'National Psoriasis Foundation',
};

// ═══════════════════════════════════════════════════════════════
// CULTURAL ROUTINES (7)
// ═══════════════════════════════════════════════════════════════

const korean_glass: RoutineTemplate = {
  id: 'korean_glass',
  name: 'Korean Glass Skin',
  emoji: '🇰🇷',
  description: 'Achieve translucent, dewy "glass skin" through hydration layering.',
  difficulty: 'advanced',
  stepCount: '7-10',
  category: 'cultural',
  tags: ['k-beauty', 'glass-skin', 'hydration', 'glow'],
  tintColor: '#64D2FF',
  philosophy: 'Glass skin is built layer by layer — each watery product adds luminosity. Hydration is the foundation of Korean beauty philosophy.',
  protocol: [
    { step: 1, name: 'Double Cleanse', description: 'Oil cleanser then low-pH water cleanser.', color: '#64D2FF' },
    { step: 2, name: '7-Skin Method', description: 'Pat 3-7 layers of hydrating toner onto skin.', color: '#30D158' },
    { step: 3, name: 'Essence', description: 'Fermented essence (galactomyces or saccharomyces).', color: '#5E5CE6' },
    { step: 4, name: 'Serum Layer', description: 'Hyaluronic acid or snail mucin serum for bounce.', color: '#BF5AF2' },
    { step: 5, name: 'Sheet Mask', description: 'Hydrating sheet mask 2-3x per week.', color: '#FF375F' },
    { step: 6, name: 'Moisturizer + SPF', description: 'Dewy moisturizer AM, sleeping pack PM; always SPF.', color: '#FFD60A' },
  ],
  keyIngredients: ['Galactomyces ferment', 'Snail mucin', 'Hyaluronic acid', 'Centella', 'Rice water'],
  bestFor: ['Dewy glow seekers', 'Dehydrated skin', 'Luminosity goals'],
  source: 'Korean beauty tradition',
};

const japanese_mochi: RoutineTemplate = {
  id: 'japanese_mochi',
  name: 'Japanese Mochi Skin',
  emoji: '🇯🇵',
  description: 'Pillowy-soft, bouncy skin through gentle cleansing and lotion layering.',
  difficulty: 'intermediate',
  stepCount: '5-6',
  category: 'cultural',
  tags: ['j-beauty', 'mochi-skin', 'gentle', 'minimal'],
  tintColor: '#FF9F0A',
  philosophy: 'Japanese beauty prizes texture over shimmer — soft, bouncy "mochi hada." Gentle products, UV obsession, and less-is-more layering.',
  protocol: [
    { step: 1, name: 'Oil Cleanse', description: 'Lightweight cleansing oil to dissolve impurities.', color: '#FFD60A' },
    { step: 2, name: 'Foaming Wash', description: 'Whipped foam cleanser using a foaming net for micro-bubbles.', color: '#64D2FF' },
    { step: 3, name: 'Lotion (Toner)', description: 'Japanese "lotion" — a watery hydrator patted into skin.', color: '#30D158' },
    { step: 4, name: 'Milky Emulsion', description: 'Light milky moisturizer to seal in hydration.', color: '#BF5AF2' },
    { step: 5, name: 'UV Protection', description: 'Japanese SPF 50+ PA++++ — world-class UV filters.', color: '#FFD60A' },
  ],
  keyIngredients: ['Rice bran', 'Sake / Koji extract', 'Camellia oil', 'Green tea', 'Yuzu'],
  bestFor: ['Soft texture goals', 'Normal to dry skin', 'Elegant minimal routines'],
  source: 'Japanese beauty tradition (J-beauty)',
};

const ayurvedic: RoutineTemplate = {
  id: 'ayurvedic',
  name: 'Ayurvedic Ritual',
  emoji: '🇮🇳',
  description: 'Dosha-balanced skincare using herbs, oils, and ancient wisdom.',
  difficulty: 'intermediate',
  stepCount: '4-5',
  category: 'cultural',
  tags: ['ayurveda', 'herbal', 'holistic', 'dosha'],
  tintColor: '#FF9F0A',
  philosophy: 'Ayurveda treats skin as a mirror of internal balance. Match products to your dosha (Vata/Pitta/Kapha) and use herbal ingredients with centuries of tradition.',
  protocol: [
    { step: 1, name: 'Oil Massage (Abhyanga)', description: 'Warm sesame or coconut oil facial massage, 2-3 min.', color: '#FFD60A' },
    { step: 2, name: 'Herbal Cleanse', description: 'Ubtan (chickpea flour + turmeric + milk paste).', color: '#FF9F0A' },
    { step: 3, name: 'Rose Water Tone', description: 'Spritz pure rose water to balance pH and soothe.', color: '#FF375F' },
    { step: 4, name: 'Herbal Serum', description: 'Kumkumadi or saffron-infused oil for radiance.', color: '#BF5AF2' },
    { step: 5, name: 'Light Moisturize', description: 'Aloe vera gel or shea butter based on dosha.', color: '#30D158' },
  ],
  keyIngredients: ['Turmeric', 'Saffron', 'Neem', 'Sandalwood', 'Rose water'],
  bestFor: ['Holistic approach lovers', 'Herbal/natural preference', 'Pitta (sensitive) skin'],
  source: 'Ayurvedic skincare tradition (5000+ years)',
};

const french_pharmacy: RoutineTemplate = {
  id: 'french_pharmacy',
  name: 'French Pharmacy',
  emoji: '🇫🇷',
  description: 'Effortless, science-backed minimalism from French pharmacies.',
  difficulty: 'beginner',
  stepCount: '3-4',
  category: 'cultural',
  tags: ['french', 'pharmacy', 'micellar', 'effortless'],
  tintColor: '#5E5CE6',
  philosophy: 'French women never overdo skincare. One excellent cleanser, one treatment, one moisturizer. Thermal water, micellar cleansing, and trusted pharmacy brands.',
  protocol: [
    { step: 1, name: 'Micellar Cleanse', description: 'Micellar water on cotton — no rinsing needed.', color: '#64D2FF' },
    { step: 2, name: 'Thermal Water Mist', description: 'Spritz thermal spring water to soothe and mineralize.', color: '#30D158' },
    { step: 3, name: 'Treatment Cream', description: 'One multi-tasking cream with active ingredients.', color: '#BF5AF2' },
    { step: 4, name: 'SPF', description: 'European SPF 50+ with superior UVA protection.', color: '#FFD60A' },
  ],
  keyIngredients: ['Thermal spring water', 'La Roche-Posay Cicaplast', 'Niacinamide', 'Shea butter'],
  bestFor: ['Low-maintenance seekers', 'Sensitive skin', 'Pharmacy brand fans'],
  source: 'French pharmacie skincare tradition',
};

const tcm: RoutineTemplate = {
  id: 'tcm',
  name: 'TCM Herbal',
  emoji: '🇨🇳',
  description: 'Traditional Chinese Medicine approach to skin as a reflection of Qi.',
  difficulty: 'intermediate',
  stepCount: '4-5',
  category: 'cultural',
  tags: ['tcm', 'chinese', 'herbal', 'qi', 'gua-sha'],
  tintColor: '#30D158',
  philosophy: 'TCM views skin issues as internal imbalances manifesting externally. Herbal formulas, facial gua sha, and jade tools stimulate Qi and blood flow.',
  protocol: [
    { step: 1, name: 'Herbal Cleanser', description: 'Green tea or ginseng-based cleanser.', color: '#30D158' },
    { step: 2, name: 'Gua Sha Massage', description: 'Jade or bian stone gua sha to move lymph and Qi, 3-5 min.', color: '#64D2FF' },
    { step: 3, name: 'Herbal Essence', description: 'Ginseng, reishi, or astragalus-infused essence.', color: '#BF5AF2' },
    { step: 4, name: 'Herbal Moisturizer', description: 'Pearl powder or licorice root cream for brightening.', color: '#FFD60A' },
  ],
  keyIngredients: ['Ginseng', 'Pearl powder', 'Licorice root', 'Reishi mushroom', 'White tea'],
  bestFor: ['Holistic wellness approach', 'Dull or fatigued skin', 'Gua sha enthusiasts'],
  source: 'Traditional Chinese Medicine (2000+ years)',
};

const african: RoutineTemplate = {
  id: 'african',
  name: 'African Botanicals',
  emoji: '🌍',
  description: 'Potent plant oils and butters from Africa\'s biodiversity.',
  difficulty: 'beginner',
  stepCount: '3-4',
  category: 'cultural',
  tags: ['african', 'shea', 'marula', 'botanical', 'natural'],
  tintColor: '#FFD60A',
  philosophy: 'Africa\'s botanical biodiversity offers some of the richest skincare ingredients on earth — shea, marula, baobab. Simple routines, powerful plants.',
  protocol: [
    { step: 1, name: 'Black Soap Cleanse', description: 'African black soap (ose dudu) for deep yet gentle cleansing.', color: '#FF9F0A' },
    { step: 2, name: 'Botanical Oil', description: 'Marula, baobab, or argan oil patted onto damp skin.', color: '#FFD60A' },
    { step: 3, name: 'Shea Butter Seal', description: 'Raw shea butter to lock in moisture — especially on dry areas.', color: '#30D158' },
    { step: 4, name: 'SPF', description: 'Broad-spectrum SPF — essential for all skin tones.', color: '#FFD60A' },
  ],
  keyIngredients: ['Shea butter', 'Marula oil', 'Baobab oil', 'African black soap'],
  bestFor: ['Dry to very dry skin', 'Natural product lovers', 'Melanin-rich skin care'],
  source: 'West and East African beauty traditions',
};

const hammam: RoutineTemplate = {
  id: 'hammam',
  name: 'Hammam Ritual',
  emoji: '🕌',
  description: 'Steam, exfoliation, and argan oil — the Moroccan bathhouse experience.',
  difficulty: 'intermediate',
  stepCount: '5',
  category: 'cultural',
  tags: ['hammam', 'moroccan', 'steam', 'exfoliation', 'argan'],
  tintColor: '#FF9F0A',
  philosophy: 'The hammam ritual uses steam to open pores, a kessa glove to slough dead skin, and rhassoul clay to purify. Finish with argan oil for silk-soft skin.',
  protocol: [
    { step: 1, name: 'Steam', description: 'Steam face 5-10 min with a warm towel or facial steamer.', color: '#FF375F' },
    { step: 2, name: 'Black Soap (Savon Noir)', description: 'Apply Moroccan black soap paste, leave 5 min.', color: '#FF9F0A' },
    { step: 3, name: 'Kessa Exfoliation', description: 'Scrub with a kessa mitt in circular motions to remove dead skin.', color: '#BF5AF2' },
    { step: 4, name: 'Rhassoul Clay Mask', description: 'Mineral-rich clay mask for 10 min to purify and tighten.', color: '#5E5CE6' },
    { step: 5, name: 'Argan Oil Finish', description: 'Pure argan oil to nourish and seal freshly exfoliated skin.', color: '#FFD60A' },
  ],
  keyIngredients: ['Argan oil', 'Rhassoul clay', 'Savon noir', 'Orange blossom water'],
  bestFor: ['Weekly deep cleanse', 'Dull or congested skin', 'Spa ritual lovers'],
  source: 'Moroccan hammam tradition',
};

// ═══════════════════════════════════════════════════════════════
// TRENDING ROUTINES (7)
// ═══════════════════════════════════════════════════════════════

const skin_cycling: RoutineTemplate = {
  id: 'skin_cycling',
  name: 'Skin Cycling',
  emoji: '🔄',
  description: 'A 4-night rotation — exfoliate, retinoid, recover, recover — to maximize results while minimizing irritation.',
  difficulty: 'intermediate',
  stepCount: '4-night cycle',
  category: 'trending',
  tags: ['skin-cycling', 'rotation', 'retinoid', 'recovery', 'trending'],
  tintColor: '#0A84FF',
  philosophy: 'Skin cycling prevents the irritation spiral that comes from using actives every night. By strategically rotating exfoliation, retinoids, and recovery nights, your skin gets maximum benefit with minimal damage. Developed by board-certified dermatologist Dr. Whitney Bowe, this method has become the gold standard for introducing potent actives safely.',
  protocol: [
    {
      step: 1,
      name: 'Night 1 — Exfoliation',
      description: 'After cleansing, apply a chemical exfoliant (glycolic acid 5-10%, salicylic acid 2%, or a PHA). Follow with a lightweight moisturizer. This clears dead cells so the next night\'s retinoid penetrates better.',
      color: '#FF9F0A',
    },
    {
      step: 2,
      name: 'Night 2 — Retinoid',
      description: 'Apply retinol (0.3-1%) or prescription tretinoin on clean, dry skin. Wait 10-15 minutes, then apply a ceramide-rich moisturizer on top. The exfoliation from Night 1 primes skin for maximum retinoid absorption.',
      color: '#BF5AF2',
    },
    {
      step: 3,
      name: 'Night 3 — Recovery',
      description: 'No actives. Focus on hydration and barrier repair: hyaluronic acid serum, niacinamide, and a rich ceramide moisturizer. This lets the skin recover from the active nights and rebuild its lipid barrier.',
      color: '#30D158',
    },
    {
      step: 4,
      name: 'Night 4 — Recovery',
      description: 'Second recovery night. Continue with gentle, nourishing products — squalane, peptide serums, sleeping masks. After this night, the cycle restarts with exfoliation. Every morning: vitamin C serum + SPF 50.',
      color: '#30D158',
    },
  ],
  keyIngredients: ['Glycolic acid', 'Retinol / Tretinoin', 'Ceramides', 'Niacinamide', 'Hyaluronic acid'],
  bestFor: ['Retinol beginners', 'Irritation-prone skin', 'Anyone wanting a structured active schedule'],
  source: 'Dr. Whitney Bowe, board-certified dermatologist',
};

const slugging: RoutineTemplate = {
  id: 'slugging',
  name: 'Slugging',
  emoji: '🐌',
  description: 'Seal everything in with a petrolatum layer for overnight hydration.',
  difficulty: 'beginner',
  stepCount: '3-4',
  category: 'trending',
  tags: ['slugging', 'petrolatum', 'occlusive', 'overnight'],
  tintColor: '#30D158',
  philosophy: 'A thin petrolatum layer creates an occlusive seal that prevents 98% of transepidermal water loss overnight. Wake up with plump, dewy skin.',
  protocol: [
    { step: 1, name: 'Gentle Cleanse', description: 'Mild cleanser — no actives underneath slugging.', color: '#64D2FF' },
    { step: 2, name: 'Hydrating Layers', description: 'Hyaluronic acid serum + moisturizer on damp skin.', color: '#30D158' },
    { step: 3, name: 'The Slug', description: 'Thin layer of Vaseline, Aquaphor, or CeraVe Healing Ointment over everything.', color: '#FFD60A' },
  ],
  keyIngredients: ['Petrolatum', 'Hyaluronic acid', 'Ceramides'],
  bestFor: ['Very dry skin', 'Winter skincare', 'Overnight repair'],
  source: 'Reddit/SkincareAddiction community, backed by dermatology',
};

const skinimalism: RoutineTemplate = {
  id: 'skinimalism',
  name: 'Skinimalism',
  emoji: '🧘',
  description: 'Fewer products, better ingredients — embrace your natural skin.',
  difficulty: 'beginner',
  stepCount: '2-3',
  category: 'trending',
  tags: ['skinimalism', 'minimal', 'less-is-more', 'natural'],
  tintColor: '#30D158',
  philosophy: 'Skinimalism rejects the 10-step routine in favor of multi-tasking products and letting your natural skin texture show. Quality over quantity.',
  protocol: [
    { step: 1, name: 'One-Step Cleanse', description: 'Single gentle cleanser, skip the double cleanse.', color: '#64D2FF' },
    { step: 2, name: 'Multi-Tasker', description: 'One product that moisturizes + treats (tinted SPF with niacinamide, etc.).', color: '#BF5AF2' },
    { step: 3, name: 'SPF', description: 'Moisturizing SPF that replaces separate moisturizer.', color: '#FFD60A' },
  ],
  keyIngredients: ['Niacinamide', 'Squalane', 'SPF filters'],
  bestFor: ['Product fatigue sufferers', 'Healthy skin maintenance', 'Budget-conscious'],
  source: 'Skinimalism trend (Pinterest 2021+)',
};

const skin_fasting: RoutineTemplate = {
  id: 'skin_fasting',
  name: 'Skin Fasting',
  emoji: '⏸️',
  description: 'Periodically go product-free to let skin self-regulate.',
  difficulty: 'beginner',
  stepCount: '0-1',
  category: 'trending',
  tags: ['skin-fasting', 'reset', 'minimal', 'detox'],
  tintColor: '#5E5CE6',
  philosophy: 'Inspired by Japanese brand Mirai Clinical, skin fasting gives sebaceous glands a chance to recalibrate. Use nothing (or just water) for 1-3 days.',
  protocol: [
    { step: 1, name: 'Water-Only Cleanse', description: 'Splash face with lukewarm water — no cleanser.', color: '#64D2FF' },
    { step: 2, name: 'Observe', description: 'Monitor how skin behaves without products for 24-72 hours.', color: '#5E5CE6' },
    { step: 3, name: 'Reintroduce', description: 'Slowly reintroduce products one at a time to identify what your skin truly needs.', color: '#30D158' },
  ],
  keyIngredients: ['Water', 'Nothing else', 'Patience'],
  bestFor: ['Product overload reset', 'Identifying irritants', 'Oily skin recalibration'],
  source: 'Mirai Clinical / Japanese beauty philosophy',
};

const skip_care: RoutineTemplate = {
  id: 'skip_care',
  name: 'Skip-Care',
  emoji: '⏭️',
  description: 'Korean minimalism — skip redundant steps, keep what works.',
  difficulty: 'beginner',
  stepCount: '2-4',
  category: 'trending',
  tags: ['skip-care', 'korean', 'minimal', 'efficient'],
  tintColor: '#FF9F0A',
  philosophy: 'Skip-care evolved from K-beauty\'s own self-correction: why use 10 steps when 3 smart ones do the job? Multi-functional products replace redundant layers.',
  protocol: [
    { step: 1, name: 'Cleansing Water', description: 'All-in-one cleansing water that tones as it cleanses.', color: '#64D2FF' },
    { step: 2, name: 'All-in-One Serum', description: 'Essence + serum + ampoule combined in one product.', color: '#BF5AF2' },
    { step: 3, name: 'Moisturizing SPF', description: 'SPF cream that doubles as your moisturizer.', color: '#FFD60A' },
  ],
  keyIngredients: ['Multi-functional formulas', 'Hyaluronic acid', 'Centella asiatica'],
  bestFor: ['Busy lifestyles', 'K-beauty simplifiers', 'Minimalists'],
  source: 'Korean beauty counter-trend (2018+)',
};

const sandwich: RoutineTemplate = {
  id: 'sandwich',
  name: 'Sandwich Method',
  emoji: '🥪',
  description: 'Buffer potent actives between moisturizer layers to reduce irritation.',
  difficulty: 'intermediate',
  stepCount: '4-5',
  category: 'trending',
  tags: ['sandwich', 'buffering', 'retinol', 'gentle'],
  tintColor: '#FF9F0A',
  philosophy: 'Sandwiching retinol or strong actives between moisturizer layers slows penetration and dramatically reduces irritation while maintaining efficacy.',
  protocol: [
    { step: 1, name: 'Cleanse', description: 'Gentle cleanser on damp skin.', color: '#64D2FF' },
    { step: 2, name: 'First Moisturizer Layer', description: 'Thin layer of moisturizer as a buffer.', color: '#30D158' },
    { step: 3, name: 'Active', description: 'Apply retinol or other irritating active on top.', color: '#BF5AF2' },
    { step: 4, name: 'Second Moisturizer Layer', description: 'Another layer of moisturizer to seal and buffer.', color: '#30D158' },
    { step: 5, name: 'SPF (AM)', description: 'Sunscreen in the morning routine.', color: '#FFD60A' },
  ],
  keyIngredients: ['Retinol', 'Ceramides', 'Squalane', 'Niacinamide'],
  bestFor: ['Retinol beginners', 'Sensitive skin + active use', 'Reducing irritation'],
  source: 'Dermatologist buffering technique',
};

const biohacking: RoutineTemplate = {
  id: 'biohacking',
  name: 'Biohacking Skin',
  emoji: '🧬',
  description: 'Tech-forward skincare with LED, peptides, and data-driven actives.',
  difficulty: 'advanced',
  stepCount: '5-6',
  category: 'trending',
  tags: ['biohacking', 'LED', 'peptides', 'tech', 'data-driven'],
  tintColor: '#BF5AF2',
  philosophy: 'Optimize skin at the cellular level using evidence-based actives, LED phototherapy, and measurable biomarkers. Track, tweak, and iterate.',
  protocol: [
    { step: 1, name: 'Cleanse', description: 'Gentle enzyme cleanser to prep skin.', color: '#64D2FF' },
    { step: 2, name: 'Copper Peptide Serum', description: 'GHK-Cu peptide serum for collagen signaling and repair.', color: '#BF5AF2' },
    { step: 3, name: 'LED Therapy', description: 'Red (630nm) for collagen or blue (415nm) for acne, 10-20 min.', color: '#FF375F' },
    { step: 4, name: 'NAD+ / Niacinamide', description: 'Niacinamide 10% (NAD+ precursor) for cellular energy.', color: '#0A84FF' },
    { step: 5, name: 'Growth Factor Cream', description: 'EGF or stem cell-derived growth factor moisturizer.', color: '#30D158' },
    { step: 6, name: 'SPF', description: 'Photostable broad-spectrum SPF 50.', color: '#FFD60A' },
  ],
  keyIngredients: ['GHK-Cu peptides', 'EGF', 'Niacinamide (NAD+)', 'Bakuchiol', 'Astaxanthin'],
  bestFor: ['Tech enthusiasts', 'Optimization-minded', 'Advanced anti-aging'],
  source: 'Longevity research & dermatology studies',
};

// ═══════════════════════════════════════════════════════════════
// LIFE STAGE ROUTINES (7)
// ═══════════════════════════════════════════════════════════════

const teen: RoutineTemplate = {
  id: 'teen',
  name: 'Teen Skin',
  emoji: '🎓',
  description: 'Simple, affordable routine for puberty-related skin changes.',
  difficulty: 'beginner',
  stepCount: '3',
  category: 'life_stage',
  tags: ['teen', 'puberty', 'acne', 'simple', 'affordable'],
  tintColor: '#30D158',
  philosophy: 'Keep it simple and affordable. Teens need gentle cleansing, oil control, and sun protection — not a 10-step routine. Build good habits early.',
  protocol: [
    { step: 1, name: 'Gentle Cleanser', description: 'Mild foaming cleanser AM & PM — no harsh scrubs.', color: '#64D2FF' },
    { step: 2, name: 'Lightweight Moisturizer', description: 'Oil-free gel cream with niacinamide.', color: '#30D158' },
    { step: 3, name: 'SPF', description: 'Lightweight SPF 30+ that won\'t feel greasy.', color: '#FFD60A' },
  ],
  keyIngredients: ['Niacinamide', 'Salicylic acid (spot)', 'Zinc'],
  bestFor: ['Ages 12-18', 'First-time routines', 'Oily T-zones'],
  source: 'Pediatric dermatology guidelines',
};

const twenties: RoutineTemplate = {
  id: 'twenties',
  name: 'Your 20s',
  emoji: '🌱',
  description: 'Preventative care — antioxidants and sunscreen before damage starts.',
  difficulty: 'beginner',
  stepCount: '4',
  category: 'life_stage',
  tags: ['20s', 'prevention', 'antioxidant', 'habits'],
  tintColor: '#30D158',
  philosophy: 'Your 20s are when you build the habits that define your skin at 40. Prevention is 10x easier than correction. Vitamin C + SPF is your power duo.',
  protocol: [
    { step: 1, name: 'Cleanse', description: 'Gentle cleanser matched to your skin type.', color: '#64D2FF' },
    { step: 2, name: 'Vitamin C Serum', description: 'L-ascorbic acid 10-15% every morning for antioxidant defense.', color: '#FFD60A' },
    { step: 3, name: 'Moisturize', description: 'Lightweight moisturizer with hyaluronic acid.', color: '#30D158' },
    { step: 4, name: 'SPF 30+', description: 'Daily broad-spectrum sunscreen — the anti-aging product.', color: '#FFD60A' },
  ],
  keyIngredients: ['Vitamin C', 'Hyaluronic acid', 'SPF', 'Niacinamide'],
  bestFor: ['Ages 20-29', 'Preventative skincare', 'Building lifelong habits'],
  source: 'Preventative dermatology',
};

const thirties_forties: RoutineTemplate = {
  id: 'thirties_forties',
  name: '30s-40s Power',
  emoji: '💪',
  description: 'Retinoids, peptides, and targeted treatments for early aging signs.',
  difficulty: 'intermediate',
  stepCount: '5-6',
  category: 'life_stage',
  tags: ['30s', '40s', 'retinol', 'peptides', 'collagen'],
  tintColor: '#5E5CE6',
  philosophy: 'Collagen production slows ~1% per year after 25. Now is the time for retinoids, peptides, and growth factors to maintain what you have and rebuild what you\'ve lost.',
  protocol: [
    { step: 1, name: 'Cleanse', description: 'Cream or oil cleanser that doesn\'t strip.', color: '#64D2FF' },
    { step: 2, name: 'Vitamin C (AM)', description: 'Antioxidant serum every morning.', color: '#FFD60A' },
    { step: 3, name: 'Retinoid (PM)', description: 'Retinol or tretinoin for collagen synthesis.', color: '#BF5AF2' },
    { step: 4, name: 'Peptide Eye Cream', description: 'Target crow\'s feet and under-eye hollows.', color: '#FF375F' },
    { step: 5, name: 'Rich Moisturizer', description: 'Ceramide and peptide-rich cream.', color: '#30D158' },
    { step: 6, name: 'SPF 50', description: 'High protection to prevent further photodamage.', color: '#FFD60A' },
  ],
  keyIngredients: ['Tretinoin / Retinol', 'Vitamin C', 'Peptides', 'Ceramides', 'EGF'],
  bestFor: ['Ages 30-49', 'Early wrinkles', 'Collagen maintenance'],
  source: 'Anti-aging dermatology research',
};

const fifties_plus: RoutineTemplate = {
  id: 'fifties_plus',
  name: '50s & Beyond',
  emoji: '🌟',
  description: 'Rich, restorative care for menopausal and mature skin changes.',
  difficulty: 'intermediate',
  stepCount: '5',
  category: 'life_stage',
  tags: ['50s', 'mature', 'menopause', 'rich', 'restorative'],
  tintColor: '#FFD60A',
  philosophy: 'Menopause drops estrogen, thinning skin and reducing oil production. Prioritize rich emollients, gentle retinoids, and deep hydration over aggressive actives.',
  protocol: [
    { step: 1, name: 'Cream Cleanse', description: 'Rich cream or balm cleanser — never foaming.', color: '#64D2FF' },
    { step: 2, name: 'Hydrating Serum', description: 'Hyaluronic acid + peptide serum on damp skin.', color: '#5E5CE6' },
    { step: 3, name: 'Retinoid (PM)', description: 'Gentle retinol or bakuchiol for collagen without irritation.', color: '#BF5AF2' },
    { step: 4, name: 'Rich Barrier Cream', description: 'Phytoestrogen, ceramide, and squalane-rich cream.', color: '#30D158' },
    { step: 5, name: 'SPF 50', description: 'Tinted mineral SPF for UV + visible light protection.', color: '#FFD60A' },
  ],
  keyIngredients: ['Bakuchiol', 'Phytoestrogens', 'Squalane', 'Peptides', 'Ceramides'],
  bestFor: ['Ages 50+', 'Menopausal skin changes', 'Very dry or thinning skin'],
  source: 'Menopausal skincare dermatology',
};

const mens: RoutineTemplate = {
  id: 'mens',
  name: 'Men\'s Essential',
  emoji: '🧔',
  description: 'No-fuss routine that accounts for shaving and thicker skin.',
  difficulty: 'beginner',
  stepCount: '3-4',
  category: 'life_stage',
  tags: ['mens', 'shaving', 'no-fuss', 'simple'],
  tintColor: '#0A84FF',
  philosophy: 'Men\'s skin is thicker with more sebum, but daily shaving creates micro-trauma. A simple routine protects the barrier and prevents razor irritation.',
  protocol: [
    { step: 1, name: 'Face Wash', description: 'Gel cleanser AM & PM — can be used in the shower.', color: '#64D2FF' },
    { step: 2, name: 'Post-Shave Treatment', description: 'Alcohol-free balm with niacinamide to calm razor irritation.', color: '#30D158' },
    { step: 3, name: 'Moisturizer', description: 'Lightweight, fast-absorbing moisturizer.', color: '#BF5AF2' },
    { step: 4, name: 'SPF', description: 'Matte-finish SPF 30+ that works under facial hair.', color: '#FFD60A' },
  ],
  keyIngredients: ['Niacinamide', 'Aloe vera', 'Salicylic acid', 'Ceramides'],
  bestFor: ['Men new to skincare', 'Post-shave care', 'Oily or combination skin'],
  source: 'Men\'s dermatology guidelines',
};

const pregnancy: RoutineTemplate = {
  id: 'pregnancy',
  name: 'Pregnancy-Safe',
  emoji: '🤰',
  description: 'Effective skincare avoiding retinoids and other pregnancy no-nos.',
  difficulty: 'beginner',
  stepCount: '3-4',
  category: 'life_stage',
  tags: ['pregnancy', 'safe', 'no-retinoids', 'gentle'],
  tintColor: '#FF375F',
  philosophy: 'Avoid retinoids, high-dose salicylic acid, and hydroquinone. Safe alternatives like azelaic acid, vitamin C, and mineral SPF keep you glowing safely.',
  protocol: [
    { step: 1, name: 'Gentle Cleanser', description: 'Fragrance-free, non-foaming cleanser.', color: '#64D2FF' },
    { step: 2, name: 'Azelaic Acid', description: 'Pregnancy-safe brightening and anti-acne treatment (15-20%).', color: '#BF5AF2' },
    { step: 3, name: 'Moisturize', description: 'Ceramide moisturizer for hormonal dryness.', color: '#30D158' },
    { step: 4, name: 'Mineral SPF', description: 'Zinc oxide sunscreen — safest UV filter for pregnancy.', color: '#FFD60A' },
  ],
  keyIngredients: ['Azelaic acid', 'Vitamin C', 'Ceramides', 'Zinc oxide'],
  bestFor: ['Pregnant individuals', 'Breastfeeding', 'Retinoid-free needs'],
  source: 'ACOG and dermatology pregnancy safety data',
};

const bridal: RoutineTemplate = {
  id: 'bridal',
  name: 'Bridal Glow',
  emoji: '👰',
  description: '3-6 month prep for camera-ready, luminous wedding skin.',
  difficulty: 'intermediate',
  stepCount: '5-6',
  category: 'life_stage',
  tags: ['bridal', 'glow', 'wedding', 'prep', 'photo-ready'],
  tintColor: '#FFD60A',
  philosophy: 'Start 3-6 months before the wedding. Introduce actives slowly, never try new products within 4 weeks of the date. Goal: even, luminous skin that photographs beautifully.',
  protocol: [
    { step: 1, name: 'Double Cleanse', description: 'Oil then water cleanser for a perfectly clean canvas.', color: '#64D2FF' },
    { step: 2, name: 'Vitamin C (AM)', description: 'Brightening serum for even, radiant tone.', color: '#FFD60A' },
    { step: 3, name: 'Retinol (PM)', description: 'Low-dose retinol for texture — stop 2 weeks before wedding.', color: '#BF5AF2' },
    { step: 4, name: 'Hydrating Mask', description: 'Weekly hyaluronic acid or honey mask for plumpness.', color: '#FF375F' },
    { step: 5, name: 'Rich Moisturizer', description: 'Glow-boosting cream with niacinamide and peptides.', color: '#30D158' },
    { step: 6, name: 'SPF 50', description: 'Prevent any new dark spots or sunburn during prep.', color: '#FFD60A' },
  ],
  keyIngredients: ['Vitamin C', 'Retinol', 'Hyaluronic acid', 'Niacinamide', 'Peptides'],
  bestFor: ['Brides-to-be', 'Event prep', 'Photo-ready skin goals'],
  source: 'Celebrity esthetician bridal protocols',
};

// ═══════════════════════════════════════════════════════════════
// BODY ZONE ROUTINES (7)
// ═══════════════════════════════════════════════════════════════

const face: RoutineTemplate = {
  id: 'face',
  name: 'Face (Complete)',
  emoji: '😊',
  description: 'Full facial care covering cleanse, actives, and protection.',
  difficulty: 'intermediate',
  stepCount: '5',
  category: 'body_zone',
  tags: ['face', 'complete', 'daily', 'foundational'],
  tintColor: '#0A84FF',
  philosophy: 'The face has the thinnest, most exposed skin on the body. It deserves dedicated products formulated for its unique pH, oil production, and UV exposure.',
  protocol: [
    { step: 1, name: 'Double Cleanse', description: 'Oil cleanser PM, water cleanser AM & PM.', color: '#64D2FF' },
    { step: 2, name: 'Active Serum', description: 'Vitamin C AM, retinol PM — rotate based on concern.', color: '#BF5AF2' },
    { step: 3, name: 'Eye Cream', description: 'Dedicated eye product for the thinnest facial skin.', color: '#FF375F' },
    { step: 4, name: 'Moisturize', description: 'Barrier-supporting cream with ceramides.', color: '#30D158' },
    { step: 5, name: 'SPF', description: 'SPF 50 PA++++ every morning without exception.', color: '#FFD60A' },
  ],
  keyIngredients: ['Vitamin C', 'Retinol', 'Ceramides', 'Hyaluronic acid'],
  bestFor: ['Everyone', 'Daily comprehensive care', 'All skin types'],
  source: 'Standard dermatological practice',
};

const body_zone: RoutineTemplate = {
  id: 'body_zone',
  name: 'Body Skin',
  emoji: '🧴',
  description: 'Full-body exfoliation and hydration for smooth, even skin.',
  difficulty: 'beginner',
  stepCount: '3-4',
  category: 'body_zone',
  tags: ['body', 'KP', 'dry-skin', 'exfoliation'],
  tintColor: '#30D158',
  philosophy: 'Body skin is often neglected but benefits enormously from regular exfoliation and moisturizing. Address KP, ingrowns, and crepey texture with body-specific actives.',
  protocol: [
    { step: 1, name: 'Body Wash', description: 'AHA/BHA body wash for gentle chemical exfoliation.', color: '#64D2FF' },
    { step: 2, name: 'Physical Exfoliation', description: 'Dry brush or exfoliating mitt before shower, 2x per week.', color: '#FF9F0A' },
    { step: 3, name: 'Body Lotion', description: 'Apply rich lotion with urea or lactic acid on damp skin.', color: '#30D158' },
    { step: 4, name: 'Body SPF', description: 'Spray SPF on exposed areas — don\'t forget ears and hands.', color: '#FFD60A' },
  ],
  keyIngredients: ['Urea 10%', 'Lactic acid', 'Shea butter', 'Glycerin'],
  bestFor: ['Keratosis pilaris (KP)', 'Dry body skin', 'Ingrown hairs'],
  source: 'Body care dermatology',
};

const neck: RoutineTemplate = {
  id: 'neck',
  name: 'Neck & Décolletage',
  emoji: '💎',
  description: 'Extend your face routine down — the neck ages faster than the face.',
  difficulty: 'intermediate',
  stepCount: '4',
  category: 'body_zone',
  tags: ['neck', 'decolletage', 'chest', 'anti-aging'],
  tintColor: '#BF5AF2',
  philosophy: 'Neck skin has fewer sebaceous glands and less collagen than the face. It shows aging earliest but is the most neglected. Always bring your routine down.',
  protocol: [
    { step: 1, name: 'Gentle Cleanse', description: 'Extend face cleanser down to chest.', color: '#64D2FF' },
    { step: 2, name: 'Peptide Serum', description: 'Apply peptide or retinol serum from jawline to chest.', color: '#BF5AF2' },
    { step: 3, name: 'Firming Cream', description: 'Dedicated neck cream or rich facial moisturizer.', color: '#30D158' },
    { step: 4, name: 'SPF', description: 'Extend facial SPF to neck and chest — critical area for photodamage.', color: '#FFD60A' },
  ],
  keyIngredients: ['Peptides', 'Retinol', 'Vitamin C', 'Ceramides'],
  bestFor: ['Neck lines ("tech neck")', 'Chest sun damage', 'Crepey décolletage'],
  source: 'Dermatology neck-specific care',
};

const hands: RoutineTemplate = {
  id: 'hands',
  name: 'Hand Care',
  emoji: '🤲',
  description: 'Protect and restore the most exposed, washed, and neglected skin.',
  difficulty: 'beginner',
  stepCount: '3',
  category: 'body_zone',
  tags: ['hands', 'anti-aging', 'moisturizing', 'SPF'],
  tintColor: '#FF9F0A',
  philosophy: 'Hands reveal age before the face — thin skin, constant washing, and zero SPF application. A 30-second routine makes a visible difference.',
  protocol: [
    { step: 1, name: 'Gentle Hand Wash', description: 'Non-stripping hand soap — avoid antibacterial formulas.', color: '#64D2FF' },
    { step: 2, name: 'Hand Cream', description: 'Rich cream with glycerin, shea, and niacinamide after every wash.', color: '#30D158' },
    { step: 3, name: 'Hand SPF', description: 'Apply SPF to backs of hands every morning and after washing.', color: '#FFD60A' },
  ],
  keyIngredients: ['Glycerin', 'Shea butter', 'Niacinamide', 'SPF'],
  bestFor: ['Frequent hand washers', 'Age spots on hands', 'Dry cracked hands'],
  source: 'Hand care dermatology',
};

const lips: RoutineTemplate = {
  id: 'lips',
  name: 'Lip Care',
  emoji: '💋',
  description: 'Exfoliate, hydrate, and protect the thinnest skin on your body.',
  difficulty: 'beginner',
  stepCount: '3',
  category: 'body_zone',
  tags: ['lips', 'hydration', 'exfoliation', 'SPF'],
  tintColor: '#FF375F',
  philosophy: 'Lips have no sebaceous glands and almost no melanin — they can\'t moisturize or protect themselves. Gentle exfoliation + occlusive balm is essential.',
  protocol: [
    { step: 1, name: 'Gentle Lip Scrub', description: 'Sugar scrub or soft toothbrush 1-2x per week to remove flakes.', color: '#FF9F0A' },
    { step: 2, name: 'Lip Treatment', description: 'Hyaluronic acid or peptide lip serum.', color: '#BF5AF2' },
    { step: 3, name: 'Occlusive Balm', description: 'Lanolin, shea, or petrolatum-based balm to seal in moisture; SPF lip balm by day.', color: '#30D158' },
  ],
  keyIngredients: ['Lanolin', 'Shea butter', 'Hyaluronic acid', 'SPF lip filters'],
  bestFor: ['Chronic chapped lips', 'Cold weather prep', 'Lip health maintenance'],
  source: 'Dermatologist lip care recommendations',
};

const feet: RoutineTemplate = {
  id: 'feet',
  name: 'Foot Care',
  emoji: '🦶',
  description: 'Exfoliate calluses and deeply moisturize for soft, healthy feet.',
  difficulty: 'beginner',
  stepCount: '3',
  category: 'body_zone',
  tags: ['feet', 'calluses', 'cracked-heels', 'urea'],
  tintColor: '#FF9F0A',
  philosophy: 'Feet bear your entire body weight on the thickest skin you have. Regular exfoliation with urea and occlusive overnight treatments prevent painful cracks.',
  protocol: [
    { step: 1, name: 'Soak & Exfoliate', description: 'Warm soak 10 min, then pumice or foot peel mask weekly.', color: '#64D2FF' },
    { step: 2, name: 'Urea Cream', description: 'Apply 20-40% urea cream to heels and callused areas.', color: '#30D158' },
    { step: 3, name: 'Sock Occlusion', description: 'Cotton socks overnight to lock in moisture.', color: '#FFD60A' },
  ],
  keyIngredients: ['Urea 20-40%', 'Salicylic acid', 'Shea butter', 'Glycerin'],
  bestFor: ['Cracked heels', 'Thick calluses', 'Sandal-season prep'],
  source: 'Podiatric dermatology',
};

const scalp: RoutineTemplate = {
  id: 'scalp',
  name: 'Scalp Care',
  emoji: '🧠',
  description: 'Healthy hair starts with a balanced, exfoliated scalp.',
  difficulty: 'beginner',
  stepCount: '3-4',
  category: 'body_zone',
  tags: ['scalp', 'dandruff', 'hair-growth', 'exfoliation'],
  tintColor: '#5E5CE6',
  philosophy: 'The scalp is skin — it needs exfoliation, hydration, and care just like your face. A healthy scalp microbiome is the foundation for strong hair.',
  protocol: [
    { step: 1, name: 'Scalp Scrub / Pre-Wash', description: 'Salicylic acid or sugar scrub on dry scalp before shampooing.', color: '#FF9F0A' },
    { step: 2, name: 'Gentle Shampoo', description: 'Sulfate-free shampoo massaged with fingertips (not nails).', color: '#64D2FF' },
    { step: 3, name: 'Scalp Serum', description: 'Niacinamide or peptide scalp serum for barrier health.', color: '#BF5AF2' },
    { step: 4, name: 'Scalp SPF', description: 'Powder or spray SPF on part line when outdoors.', color: '#FFD60A' },
  ],
  keyIngredients: ['Salicylic acid', 'Niacinamide', 'Tea tree oil', 'Zinc pyrithione'],
  bestFor: ['Dandruff / flaking', 'Oily scalp', 'Hair thinning concerns'],
  source: 'Trichology and scalp dermatology',
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

const coreTemplates = [essential_3step, standard_4step, standard_5_6, extended_7_9, kbeauty_10];
const concernTemplates = [acne, anti_aging, hyperpigmentation, rosacea, sensitive, barrier_repair, eczema, psoriasis];
const culturalTemplates = [korean_glass, japanese_mochi, ayurvedic, french_pharmacy, tcm, african, hammam];
const trendingTemplates = [skin_cycling, slugging, skinimalism, skin_fasting, skip_care, sandwich, biohacking];
const lifeStageTemplates = [teen, twenties, thirties_forties, fifties_plus, mens, pregnancy, bridal];
const bodyZoneTemplates = [face, body_zone, neck, hands, lips, feet, scalp];

export const ROUTINE_CATEGORIES: RoutineCategory[] = [
  { id: 'core', title: 'Core Routines', templates: coreTemplates },
  { id: 'concern', title: 'Concern-Based', templates: concernTemplates },
  { id: 'cultural', title: 'Cultural Rituals', templates: culturalTemplates },
  { id: 'trending', title: 'Trending Methods', templates: trendingTemplates },
  { id: 'life_stage', title: 'Life Stage', templates: lifeStageTemplates },
  { id: 'body_zone', title: 'Body Zone', templates: bodyZoneTemplates },
];

export const FEATURED_ROUTINE: RoutineTemplate = skin_cycling;

export function getAllTemplates(): RoutineTemplate[] {
  return ROUTINE_CATEGORIES.flatMap((cat) => cat.templates);
}

export function getTemplateById(id: string): RoutineTemplate | undefined {
  return getAllTemplates().find((t) => t.id === id);
}
