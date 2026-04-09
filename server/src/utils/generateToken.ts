import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export const generateToken = (id: string, role: 'student' | 'admin') => {
  return jwt.sign({ id, role }, ENV.JWT_SECRET, { expiresIn: '7d' });
};

/** Short-lived token after password OK, before TOTP verified */
export const generatePending2FAToken = (userId: string) => {
  return jwt.sign({ id: userId, pending2FA: true }, ENV.JWT_SECRET, {
    expiresIn: '10m',
  });
};

