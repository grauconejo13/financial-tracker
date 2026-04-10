import { useEffect, useState } from "react";
import { fetchGhostOverview } from "../api/ghostApi";
import { useAuth } from "../context/AuthContext";
import type { GhostOverview } from "../types/dashboard.types";
import { PieSvg } from "../components/charts/PieSvg";
import { getGhostSuggestion } from "../data/ghostSuggestionLibrary";
import "../styles/ghostInsights.css";

function GhostPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<GhostOverview | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const overview = await fetchGhostOverview(token || undefined);
        if (!cancelled) setData(overview);
      } catch (e) {
        if (!cancelled) {
          setError("Could not load ghost analytics right now.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="text-muted">Loading ghost insights...</div>;
  if (error || !data) return <div className="alert alert-warning">{error || "No ghost data yet."}</div>;

  const gapPie = data.gapByCategory
    .filter((row) => row.gap > 0)
    .map((row) => ({ name: row.category, value: row.gap }));
  const actualPie = data.gapByCategory
    .filter((row) => row.actual > 0)
    .map((row) => ({ name: row.category, value: row.actual }));
  const modeledPie = data.gapByCategory
    .filter((row) => row.ghostPortion > 0)
    .map((row) => ({ name: row.category, value: row.ghostPortion }));
  const flowPie = [
    { name: "Expenses", value: Math.max(0, data.totalExpense) },
    { name: "Savings", value: Math.max(0, data.realBalance) },
  ].filter((x) => x.value > 0);
  const comparePie = [
    { name: "Your spending", value: Math.max(0, data.totalExpense) },
    { name: "Ghost spend", value: Math.max(0, data.ghostExpenseTotal) },
  ].filter((x) => x.value > 0);

  const activeRow =
    (activeCategory ? data.gapByCategory.find((row) => row.category === activeCategory) : null) ||
    data.gapByCategory[0] ||
    null;

  const helperSuggestion = (() => {
    if (!activeRow) return "Hover a category card to see Ghost suggestions based on your spending pattern.";
    return getGhostSuggestion({
      category: activeRow.category,
      gap: activeRow.gap,
      actual: activeRow.actual,
      currency: data.currency,
    });
  })();

  return (
    <div className="pb-3">
      <header className="mb-4">
        <p className="text-muted small fw-semibold text-uppercase cp-label-overline mb-2">Ghost insights</p>
        <h1 className="cp-page-title mb-2">Real vs Ghost</h1>
        <p className="cp-page-lead mb-0">
          Compare your actual outcomes against a lean spending baseline to highlight where habits create the biggest gap.
        </p>
      </header>

      <section className="cp-ghost-balance-grid mb-4">
        <div className="cp-ghost-balance-card">
          <div className="cp-ghost-balance-label">Real balance</div>
          <div className="cp-ghost-balance-value">
            {fmt(data.realBalance)} {data.currency}
          </div>
        </div>
        <div className="cp-ghost-balance-card cp-ghost-balance-card--ghost">
          <div className="cp-ghost-balance-label">Ghost balance</div>
          <div className="cp-ghost-balance-value">
            {fmt(data.ghostBalance)} {data.currency}
          </div>
        </div>
        <div className="cp-ghost-balance-card">
          <div className="cp-ghost-balance-label">Total gap</div>
          <div className="cp-ghost-balance-value">
            {fmt(data.totalGap)} {data.currency}
          </div>
        </div>
      </section>

      <section className="cp-ghost-chart-grid cp-ghost-chart-grid--primary mb-3">
        <div className="cp-ghost-chart-card">
          <h3>Income / expense transactions / savings</h3>
          {flowPie.length > 0 ? (
            <PieSvg
              data={flowPie}
              colors={["#ef476f", "#06d6a0"]}
              formatValue={(v) => `${fmt(v)} ${data.currency}`}
              centerLabel="Flow view"
            />
          ) : (
            <p className="text-muted small mb-0">Add more income and expense entries to render your flow.</p>
          )}
        </div>
        <div className="cp-ghost-chart-card">
          <h3>Your spend vs ghost spend</h3>
          {comparePie.length > 0 ? (
            <PieSvg
              data={comparePie}
              colors={["#0f766e", "#a78bfa"]}
              formatValue={(v) => `${fmt(v)} ${data.currency}`}
              centerLabel="Spend comparison"
            />
          ) : (
            <p className="text-muted small mb-0">No spending comparison data yet.</p>
          )}
        </div>
        <div className="cp-ghost-chart-card">
          <h3>Ghost gap by category</h3>
          {gapPie.length > 0 ? (
            <PieSvg
              data={gapPie}
              colors={["#5b5f97", "#3a0ca3", "#4cc9f0", "#f72585", "#7209b7", "#4361ee", "#06d6a0", "#ff9e00"]}
              formatValue={(v) => `${fmt(v)} ${data.currency}`}
              centerLabel="Gap focus"
            />
          ) : (
            <p className="text-muted small mb-0">No category gap yet. Add categorized expense transactions first.</p>
          )}
        </div>
      </section>

      <section className="cp-ghost-chart-grid cp-ghost-chart-grid--secondary mb-4">
        <div className="cp-ghost-chart-card">
          <h3>Actual spending mix</h3>
          {actualPie.length > 0 ? (
            <PieSvg
              data={actualPie}
              colors={["#1d4ed8", "#7c3aed", "#0891b2", "#ec4899", "#ca8a04", "#059669", "#334155", "#14b8a6"]}
              formatValue={(v) => `${fmt(v)} ${data.currency}`}
              centerLabel="Your spending"
            />
          ) : (
            <p className="text-muted small mb-0">No spending data available yet.</p>
          )}
        </div>
        <div className="cp-ghost-chart-card">
          <h3>Ghost modeled mix</h3>
          {modeledPie.length > 0 ? (
            <PieSvg
              data={modeledPie}
              colors={["#22c55e", "#6366f1", "#06b6d4", "#f43f5e", "#84cc16", "#a855f7", "#0ea5e9", "#14b8a6"]}
              formatValue={(v) => `${fmt(v)} ${data.currency}`}
              centerLabel="Ghost model"
            />
          ) : (
            <p className="text-muted small mb-0">No modeled data available yet.</p>
          )}
        </div>
      </section>

      <section className="cp-ghost-chart-card mb-4">
        <h3>Pattern insights by category</h3>
        <div className="cp-ghost-insight-grid">
          {data.gapByCategory.map((row) => {
            const pct = row.actual > 0 ? Math.max(0, Math.min(100, (row.gap / row.actual) * 100)) : 0;
            return (
              <article
                key={row.category}
                className={`cp-ghost-insight-card ${activeCategory === row.category ? "is-active" : ""}`}
                onMouseEnter={() => setActiveCategory(row.category)}
                onFocus={() => setActiveCategory(row.category)}
                tabIndex={0}
              >
                <div className="cp-ghost-insight-head">
                  <h4>{row.category}</h4>
                  <span className="cp-ghost-insight-gap">{fmt(row.gap)} {data.currency}</span>
                </div>
                <div className="cp-ghost-insight-meta">
                  <span>Actual: {fmt(row.actual)} {data.currency}</span>
                  <span>Ghost: {fmt(row.ghostPortion)} {data.currency}</span>
                </div>
                <div className="cp-ghost-bar">
                  <div className="cp-ghost-bar__fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="cp-ghost-insight-note">Gap intensity: {pct.toFixed(1)}%</p>
              </article>
            );
          })}
        </div>
        <div className="cp-ghost-helper-box mt-3">
          <div className="cp-ghost-helper-box__label">
            Ghost suggestions {activeRow ? `for ${activeRow.category}` : ""}
          </div>
          <p className="mb-0">{helperSuggestion}</p>
        </div>
      </section>
    </div>
  );
}

export default GhostPage;