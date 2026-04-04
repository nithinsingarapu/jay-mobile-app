import { create } from 'zustand';
import {
  contentService,
  type IngredientOut,
  type ArticleOut,
  type ConcernOut,
  type MythOut,
  type TipOut,
} from '../services/content';

interface ContentState {
  ingredients: IngredientOut[];
  articles: ArticleOut[];
  concerns: ConcernOut[];
  myths: MythOut[];
  tips: TipOut[];
  isLoading: boolean;

  loadIngredients: (department?: string) => Promise<void>;
  loadArticles: (department?: string, type?: string) => Promise<void>;
  loadConcerns: (department?: string) => Promise<void>;
  loadMyths: (department?: string) => Promise<void>;
  loadTips: (department?: string) => Promise<void>;
  loadAllForDepartment: (department: string) => Promise<void>;
}

export const useContentStore = create<ContentState>((set) => ({
  ingredients: [],
  articles: [],
  concerns: [],
  myths: [],
  tips: [],
  isLoading: false,

  loadIngredients: async (department) => {
    try {
      const ingredients = await contentService.getIngredients({ department, limit: 50 });
      set({ ingredients });
    } catch (e) {
      console.error('[Content] Load ingredients:', e);
    }
  },

  loadArticles: async (department, type) => {
    try {
      const articles = await contentService.getArticles({ department, type, limit: 30 });
      set({ articles });
    } catch (e) {
      console.error('[Content] Load articles:', e);
    }
  },

  loadConcerns: async (department) => {
    try {
      const concerns = await contentService.getConcerns({ department, limit: 20 });
      set({ concerns });
    } catch (e) {
      console.error('[Content] Load concerns:', e);
    }
  },

  loadMyths: async (department) => {
    try {
      const myths = await contentService.getMyths({ department, limit: 20 });
      set({ myths });
    } catch (e) {
      console.error('[Content] Load myths:', e);
    }
  },

  loadTips: async (department) => {
    try {
      const tips = await contentService.getTips({ department, limit: 20 });
      set({ tips });
    } catch (e) {
      console.error('[Content] Load tips:', e);
    }
  },

  loadAllForDepartment: async (department) => {
    set({ isLoading: true });
    try {
      const [ingredients, articles, concerns, myths, tips] = await Promise.allSettled([
        contentService.getIngredients({ department, limit: 50 }),
        contentService.getArticles({ department, limit: 30 }),
        contentService.getConcerns({ department, limit: 20 }),
        contentService.getMyths({ department, limit: 20 }),
        contentService.getTips({ department, limit: 20 }),
      ]);
      set({
        ingredients: ingredients.status === 'fulfilled' ? ingredients.value : [],
        articles: articles.status === 'fulfilled' ? articles.value : [],
        concerns: concerns.status === 'fulfilled' ? concerns.value : [],
        myths: myths.status === 'fulfilled' ? myths.value : [],
        tips: tips.status === 'fulfilled' ? tips.value : [],
      });
    } catch (e) {
      console.error('[Content] Load all:', e);
    }
    set({ isLoading: false });
  },
}));
