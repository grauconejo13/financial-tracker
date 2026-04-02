import { expenseCategories } from '../models/expenseCategories.js';
import type { PeriodWindow } from './ghostPeriod.service.js';

export const CATEGORY_GHOST_FACTORS: Record<string, number> = {
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
  const f = CATEGORY_GHOST_FACTORS[category];
  if (f !== undefined) return f;
  return 0.8;
}

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

export function computeGhostMetrics(
  expenses: ExpenseRow[],
  incomes: { amount: number }[]
): GhostMetrics {
  const totalIncome = incomes.reduce((s, i) => s + Math.max(0, i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Math.max(0, e.amount), 0);
  const realBalance = totalIncome - totalExpense;

  const byCat = new Map<string, { actual: number; ghost: number }>();
  for (const c of expenseCategories) {
    byCat.set(c, { actual: 0, ghost: 0 });
  }

  for (const e of expenses) {
    const amt = Math.max(0, e.amount);
    const cat = expenseCategories.includes(e.category) ? e.category : 'Other';
    const fac = factorForCategory(cat);
    const ghostPortion = amt * fac;
    const cur = byCat.get(cat) || { actual: 0, ghost: 0 };
    cur.actual += amt;
    cur.ghost += ghostPortion;
    byCat.set(cat, cur);
  }

  let ghostExpenseTotal = 0;
  const gapByCategory: GhostMetrics['gapByCategory'] = [];
  for (const [category, v] of byCat) {
    if (v.actual <= 0) continue;
    ghostExpenseTotal += v.ghost;
    gapByCategory.push({
      category,
      actual: v.actual,
      ghostPortion: v.ghost,
      gap: v.actual - v.ghost,
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

export interface Suggestion {
  title: string;
  detail: string;
  kind: 'positive' | 'alert' | 'danger' | 'summary';
}

export interface CategoryHabitInsight {
  category: string;
  gap: number;
  actual: number;
  modeled: number;
  headline: string;
  body: string;
  pulse: string;
  tone: 'positive' | 'alert' | 'danger';
}

function periodLinesForCategory(cat: string, windows: PeriodWindow[]): string {
  const lines: string[] = [];
  for (const w of windows) {
    const d = w.deltas.find((x) => x.category === cat);
    if (!d) continue;
    if (d.currentTotal + d.previousTotal + d.currentEntries + d.previousEntries === 0) continue;
    const up = d.previousTotal > 0 && d.currentTotal > d.previousTotal * 1.08;
    const moreEntries = d.previousEntries > 0 && d.currentEntries > d.previousEntries;
    const curL = w.currentLabel ?? 'Current period';
    const prevL = w.previousLabel ?? 'Prior period';
    if (up || moreEntries) {
      lines.push(
        `${curL}: ${d.currentTotal.toFixed(2)} (${d.currentEntries} entries) vs ${prevL}: ${d.previousTotal.toFixed(2)} (${d.previousEntries} entries) — higher than your earlier stretch.`
      );
    } else {
      lines.push(
        `${curL}: ${d.currentTotal.toFixed(2)} (${d.currentEntries} entries) vs ${prevL}: ${d.previousTotal.toFixed(2)} (${d.previousEntries} entries).`
      );
    }
  }
  return lines.join(' ');
}

function habitCopyForCategory(
  cat: string,
  gap: number,
  actual: number,
  modeled: number,
  currency: string,
  windows: PeriodWindow[]
): { headline: string; body: string; pulse: string; tone: 'positive' | 'alert' | 'danger' } {
  const pct = actual > 0 ? Math.round((gap / actual) * 100) : 0;
  const gapStr = gap.toFixed(2);
  const periodBlock = periodLinesForCategory(cat, windows);
  const tone: 'positive' | 'alert' | 'danger' =
    pct <= 8 ? 'positive' : pct <= 22 ? 'alert' : 'danger';

  const blocks: Record<string, () => { headline: string; body: string; pulse: string; tone: 'positive' | 'alert' | 'danger' }> = {
    Food: () => ({
      headline: 'Food: pace vs last week / last month',
      body: `All-time spend in Food: ${actual.toFixed(2)} ${currency}; ghost compares that to a leaner pattern (about ${pct}% could shift). ${periodBlock ? `Time comparison: ${periodBlock}` : 'Log dates on expenses to unlock week-over-week and month-to-date comparisons.'}`,
      pulse: 'Meals & groceries',
      tone,
    }),
    Transport: () => ({
      headline: 'Transport: trips vs your earlier weeks',
      body: `Spend ${actual.toFixed(2)} ${currency} vs modeled ${modeled.toFixed(2)} ${currency}. ${periodBlock ? periodBlock : 'Add dated trips to see if this week outran last week.'}`,
      pulse: 'Commute & rides',
      tone,
    }),
    Rent: () => ({
      headline: 'Rent: mostly fixed',
      body: `Rent is modeled as inflexible; small gaps are usually timing. ${periodBlock}`,
      pulse: 'Housing',
      tone,
    }),
    Utilities: () => ({
      headline: 'Utilities: usage vs prior month',
      body: `Actual ${actual.toFixed(2)} ${currency} vs modeled ${modeled.toFixed(2)} ${currency}. ${periodBlock}`,
      pulse: 'Bills',
      tone,
    }),
    Entertainment: () => ({
      headline: 'Entertainment: nights out vs your baseline',
      body: `Higher discretionary spend here widens the ghost gap (${gapStr} ${currency}). ${periodBlock ? `If entries jumped (e.g. more movie or event nights than last month), treat it like dialing from three outings down to one — not “savings hacks,” just matching your calmer weeks.` : 'Use dated entries so we can compare this month to the same days last month.'}`,
      pulse: 'Nights & tickets',
      tone,
    }),
    Healthcare: () => ({
      headline: 'Healthcare',
      body: `Modeled close to actual. ${periodBlock}`,
      pulse: 'Essentials',
      tone,
    }),
    Education: () => ({
      headline: 'Education',
      body: `Course-related spend. ${periodBlock}`,
      pulse: 'School costs',
      tone,
    }),
    Other: () => ({
      headline: 'Other: mixed charges',
      body: `Catch-all category; ghost trims a portion. ${periodBlock}`,
      pulse: 'Misc',
      tone,
    }),
  };

  const fn = blocks[cat] || blocks.Other;
  return fn();
}

export function buildCategoryHabitInsights(
  metrics: GhostMetrics,
  currencyCode = 'CAD',
  windows: PeriodWindow[] = []
): CategoryHabitInsight[] {
  const currency = currencyCode || 'CAD';
  const out: CategoryHabitInsight[] = [];
  for (const row of metrics.gapByCategory) {
    if (row.gap < 0.01) continue;
    const copy = habitCopyForCategory(
      row.category,
      row.gap,
      row.actual,
      row.ghostPortion,
      currency,
      windows
    );
    out.push({
      category: row.category,
      gap: Math.round(row.gap * 100) / 100,
      actual: Math.round(row.actual * 100) / 100,
      modeled: Math.round(row.ghostPortion * 100) / 100,
      headline: copy.headline,
      body: copy.body,
      pulse: copy.pulse,
      tone: copy.tone,
    });
  }
  return out;
}

function categorizeDelta(
  cat: string,
  d: {
    currentTotal: number;
    previousTotal: number;
    currentEntries: number;
    previousEntries: number;
  },
  curLabel: string,
  prevLabel: string,
  currency: string
): { kind: 'positive' | 'alert' | 'danger'; detail: string } | null {
  const up = d.previousTotal > 0 && d.currentTotal > d.previousTotal;
  const down = d.previousTotal > 0 && d.currentTotal < d.previousTotal;
  const more = d.currentEntries > d.previousEntries && d.previousEntries > 0;
  const less = d.currentEntries < d.previousEntries && d.previousEntries > 0;
  const increaseRatio = d.previousTotal > 0 ? d.currentTotal / d.previousTotal : 1;
  const decreaseRatio = d.previousTotal > 0 ? d.currentTotal / d.previousTotal : 1;

  if (down && (decreaseRatio <= 0.92 || less)) {
    return {
      kind: 'positive',
      detail: `${cat} improved ${curLabel} (${d.currentTotal.toFixed(2)} ${currency}) vs ${prevLabel} (${d.previousTotal.toFixed(2)} ${currency}). Great control — keep this pace and route the difference to savings.`,
    };
  }

  if (!up && !more) return null;

  if (cat === 'Entertainment') {
    if (more) {
      return {
        kind: d.currentEntries - d.previousEntries >= 2 ? 'danger' : 'alert',
        detail: `You logged ${d.currentEntries} entertainment entries ${curLabel} vs ${d.previousEntries} ${prevLabel} — more nights out than your calmer stretch. Try one fewer outing and move that amount to savings.`,
      };
    }
    return {
      kind: increaseRatio >= 1.25 ? 'danger' : 'alert',
      detail: `Entertainment is higher ${curLabel} (${d.currentTotal.toFixed(2)} ${currency}) than ${prevLabel} (${d.previousTotal.toFixed(2)} ${currency}). Cut one movie/ticket event and transfer the saved amount.`,
    };
  }
  if (cat === 'Food') {
    return {
      kind: increaseRatio >= 1.2 ? 'danger' : 'alert',
      detail: `Food ran higher ${curLabel} (${d.currentTotal.toFixed(2)} ${currency}) than ${prevLabel} (${d.previousTotal.toFixed(2)} ${currency}). One fewer delivery/dine-out each week can redirect money to savings.`,
    };
  }
  if (cat === 'Transport') {
    return {
      kind: increaseRatio >= 1.2 ? 'danger' : 'alert',
      detail: `Transport is up ${curLabel} vs ${prevLabel}. Reduce discretionary rides and route the difference to debt payoff or savings.`,
    };
  }
  if (cat === 'Other') {
    return {
      kind: increaseRatio >= 1.2 ? 'danger' : 'alert',
      detail: `“Other” spend is up ${curLabel} vs ${prevLabel}. Cancel one small subscription or impulse purchase category this cycle.`,
    };
  }
  return {
    kind: increaseRatio >= 1.25 ? 'danger' : 'alert',
    detail: `${cat} is higher ${curLabel} (${d.currentTotal.toFixed(2)} ${currency}) than ${prevLabel} (${d.previousTotal.toFixed(2)} ${currency}). Trim frequency and redirect the difference to savings.`,
  };
}

export function buildSpendingAwarenessSuggestions(
  windows: PeriodWindow[],
  currencyCode = 'CAD'
): Suggestion[] {
  const currency = currencyCode || 'CAD';
  const out: Suggestion[] = [];

  const hasData = windows.some((w) => w.deltas.some((d) => d.currentTotal > 0 || d.previousTotal > 0));
  if (!hasData) {
    out.push({
      title: 'Add dated expenses',
      detail:
        'Ghost compares this week vs last week and month-to-date vs the same days last month. Add expenses with dates to see where you are running hotter than before.',
      kind: 'summary',
    });
    return out;
  }

  for (const w of windows) {
    for (const d of w.deltas) {
      const verdict = categorizeDelta(
        d.category,
        d,
        w.currentLabel,
        w.previousLabel,
        currency
      );
      if (!verdict) continue;
      out.push({
        title: `${d.category}: ${w.id === 'week' ? 'week over week' : 'month vs last month'}`,
        detail: verdict.detail,
        kind: verdict.kind,
      });
    }
  }

  const seen = new Set<string>();
  const deduped: Suggestion[] = [];
  for (const s of out) {
    const key = s.title + s.detail.slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(s);
  }

  if (deduped.length === 0) {
    deduped.push({
      title: 'No clear spike vs last period',
      detail:
        'Nothing stands much above your prior week or same-days-last-month window yet. When a category jumps, Ghost will call it out with concrete “one fewer outing” style cues.',
      kind: 'summary',
    });
  }

  return deduped.slice(0, 12);
}
