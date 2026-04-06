import { apiFetch } from '../lib/api';
import type { ProductOut } from '../types/product';

export const productService = {
  search: (params: {
    q?: string;
    brand?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.brand) qs.set('brand', params.brand);
    if (params.category) qs.set('category', params.category);
    if (params.min_price) qs.set('min_price', String(params.min_price));
    if (params.max_price) qs.set('max_price', String(params.max_price));
    qs.set('limit', String(params.limit ?? 20));
    qs.set('offset', String(params.offset ?? 0));
    return apiFetch<ProductOut[]>(`/api/v1/products?${qs.toString()}`, { noAuth: true });
  },

  getById: (id: number) =>
    apiFetch<ProductOut>(`/api/v1/products/${id}`, { noAuth: true }),

  getBrands: () =>
    apiFetch<string[]>('/api/v1/products/brands', { noAuth: true }),

  getCategories: () =>
    apiFetch<string[]>('/api/v1/products/categories', { noAuth: true }),

  enrichProduct: (id: number) =>
    apiFetch<{ status: string; error?: string; price?: number; rating?: number; review_count?: number; image?: string; source?: string }>(
      `/api/v1/products/${id}/enrich`, { method: 'POST' },
    ),

  getDupes: (id: number, limit?: number) =>
    apiFetch<{
      original: {
        id: number; name: string; brand: string; price: number;
        image_url: string | null; key_ingredients: string[];
        rating: number | null; review_count: number | null;
      } | null;
      dupes: {
        id: number; name: string; brand: string; price: number;
        image_url: string | null; rating: number | null;
        review_count: number | null; match_percent: number;
        ingredient_match: number; shared_ingredients: string[];
        rank: string; key_ingredients: string[];
      }[];
      total_savings: number;
    }>(`/api/v1/products/${id}/dupes?limit=${limit ?? 10}`, { noAuth: true }),
};
