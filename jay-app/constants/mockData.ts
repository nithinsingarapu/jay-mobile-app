export const mockUser = {
  name: 'Priya',
  skinType: 'Combination',
  sensitivity: 'Sensitive',
  skinScore: 78,
  streak: 12,
  diaryEntries: 42,
  trackedProducts: 8,
  glowPoints: 320,
  level: 'Skincare Enthusiast',
  levelProgress: 64,
  memberSince: 'March 2026',
};

export const mockRoutine = {
  am: [
    { id: '1', step: 1, category: 'Cleanser', product: 'CeraVe Foaming Cleanser', brand: 'CeraVe', instruction: 'Massage onto damp skin 60s', completed: true },
    { id: '2', step: 2, category: 'Serum', product: 'Minimalist 10% Vitamin C', brand: 'Minimalist', instruction: '2-3 drops on damp skin', completed: true, waitTime: '1 min' },
    { id: '3', step: 3, category: 'Moisturizer', product: 'Neutrogena Hydro Boost', brand: 'Neutrogena', instruction: 'Apply evenly to face', completed: false },
    { id: '4', step: 4, category: 'Sunscreen', product: 'La Shield Mineral SPF 50', brand: 'La Shield', instruction: '2 finger lengths', completed: false },
  ],
  pm: [
    { id: '5', step: 1, category: 'Cleanser', product: 'CeraVe Foaming Cleanser', brand: 'CeraVe', instruction: 'Double cleanse after makeup', completed: false },
    { id: '6', step: 2, category: 'Toner', product: 'Pyunkang Yul Essence', brand: 'Pyunkang Yul', instruction: 'Pat gently onto skin', completed: false },
    { id: '7', step: 3, category: 'Serum', product: 'The Ordinary Niacinamide', brand: 'The Ordinary', instruction: 'Apply thin layer, avoid eyes', completed: false, waitTime: '30 sec' },
    { id: '8', step: 4, category: 'Moisturizer', product: 'Cetaphil Moisturizing Cream', brand: 'Cetaphil', instruction: 'Seal everything in', completed: false },
  ],
};

export const mockDiaryEntries = [
  { id: '1', date: '2026-03-27', mood: 5, moodLabel: 'Great', tags: ['Hydrated', 'Glowing'], notes: 'Skin looked amazing today!' },
  { id: '2', date: '2026-03-26', mood: 4, moodLabel: 'Good', tags: ['Clear', 'Smooth'], notes: 'Pretty good day.' },
  { id: '3', date: '2026-03-25', mood: 3, moodLabel: 'Okay', tags: ['Slightly oily'], notes: 'T-zone was oily by noon.' },
  { id: '4', date: '2026-03-24', mood: 2, moodLabel: 'Bad', tags: ['Breakout', 'Stressed'], notes: 'Small breakout on chin.' },
  { id: '5', date: '2026-03-23', mood: 5, moodLabel: 'Great', tags: ['Hydrated', 'No breakouts'], notes: '' },
];

export const mockChatMessages = [
  {
    id: '1',
    role: 'jay' as const,
    text: "Hi Priya! I'm JAY, your personal skincare expert. I've analyzed your skin profile — combination with sensitivity. What would you like to know today?",
    timestamp: '9:41 AM',
  },
  {
    id: '2',
    role: 'user' as const,
    text: 'Is Minimalist SPF 50 good for my skin type?',
    timestamp: '9:42 AM',
  },
  {
    id: '3',
    role: 'jay' as const,
    text: "Great choice for combination skin! Here's my verdict:",
    timestamp: '9:42 AM',
    verdict: {
      type: 'SLAP' as const,
      product: 'Minimalist SPF 50',
      score: 8.4,
      reason: 'Lightweight, non-comedogenic, broad-spectrum protection. Perfect for your skin type.',
    },
  },
];

export const mockSuggestedPrompts = [
  'Is niacinamide good for me?',
  'Best moisturizer under ₹500?',
  'How to layer my products?',
  'What causes my T-zone oiliness?',
];

