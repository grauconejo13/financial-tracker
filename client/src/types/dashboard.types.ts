export interface DashboardSummary {
  currency: string;
  displayName: string;
  totals: {
    income: number;
    expenses: number;
    net: number;
  };
  ghost: {
    realBalance: number;
    ghostBalance: number;
    totalGap: number;
  };
  flow: {
    income: number;
    expenses: number;
    savings: number;
  };
  ghostVsUser: {
    expenseActual: number;
    expenseGhost: number;
    savingsActual: number;
    savingsGhost: number;
  };
  expenseByCategory: { name: string; value: number }[];
  gapByCategory: { name: string; value: number }[];
}

export interface GhostOverview {
  currency: string;
  realBalance: number;
  ghostBalance: number;
  totalIncome: number;
  totalExpense: number;
  ghostExpenseTotal: number;
  totalGap: number;
  gapByCategory: {
    category: string;
    actual: number;
    ghostPortion: number;
    gap: number;
  }[];
  suggestions: {
    title: string;
    detail: string;
    signal: "good" | "caution" | "alert";
  }[];
}
