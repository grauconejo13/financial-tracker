// =============================================
// ClearPath - Authentication API Calls
// Connects React frontend to Spring Boot backend
// =============================================

import axios from "axios";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth.types";

// Base URL from environment variable (.env file)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * CP-01: REGISTER
 * POST /api/auth/register
 *
 * Sends registration data to backend.
 * Backend hashes password with BCrypt and stores user.
 */
export const registerUser = async (
  data: RegisterRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/register", data);
  return response.data;
};

/**
 * CP-02: LOGIN
 * POST /api/auth/login
 *
 * Sends credentials to backend.
 * Returns JWT token and user info on success.
 */
export const loginUser = async (
  data: LoginRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/login", data);
  return response.data;
};

/**
 * CP-03: LOGOUT
 * POST /api/auth/logout
 *
 * Sends current JWT token to backend for blacklisting.
 * Token can no longer be used after this call.
 */
export const logoutUser = async (token: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/logout",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * GET CURRENT USER
 * GET /api/auth/me
 *
 * Verifies token is still valid and returns user info.
 * Used on page load to restore authentication state.
 */
export const getCurrentUser = async (
  token: string
): Promise<AuthResponse> => {
  const response = await api.get<AuthResponse>("/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};