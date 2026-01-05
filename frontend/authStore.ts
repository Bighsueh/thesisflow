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
  checkTokenExpiry: () => boolean;
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
      // 延遲檢查 token 是否過期（確保 state 已更新）
      setTimeout(() => {
        get().checkTokenExpiry();
      }, 0);
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

  checkTokenExpiry: () => {
    const token = get().token;
    if (!token) return false;

    try {
      // 解析 JWT token（標準 JWT 格式：header.payload.signature）
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('[Auth] Invalid token format');
        get().logout();
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      const expiryTime = payload.exp * 1000; // 轉換為毫秒
      const now = Date.now();

      if (now > expiryTime) {
        // Token 已過期，自動登出
        console.warn('[Auth] Token expired, logging out...');
        get().logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('[Auth] Failed to parse token:', error);
      // Token 格式錯誤，視為無效
      get().logout();
      return false;
    }
  },
}));
