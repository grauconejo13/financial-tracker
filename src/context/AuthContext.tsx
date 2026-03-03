// =============================================
// ClearPath - Authentication Context
// Manages global auth state across the app
// Handles token storage in localStorage
// =============================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type {
  AuthContextType,
  AuthResponse,
  RegisterRequest,
  UserInfo,
} from "../types/auth.types";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../api/authApi";

// Create the context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const TOKEN_KEY = "clearpath_token";
const USER_KEY = "clearpath_user";

/**
 * AuthProvider wraps the entire app and provides
 * authentication state to all child components.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * On app load, check localStorage for existing session.
   * If a token exists, verify it with the backend.
   * This handles browser refresh without losing login.
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid with backend
          const response = await getCurrentUser(storedToken);

          if (response.success && response.user) {
            setToken(storedToken);
            setUser(response.user);
          } else {
            // Token invalid — clear everything
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        } catch {
          // Token expired or server error — clear session
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * CP-01: REGISTER
   * Calls backend registration endpoint.
   * Does NOT auto-login — user must log in after registering.
   * This matches acceptance test: "redirect to login"
   */
  const register = useCallback(
    async (data: RegisterRequest): Promise<AuthResponse> => {
      const response = await registerUser(data);
      return response;
    },
    []
  );

  /**
   * CP-02: LOGIN
   * Calls backend login endpoint.
   * On success, stores token and user in state + localStorage.
   * This matches acceptance test: "redirect to dashboard"
   */
  const login = useCallback(
    async (email: string, password: string): Promise<AuthResponse> => {
      const response = await loginUser({ email, password });

      if (response.success && response.token && response.user) {
        // Store in state
        setToken(response.token);
        setUser(response.user);

        // Persist in localStorage for page refresh
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }

      return response;
    },
    []
  );

  /**
   * CP-03: LOGOUT
   * Calls backend to blacklist the token.
   * Clears all local state and storage.
   *
   * Acceptance Tests:
   * - Session ends when logout button is clicked
   * - Session must be inactivated for security purposes
   */
  const logout = useCallback(async () => {
    if (token) {
      try {
        // Tell backend to blacklist this token
        await logoutUser(token);
      } catch {
        // Even if backend call fails, still clear local session
        // This ensures user can always log out
      }
    }

    // Clear state
    setToken(null);
    setUser(null);

    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, [token]);

  // Build the context value
  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/**
 * Custom hook to use auth context.
 * Must be used inside an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}