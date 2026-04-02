import type { CategoryHabitInsight } from "../../types/dashboard.types";
import "../../styles/ghost.css";

interface GhostHabitPanelProps {
  insights: CategoryHabitInsight[];
  currency: string;
  fmt: (n: number) => string;
}

export function GhostHabitPanel({ insights, currency, fmt }: GhostHabitPanelProps) {
  const maxGap = Math.max(...insights.map((i) => i.gap), 1);
  const toneClass = (tone?: string) =>
    tone === "positive" ? "ghost-tone-positive" : tone === "danger" ? "ghost-tone-danger" : "ghost-tone-alert";

  if (insights.length === 0) {
    return (
      <p className="text-muted small mb-0 ghost-muted">
        Add categorized expenses to map your habits against the ghost model.
      </p>
    );
  }

  return (
    <div className="ghost-habit-grid">
      {insights.map((row) => (
        <div key={row.category} className={`ghost-habit-card ${toneClass(row.tone)}`} tabIndex={0}>
          <div className="ghost-habit-card__top">
            <span className="ghost-pulse" aria-hidden />
            <div>
              <div className="ghost-habit-card__cat">{row.category}</div>
              <div className="ghost-habit-card__sub">
                Actual {fmt(row.actual)} {currency} · Modeled {fmt(row.modeled)} {currency}
              </div>
            </div>
            <div className="ghost-habit-card__gap">
              {fmt(row.gap)}
              <span className="ghost-habit-card__ccy">{currency}</span>
            </div>
          </div>
          <div className="ghost-habit-card__bar-track">
            <div
              className="ghost-habit-card__bar-fill"
              style={{ width: `${Math.min(100, (row.gap / maxGap) * 100)}%` }}
            />
          </div>
          <div className={`ghost-bubble ${toneClass(row.tone)}`}>
            <div className="ghost-bubble__title">{row.headline}</div>
            <p className="ghost-bubble__body">{row.body}</p>
            <span className="ghost-bubble__tag">{row.pulse}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
