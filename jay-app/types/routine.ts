/**
 * JAY Routine — Shared TypeScript types
 */

// ── Routine & Steps ──────────────────────────────────────────────────

export interface StepOut {
  id: string;
  step_order: number;
  category: string;
  product_id: number | null;
  product_name: string | null;
  product_brand: string | null;
  product_price: number | null;
  custom_product_name: string | null;
  instruction: string | null;
  wait_time_seconds: number | null;
  frequency: string;
  frequency_days: string[] | null;
  is_essential: boolean;
  notes: string | null;
  why_this_product: string | null;
}

export interface RoutineOut {
  id: string;
  name: string | null;
  description: string | null;
  period: string;
  routine_type: string;
  is_active: boolean;
  total_monthly_cost: number | null;
  steps: StepOut[];
  created_at: string;
  updated_at: string;
}

/** @deprecated Backend now returns RoutineOut[] instead of RoutineOverview */
export interface RoutineOverview {
  am: RoutineOut | null;
  pm: RoutineOut | null;
}

// ── Today tracking ───────────────────────────────────────────────────

export interface TodayStepStatus {
  step_id: string;
  step_category: string;
  product_name: string | null;
  completed: boolean;
  skipped: boolean;
  completed_at: string | null;
}

export interface TodayStatus {
  routine_id: string;
  period: string;
  total_steps: number;
  completed_steps: number;
  skipped_steps: number;
  remaining_steps: number;
  completion_percentage: number;
  steps: TodayStepStatus[];
}

// ── Requests ─────────────────────────────────────────────────────────

export interface CreateRoutineRequest {
  name: string;
  description?: string;
  period: string;
  routine_type: string;
}

export interface AddStepRequest {
  category: string;
  product_id?: number;
  custom_product_name?: string;
  instruction?: string;
  wait_time_seconds?: number;
  frequency?: string;
  frequency_days?: string[];
  is_essential?: boolean;
  notes?: string;
}

export interface GenerateRequest {
  period: 'am' | 'pm' | 'both';
  routine_type: string;
  goals?: string[];
  additional_instructions?: string;
}

// ── Stats & Cost ─────────────────────────────────────────────────────

export interface StatsOut {
  period_days: number;
  total_routines_possible: number;
  completed_count: number;
  skipped_count: number;
  missed_count: number;
  adherence_percentage: number;
  current_streak: number;
  longest_streak: number;
}

export interface CostOut {
  total_monthly_cost: number;
  products: { name: string; category: string; price: number; period: string }[];
}

export interface ConflictOut {
  ingredient_a: string;
  ingredient_b: string;
  severity: 'avoid' | 'caution';
  reason: string;
  solution: string;
}

// ── AI Generation ────────────────────────────────────────────────────

export interface GeneratedRoutineOut {
  routine_type: string;
  period: string;
  name: string;
  description: string;
  total_monthly_cost: number;
  steps: GeneratedStep[];
  reasoning: string;
  tips: string[];
  conflicts_checked: Record<string, unknown>[];
}

export interface GeneratedStep {
  category: string;
  period?: 'am' | 'pm';
  product_id?: number;
  product_name?: string;
  product_brand?: string;
  product_price?: number;
  instruction?: string;
  wait_time_seconds?: number;
  frequency?: string;
  is_essential?: boolean;
  why_this_product?: string;
}

// ── Product Search ───────────────────────────────────────────────────

export interface SearchProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  price_inr: number;
  key_ingredients: string[];
  image_url: string | null;
}

// ── Routine Types (from /routine/types) ──────────────────────────────

export interface RoutineTypeInfo {
  name: string;
  description: string;
  complexity: string;
  am_template: string[];
  pm_template: string[];
  max_steps: number;
  who_its_for: string;
}
