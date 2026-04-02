import { useEffect, useState } from 'react';
import { fetchGhostOverview } from '../api/ghostApi';
import type { GhostOverview } from '../types/dashboard.types';
import { GhostHabitPanel } from '../components/ghost/GhostHabitPanel';
import { GhostSignalOrbs } from '../components/ghost/GhostSignalOrbs';
import { HoverHint } from '../components/common/HoverHint';
import '../styles/dashboard.css';
import '../styles/ghost.css';

export default function GhostPage() {
  const [data, setData] = useState<GhostOverview | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    fetchGhostOverview()
      .then((d) => {
        if (!c) setData(d);
      })
      .catch((e: Error) => {
        if (!c) setErr(e.message || 'Failed to load ghost analytics');
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading ghost analytics…</p>
      </div>
    );
  }

  if (err || !data) {
    return <div className="alert alert-danger">{err || 'No data'}</div>;
  }

  const cur = data.currency;
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const month = data.periods?.currentMonth;
  const view = month ?? {
    realBalance: data.realBalance,
    ghostBalance: data.ghostBalance,
    totalIncome: data.totalIncome,
    totalExpense: data.totalExpense,
    ghostExpenseTotal: data.ghostExpenseTotal,
    totalGap: data.totalGap,
  };

  const insights = data.categoryInsights ?? [];

  return (
    <div className="dashboard-shell">
      <header className="dashboard-hero mb-3">
        <h1>Real vs Ghost</h1>
        <p>
          Your <strong>real</strong> balance is what you actually spent. Your <strong>ghost</strong>{' '}
          balance compares that to a stricter pattern per category. We also compare{' '}
          <strong>this week vs last week</strong> and <strong>this month vs the same days last month</strong>{' '}
          so you see where you are running hotter — hover cards and orbs (they fade like a ghost).
        </p>
      </header>

      <div className="balance-compare mb-4">
        <div className="balance-panel real">
          <h2>
            Real balance
            <HoverHint text="Actual balance based on your recorded income and expenses." />
          </h2>
          <div className="amt">
            {fmt(view.realBalance)} {cur}
          </div>
          <p className="small mt-2 mb-0 opacity-90">
            This month: income {fmt(view.totalIncome)} − expenses {fmt(view.totalExpense)}
          </p>
        </div>
        <div className="balance-panel ghost">
          <h2>
            Ghost balance
            <HoverHint text="Modeled balance if you followed tighter spending behavior by category." />
          </h2>
          <div className="amt">
            {fmt(view.ghostBalance)} {cur}
          </div>
          <p className="small mt-2 mb-0 opacity-90">
            This month modeled spend: {fmt(view.ghostExpenseTotal)} {cur}
          </p>
        </div>
      </div>

      <div className="metric-card mb-4">
        <h3 className="text-uppercase small text-muted mb-2">
          Total ghost gap
          <HoverHint text="Potential headroom between current spending and the ghost model." />
        </h3>
        <div className="fs-3 fw-bold text-primary">
          {fmt(view.totalGap)} {cur}
        </div>
        <p className="small text-muted mb-0 mt-1">
          Month-to-date headroom between real and ghost balance. All-time values are still used in
          category trend analysis below.
        </p>
      </div>

      <h2 className="ghost-section-title">
        Habit divergence by category
        <HoverHint text="Hover each category card to read the personalized narrative and pulse tag." />
      </h2>
      <p className="small text-muted mb-3">
        Each card compares <strong>actual</strong> spend to <strong>modeled</strong> spend. Hover a
        card to reveal the ghost narrative for that category.
      </p>
      <GhostHabitPanel insights={insights} currency={cur} fmt={fmt} />

      <GhostSignalOrbs suggestions={data.suggestions} />
    </div>
  );
}
