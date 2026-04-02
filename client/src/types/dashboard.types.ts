export interface DashboardSummary {
  currency: string;
  displayName: string;
  totals: {
    income: number;
    expenses: number;
    net: number;
  };
  periods: {
    currentMonth: {
      income: number;
      expenses: number;
      net: number;
    };
  };
  ghost: {
    realBalance: number;
    ghostBalance: number;
    totalGap: number;
  };
  expenseByCategory: { name: string; value: number }[];
  incomeVsExpense: { name: string; value: number }[];
  gapByCategory: { name: string; value: number }[];
}

export interface CategoryHabitInsight {
  category: string;
  gap: number;
  actual: number;
  modeled: number;
  headline: string;
  body: string;
  pulse: string;
  tone?: "positive" | "alert" | "danger";
}

export interface GhostSuggestion {
  title: string;
  detail: string;
  kind?: "positive" | "alert" | "danger" | "summary";
}

export interface GhostOverview {
  currency: string;
  realBalance: number;
  ghostBalance: number;
  totalIncome: number;
  totalExpense: number;
  ghostExpenseTotal: number;
  totalGap: number;
  periods?: {
    currentMonth: {
      realBalance: number;
      ghostBalance: number;
      totalIncome: number;
      totalExpense: number;
      ghostExpenseTotal: number;
      totalGap: number;
    };
  };
  gapByCategory: {
    category: string;
    actual: number;
    ghostPortion: number;
    gap: number;
  }[];
  suggestions: GhostSuggestion[];
  categoryInsights: CategoryHabitInsight[];
}
