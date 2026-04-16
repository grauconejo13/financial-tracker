import { Response } from "express";
import mongoose from "mongoose";
import { Savings } from "../models/Savings.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { logAccountabilityEvent } from "../utils/accountability";

// Get savings
export const getSavings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });
    let savings = await Savings.findOne({ user: userId });

    if (!savings) {
      savings = new Savings({ user: new mongoose.Types.ObjectId(userId), balance: 0 });
      await savings.save();
    }

    res.status(200).json(savings);
  } catch {
    res.status(500).json({ message: "Failed to fetch savings" });
  }
};

// Add money
export const addSavings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const existing = await Savings.findOne({ user: userId });
    const previousBalance = existing?.balance ?? 0;
    const savings = await Savings.findOneAndUpdate(
      { user: userId },
      {
        $inc: { balance: amount },
        $setOnInsert: { user: new mongoose.Types.ObjectId(userId) }
      },
      { new: true, upsert: true }
    );

    await logAccountabilityEvent({
      userId,
      action: "savings_deposit",
      entityType: "savings",
      entityId: savings._id,
      reason: "Added savings funds",
      detail: {
        deposit: {
          amount: Number(amount),
          previousBalance,
          newBalance: savings.balance,
        },
      },
    });

    res.json({ message: "Amount added", savings });
  } catch {
    res.status(500).json({ message: "Failed to add amount" });
  }
};

// Remove money
export const withdrawSavings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });
    const { amount, reason } = req.body;

    const savings = await Savings.findOne({ user: userId });

    if (!savings || savings.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const previousBalance = savings.balance;
    savings.balance -= amount;
    await savings.save();

    await logAccountabilityEvent({
      userId,
      action: "savings_withdraw",
      entityType: "savings",
      entityId: savings._id,
      reason: typeof reason === "string" && reason.trim() ? reason.trim() : "Withdrew savings funds",
      detail: {
        withdraw: {
          amount: Number(amount),
          previousBalance,
          newBalance: savings.balance,
        },
      },
    });

    res.json({ message: "Amount removed", savings });
  } catch {
    res.status(500).json({ message: "Failed to remove amount" });
  }
};
