import type { PieSlice } from "../components/charts/PieSvg";

export const EXPENSE_CHART_META = {
  title: "Expense breakdown",
  explainer:
    "Each slice is a share of your total recorded spending. Larger slices show where your budget weight sits.",
};

export const PROPOSAL_SCOPE_META = {
  title: "Proposal scope (Team 4)",
  explainer: "Stakeholder-facing split of major feature areas in your proposal.",
};

export const INCOME_EXPENSE_META = {
  title: "Income vs expenses",
  explainer: "Compares total income logged against total expenses.",
};

const CATEGORY_HINTS: Record<string, string> = {
  Food: "Groceries, dining, and delivery are often where habits surface first.",
  Transport: "Transit, fuel, and rides.",
  Rent: "Housing cost (mostly fixed).",
  Utilities: "Power, internet, and recurring bills.",
  Entertainment: "Discretionary spending category.",
  Healthcare: "Medical essentials and copays.",
  Education: "Tuition, books, and school tools.",
  Other: "Uncategorized spending.",
};

function withHints(rows: { name: string; value: number }[], hints: Record<string, string>): PieSlice[] {
  return rows.map((r) => ({
    name: r.name,
    value: r.value,
    hint: hints[r.name] || "Contextual chart segment.",
  }));
}

export function expenseSlicesWithHints(rows: { name: string; value: number }[]): PieSlice[] {
  return withHints(rows, CATEGORY_HINTS);
}

export function proposalSlices(rows: { name: string; value: number }[]): PieSlice[] {
  return withHints(rows, {
    "Auth & transactions": "Core login and transaction stories.",
    "Student personas (R1)": "First-year, international, and graduating user flows.",
    "Analytics & ghost (R2)": "Charts and ghost-tracking features.",
    "Admin & accountability (R2)": "Oversight, moderation, and audit features.",
  });
}

export function methodologySlices(rows: { name: string; value: number }[]): PieSlice[] {
  return withHints(rows, {
    "Plan & requirements": "Problem framing and scope definition.",
    "Iterative build": "Sprints and implementation cycles.",
    "Integration & test": "API/UI/database alignment and QA.",
    "Review & release": "Demo prep and release hardening.",
  });
}

export function cpSlices(rows: { name: string; value: number }[]): PieSlice[] {
  return withHints(rows, {
    "Release 1.0 (CP-01-10)": "Foundation stories and core flows.",
    "Release 2.0 Iteration 1": "Analytics and savings UX wave.",
    "Release 2.0 Iteration 2": "Ghost depth and accountability enhancements.",
  });
}

export function incomeExpenseSlices(rows: { name: string; value: number }[]): PieSlice[] {
  return rows.map((r) => ({
    name: r.name,
    value: r.value,
    hint: r.name === "Income" ? "Total income logged." : "Total expenses logged.",
  }));
}
