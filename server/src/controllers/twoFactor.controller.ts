import { Response, NextFunction } from 'express';
import QRCode from 'qrcode';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { comparePassword } from '../utils/hashPassword';
import { serializeUser } from '../utils/serializeUser';
import {
  generateSecret,
  createOtpauthUrl,
  verifyTotpCode,
} from '../utils/totp';

export const setupTwoFactor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.twoFactorEnabled) {
      return res
        .status(400)
        .json({ message: 'Two-factor auth is already on. Disable it first to set up again.' });
    }

    const secret = generateSecret();
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false;
    await user.save();

    const otpauthUrl = createOtpauthUrl(user.email, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    return res.json({
      message: 'Scan the QR code or enter the key in your authenticator app.',
      manualKey: secret,
      otpauthUrl,
      qrDataUrl,
    });
  } catch (err) {
    next(err);
  }
};

export const enableTwoFactor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.body as { code?: string };
    if (!code || !String(code).trim()) {
      return res.status(400).json({ message: 'Authenticator code is required' });
    }

    const user = await User.findById(req.user!._id).select('+twoFactorSecret');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: 'Run setup first to generate a secret' });
    }
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
    }

    const ok = verifyTotpCode(String(code), user.twoFactorSecret);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid authenticator code' });
    }

    user.twoFactorEnabled = true;
    await user.save();

    return res.json({
      message: 'Two-factor authentication is now enabled',
      user: serializeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const disableTwoFactor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password, code } = req.body as { password?: string; code?: string };
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findById(req.user!._id).select(
      '+password +twoFactorSecret'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    const passOk = await comparePassword(password, user.password);
    if (!passOk) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!code || !String(code).trim()) {
        return res.status(400).json({
          message: 'Enter a valid code from your authenticator to turn off 2FA',
        });
      }
      const ok = verifyTotpCode(String(code), user.twoFactorSecret);
      if (!ok) {
        return res.status(401).json({ message: 'Invalid authenticator code' });
      }
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = '';
    await user.save();

    const safe = await User.findById(user.id).select('-password');
    return res.json({
      message: 'Two-factor authentication has been turned off',
      user: safe ? serializeUser(safe) : undefined,
    });
  } catch (err) {
    next(err);
  }
};
