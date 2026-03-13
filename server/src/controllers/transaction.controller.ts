import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.model';
import { AuthRequest } from '../middleware/auth.middleware';

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

    const transactions = await Transaction.find({
      user: user._id,
      isDeleted: false
    }).sort({ createdAt: -1 });

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

    tx.isDeleted = true;
    tx.deletedAt = new Date();
    tx.deletedBy = new mongoose.Types.ObjectId(user._id);
    tx.deleteReason = reason.trim();

    await tx.save();

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

    if (amount !== undefined) tx.amount = amount;
    if (description !== undefined) tx.description = description;
    if (category !== undefined) tx.category = category;

    await tx.save();

    return res.status(200).json({ transaction: tx });
  } catch (err) {
    next(err);
  }
};