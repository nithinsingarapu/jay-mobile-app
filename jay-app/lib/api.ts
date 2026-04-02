import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 60000; // 60s — AI generation can take 20-30s

let _tokenOverride: string | null = null;

export function setApiToken(token: string | null) {
  _tokenOverride = token;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (_tokenOverride) {
    return { Authorization: `Bearer ${_tokenOverride}` };
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  noAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, noAuth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!noAuth) {
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
    if (!authHeaders.Authorization) {
      console.warn(`[JAY API] No auth token for ${method} ${path} — request will 401`);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || `API error ${res.status}`);
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out — check your connection and try again.');
    }
    throw err;
  }
}
