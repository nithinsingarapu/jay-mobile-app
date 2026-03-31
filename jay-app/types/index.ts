export interface User {
  name: string;
  skinType: string;
  sensitivity: string;
  skinScore: number;
  streak: number;
  diaryEntries: number;
  trackedProducts: number;
  glowPoints: number;
  level: string;
  levelProgress: number;
  memberSince: string;
}

export interface RoutineStep {
  id: string;
  step: number;
  category: string;
  product: string;
  brand: string;
  instruction: string;
  completed: boolean;
  waitTime?: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  mood: number;
  moodLabel: string;
  tags: string[];
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: 'jay' | 'user';
  text: string;
  timestamp: string;
  verdict?: {
    type: 'SLAP' | 'CAP';
    product: string;
    score: number;
    reason: string;
  };
}

export interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  featured: boolean;
}

export interface CapSlapVerdict {
  id: string;
  product: string;
  brand: string;
  verdict: 'SLAP' | 'CAP';
  score: number;
  reason: string;
}

export interface DupeResult {
  id: string;
  name: string;
  brand: string;
  price: number;
  matchPercent: number;
  ingredientMatch: number;
  rank: 'BEST MATCH' | 'STRONG' | 'GOOD';
}

export interface ResearchModule {
  id: string;
  name: string;
  description: string;
  time: string;
  status: 'done' | 'in-progress' | 'pending';
}

export interface InsightCard {
  id: string;
  title: string;
  description: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  timeAgo: string;
  text: string;
  tags: string[];
  likes: number;
  comments: number;
}
