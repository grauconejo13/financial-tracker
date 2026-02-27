import { Response, NextFunction } from 'express';
import { Debt } from '../models/Debt.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const createDebt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const {
      label,
      counterparty,
      amount,
      currency = 'LKR',
      direction = 'owed_by_me',
      dueDate,
      notes
    } = req.body as {
      label?: string;
      counterparty?: string;
      amount?: number;
      currency?: string;
      direction?: 'owed_by_me' | 'owed_to_me';
      dueDate?: string;
      notes?: string;
    };

    const errors: string[] = [];

    if (!label || !label.trim()) {
      errors.push('Label is required');
    }

    if (amount == null || Number.isNaN(Number(amount))) {
      errors.push('Amount must be a number');
    } else if (Number(amount) <= 0) {
      errors.push('Amount must be greater than 0');
    }

    let parsedDueDate: Date | undefined;
    if (dueDate) {
      const d = new Date(dueDate);
      if (Number.isNaN(d.getTime())) {
        errors.push('Invalid dueDate');
      } else {
        parsedDueDate = d;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const debt = await Debt.create({
      user: user._id,
      label: label!.trim(),
      counterparty: counterparty?.trim() || undefined,
      amount: Number(amount),
      currency,
      direction,
      dueDate: parsedDueDate,
      notes: notes?.trim() || undefined
    });

    return res.status(201).json({ debt });
  } catch (err) {
    next(err);
  }
};

export const getMyDebts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const debts = await Debt.find({ user: user._id }).sort({ createdAt: -1 });
    return res.json({ debts });
  } catch (err) {
    next(err);
  }
};

