import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { sessionToAuthUser, type AuthUser } from '../services/auth';
import { setApiToken } from '../lib/api';
import { profileService, type BackendProfile } from '../services/profile';

// User display data — derived from backend profile when available
export interface UserDisplayData {
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
  username: string | null;
  primaryConcerns: string[];
  topGoal: string | null;
  profileCompleteness: number;
}

const DEFAULT_USER: UserDisplayData = {
  name: '',
  skinType: '',
  sensitivity: '',
  skinScore: 0,
  streak: 0,
  diaryEntries: 0,
  trackedProducts: 0,
  glowPoints: 0,
  level: 'Newcomer',
  levelProgress: 0,
  memberSince: '',
  username: null,
  primaryConcerns: [],
  topGoal: null,
  profileCompleteness: 0,
};

// Build display data from backend profile
function profileToDisplayData(profile: BackendProfile, authUser: AuthUser | null): UserDisplayData {
  const concerns = profile.primary_concerns || [];
  const sensitivities = profile.sensitivities || [];
  const completeness = profile.profile_completeness || 0;

  // Calculate glow points from completeness + onboarding bonus
  const glowPoints = profile.onboarding_completed ? completeness + 20 : completeness;

  // Determine level from profile completeness
  let level = 'Newcomer';
  let levelProgress = 0;
  if (completeness >= 80) { level = 'Skincare Expert'; levelProgress = Math.min(100, (completeness - 80) * 5); }
  else if (completeness >= 50) { level = 'Skincare Enthusiast'; levelProgress = Math.round(((completeness - 50) / 30) * 100); }
  else if (completeness >= 20) { level = 'Skincare Explorer'; levelProgress = Math.round(((completeness - 20) / 30) * 100); }
  else { level = 'Newcomer'; levelProgress = Math.round((completeness / 20) * 100); }

  // Format memberSince from created_at
  let memberSince = '';
  if (profile.created_at) {
    const d = new Date(profile.created_at);
    memberSince = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  return {
    name: profile.full_name || authUser?.full_name || authUser?.email?.split('@')[0] || '',
    skinType: profile.skin_type ? profile.skin_type.charAt(0).toUpperCase() + profile.skin_type.slice(1) : '',
    sensitivity: sensitivities.length > 0 ? `${sensitivities.length} sensitivit${sensitivities.length === 1 ? 'y' : 'ies'}` : '',
    skinScore: completeness,
    streak: 0, // No streak tracking in Phase 1
    diaryEntries: 0, // No diary in Phase 1
    trackedProducts: 0, // No product tracking in Phase 1
    glowPoints,
    level,
    levelProgress,
    memberSince,
    username: profile.username,
    primaryConcerns: concerns,
    topGoal: (profile.preferences as Record<string, unknown>)?.top_goal as string || null,
    profileCompleteness: completeness,
  };
}

interface UserState {
  user: UserDisplayData;
  onboardingComplete: boolean;
  setOnboardingComplete: (val: boolean) => void;
  updateUser: (updates: Partial<UserDisplayData>) => void;

  backendProfile: BackendProfile | null;
  profileLoading: boolean;
  fetchProfile: () => Promise<void>;

  session: Session | null;
  authUser: AuthUser | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;

  initAuth: () => void;
  signOut: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: DEFAULT_USER,
  onboardingComplete: false,
  setOnboardingComplete: (val) => set({ onboardingComplete: val }),
  updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

  backendProfile: null,
  profileLoading: false,

  fetchProfile: async () => {
    const { isAuthenticated, authUser } = get();
    if (!isAuthenticated) return;

    set({ profileLoading: true });
    try {
      const profile = await profileService.getProfile();
      const displayData = profileToDisplayData(profile, authUser);

      // Load skin score from insights (cached, fast)
      try {
        const insights = await profileService.getInsights();
        if (insights?.skin_score?.overall_score) {
          displayData.skinScore = insights.skin_score.overall_score;
        }
      } catch {
        // Insights unavailable — keep skinScore from profile completeness
      }

      set({
        backendProfile: profile,
        onboardingComplete: profile.onboarding_completed,
        user: displayData,
        profileLoading: false,
      });
    } catch {
      set({ profileLoading: false });
    }
  },

  session: null,
  authUser: null,
  isAuthLoading: true,
  isAuthenticated: false,

  initAuth: () => {
    supabase.auth.onAuthStateChange((event, session) => {
      setApiToken(session?.access_token ?? null);

      if (event === 'INITIAL_SESSION') {
        if (session) {
          const authUser = sessionToAuthUser(session.user);
          set({
            session,
            authUser,
            isAuthenticated: true,
            isAuthLoading: false,
            // Set name from auth immediately while backend profile loads
            user: { ...DEFAULT_USER, name: authUser.full_name || authUser.email?.split('@')[0] || '' },
          });
          setTimeout(() => get().fetchProfile(), 0);
        } else {
          set({ isAuthLoading: false });
        }
      } else if (event === 'SIGNED_IN' && session) {
        const authUser = sessionToAuthUser(session.user);
        set({
          session,
          authUser,
          isAuthenticated: true,
          user: { ...DEFAULT_USER, name: authUser.full_name || authUser.email?.split('@')[0] || '' },
        });
        setTimeout(() => get().fetchProfile(), 0);
      } else if (event === 'SIGNED_OUT') {
        set({
          session: null,
          authUser: null,
          isAuthenticated: false,
          backendProfile: null,
          onboardingComplete: false,
          user: DEFAULT_USER,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        set({ session });
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
