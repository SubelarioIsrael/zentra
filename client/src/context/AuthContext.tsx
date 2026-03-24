import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import type { User } from '../types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('zentra_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest<{ user: User }>('/auth/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem('zentra_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  async function login(email: string, password: string) {
    const data = await apiRequest<{ user: User; token: string }>(
      '/auth/login',
      'POST',
      { email, password },
      false,
    );
    localStorage.setItem('zentra_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function register(name: string, email: string, password: string) {
    const data = await apiRequest<{ user: User; token: string }>(
      '/auth/register',
      'POST',
      { name, email, password },
      false,
    );
    localStorage.setItem('zentra_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('zentra_token');
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
