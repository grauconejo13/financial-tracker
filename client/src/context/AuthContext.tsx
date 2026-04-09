import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import * as authApi from "../api/authApi";
import type { User } from "../api/authApi";
import { normalizeUser } from "../utils/normalizeUser";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ twoFactorToken?: string }>;
  complete2FALogin: (twoFactorToken: string, code: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserFromServer: (user: User) => void;
}

const TOKEN_KEY = "clearpath_token";
const USER_KEY = "clearpath_user";

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const applySession = useCallback((rawUser: User, newToken: string) => {
    const normalized = normalizeUser(rawUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    setToken(newToken);
    setUser(normalized);
  }, []);

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem(TOKEN_KEY);

    if (!t) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      setToken(t);

      const { user: u } = await authApi.getCurrentUser(t);
      const normalized = normalizeUser(u);
      setUser(normalized);
      localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      if ("requiresTwoFactor" in data && data.requiresTwoFactor) {
        return { twoFactorToken: data.twoFactorToken };
      }
      const d = data as authApi.AuthResponse;
      applySession(d.user, d.token);
      return {};
    },
    [applySession]
  );

  const complete2FALogin = useCallback(
    async (twoFactorToken: string, code: string) => {
      const d = await authApi.verify2FALogin(twoFactorToken, code);
      applySession(d.user, d.token);
    },
    [applySession]
  );

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    const { user: u } = await authApi.getCurrentUser(t);
    const normalized = normalizeUser(u);
    setUser(normalized);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  }, []);

  const setUserFromServer = useCallback((u: User) => {
    const normalized = normalizeUser(u);
    setUser(normalized);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await authApi.register(name, email, password);
    },
    []
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await authApi.logout(token);
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        complete2FALogin,
        register,
        logout,
        refreshUser,
        setUserFromServer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
