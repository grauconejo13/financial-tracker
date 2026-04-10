import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Expense } from "../models/expense.model";
import Income from "../models/income.model";
import { User } from "../models/User.model";
import { expenseCategories } from "../models/expenseCategories";
import { computeGhostMetrics, type ExpenseRow } from "../services/ghost.service";

export async function getDashboardSummary(
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

    const [expensesRaw, incomesRaw, user] = await Promise.all([
      Expense.find({ user: userId }).lean(),
      Income.find({ user: userId }).lean(),
      User.findById(userId).select("name preferredCurrency").lean(),
    ]);

    const incomes = incomesRaw.map((t) => ({ amount: Number(t.amount) || 0 }));
    const expenses: ExpenseRow[] = expensesRaw.map((t) => ({
      amount: Number(t.amount) || 0,
      category: typeof t.category === "string" ? t.category : "Other",
    }));

    const totalIncome = incomes.reduce((sum, i) => sum + Math.max(0, i.amount), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + Math.max(0, e.amount), 0);
    const net = totalIncome - totalExpense;

    const byCategory: Record<string, number> = {};
    for (const category of expenseCategories) byCategory[category] = 0;
    for (const e of expenses) {
      const category = expenseCategories.includes(e.category) ? e.category : "Other";
      byCategory[category] = (byCategory[category] || 0) + Math.max(0, e.amount);
    }

    const expenseByCategory = expenseCategories
      .map((name) => ({ name, value: Math.round((byCategory[name] || 0) * 100) / 100 }))
      .filter((x) => x.value > 0);

    const metrics = computeGhostMetrics(expenses, incomes);
    const gapByCategory = metrics.gapByCategory
      .filter((x) => x.gap > 0)
      .map((x) => ({ name: x.category, value: Math.round(x.gap * 100) / 100 }));

    const currency = user?.preferredCurrency || "USD";

    res.json({
      currency,
      displayName: user?.name || "",
      totals: {
        income: Math.round(totalIncome * 100) / 100,
        expenses: Math.round(totalExpense * 100) / 100,
        net: Math.round(net * 100) / 100,
      },
      ghost: {
        realBalance: Math.round(metrics.realBalance * 100) / 100,
        ghostBalance: Math.round(metrics.ghostBalance * 100) / 100,
        totalGap: Math.round(metrics.totalGap * 100) / 100,
      },
      flow: {
        income: Math.round(totalIncome * 100) / 100,
        expenses: Math.round(totalExpense * 100) / 100,
        savings: Math.round(net * 100) / 100,
      },
      ghostVsUser: {
        expenseActual: Math.round(totalExpense * 100) / 100,
        expenseGhost: Math.round(metrics.ghostExpenseTotal * 100) / 100,
        savingsActual: Math.round(metrics.realBalance * 100) / 100,
        savingsGhost: Math.round(metrics.ghostBalance * 100) / 100,
      },
      expenseByCategory,
      gapByCategory,
    });
  } catch (err) {
    next(err);
  }
}
