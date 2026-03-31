import { apiFetch } from '../lib/api';

export interface BackendProfile {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  date_of_birth: string | null;
  gender: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string;
  skin_type: string | null;
  fitzpatrick_type: number | null;
  primary_concerns: string[] | null;
  skin_feel_midday: string | null;
  skin_history: string[] | null;
  allergies: string[] | null;
  sensitivities: string[] | null;
  current_skin_state: Record<string, unknown> | null;
  current_routine: Record<string, unknown> | null;
  lifestyle: Record<string, unknown> | null;
  preferences: Record<string, unknown> | null;
  onboarding_completed: boolean;
  onboarding_progress: Record<string, boolean>;
  profile_completeness: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  questions: QuestionnaireQuestion[];
}

export interface QuestionnaireQuestion {
  id: string;
  type: string;
  question: string;
  subtitle?: string;
  placeholder?: string;
  options?: { value: string | number; label: string; description?: string; emoji?: string }[];
  validation?: Record<string, unknown>;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  labels?: Record<string, string>;
  suggestions?: string[];
  fields?: { id: string; placeholder: string; required?: boolean; default?: string }[];
}

export interface Questionnaire {
  sections: QuestionnaireSection[];
  completion_rewards: Record<string, { points: number; message: string }>;
  total_bonus_points: number;
}

export interface ProfileCompleteness {
  completeness: number;
  sections: Record<string, boolean>;
  onboarding_completed: boolean;
}

export const profileService = {
  getQuestionnaire: () =>
    apiFetch<Questionnaire>('/api/v1/profile/questionnaire', { noAuth: true }),

  getProfile: () =>
    apiFetch<BackendProfile>('/api/v1/profile'),

  getCompleteness: () =>
    apiFetch<ProfileCompleteness>('/api/v1/profile/completeness'),

  updateBasics: (data: Record<string, unknown>) =>
    apiFetch<BackendProfile>('/api/v1/profile/basics', { method: 'PUT', body: data }),

  updateSkinIdentity: (data: Record<string, unknown>) =>
    apiFetch<BackendProfile>('/api/v1/profile/skin-identity', { method: 'PUT', body: data }),

  updateSkinState: (data: Record<string, unknown>) =>
    apiFetch<BackendProfile>('/api/v1/profile/skin-state', { method: 'PUT', body: data }),

  updateRoutine: (data: Record<string, unknown>) =>
    apiFetch<BackendProfile>('/api/v1/profile/routine', { method: 'PUT', body: data }),

  updateLifestyle: (data: Record<string, unknown>) =>
    apiFetch<BackendProfile>('/api/v1/profile/lifestyle', { method: 'PUT', body: data }),

  updatePreferences: (data: Record<string, unknown>) =>
    apiFetch<BackendProfile>('/api/v1/profile/preferences', { method: 'PUT', body: data }),

  completeOnboarding: () =>
    apiFetch<BackendProfile>('/api/v1/profile/complete-onboarding', { method: 'POST' }),
};

// Maps section ID to the correct service method
const SECTION_UPDATERS: Record<string, (data: Record<string, unknown>) => Promise<BackendProfile>> = {
  basics: profileService.updateBasics,
  skin: profileService.updateSkinIdentity,
  skin_state: profileService.updateSkinState,
  routine: profileService.updateRoutine,
  lifestyle: profileService.updateLifestyle,
  preferences: profileService.updatePreferences,
};

export function getUpdaterForSection(sectionId: string) {
  return SECTION_UPDATERS[sectionId];
}

/** Backend replaces the whole `preferences` JSONB; merge before saving so other keys are kept. */
export function mergePreferences(
  prev: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(prev || {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}
