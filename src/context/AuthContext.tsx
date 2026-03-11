import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  setToken: (t: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('clearpath_token'));
  const [loading, setLoading] = useState(!!token);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('clearpath_token', newToken);
      setTokenState(newToken);
    } else {
      localStorage.removeItem('clearpath_token');
      setTokenState(null);
      setUser(null);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.request<{ user: User }>('/auth/me').then(({ user }) => setUser(user)).catch(() => setToken(null)).finally(() => setLoading(false));
  }, [token]);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    if (token) {
      try {
        await api.request('/auth/logout', { method: 'POST' });
      } catch {}
    }
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
