import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";

const API_BASE = getApiOrigin();
export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  phone: string;
  country: string;
  preferredCurrency: string;
  timezone: string;
  avatar: string;
  language: string;
  studentId: string;
  program: string;
  monthlyBudgetTarget: number | null;
  notifyEmail: boolean;
  notifyPush: boolean;
  twoFactorEnabled: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type LoginApiResponse =
  | AuthResponse
  | { requiresTwoFactor: true; twoFactorToken: string };

const api = axios.create({
  baseURL: `${API_BASE}/api/auth`,
  headers: { "Content-Type": "application/json" },
});

export const register = async (
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/register", {
    name,
    email,
    password,
  });
  return data;
};

export const login = async (
  email: string,
  password: string,
): Promise<LoginApiResponse> => {
  const { data } = await api.post<LoginApiResponse>("/login", {
    email,
    password,
  });
  return data;
};

export const verify2FALogin = async (
  twoFactorToken: string,
  code: string,
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/login/2fa", {
    twoFactorToken,
    code,
  });
  return data;
};

export const forgotPassword = async (
  email: string,
): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>("/forgot-password", {
    email,
  });
  return data;
};

export const resetPassword = async (
  token: string,
  password: string,
): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>("/reset-password", {
    token,
    password,
  });
  return data;
};

export const logout = async (token: string): Promise<void> => {
  await api.post(
    "/logout",
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

export const getCurrentUser = async (
  token: string,
): Promise<{ user: User }> => {
  const { data } = await api.get<{ user: User }>("/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
