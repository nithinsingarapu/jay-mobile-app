import { apiFetch } from '../lib/api';

export interface ResearchStatus {
  id: number;
  product_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_stage: string | null;
  created_at: string | null;
}

export interface ReportCard {
  ingredient_quality?: number;
  formula_safety?: number;
  value_for_money?: number;
  brand_transparency?: number;
  user_satisfaction?: number;
  derm_endorsement?: number;
  overall?: number;
}

export interface ResearchReport {
  id: number;
  product_id: number | null;
  product_name: string;
  brand: string | null;
  status: string;
  current_stage: string | null;
  product_data: Record<string, any> | null;
  ingredients_analysis: string | null;
  review_synthesis: string | null;
  expert_reviews: string | null;
  brand_intelligence: string | null;
  claims_alternatives: string | null;
  report_markdown: string | null;
  tldr: string | null;
  usage_protocol: string | null;
  report_card: ReportCard | null;
  error_message: string | null;
  model_used: string | null;
  total_tokens: number | null;
  estimated_cost_usd: number | null;
  duration_seconds: number | null;
  created_at: string | null;
}

export const researchService = {
  start: (productName: string, productId?: number) =>
    apiFetch<ResearchStatus>('/api/v1/research', {
      method: 'POST',
      body: { product_name: productName, product_id: productId },
    }),

  getStatus: (id: number) =>
    apiFetch<ResearchReport>(`/api/v1/research/${id}`),

  list: (limit?: number) =>
    apiFetch<ResearchStatus[]>(`/api/v1/research?limit=${limit ?? 20}`),

  getByProduct: (productId: number) =>
    apiFetch<ResearchReport | null>(`/api/v1/research/product/${productId}`, { noAuth: true }),

  getPdfUrl: (id: number, apiUrl: string) =>
    `${apiUrl}/api/v1/research/${id}/pdf`,
};