export const mockJayResponses = [
  "Based on your skin profile, I recommend looking for non-comedogenic, lightweight formulations. Combination skin does best with gel-based products in the morning and slightly richer ones at night.",
  "That's a great question! Niacinamide is excellent for combination skin — it regulates sebum production, minimizes pores, and evens skin tone. Start with 10% concentration and apply after cleansing.",
  "For layering, always go thinnest to thickest: toner → essence → serum → moisturizer → SPF (morning only). Wait 30 seconds between steps to allow absorption.",
];

export const mockDiscoverArticles = [
  { id: '1', title: "Why niacinamide is your skin's quiet hero", category: 'Ingredients', readTime: '3 min', featured: true },
  { id: '2', title: 'The definitive SPF guide for Indian skin', category: 'Guide', readTime: '5 min', featured: false },
  { id: '3', title: '10 myths about skincare debunked', category: 'Myths', readTime: '4 min', featured: false },
  { id: '4', title: 'Building a minimalist routine for beginners', category: 'Routines', readTime: '6 min', featured: false },
  { id: '5', title: 'How to read an ingredient list like a pro', category: 'Ingredients', readTime: '5 min', featured: false },
];

export const mockCapSlapVerdicts = [
  { id: '1', product: 'Minimalist SPF 50', brand: 'Minimalist', verdict: 'SLAP' as const, score: 8.4, reason: 'Solid broad-spectrum protection at an incredible price point.' },
  { id: '2', product: 'Glow Recipe Watermelon Dew Drops', brand: 'Glow Recipe', verdict: 'CAP' as const, score: 4.2, reason: 'Overhyped, overpriced, and underpowered for the claims made.' },
  { id: '3', product: 'CeraVe Moisturizing Cream', brand: 'CeraVe', verdict: 'SLAP' as const, score: 9.1, reason: 'Dermatologist-recommended ceramide formula at accessible price.' },
  { id: '4', product: 'Tatcha The Dewy Skin Cream', brand: 'Tatcha', verdict: 'CAP' as const, score: 5.1, reason: 'Beautiful texture but not worth 4x the price of alternatives.' },
];

export const mockDupeResults = {
  original: {
    name: 'SK-II Facial Treatment Essence',
    brand: 'SK-II',
    keyIngredients: ['Pitera (Galactomyces)', 'Niacinamide', 'Panthenol'],
    price: 8500,
  },
  dupes: [
    { id: '1', name: 'Missha Time Revolution', brand: 'Missha', price: 1299, matchPercent: 89, ingredientMatch: 87, rank: 'BEST MATCH' as const },
    { id: '2', name: 'Some By Mi AHA BHA PHA', brand: 'Some By Mi', price: 899, matchPercent: 81, ingredientMatch: 79, rank: 'STRONG' as const },
    { id: '3', name: 'The Ordinary Glycolic Acid', brand: 'The Ordinary', price: 549, matchPercent: 74, ingredientMatch: 71, rank: 'GOOD' as const },
  ],
  totalSavings: 3951,
};

export const mockResearchProduct = {
  name: 'CeraVe Moisturizing Cream',
  brand: 'CeraVe',
  price: 749,
  jayScore: 9.1,
  recommendation: 'Highly recommended for combination-sensitive skin',
  modules: [
    { id: '1', name: 'Ingredient Safety', description: 'Full analysis of all ingredients', time: '2 min', status: 'done' as const },
    { id: '2', name: 'Skin Type Match', description: 'How well it fits your profile', time: '1 min', status: 'done' as const },
    { id: '3', name: 'Claims Verification', description: 'Science vs. marketing claims', time: '3 min', status: 'in-progress' as const },
    { id: '4', name: 'Price Analysis', description: 'Value vs. alternatives', time: '2 min', status: 'pending' as const },
    { id: '5', name: 'User Feedback', description: 'Community experience summary', time: '1 min', status: 'pending' as const },
  ],
};

export const mockInsights = [
  { id: '1', title: 'Niacinamide is working', description: '8 good skin days since you added it to your routine.' },
  { id: '2', title: 'Hydration dip on weekends', description: 'Your skin scores 12% lower on Sat/Sun. Check weekend routine.' },
  { id: '3', title: 'Morning SPF consistency up', description: 'Applied SPF 6 out of 7 days this week. Keep it up!' },
];

