import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { BlacklistedToken } from '../models/BlacklistedToken.model';
import { ENV } from '../config/env';

interface JwtPayload {
  id: string;
  role: 'student' | 'admin';
}

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: 'student' | 'admin';
    preferredCurrency?: string; //Added by jasmin
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  const blacklisted = await BlacklistedToken.findOne({ token });
  if (blacklisted) {
    return res.status(401).json({ message: 'Token has been revoked' });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    req.user = { _id: decoded.id, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/** Sets req.user when a valid Bearer token is present; otherwise continues without user. */
export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const blacklisted = await BlacklistedToken.findOne({ token });
  if (blacklisted) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    req.user = { _id: decoded.id, role: decoded.role };
  } catch {
    /* invalid token — treat as anonymous */
  }
  next();
};

