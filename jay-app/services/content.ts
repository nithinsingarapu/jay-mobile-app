import { apiFetch } from '../lib/api';

export interface SourcedFact {
  text: string;
  source_url?: string;
  source_name?: string;
}

export interface IngredientOut {
  id: number;
  name: string;
  slug: string;
  also_known_as?: string[];
  category?: string;
  what_it_does?: string;
  how_it_works?: string;
  benefits?: string[];
  who_its_for?: string[];
  avoid_with?: string[];
  safety_rating?: string;
  concentration_range?: string;
  facts?: SourcedFact[];
  image_url?: string;
  sources?: { url: string; name: string }[];
  departments?: string[];
  tags?: string[];
}

export interface ArticleOut {
  id: number;
  slug: string;
  title: string;
  type: string;
  summary?: string;
  body?: string;
  author_name?: string;
  author_credential?: string;
  author_image_url?: string;
  image_url?: string;
  read_time_minutes?: number;
  tags?: string[];
  departments?: string[];
  concerns?: string[];
  source_url?: string;
  source_name?: string;
}

export interface ConcernOut {
  id: number;
  name: string;
  slug: string;
  description?: string;
  causes?: SourcedFact[];
  treatments?: SourcedFact[];
  recommended_ingredients?: string[];
  avoid_ingredients?: string[];
  image_url?: string;
  departments?: string[];
  tags?: string[];
}

export interface MythOut {
  id: number;
  myth: string;
  truth: string;
  explanation?: string;
  source_url?: string;
  source_name?: string;
  departments?: string[];
}

export interface TipOut {
  id: number;
  title: string;
  body: string;
  category?: string;
  source_url?: string;
  source_name?: string;
  departments?: string[];
}

function qs(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const contentService = {
  getIngredients: (params?: { department?: string; category?: string; limit?: number }) =>
    apiFetch<IngredientOut[]>(`/api/v1/content/ingredients${qs(params ?? {})}`, { noAuth: true }),

  getIngredient: (slug: string) =>
    apiFetch<IngredientOut>(`/api/v1/content/ingredients/${slug}`, { noAuth: true }),

  getArticles: (params?: { type?: string; department?: string; limit?: number }) =>
    apiFetch<ArticleOut[]>(`/api/v1/content/articles${qs(params ?? {})}`, { noAuth: true }),

  getArticle: (slug: string) =>
    apiFetch<ArticleOut>(`/api/v1/content/articles/${slug}`, { noAuth: true }),

  getConcerns: (params?: { department?: string; limit?: number }) =>
    apiFetch<ConcernOut[]>(`/api/v1/content/concerns${qs(params ?? {})}`, { noAuth: true }),

  getConcern: (slug: string) =>
    apiFetch<ConcernOut>(`/api/v1/content/concerns/${slug}`, { noAuth: true }),

  getMyths: (params?: { department?: string; limit?: number }) =>
    apiFetch<MythOut[]>(`/api/v1/content/myths${qs(params ?? {})}`, { noAuth: true }),

  getTips: (params?: { department?: string; category?: string; limit?: number }) =>
    apiFetch<TipOut[]>(`/api/v1/content/tips${qs(params ?? {})}`, { noAuth: true }),
};
