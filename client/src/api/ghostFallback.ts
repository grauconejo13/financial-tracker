import { getExpenses, type Expense } from "./expenseApi";
import { getIncomes, type Income } from "./incomeApi";
import type { DashboardSummary, GhostOverview } from "../types/dashboard.types";

const CATEGORY_ORDER = [
  "Food",
  "Transport",
  "Rent",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Other",
] as const;

const CATEGORY_FACTORS: Record<string, number> = {
  Food: 0.78,
  Transport: 0.88,
  Rent: 1,
  Utilities: 1,
  Entertainment: 0.45,
  Healthcare: 1,
  Education: 1,
  Other: 0.72,
};

type GapRow = { category: string; actual: number; ghostPortion: number; gap: number };

function normalizeCategory(raw: string): string {
  return CATEGORY_ORDER.includes(raw as (typeof CATEGORY_ORDER)[number]) ? raw : "Other";
}

function compute(expenses: Expense[], incomes: Income[]) {
  const totalIncome = incomes.reduce((s, x) => s + Math.max(0, Number(x.amount) || 0), 0);
  const totalExpense = expenses.reduce((s, x) => s + Math.max(0, Number(x.amount) || 0), 0);
  const realBalance = totalIncome - totalExpense;

  const byCategory = new Map<string, { actual: number; ghost: number }>();
  for (const c of CATEGORY_ORDER) byCategory.set(c, { actual: 0, ghost: 0 });

  for (const e of expenses) {
    const amount = Math.max(0, Number(e.amount) || 0);
    const category = normalizeCategory(String(e.category || "Other"));
    const factor = CATEGORY_FACTORS[category] ?? 0.8;
    const current = byCategory.get(category) || { actual: 0, ghost: 0 };
    current.actual += amount;
    current.ghost += amount * factor;
    byCategory.set(category, current);
  }

  const gapByCategory: GapRow[] = [];
  let ghostExpenseTotal = 0;
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

  return { totalIncome, totalExpense, realBalance, ghostExpenseTotal, ghostBalance, totalGap, gapByCategory };
}

export async function buildDashboardSummaryFallback(): Promise<DashboardSummary> {
  const [incomes, expenses] = await Promise.all([getIncomes(), getExpenses()]);
  const m = compute(expenses, incomes);

  const expenseByCategory = CATEGORY_ORDER.map((c) => {
    const row = m.gapByCategory.find((g) => g.category === c);
    return { name: c, value: Math.round((row?.actual || 0) * 100) / 100 };
  }).filter((x) => x.value > 0);

  return {
    currency: "USD",
    displayName: "",
    totals: {
      income: Math.round(m.totalIncome * 100) / 100,
      expenses: Math.round(m.totalExpense * 100) / 100,
      net: Math.round((m.totalIncome - m.totalExpense) * 100) / 100,
    },
    ghost: {
      realBalance: Math.round(m.realBalance * 100) / 100,
      ghostBalance: Math.round(m.ghostBalance * 100) / 100,
      totalGap: Math.round(m.totalGap * 100) / 100,
    },
    flow: {
      income: Math.round(m.totalIncome * 100) / 100,
      expenses: Math.round(m.totalExpense * 100) / 100,
      savings: Math.round((m.totalIncome - m.totalExpense) * 100) / 100,
    },
    ghostVsUser: {
      expenseActual: Math.round(m.totalExpense * 100) / 100,
      expenseGhost: Math.round(m.ghostExpenseTotal * 100) / 100,
      savingsActual: Math.round(m.realBalance * 100) / 100,
      savingsGhost: Math.round(m.ghostBalance * 100) / 100,
    },
    expenseByCategory,
    gapByCategory: m.gapByCategory
      .filter((g) => g.gap > 0)
      .map((g) => ({ name: g.category, value: Math.round(g.gap * 100) / 100 })),
  };
}

export async function buildGhostOverviewFallback(): Promise<GhostOverview> {
  const [incomes, expenses] = await Promise.all([getIncomes(), getExpenses()]);
  const m = compute(expenses, incomes);
  const top = m.gapByCategory.filter((g) => g.gap > 0.01).slice(0, 4);

  const suggestions =
    top.length > 0
      ? top.map((g) => ({
          title: `${g.category} is a key gap driver`,
          detail: `Potential recoverable gap is ${g.gap.toFixed(2)} USD based on your current pattern.`,
          signal: (g.category === "Food" || g.category === "Entertainment" ? "alert" : "caution") as
            | "good"
            | "caution"
            | "alert",
        }))
      : [
          {
            title: "Spending is near ghost baseline",
            detail: "No significant category gap yet. Keep tracking to surface trends.",
            signal: "good" as const,
          },
        ];

  return {
    currency: "USD",
    realBalance: Math.round(m.realBalance * 100) / 100,
    ghostBalance: Math.round(m.ghostBalance * 100) / 100,
    totalIncome: Math.round(m.totalIncome * 100) / 100,
    totalExpense: Math.round(m.totalExpense * 100) / 100,
    ghostExpenseTotal: Math.round(m.ghostExpenseTotal * 100) / 100,
    totalGap: Math.round(m.totalGap * 100) / 100,
    gapByCategory: m.gapByCategory.map((g) => ({
      category: g.category,
      actual: Math.round(g.actual * 100) / 100,
      ghostPortion: Math.round(g.ghostPortion * 100) / 100,
      gap: Math.round(g.gap * 100) / 100,
    })),
    suggestions,
  };
}
