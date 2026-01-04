import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  username?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    name: string;
    role: 'teacher' | 'student';
  }) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,

  hydrate: () => {
    const token = localStorage.getItem('thesisflow_token');
    const user = localStorage.getItem('thesisflow_user');
    if (token && user) {
      set({ token, user: JSON.parse(user) });
    }
  },

  logout: () => {
    localStorage.removeItem('thesisflow_token');
    localStorage.removeItem('thesisflow_user');
    set({ user: null, token: null });
  },

  register: async (payload) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    await get().login({ email: payload.email, password: payload.password });
  },

  login: async ({ email, password }) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error('登入失敗，請確認帳密');
    }
    const data = await res.json();
    const user = {
      ...data.user,
      username: (data.user.email || '').split('@')[0] || data.user.email,
    };
    localStorage.setItem('thesisflow_token', data.access_token);
    localStorage.setItem('thesisflow_user', JSON.stringify(user));
    set({ token: data.access_token, user });
  },
}));
