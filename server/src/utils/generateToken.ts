import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export const generateToken = (id: string, role: 'student' | 'admin') => {
  return jwt.sign({ id, role }, ENV.JWT_SECRET, { expiresIn: '7d' });
};

