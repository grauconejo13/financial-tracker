import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { validationResult, body } from 'express-validator';
import { User } from '../models/User.model.js';
import { BlacklistedToken } from '../models/BlacklistedToken.model.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { generateToken, decodeToken } from '../utils/generateToken.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName').optional().trim().isLength({ max: 50 }),
];

export async function register(req: Request, res: Response): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database not connected. Please start MongoDB and restart the server.' });
    return;
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }
  const { email, password, displayName } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email already exists.' });
      return;
    }
    const hashed = await hashPassword(password);
    const user = await User.create({ email, password: hashed, displayName: displayName || '' });
    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user._id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'Email already exists.' });
      return;
    }
    const isDbDown = mongoose.connection.readyState !== 1;
    res.status(isDbDown ? 503 : 500).json({
      message: isDbDown ? 'Database not connected. Please start MongoDB and restart the server.' : 'Registration failed. Please try again.',
    });
  }
}

export const loginValidation = [body('email').isEmail(), body('password').notEmpty()];

export async function login(req: Request, res: Response): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database not connected. Please start MongoDB and restart the server.' });
    return;
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Invalid email or password.' });
    return;
  }
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await comparePassword(password, user.password))) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }
    const token = generateToken(user._id.toString());
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const decoded = decodeToken(token);
      if (decoded?.exp) {
        await BlacklistedToken.create({ token, expiresAt: new Date(decoded.exp * 1000) });
      }
    } catch {}
  }
  res.json({ message: 'Logged out successfully' });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
}