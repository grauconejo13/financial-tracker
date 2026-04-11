import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.model';
import { AccountabilityLog } from '../models/AccountabilityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  parseTransactionListQuery,
  buildTransactionListFilter,
  startOfUtcDayFromDateInput
} from '../utils/transactionListQuery';

const DATE_INPUT_RE = /^\d{4}-\d{2}-\d{2}$/;

export const createTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const { type, amount, description, category, reason, transactionDate } = req.body as {
      type?: string;
      amount?: number;
      description?: string;
      category?: string;
      reason?: string;
      /** Optional YYYY-MM-DD — when the transaction occurred (defaults to “today” UTC if omitted). */
      transactionDate?: string;
    };

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ message: 'type must be income or expense' });
    }

    if (amount === undefined || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }

    if (!reason || reason.trim().length < 5) {
      return res
        .status(400)
        .json({ message: 'Reason is required (min 5 characters)' });
    }

    const dateStr =
      typeof transactionDate === 'string' ? transactionDate.trim() : '';
    if (!dateStr) {
      return res
        .status(400)
        .json({ message: 'Transaction date is required (YYYY-MM-DD)' });
    }
    if (!DATE_INPUT_RE.test(dateStr)) {
      return res
        .status(400)
        .json({ message: 'transactionDate must be YYYY-MM-DD' });
    }
    let occurredAt: Date;
    try {
      occurredAt = startOfUtcDayFromDateInput(dateStr);
    } catch {
      return res.status(400).json({ message: 'Invalid transactionDate' });
    }

    const tx = await Transaction.create({
      user: new mongoose.Types.ObjectId(user._id.toString()),
      type,
      amount,
      description: description.trim(),
      category: category?.trim() || undefined,
      createdAt: occurredAt,
      updatedAt: occurredAt
    });

    await AccountabilityLog.create({
      user: new mongoose.Types.ObjectId(user._id.toString()),
      action: 'transaction_create',
      entityType: 'transaction',
      entityId: tx._id,
      reason: reason.trim(),
      detail: {
        created: {
          type,
          amount,
          description: description.trim(),
          category: category?.trim() || undefined,
          transactionDate: dateStr
        }
      }
    });

    return res.status(201).json({ transaction: tx });
  } catch (err) {
    next(err);
  }
};

export const getMyTransactionCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const rows = await Transaction.find({
      user: user._id,
      isDeleted: false,
      category: { $exists: true, $nin: [null, ''] }
    })
      .select('category')
      .lean();

    const set = new Set<string>();
    for (const r of rows) {
      if (r.category != null && r.category !== '') {
        set.add(String(r.category));
      }
    }

    const categories = [...set].sort((a, b) => a.localeCompare(b));
    return res.json({ categories });
  } catch (err) {
    next(err);
  }
};

export const getMyTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    let listQuery;
    try {
      listQuery = parseTransactionListQuery(req.query as Record<string, unknown>);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid query parameters';
      return res.status(400).json({ message: msg });
    }

    const filter = buildTransactionListFilter(
      new mongoose.Types.ObjectId(user._id.toString()),
      listQuery
    );

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });

    return res.json({ transactions });
  } catch (err) {
    next(err);
  }
};

export const deleteTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid transaction id' });
    }

    if (!reason || reason.trim().length < 5) {
      return res
        .status(400)
        .json({ message: 'Delete reason is required (min 5 characters)' });
    }

    const tx = await Transaction.findById(id);
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const isOwner = tx.user.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to delete this transaction' });
    }

    if (tx.isDeleted) {
      return res.status(409).json({ message: 'Transaction already deleted' });
    }

    const deletedSnapshot = {
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category:
        tx.category != null && tx.category !== ''
          ? String(tx.category)
          : undefined
    };

    tx.isDeleted = true;
    tx.deletedAt = new Date();
    tx.deletedBy = new mongoose.Types.ObjectId(user._id);
    tx.deleteReason = reason.trim();

    await tx.save();

    await AccountabilityLog.create({
      user: new mongoose.Types.ObjectId(user._id.toString()),
      action: 'transaction_delete',
      entityType: 'transaction',
      entityId: tx._id,
      reason: reason.trim(),
      detail: { deleted: deletedSnapshot }
    });

    return res.status(200).json({ transaction: tx });
  } catch (err) {
    next(err);
  }
};

export const editTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const { id } = req.params;
    const { amount, description, category, reason } = req.body as {
      amount?: number;
      description?: string;
      category?: string;
      reason?: string;
    };

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid transaction id' });
    }

    if (!reason || reason.trim().length < 5) {
      return res
        .status(400)
        .json({ message: 'Edit reason is required (min 5 characters)' });
    }

    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    if (description !== undefined && !description.trim()) {
      return res.status(400).json({ message: 'Description cannot be empty' });
    }

    const tx = await Transaction.findById(id);

    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const isOwner = tx.user.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to edit this transaction' });
    }

    if (tx.isDeleted) {
      return res.status(409).json({ message: 'Cannot edit a deleted transaction' });
    }

    const before = {
      amount: tx.amount,
      description: tx.description,
      category:
        tx.category != null && tx.category !== ''
          ? String(tx.category)
          : ''
    };

    if (amount !== undefined) tx.amount = amount;
    if (description !== undefined) tx.description = description;
    if (category !== undefined) tx.category = category;

    const after = {
      amount: tx.amount,
      description: tx.description,
      category:
        tx.category != null && tx.category !== ''
          ? String(tx.category)
          : ''
    };

    await tx.save();

    await AccountabilityLog.create({
      user: new mongoose.Types.ObjectId(user._id.toString()),
      action: 'transaction_edit',
      entityType: 'transaction',
      entityId: tx._id,
      reason: reason.trim(),
      detail: { before, after }
    });

    return res.status(200).json({ transaction: tx });
  } catch (err) {
    next(err);
  }
};
