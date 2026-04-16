import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { BlacklistedToken } from '../models/BlacklistedToken.model';
import { hashPassword, comparePassword } from '../utils/hashPassword';
import { generateToken, generatePending2FAToken } from '../utils/generateToken';
import { verifyTotpCode } from '../utils/totp';
import { ENV } from '../config/env';
import { serializeUser } from '../utils/serializeUser';
import { logAccountabilityEvent } from '../utils/accountability';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const trimmedName = name?.trim() ?? '';
    if (!trimmedName) {
      return res.status(400).json({ message: 'Name is required' });
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
      name: trimmedName,
      email: email.toLowerCase(),
      password: hashed
    });

    const token = generateToken(user.id, user.role);

    return res.status(201).json({
      user: serializeUser(user),
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

    const with2fa = await User.findById(user._id).select('+twoFactorSecret');
    if (
      with2fa?.twoFactorEnabled &&
      with2fa.twoFactorSecret &&
      String(with2fa.twoFactorSecret).length > 0
    ) {
      return res.json({
        requiresTwoFactor: true,
        twoFactorToken: generatePending2FAToken(user.id)
      });
    }

    const token = generateToken(user.id, user.role);

    await logAccountabilityEvent({
      userId: user._id,
      action: 'login',
      entityType: 'security',
      entityId: user._id,
      reason: 'Logged in',
      detail: { metadata: { usedTwoFactor: false } },
    });

    return res.json({
      user: serializeUser(user),
      token
    });
  } catch (err) {
    next(err);
  }
};

export const verify2FALogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { twoFactorToken, code } = req.body as {
      twoFactorToken?: string;
      code?: string;
    };
    if (!twoFactorToken || !code) {
      return res
        .status(400)
        .json({ message: 'Verification session and code are required' });
    }

    let decoded: { id?: string; pending2FA?: boolean };
    try {
      decoded = jwt.verify(twoFactorToken, ENV.JWT_SECRET) as {
        id?: string;
        pending2FA?: boolean;
      };
    } catch {
      return res.status(401).json({
        message: 'Invalid or expired login session. Please sign in again.'
      });
    }

    if (!decoded.pending2FA || !decoded.id) {
      return res.status(401).json({ message: 'Invalid verification session' });
    }

    const user = await User.findById(decoded.id).select('+twoFactorSecret');
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(401).json({
        message: 'Two-factor authentication is not active for this account'
      });
    }

    const ok = verifyTotpCode(String(code), user.twoFactorSecret);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid authenticator code' });
    }

    const token = generateToken(user.id, user.role);
    await logAccountabilityEvent({
      userId: user._id,
      action: 'login_2fa',
      entityType: 'security',
      entityId: user._id,
      reason: 'Logged in with two-factor authentication',
      detail: { metadata: { usedTwoFactor: true } },
    });
    return res.json({
      user: serializeUser(user),
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
    let logoutUserId: string | undefined;
    if (token) {
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { exp?: number; id?: string };
        logoutUserId = decoded?.id;
        if (decoded?.exp) {
          await BlacklistedToken.create({ token, expiresAt: new Date(decoded.exp * 1000) });
        }
      } catch {
        // token invalid/expired - still respond success
      }
    }
    if (logoutUserId) {
      await logAccountabilityEvent({
        userId: logoutUserId,
        action: 'logout',
        entityType: 'security',
        entityId: logoutUserId,
        reason: 'Logged out',
        detail: { metadata: { at: new Date().toISOString() } },
      });
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
    return res.json({
      user: serializeUser(user)
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Return success even when user does not exist to avoid account enumeration.
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been generated.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    await logAccountabilityEvent({
      userId: user._id,
      action: 'password_reset_requested',
      entityType: 'security',
      entityId: user._id,
      reason: 'Requested password reset',
      detail: { metadata: { expiresAt: expiresAt.toISOString() } },
    });

    const appBase = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${appBase.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    console.log(`Password reset link for ${user.email}: ${resetLink}`);

    return res.json({ message: 'If the email exists, a reset link has been generated.' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = await hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await logAccountabilityEvent({
      userId: user._id,
      action: 'password_reset_completed',
      entityType: 'security',
      entityId: user._id,
      reason: 'Completed password reset',
      detail: { metadata: { at: new Date().toISOString() } },
    });

    return res.json({ message: 'Password reset successful. Please log in.' });
  } catch (err) {
    next(err);
  }
};

