import { expenseCategories } from "../models/expenseCategories";

export interface ExpenseRow {
  amount: number;
  category: string;
}

export interface GhostMetrics {
  totalIncome: number;
  totalExpense: number;
  realBalance: number;
  ghostExpenseTotal: number;
  ghostBalance: number;
  totalGap: number;
  gapByCategory: { category: string; actual: number; ghostPortion: number; gap: number }[];
}

const CATEGORY_GHOST_FACTORS: Record<string, number> = {
  Food: 0.78,
  Transport: 0.88,
  Rent: 1,
  Utilities: 1,
  Entertainment: 0.45,
  Healthcare: 1,
  Education: 1,
  Other: 0.72,
};

function factorForCategory(category: string): number {
  const known = CATEGORY_GHOST_FACTORS[category];
  if (known !== undefined) return known;
  return 0.8;
}

export function computeGhostMetrics(
  expenses: ExpenseRow[],
  incomes: { amount: number }[],
): GhostMetrics {
  const totalIncome = incomes.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
  const totalExpense = expenses.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
  const realBalance = totalIncome - totalExpense;

  const byCategory = new Map<string, { actual: number; ghost: number }>();
  for (const c of expenseCategories) byCategory.set(c, { actual: 0, ghost: 0 });

  for (const e of expenses) {
    const amount = Math.max(0, e.amount);
    const rawCategory = typeof e.category === "string" ? e.category.trim() : "";
    const category = expenseCategories.includes(rawCategory) ? rawCategory : "Other";
    const ghostPortion = amount * factorForCategory(category);
    const current = byCategory.get(category) || { actual: 0, ghost: 0 };
    current.actual += amount;
    current.ghost += ghostPortion;
    byCategory.set(category, current);
  }

  let ghostExpenseTotal = 0;
  const gapByCategory: GhostMetrics["gapByCategory"] = [];

  for (const [category, row] of byCategory) {
    if (row.actual <= 0) continue;
    ghostExpenseTotal += row.ghost;
    gapByCategory.push({
      category,
      actual: row.actual,
      ghostPortion: row.ghost,
      gap: row.actual - row.ghost,
    });
  }

  gapByCategory.sort((a, b) => b.gap - a.gap);

  const ghostBalance = totalIncome - ghostExpenseTotal;
  const totalGap = ghostBalance - realBalance;

  return {
    totalIncome,
    totalExpense,
    realBalance,
    ghostExpenseTotal,
    ghostBalance,
    totalGap,
    gapByCategory,
  };
}

export interface GhostSuggestion {
  title: string;
  detail: string;
  signal: "good" | "caution" | "alert";
}

export function buildGhostSuggestions(
  gapByCategory: GhostMetrics["gapByCategory"],
  currency: string,
): GhostSuggestion[] {
  const positive = gapByCategory.filter((row) => row.gap > 0.01);
  if (positive.length === 0) {
    return [
      {
        title: "You're in a steady stretch",
        detail:
          "Your current spending pattern is already close to the ghost baseline. Keep logging to maintain this trend.",
        signal: "good",
      },
    ];
  }

  const top = positive.slice(0, 4);
  return top.map((row) => {
    const signal: GhostSuggestion["signal"] =
      row.category === "Entertainment" || row.category === "Food" ? "alert" : "caution";

    return {
      title: `${row.category} is a key gap driver`,
      detail: `You spent ${row.actual.toFixed(2)} ${currency} here; the ghost model estimates ${row.ghostPortion.toFixed(2)} ${currency}. Potential recoverable gap: ${row.gap.toFixed(2)} ${currency}.`,
      signal,
    };
  });
}