export const mockCommunityPosts = [
  { id: '1', author: 'Arya K.', avatar: 'A', timeAgo: '2h', text: 'Finally cleared my hormonal acne after 3 months of consistent niacinamide use! JAY helped me build the right routine.', tags: ['Acne', 'Niacinamide', 'Progress'], likes: 47, comments: 12 },
  { id: '2', author: 'Rohit M.', avatar: 'R', timeAgo: '5h', text: 'Just got my skin score to 85! The routine builder is a game changer for beginners like me.', tags: ['Beginner', 'Routine'], likes: 31, comments: 8 },
  { id: '3', author: 'Sneha P.', avatar: 'S', timeAgo: '1d', text: 'The dupe finder saved me ₹7,000 on my monthly skincare budget. Absolutely wild.', tags: ['Savings', 'Dupes'], likes: 89, comments: 24 },
];

export const mockDietPlan = {
  optimizeFor: ['Hydration', 'Anti-aging', 'Acne prevention'],
  meals: [
    { type: 'Breakfast', dish: 'Avocado & Spinach Smoothie Bowl', description: 'Rich in vitamin E, zinc, and omega-3s for skin barrier support', nutrients: ['Vitamin E', 'Zinc', 'Omega-3', 'Vitamin C'] },
    { type: 'Lunch', dish: 'Grilled Salmon with Quinoa', description: 'High in astaxanthin and DHA for collagen production', nutrients: ['Astaxanthin', 'DHA', 'Protein', 'B12'] },
    { type: 'Dinner', dish: 'Lentil & Turmeric Soup', description: 'Anti-inflammatory curcumin reduces redness and breakouts', nutrients: ['Curcumin', 'Iron', 'Folate', 'Antioxidants'] },
  ],
  waterIntake: { current: 6, goal: 8 },
};

export const mockDermatConditions = [
  { id: '1', emoji: '😔', name: 'Persistent Acne' },
  { id: '2', emoji: '🔴', name: 'Redness & Rosacea' },
  { id: '3', emoji: '🌙', name: 'Hyperpigmentation' },
  { id: '4', emoji: '💧', name: 'Extreme Dryness' },
];

export const mockFAQs = [
  { id: '1', question: 'How do I find a good dermatologist?', answer: 'Look for board-certified dermatologists (MD or DNB in Dermatology). Check reviews, ask for referrals from your GP, and ensure they specialize in your concern.' },
  { id: '2', question: 'What should I bring to my first appointment?', answer: 'Bring a list of all current skincare products, any medications, photos of skin concerns over time, and a list of known allergies.' },
  { id: '3', question: 'How often should I see a dermatologist?', answer: 'For preventative care, once a year is recommended. For active concerns like acne or eczema, every 2-3 months until controlled.' },
];

export const mockWeeklyData = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  scores: [72, 75, 80, 78, 82, 68, 71],
  adherence: [100, 100, 75, 100, 100, 50, 75],
  goodDays: 6,
};

export const mockCalendarDots: Record<string, 'good' | 'okay' | 'bad'> = {
  '2026-03-01': 'good', '2026-03-02': 'okay', '2026-03-03': 'bad',
  '2026-03-04': 'good', '2026-03-05': 'good', '2026-03-06': 'okay',
  '2026-03-07': 'good', '2026-03-08': 'good', '2026-03-09': 'bad',
  '2026-03-10': 'okay', '2026-03-11': 'good', '2026-03-12': 'good',
  '2026-03-13': 'good', '2026-03-14': 'okay', '2026-03-15': 'good',
  '2026-03-16': 'bad', '2026-03-17': 'okay', '2026-03-18': 'good',
  '2026-03-19': 'good', '2026-03-20': 'good', '2026-03-21': 'okay',
  '2026-03-22': 'good', '2026-03-23': 'good', '2026-03-24': 'bad',
  '2026-03-25': 'okay', '2026-03-26': 'good', '2026-03-27': 'good',
};
