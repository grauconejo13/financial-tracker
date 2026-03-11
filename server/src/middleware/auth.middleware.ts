import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { BlacklistedToken } from '../models/BlacklistedToken.model.js';

export interface AuthRequest extends Request {
  user?: { id: string };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }
  try {
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      res.status(401).json({ message: 'Session expired. Please log in again.' });
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { userId: string };
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Session expired. Please log in again.' });
      return;
    }
    res.status(401).json({ message: 'Invalid token.' });
  }
}

export const authenticate = authMiddleware;