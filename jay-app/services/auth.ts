import { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  auth_provider: string;
}

export function sessionToAuthUser(user: User): AuthUser {
  const meta = user.user_metadata ?? {};
  const app = user.app_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: meta.full_name ?? meta.name ?? null,
    display_name: meta.display_name ?? meta.full_name ?? null,
    avatar_url: meta.avatar_url ?? meta.picture ?? null,
    auth_provider: app.provider ?? 'email',
  };
}

export const authService = {
  signup: (data: { full_name: string; email: string; password: string }) =>
    supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } },
    }),

  login: (data: { email: string; password: string }) =>
    supabase.auth.signInWithPassword({ email: data.email, password: data.password }),

  logout: () => supabase.auth.signOut(),

  resetPassword: (email: string) =>
    supabase.auth.resetPasswordForEmail(email),

  signInWithOAuth: async (provider: 'google' | 'apple') => {
    const redirectTo = Linking.createURL('onboarding/callback');
    console.log('[JAY OAuth] Redirect URL:', redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) return { error: error || new Error('No OAuth URL') };
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !('url' in result)) {
      return { error: null, cancelled: true };
    }
    // Extract tokens from the redirect URL fragment
    const url = new URL(result.url);
    const params = new URLSearchParams(url.hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) return { error: sessionError };
    }
    return { error: null };
  },
};
