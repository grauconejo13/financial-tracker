import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { Expense } from '../models/expense.model.js';
import Income from '../models/income.model.js';
import { User } from '../models/User.model.js';
import { expenseCategories } from '../models/expenseCategories.js';
import { computeGhostMetrics, ExpenseRow } from '../services/ghost.service.js';

function isInCurrentMonth(value: unknown, now: Date): boolean {
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return false;
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export async function getDashboardSummary(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const uid = req.user!._id;
    const [expenses, incomes, user] = await Promise.all([
      Expense.find({ user: uid }).lean(),
      Income.find({ user: uid }).lean(),
      User.findById(uid).select('homeCurrency displayName').lean(),
    ]);

    const expenseRows: ExpenseRow[] = expenses.map((e) => ({
      amount: e.amount,
      category: e.category,
    }));

    const totalIncome = incomes.reduce((s, i) => s + Math.max(0, i.amount), 0);
    const totalExpense = expenseRows.reduce((s, e) => s + Math.max(0, e.amount), 0);
    const now = new Date();
    const monthIncome = incomes
      .filter((i) => isInCurrentMonth(i.date, now))
      .reduce((s, i) => s + Math.max(0, i.amount), 0);
    const monthExpense = expenses
      .filter((e) => isInCurrentMonth(e.date, now))
      .reduce((s, e) => s + Math.max(0, e.amount), 0);

    const byCategory: Record<string, number> = {};
    for (const c of expenseCategories) byCategory[c] = 0;
    for (const e of expenseRows) {
      const cat = expenseCategories.includes(e.category) ? e.category : 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + Math.max(0, e.amount);
    }

    const expenseByCategory = expenseCategories
      .map((name) => ({ name, value: Math.round(byCategory[name] * 100) / 100 }))
      .filter((x) => x.value > 0);

    const incomeVsExpense = [
      { name: 'Income', value: Math.round(monthIncome * 100) / 100 },
      { name: 'Expenses', value: Math.round(monthExpense * 100) / 100 },
    ];

    const metrics = computeGhostMetrics(expenseRows, incomes.map((i) => ({ amount: i.amount })));
    const gapChart = metrics.gapByCategory
      .filter((g) => g.gap > 0)
      .map((g) => ({
        name: g.category,
        value: Math.round(g.gap * 100) / 100,
      }));

    const currency = user?.homeCurrency || 'CAD';

    res.json({
      currency,
      displayName: user?.displayName || '',
      totals: {
        income: Math.round(totalIncome * 100) / 100,
        expenses: Math.round(totalExpense * 100) / 100,
        net: Math.round((totalIncome - totalExpense) * 100) / 100,
      },
      periods: {
        currentMonth: {
          income: Math.round(monthIncome * 100) / 100,
          expenses: Math.round(monthExpense * 100) / 100,
          net: Math.round((monthIncome - monthExpense) * 100) / 100,
        },
      },
      ghost: {
        realBalance: Math.round(metrics.realBalance * 100) / 100,
        ghostBalance: Math.round(metrics.ghostBalance * 100) / 100,
        totalGap: Math.round(metrics.totalGap * 100) / 100,
      },
      expenseByCategory,
      incomeVsExpense,
      gapByCategory: gapChart,
    });
  } catch (err) {
    next(err);
  }
}

