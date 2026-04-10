import { useEffect, useState } from "react";
import { fetchGhostOverview } from "../api/ghostApi";
import { useAuth } from "../context/AuthContext";
import type { GhostOverview } from "../types/dashboard.types";
import { PieSvg } from "../components/charts/PieSvg";
import "../styles/ghostInsights.css";

function GhostPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<GhostOverview | null>(null);

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

      <section className="cp-ghost-chart-card mb-4">
        <h3>Ghost gap by category</h3>
        {gapPie.length > 0 ? (
          <PieSvg
            data={gapPie}
            colors={["#5b5f97", "#3a0ca3", "#4cc9f0", "#f72585", "#7209b7", "#4361ee", "#06d6a0", "#ff9e00"]}
            formatValue={(v) => `${fmt(v)} ${data.currency}`}
          />
        ) : (
          <p className="text-muted small mb-0">No category gap yet. Add categorized expense transactions first.</p>
        )}
      </section>

      <section className="cp-ghost-chart-card mb-4">
        <h3>Category breakdown details</h3>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Category</th>
                <th>Actual</th>
                <th>Ghost</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {data.gapByCategory.map((row) => (
                <tr key={row.category}>
                  <td>{row.category}</td>
                  <td>{fmt(row.actual)} {data.currency}</td>
                  <td>{fmt(row.ghostPortion)} {data.currency}</td>
                  <td>{fmt(row.gap)} {data.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cp-ghost-chart-card">
        <h3>Ghost suggestions</h3>
        <div className="cp-suggestion-list">
          {data.suggestions.map((s, i) => (
            <div key={`${s.title}-${i}`} className={`cp-suggestion cp-suggestion--${s.signal}`}>
              <h4>{s.title}</h4>
              <p>{s.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default GhostPage;