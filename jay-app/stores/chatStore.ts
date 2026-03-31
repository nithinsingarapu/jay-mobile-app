import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'jay';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  updated_at: string;
  message_count: number;
  last_message_preview: string | null;
}

interface ChatState {
  conversationId: string | null;
  messages: ChatMessage[];
  conversations: ConversationSummary[];
  isTyping: boolean;
  isStreaming: boolean;
  isLoading: boolean;
  abortController: AbortController | null;
  mode: string;

  initConversation: () => Promise<void>;
  loadConversations: () => Promise<void>;
  openConversation: (id: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  stopGenerating: () => void;
  newChat: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setMode: (mode: string) => void;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const fmtTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const useChatStore = create<ChatState>((set, get) => ({
  conversationId: null,
  messages: [],
  conversations: [],
  isTyping: false,
  isStreaming: false,
  isLoading: false,
  abortController: null,
  mode: 'General',

  setMode: (mode) => set({ mode }),

  loadConversations: async () => {
    try {
      const convs = await apiFetch<ConversationSummary[]>('/api/v1/chat/conversations?limit=30');
      set({ conversations: convs });
    } catch {}
  },

  initConversation: async () => {
    if (get().conversationId) return;
    set({ isLoading: true });
    try {
      const convs = await apiFetch<ConversationSummary[]>('/api/v1/chat/conversations?limit=1');
      if (convs.length > 0) {
        set({ conversationId: convs[0].id });
        await get().openConversation(convs[0].id);
      }
      // If no conversations, stay on empty state — user will create one by sending a message
    } catch (e) { console.error('[Chat] Init failed:', e); }
    set({ isLoading: false });
  },

  openConversation: async (id: string) => {
    set({ conversationId: id, isLoading: true, messages: [] });
    try {
      const msgs = await apiFetch<{ id: string; role: string; content: string; created_at: string }[]>(
        `/api/v1/chat/conversations/${id}/messages`
      );
      set({
        messages: msgs.map((m) => ({
          id: m.id,
          role: m.role === 'user' ? 'user' as const : 'jay' as const,
          text: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })),
      });
    } catch {}
    set({ isLoading: false });
  },

  sendMessage: async (text: string) => {
    let { conversationId } = get();
    if (get().isStreaming) return;

    // Auto-create conversation if none exists
    if (!conversationId) {
      try {
        const conv = await apiFetch<{ id: string }>('/api/v1/chat/conversations', { method: 'POST' });
        conversationId = conv.id;
        set({ conversationId });
      } catch { return; }
    }

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text, timestamp: fmtTime() };
    const jayId = `j-${Date.now()}`;
    const controller = new AbortController();

    set((s) => ({
      messages: [...s.messages, userMsg],
      isTyping: true, isStreaming: true, abortController: controller,
    }));

    // Add JAY placeholder immediately so errors can be shown in it
    set((s) => ({
      messages: [...s.messages, { id: jayId, role: 'jay' as const, text: '', timestamp: fmtTime(), isStreaming: true }],
      isTyping: false,
    }));

    let fullText = '';
    try {
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch(`${API_URL}/api/v1/chat/conversations/${conversationId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ content: text, mode: get().mode }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No body');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6);
            if (d === '[DONE]') continue;
            fullText += d;
            set((s) => ({ messages: s.messages.map((m) => m.id === jayId ? { ...m, text: fullText } : m) }));
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') fullText = fullText || '(Stopped generating)';
      else if (!fullText) fullText = "Couldn't connect to JAY right now. Is the backend running?";
    }

    // Finalize JAY message
    set((s) => ({
      messages: s.messages.map((m) => m.id === jayId ? { ...m, text: fullText, isStreaming: false } : m),
      isTyping: false, isStreaming: false, abortController: null,
    }));

    // Refresh conversation list in background
    get().loadConversations();
  },

  stopGenerating: () => { get().abortController?.abort(); },

  newChat: async () => {
    get().abortController?.abort();
    set({ conversationId: null, messages: [], isTyping: false, isStreaming: false, abortController: null });
  },

  deleteConversation: async (id: string) => {
    try {
      await apiFetch(`/api/v1/chat/conversations/${id}`, { method: 'DELETE' });
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        ...(s.conversationId === id ? { conversationId: null, messages: [] } : {}),
      }));
    } catch {}
  },
}));
