import { User } from '@supabase/supabase-js';
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
};
