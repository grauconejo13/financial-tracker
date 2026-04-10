import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Transaction } from "../models/Transaction.model";
import { User } from "../models/User.model";
import {
  buildGhostSuggestions,
  computeGhostMetrics,
  type ExpenseRow,
} from "../services/ghost.service";

export async function getGhostOverview(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const [transactions, user] = await Promise.all([
      Transaction.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 }).lean(),
      User.findById(userId).select("preferredCurrency").lean(),
    ]);

    const incomes = transactions
      .filter((t) => t.type === "income")
      .map((t) => ({ amount: Number(t.amount) || 0 }));
    const expenses: ExpenseRow[] = transactions
      .filter((t) => t.type === "expense")
      .map((t) => ({
        amount: Number(t.amount) || 0,
        category: typeof t.category === "string" ? t.category : "Other",
      }));

    const metrics = computeGhostMetrics(expenses, incomes);
    const currency = user?.preferredCurrency || "USD";
    const suggestions = buildGhostSuggestions(metrics.gapByCategory, currency);

    res.json({
      currency,
      realBalance: Math.round(metrics.realBalance * 100) / 100,
      ghostBalance: Math.round(metrics.ghostBalance * 100) / 100,
      totalIncome: Math.round(metrics.totalIncome * 100) / 100,
      totalExpense: Math.round(metrics.totalExpense * 100) / 100,
      ghostExpenseTotal: Math.round(metrics.ghostExpenseTotal * 100) / 100,
      totalGap: Math.round(metrics.totalGap * 100) / 100,
      gapByCategory: metrics.gapByCategory.map((x) => ({
        category: x.category,
        actual: Math.round(x.actual * 100) / 100,
        ghostPortion: Math.round(x.ghostPortion * 100) / 100,
        gap: Math.round(x.gap * 100) / 100,
      })),
      suggestions,
    });
  } catch (err) {
    next(err);
  }
}
