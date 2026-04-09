import type { User } from "../api/authApi";

/** Merge API user + safe defaults for older responses */
export function normalizeUser(
  u: Partial<User> & Pick<User, "id" | "email" | "role">
): User {
  return {
    id: u.id,
    name: u.name ?? "",
    email: u.email,
    role: u.role,
    phone: u.phone ?? "",
    country: u.country ?? "",
    preferredCurrency: u.preferredCurrency ?? "USD",
    timezone: u.timezone ?? "",
    avatar: u.avatar ?? "",
    language: u.language ?? "en",
    studentId: u.studentId ?? "",
    program: u.program ?? "",
    monthlyBudgetTarget:
      u.monthlyBudgetTarget === undefined || u.monthlyBudgetTarget === null
        ? null
        : Number(u.monthlyBudgetTarget),
    notifyEmail: u.notifyEmail !== false,
    notifyPush: u.notifyPush === true,
    twoFactorEnabled: u.twoFactorEnabled === true,
  };
}
