import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";
import type { User } from "./authApi";

const base = () => `${getApiOrigin()}/api/user`;

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const getProfile = async (token: string): Promise<{ user: User }> => {
  const { data } = await axios.get<{ user: User }>(`${base()}/profile`, {
    headers: authHeader(token),
  });
  return data;
};

export type ProfileUpdate = {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  preferredCurrency?: string;
  timezone?: string;
  avatar?: string | null;
  language?: string;
  studentId?: string;
  program?: string;
  monthlyBudgetTarget?: number | null;
  notifyEmail?: boolean;
  notifyPush?: boolean;
};

export const updateProfile = async (
  fields: ProfileUpdate,
  token: string
): Promise<{ user: User; message?: string }> => {
  const { data } = await axios.put<{ user: User; message?: string }>(
    `${base()}/profile`,
    fields,
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );
  return data;
};

export const updatePassword = async (
  currentPassword: string,
  newPassword: string,
  token: string
): Promise<{ message: string }> => {
  const { data } = await axios.put<{ message: string }>(
    `${base()}/password`,
    { currentPassword, newPassword },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );
  return data;
};

export const exportMyData = async (token: string): Promise<unknown> => {
  const { data } = await axios.get(`${base()}/export`, {
    headers: authHeader(token),
  });
  return data;
};

export const deleteMyAccount = async (
  password: string,
  confirmation: string,
  token: string
): Promise<{ message: string }> => {
  const { data } = await axios.post<{ message: string }>(
    `${base()}/account/delete`,
    { password, confirmation },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );
  return data;
};

export type TwoFASetupResponse = {
  message: string;
  manualKey: string;
  otpauthUrl: string;
  qrDataUrl: string;
};

export const setupTwoFA = async (token: string): Promise<TwoFASetupResponse> => {
  const { data } = await axios.post<TwoFASetupResponse>(
    `${base()}/2fa/setup`,
    {},
    { headers: authHeader(token) }
  );
  return data;
};

export const enableTwoFA = async (
  code: string,
  token: string
): Promise<{ message: string; user?: User }> => {
  const { data } = await axios.post<{ message: string; user?: User }>(
    `${base()}/2fa/enable`,
    { code },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );
  return data;
};

export const disableTwoFA = async (
  password: string,
  code: string | undefined,
  token: string
): Promise<{ message: string; user?: User }> => {
  const { data } = await axios.post<{ message: string; user?: User }>(
    `${base()}/2fa/disable`,
    { password, code },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );
  return data;
};
