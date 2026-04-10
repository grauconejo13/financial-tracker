import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { Transaction } from '../models/Transaction.model';
import { Debt } from '../models/Debt.model';
import { comparePassword, hashPassword } from '../utils/hashPassword';
import { serializeUser } from '../utils/serializeUser';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_LANGUAGES = new Set([
  'en',
  'es',
  'fr',
  'de',
  'bn',
  'hi',
  'zh',
  'ja',
  'pt',
  'ar',
  'it',
  'ru',
  'ko',
]);
const AVATAR_MAX_LENGTH = 450_000;

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      country?: string;
      preferredCurrency?: string;
      timezone?: string;
      avatar?: string | null;
      language?: string;
      studentId?: string;
      program?: string;
      monthlyBudgetTarget?: number | null | string;
      notifyEmail?: boolean;
      notifyPush?: boolean;
    };

    const user = await User.findById(req.user!._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (body.name !== undefined) {
      const n = String(body.name).trim();
      if (!n) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      user.name = n;
    }

    if (body.email !== undefined && body.email.trim()) {
      const nextEmail = body.email.trim().toLowerCase();
      if (!EMAIL_RE.test(nextEmail)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      if (nextEmail !== user.email) {
        const taken = await User.findOne({ email: nextEmail });
        if (taken) {
          return res.status(409).json({ message: 'That email is already in use' });
        }
        user.email = nextEmail;
      }
    }

    if (body.phone !== undefined) {
      user.phone = String(body.phone).trim();
    }
    if (body.country !== undefined) {
      user.country = String(body.country).trim();
    }
    if (body.preferredCurrency !== undefined && String(body.preferredCurrency).trim()) {
      user.preferredCurrency = String(body.preferredCurrency).trim().toUpperCase();
    }
    if (body.timezone !== undefined) {
      user.timezone = String(body.timezone).trim();
    }

    if (body.avatar !== undefined) {
      if (body.avatar === null || body.avatar === '') {
        user.avatar = '';
      } else {
        const a = String(body.avatar);
        if (a.length > AVATAR_MAX_LENGTH) {
          return res.status(400).json({
            message: 'Avatar is too large. Use a smaller image (try under ~300KB).',
          });
        }
        user.avatar = a;
      }
    }

    if (body.language !== undefined && body.language !== '') {
      const lang = String(body.language).trim().toLowerCase();
      if (!ALLOWED_LANGUAGES.has(lang)) {
        return res.status(400).json({ message: 'Unsupported language code' });
      }
      user.language = lang;
    }

    if (body.studentId !== undefined) {
      user.studentId = String(body.studentId).trim();
    }
    if (body.program !== undefined) {
      user.program = String(body.program).trim();
    }

    if (body.monthlyBudgetTarget !== undefined) {
      if (body.monthlyBudgetTarget === null || body.monthlyBudgetTarget === '') {
        user.monthlyBudgetTarget = null;
      } else {
        const n = Number(body.monthlyBudgetTarget);
        if (Number.isNaN(n) || n < 0) {
          return res
            .status(400)
            .json({ message: 'Monthly budget must be a non-negative number' });
        }
        user.monthlyBudgetTarget = n;
      }
    }

    if (body.notifyEmail !== undefined) {
      user.notifyEmail = Boolean(body.notifyEmail);
    }
    if (body.notifyPush !== undefined) {
      user.notifyPush = Boolean(body.notifyPush);
    }

    await user.save();
    return res.json({ user: serializeUser(user), message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user!._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await comparePassword(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = await hashPassword(newPassword);
    await user.save();
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};


export const saveCurrencyPreference = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currency } = req.body as { currency?: string };
    if (!currency || !String(currency).trim()) {
      return res.status(400).json({ message: 'Currency is required' });
    }

    const user = await User.findById(req.user!._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.preferredCurrency = String(currency).trim().toUpperCase();
    await user.save();

    return res.json({
      message: 'Currency preference saved',
      currency: user.preferredCurrency,
      user: serializeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const exportMyData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const uid = req.user!._id;
    const user = await User.findById(uid).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [transactions, debts] = await Promise.all([
      Transaction.find({ user: uid, isDeleted: false }).lean(),
      Debt.find({ user: uid }).lean(),
    ]);

    return res.json({
      exportedAt: new Date().toISOString(),
      format: 'clearpath-export-v1',
      profile: serializeUser(user),
      transactions,
      debts,
      _note:
        'Income and expense records are not linked to your user in this build and are omitted.',
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMyAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password, confirmation } = req.body as {
      password?: string;
      confirmation?: string;
    };
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (confirmation !== 'DELETE') {
      return res.status(400).json({
        message: 'Type DELETE in the confirmation field to permanently remove your account',
      });
    }

    const user = await User.findById(req.user!._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    const uid = user._id;
    await Transaction.deleteMany({ user: uid });
    await Debt.deleteMany({ user: uid });
    await User.findByIdAndDelete(uid);

    return res.json({
      message: 'Your account and related data have been deleted',
    });
  } catch (err) {
    next(err);
  }
};
