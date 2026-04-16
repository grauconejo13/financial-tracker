import { Response, NextFunction } from 'express';
import { Debt } from '../models/Debt.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { AccountabilityLog } from '../models/AccountabilityLog.model';
import mongoose from 'mongoose';

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

    if (!counterparty || !counterparty.trim()) {
      errors.push('Counterparty is required');
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

    await AccountabilityLog.create({
      user: new mongoose.Types.ObjectId(user._id.toString()),
      action: 'debt_create',
      entityType: 'debt',
      entityId: debt._id,
      reason: 'Created debt',
      detail: {
        created: {
          label: debt.label,
          counterparty: debt.counterparty,
          amount: debt.amount,
          currency: debt.currency,
          direction: debt.direction,
          dueDate: debt.dueDate,
          notes: debt.notes
        }
      }
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

export const updateDebt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthenticated' });

    const { id } = req.params;
    const {
      label,
      counterparty,
      amount,
      currency,
      direction,
      dueDate,
      notes
    } = req.body as Partial<{
      label: string;
      counterparty: string;
      amount: number;
      currency: string;
      direction: 'owed_by_me' | 'owed_to_me';
      dueDate: string;
      notes: string;
    }>;

    const debt = await Debt.findOne({ _id: id, user: user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });

    const errors: string[] = [];

    const before = {
      label: debt.label,
      counterparty: debt.counterparty,
      amount: debt.amount,
      currency: debt.currency,
      direction: debt.direction,
      dueDate: debt.dueDate,
      notes: debt.notes
    };
    if (label !== undefined) {
      if (!label || !String(label).trim()) errors.push('Label cannot be empty');
      else debt.label = String(label).trim();
    }
    if (counterparty !== undefined) {
      if (!counterparty || !String(counterparty).trim()) errors.push('Counterparty is required');
      else debt.counterparty = String(counterparty).trim();
    }
    if (amount !== undefined) {
      const n = Number(amount);
      if (isNaN(n) || n <= 0) errors.push('Amount must be a positive number');
      else debt.amount = n;
    }
    if (currency !== undefined) debt.currency = String(currency);
    if (direction !== undefined && ['owed_by_me', 'owed_to_me'].includes(direction)) debt.direction = direction;
    if (dueDate !== undefined) {
      if (dueDate === '' || dueDate == null) debt.dueDate = undefined;
      else {
        const d = new Date(dueDate);
        if (!isNaN(d.getTime())) debt.dueDate = d;
      }
    }
    if (notes !== undefined) debt.notes = String(notes).trim() || undefined;

    if (errors.length) return res.status(400).json({ errors });
    await debt.save();

    const after = {
      label: debt.label,
      counterparty: debt.counterparty,
      amount: debt.amount,
      currency: debt.currency,
      direction: debt.direction,
      dueDate: debt.dueDate,
      notes: debt.notes
    };

    await AccountabilityLog.create({
      user: new mongoose.Types.ObjectId(user._id.toString()),
      action: 'debt_edit',
      entityType: 'debt',
      entityId: debt._id,
      reason: 'Updated debt details',
      detail: { before, after }
    });

    return res.json({ debt });
  } catch (err) {
    next(err);
  }
};

export const makePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthenticated' });

    const { id } = req.params;
    const { amount } = req.body as { amount?: number };

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ errors: ['Payment amount must be greater than 0'] });
    }

    const debt = await Debt.findOne({ _id: id, user: user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });

    const newPaid = (debt.paidAmount || 0) + Number(amount);
    if (newPaid > debt.amount) {
      return res.status(400).json({ errors: ['Payment exceeds remaining debt balance'] });
    }

    debt.paidAmount = newPaid;
    await debt.save();

    await AccountabilityLog.create({
      user: new mongoose.Types.ObjectId(user._id.toString()),
      action: 'debt_payment',
      entityType: 'debt',
      entityId: debt._id,
      reason: 'Debt payment recorded',
      detail: {
        payment: {
          amount: Number(amount),
          newPaidAmount: debt.paidAmount,
          totalAmount: debt.amount
        }
      }
    });

    return res.json({ debt });
  } catch (err) {
    next(err);
  }
};

export const deleteDebt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthenticated' });

    const { id } = req.params;
    const debt = await Debt.findOne({ _id: id, user: user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });

    await Debt.findByIdAndDelete(id);

    await AccountabilityLog.create({
      user: new mongoose.Types.ObjectId(user._id.toString()),
      action: 'debt_delete',
      entityType: 'debt',
      entityId: debt._id,
      reason: 'Debt deleted',
      detail: {
        deleted: {
          label: debt.label,
          counterparty: debt.counterparty,
          amount: debt.amount,
          currency: debt.currency,
          direction: debt.direction
        }
      }
    });

    return res.status(200).json({ message: 'Debt deleted', debt });
  } catch (err) {
    next(err);
  }
};