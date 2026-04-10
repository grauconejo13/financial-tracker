type Severity = "low" | "medium" | "high";

type SuggestionBucket = {
  category: string;
  severity: Severity;
  suggestions: string[];
};

type SuggestionInput = {
  category: string;
  gap: number;
  actual: number;
  currency: string;
};

const LIBRARY: SuggestionBucket[] = [
  {
    category: "Food",
    severity: "high",
    suggestions: [
      "Food spending is consistently above your baseline. Try a 7-day meal map before the week starts and cap delivery orders to one day.",
      "Pattern detected: frequent convenience spending. Shift one high-cost meal window to planned groceries and check impact after two weeks.",
      "Your food variance is large. Keep favorite meals, but set a weekly dining ceiling and move any extra to a savings transfer.",
      "Food overruns are likely habit-driven rather than one-off events. Track lunch + late-night spend separately to isolate the bigger leak.",
      "Suggested action: run a no-delivery challenge on weekdays for 14 days and compare your updated ghost gap.",
    ],
  },
  {
    category: "Food",
    severity: "medium",
    suggestions: [
      "Food is slightly above trend. One planned grocery reset each week should bring this category back in range.",
      "You are close to your target. Keep current habits and trim one impulse food spend per week.",
      "Try setting a soft daily food limit and review only the days you exceed it.",
      "Food can be optimized without cutting quality: batch staples once, then only top-up shop.",
    ],
  },
  {
    category: "Food",
    severity: "low",
    suggestions: [
      "Food looks stable. Maintain this pattern and redirect small wins to savings.",
      "You are near ghost baseline for food. Keep consistency and avoid end-of-week overspend spikes.",
      "This category is under control. Preserve your routine and focus optimization on higher-gap areas.",
    ],
  },
  {
    category: "Entertainment",
    severity: "high",
    suggestions: [
      "Entertainment is your top gap driver. Set a fixed weekly fun budget and pre-allocate it at the start of the week.",
      "Pattern detected: high discretionary variance. Replace one paid activity each week with a low-cost alternative.",
      "Suggested action: use a 'cooldown day' after each high entertainment spend to stop stacking purchases.",
      "Your entertainment category is overshooting baseline. Create two tiers: planned events vs spontaneous spend, then cap spontaneous.",
      "This gap is actionable fast. A single weekly limit can materially improve your ghost balance next cycle.",
    ],
  },
  {
    category: "Entertainment",
    severity: "medium",
    suggestions: [
      "Entertainment is moderately above baseline. Plan event spending in advance and leave a small buffer.",
      "You are close to target here. Reducing one impulse spend per cycle should close the remaining gap.",
      "Try grouping entertainment costs by weekend vs weekday to identify your highest-cost pattern.",
      "Suggested action: set a monthly entertainment envelope and track remaining balance visibly.",
    ],
  },
  {
    category: "Entertainment",
    severity: "low",
    suggestions: [
      "Entertainment is controlled. Keep this pace and prioritize categories with larger variance.",
      "You are maintaining a healthy fun-to-budget balance. Continue this pattern.",
      "This category is near baseline. Keep intentional spending and avoid drift from small add-ons.",
    ],
  },
  {
    category: "Transport",
    severity: "high",
    suggestions: [
      "Transport is significantly above baseline. Batch errands and reduce single-purpose trips where possible.",
      "Pattern detected: frequent short-distance spend. Combine nearby destinations to lower ride frequency.",
      "Suggested action: identify your top 3 highest-cost transport days and redesign those routes first.",
      "Transport variance is high. Set a weekly cap and track midpoint status before weekends.",
    ],
  },
  {
    category: "Transport",
    severity: "medium",
    suggestions: [
      "Transport is moderately elevated. One route optimization per week can close this gap steadily.",
      "You are close to your target. Shift one paid trip to lower-cost travel mode weekly.",
      "Suggested action: pre-plan high-mobility days to avoid reactive transport decisions.",
    ],
  },
  {
    category: "Transport",
    severity: "low",
    suggestions: [
      "Transport is stable. Maintain this pattern and monitor for occasional spikes.",
      "This category is near baseline. Keep current commuting habits.",
      "You are tracking well in transport. Focus on larger discretionary categories next.",
    ],
  },
  {
    category: "Other",
    severity: "high",
    suggestions: [
      "The 'Other' bucket is high, which often hides leak sources. Tag the next 10 entries with detailed labels.",
      "Pattern detected: unclassified spend concentration. Split this category to reveal actionable sub-gaps.",
      "Suggested action: review subscriptions and micro-purchases first; these usually dominate 'Other' drift.",
      "Your 'Other' variance is large. Convert this into named buckets to improve future ghost accuracy.",
    ],
  },
  {
    category: "Other",
    severity: "medium",
    suggestions: [
      "The 'Other' category is moderately above baseline. Add clearer labels to the next cycle for better control.",
      "A quick weekly audit of miscellaneous spend can prevent this category from expanding.",
      "Suggested action: move recurring 'Other' items into fixed categories to reduce hidden drift.",
    ],
  },
  {
    category: "Other",
    severity: "low",
    suggestions: [
      "The 'Other' bucket is stable. Continue labeling items to keep insight quality high.",
      "Miscellaneous spend is currently controlled. Keep this structure consistent.",
      "No major concern in 'Other' right now. Monitor for sudden unexplained spikes.",
    ],
  },
  {
    category: "default",
    severity: "high",
    suggestions: [
      "This category is materially above baseline. Set a short-cycle cap and review progress weekly.",
      "Pattern detected: sustained overspend. Apply one focused limit and reassess after two cycles.",
      "Suggested action: isolate top transactions in this category and cap the largest recurring driver.",
    ],
  },
  {
    category: "default",
    severity: "medium",
    suggestions: [
      "This category is moderately above target. A small weekly adjustment should close the gap.",
      "You are near baseline but drifting upward. Add a soft threshold and monitor.",
      "Suggested action: pre-plan this category before each week to reduce reactive spend.",
    ],
  },
  {
    category: "default",
    severity: "low",
    suggestions: [
      "This category is aligned with baseline. Keep the current pattern.",
      "Low variance detected. Maintain consistency and focus on higher-gap categories.",
      "Category is healthy. Continue tracking to prevent trend reversal.",
    ],
  },
];

function pickSeverity(gap: number, actual: number): Severity {
  if (actual <= 0) return "low";
  const intensity = gap / actual;
  if (intensity >= 0.35 || gap >= 200) return "high";
  if (intensity >= 0.15 || gap >= 60) return "medium";
  return "low";
}

function chooseSuggestion(list: string[], key: string): string {
  if (list.length === 0) return "";
  const day = new Date().getDate();
  const hash = [...key].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return list[(hash + day) % list.length];
}

export function getGhostSuggestion(input: SuggestionInput): string {
  const severity = pickSeverity(input.gap, input.actual);
  const category = input.category;
  const exact = LIBRARY.find((x) => x.category === category && x.severity === severity);
  const fallback = LIBRARY.find((x) => x.category === "default" && x.severity === severity);
  const picked = chooseSuggestion(exact?.suggestions || fallback?.suggestions || [], `${category}:${severity}`);
  return `${picked} Current estimated gap: ${input.gap.toFixed(2)} ${input.currency}.`;
}
