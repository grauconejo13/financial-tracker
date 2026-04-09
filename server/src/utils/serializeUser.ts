import type { IUser } from '../models/User.model';

/** Safe JSON shape returned to the client (never includes password or 2FA secret). */
export function serializeUser(user: IUser) {
  return {
    id: user.id,
    name: (user.name && String(user.name).trim()) || '',
    email: user.email,
    role: user.role,
    phone: (user.phone && String(user.phone).trim()) || '',
    country: (user.country && String(user.country).trim()) || '',
    preferredCurrency: (user.preferredCurrency && String(user.preferredCurrency).trim()) || 'USD',
    timezone: (user.timezone && String(user.timezone).trim()) || '',
    avatar: user.avatar ? String(user.avatar) : '',
    language: (user.language && String(user.language).trim()) || 'en',
    studentId: (user.studentId && String(user.studentId).trim()) || '',
    program: (user.program && String(user.program).trim()) || '',
    monthlyBudgetTarget:
      user.monthlyBudgetTarget === null || user.monthlyBudgetTarget === undefined
        ? null
        : Number(user.monthlyBudgetTarget),
    notifyEmail: user.notifyEmail !== false,
    notifyPush: user.notifyPush === true,
    twoFactorEnabled: user.twoFactorEnabled === true,
  };
}
