import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { Expense } from '../models/expense.model.js';
import Income from '../models/income.model.js';
import { User } from '../models/User.model.js';
import {
  buildCategoryHabitInsights,
  buildSpendingAwarenessSuggestions,
  computeGhostMetrics,
  ExpenseRow,
} from '../services/ghost.service.js';
import {
  buildPeriodWindows,
  parseExpenseDate,
  type DatedExpense,
} from '../services/ghostPeriod.service.js';

export async function getGhostOverview(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const uid = req.user!._id;
    const [expenses, incomes, user] = await Promise.all([
      Expense.find({ user: uid }).lean(),
      Income.find({ user: uid }).lean(),
      User.findById(uid).select('homeCurrency').lean(),
    ]);

    const expenseRows: ExpenseRow[] = expenses.map((e) => ({
      amount: e.amount,
      category: e.category,
    }));

    const datedExpenses: DatedExpense[] = expenses.map((e) => ({
      amount: e.amount,
      category: e.category,
      date: parseExpenseDate(e.date),
    }));

    const incomeRows = incomes.map((i) => ({ amount: i.amount }));
    const now = new Date();
    const isCurrentMonth = (value: unknown) => {
      const d = new Date(String(value));
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };
    const currentMonthExpenseRows: ExpenseRow[] = expenses
      .filter((e) => isCurrentMonth(e.date))
      .map((e) => ({
        amount: e.amount,
        category: e.category,
      }));
    const currentMonthIncomeRows = incomes
      .filter((i) => isCurrentMonth(i.date))
      .map((i) => ({ amount: i.amount }));

    const metrics = computeGhostMetrics(expenseRows, incomeRows);
    const monthMetrics = computeGhostMetrics(currentMonthExpenseRows, currentMonthIncomeRows);
    const currency = user?.homeCurrency || 'CAD';
    const spendingWindows = buildPeriodWindows(datedExpenses, new Date());
    const categoryInsights = buildCategoryHabitInsights(metrics, currency, spendingWindows);
    const suggestions = buildSpendingAwarenessSuggestions(spendingWindows, currency);

    // When period deltas are calm, still provide actionable CP-20 guidance from category gaps.
    const onlySummarySuggestion =
      suggestions.length <= 1 &&
      suggestions.every((s) => s.kind === 'summary');
    if (onlySummarySuggestion && categoryInsights.length > 0) {
      const fallback = categoryInsights.slice(0, 3).map((insight) => ({
        title: `Focus: ${insight.category}`,
        detail: `${insight.headline}. ${insight.body}`,
        kind: (insight.tone === 'positive' ? 'positive' : insight.tone === 'danger' ? 'danger' : 'alert') as
          | 'positive'
          | 'alert'
          | 'danger',
      }));
      suggestions.unshift(...fallback);
    }

    res.json({
      currency,
      realBalance: metrics.realBalance,
      ghostBalance: metrics.ghostBalance,
      totalIncome: metrics.totalIncome,
      totalExpense: metrics.totalExpense,
      ghostExpenseTotal: metrics.ghostExpenseTotal,
      totalGap: metrics.totalGap,
      periods: {
        currentMonth: {
          realBalance: monthMetrics.realBalance,
          ghostBalance: monthMetrics.ghostBalance,
          totalIncome: monthMetrics.totalIncome,
          totalExpense: monthMetrics.totalExpense,
          ghostExpenseTotal: monthMetrics.ghostExpenseTotal,
          totalGap: monthMetrics.totalGap,
        },
      },
      gapByCategory: metrics.gapByCategory,
      suggestions,
      categoryInsights,
      spendingWindows,
    });
  } catch (err) {
    next(err);
  }
}

