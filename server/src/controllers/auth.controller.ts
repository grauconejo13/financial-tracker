import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { BlacklistedToken } from '../models/BlacklistedToken.model';
import { hashPassword, comparePassword } from '../utils/hashPassword';
import { generateToken } from '../utils/generateToken';
import { ENV } from '../config/env';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const hashed = await hashPassword(password);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashed
    });

    const token = generateToken(user.id, user.role);

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);

    return res.json({
      user: { id: user.id, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { exp?: number };
        if (decoded?.exp) {
          await BlacklistedToken.create({ token, expiresAt: new Date(decoded.exp * 1000) });
        }
      } catch {
        // token invalid/expired - still respond success
      }
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

