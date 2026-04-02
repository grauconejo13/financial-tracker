import { useEffect, useState } from "react";
import { fetchDashboardSummary } from "../../api/dashboardApi";
import { useAuth } from "../../context/AuthContext";
import type { DashboardSummary } from "../../types/dashboard.types";
import { PieSvg } from "../charts/PieSvg";
import { getDebts, type Debt } from "../../api/debtApi";
import { HoverHint } from "../common/HoverHint";
import "../../styles/dashboard.css";
import "../../styles/ghost.css";

const PALETTE = ["#5b5f97", "#3a0ca3", "#4cc9f0", "#f72585", "#7209b7", "#4361ee", "#06d6a0", "#ef476f"];

function ChartEmpty({ label }: { label: string }) {
  return <div className="d-flex align-items-center justify-content-center h-100 text-muted py-5">{label}</div>;
}

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchDashboardSummary(),
      token ? getDebts(token).catch(() => []) : Promise.resolve([]),
    ])
      .then(([summary, debtRows]) => {
        if (cancelled) return;
        setData(summary);
        setDebts(debtRows);
      })
      .catch((e: Error) => !cancelled && setErr(e.message || "Could not load dashboard data"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;
  if (err || !data) return <div className="alert alert-danger">{err || "No data"}</div>;

  const cur = data.currency;
  const name = data.displayName || user?.email?.split("@")[0] || "there";
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const expensePie = data.expenseByCategory.map((x) => ({ name: x.name, value: x.value }));
  const monthIncome = Math.max(0, data.periods?.currentMonth?.income ?? data.totals.income);
  const monthExpenses = Math.max(0, data.periods?.currentMonth?.expenses ?? data.totals.expenses);
  const monthNet = (data.periods?.currentMonth?.net ?? (monthIncome - monthExpenses));
  const incomeVsExpense = [
    { name: "Income", value: monthIncome },
    { name: "Expenses", value: monthExpenses },
  ].filter((x) => x.value > 0);

  const debtOwedByMe = debts
    .filter((d) => d.direction === "owed_by_me")
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const debtOwedToMe = debts
    .filter((d) => d.direction === "owed_to_me")
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const debtNet = debtOwedByMe - debtOwedToMe;

  const availableSavings = Math.max(0, monthIncome - monthExpenses - Math.max(0, debtNet));
  const debtPressure = Math.max(0, debtOwedByMe);
  const debtRecovery = Math.max(0, debtOwedToMe);

  const allocationPie = [
    { name: "Expenses", value: Math.max(0, data.totals.expenses), hint: "Total recorded spending." },
    { name: "Debt obligation", value: debtPressure, hint: "Amount currently owed by you." },
    { name: "Available savings", value: availableSavings, hint: "Income left after expenses and debt pressure." },
  ].filter((x) => x.value > 0);

  const incomeUseBars = [
    { name: "Income", value: monthIncome },
    { name: "Spent", value: monthExpenses },
    { name: "Debt owed", value: debtPressure },
    { name: "Savings room", value: availableSavings },
  ];

  const maxBar = Math.max(...incomeUseBars.map((b) => b.value), 1);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-hero">
        <h1>Welcome back, {name}</h1>
        <p>Professional financial analytics dashboard with spending, debt exposure, savings capacity, and income allocation insights.</p>
      </header>

      <div className="metric-grid">
        <div className="metric-card"><h3>Net position</h3><div className="value">{fmt(data.totals.net)} {cur}</div></div>
        <div className="metric-card"><h3>Total income</h3><div className="value">{fmt(data.totals.income)} {cur}</div></div>
        <div className="metric-card"><h3>Total expenses</h3><div className="value">{fmt(data.totals.expenses)} {cur}</div></div>
        <div className="metric-card"><h3>Total debt owed</h3><div className="value">{fmt(debtOwedByMe)} {cur}</div></div>
        <div className="metric-card"><h3>Total debt receivable</h3><div className="value">{fmt(debtOwedToMe)} {cur}</div></div>
        <div className="metric-card accent"><h3>Savings capacity</h3><div className="value">{fmt(availableSavings)} {cur}</div></div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          {expensePie.length === 0 ? (
            <>
              <div className="chart-section-title">
                Expense breakdown by category
                <HoverHint text="CP-23 chart: tracks spending concentration across categories." />
              </div>
              <ChartEmpty label="Add categorized expenses to see this chart." />
            </>
          ) : (
            <PieSvg
              data={expensePie}
              colors={PALETTE}
              size={280}
              formatValue={(v) => `${fmt(v)} ${cur}`}
              chartTitle="Spending by category"
              chartExplainer="Distribution of your recorded expenses by category."
            />
          )}
        </div>

        <div className="chart-card">
          {incomeVsExpense.length === 0 ? (
            <>
              <div className="chart-section-title">
                Income vs expenses
                <HoverHint text="Compares total inflow and outflow for quick financial health checks." />
              </div>
              <ChartEmpty label="Record income and expenses to compare totals." />
            </>
          ) : (
            <PieSvg
              data={incomeVsExpense}
              colors={["#06d6a0", "#ef476f"]}
              size={280}
              formatValue={(v) => `${fmt(v)} ${cur}`}
              chartTitle="Income vs spending"
              chartExplainer="Month-to-date comparison between income and spending for a more realistic student budgeting view."
            />
          )}
          <p className="chart-note mt-3 mb-0">
            Month net: <strong>{fmt(monthNet)} {cur}</strong>
          </p>
        </div>

        <div className="chart-card">
          <div className="chart-section-title mb-2">
            Debt exposure vs recovery
            <HoverHint text="Shows money you owe versus money expected back to you." />
          </div>
          {debtPressure + debtRecovery <= 0 ? (
            <ChartEmpty label="No debt records yet. Add debt entries to visualize exposure." />
          ) : (
            <PieSvg
              data={[
                { name: "I owe", value: debtPressure, hint: "Total liabilities you currently owe." },
                { name: "Owed to me", value: debtRecovery, hint: "Total money expected back to you." },
              ].filter((x) => x.value > 0)}
              colors={["#ef476f", "#06d6a0"]}
              size={280}
              formatValue={(v) => `${fmt(v)} ${cur}`}
              chartTitle="Debt balance"
              chartExplainer="Current liabilities versus receivables."
            />
          )}
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          {allocationPie.length === 0 ? (
            <ChartEmpty label="Allocation chart appears once financial records exist." />
          ) : (
            <PieSvg
              data={allocationPie}
              colors={["#ef476f", "#f59e0b", "#06d6a0"]}
              size={280}
              formatValue={(v) => `${fmt(v)} ${cur}`}
              chartTitle="Income allocation"
              chartExplainer="How income is currently split across spending, debt, and savings room."
            />
          )}
        </div>
        <div className="chart-card">
          <div className="chart-section-title mb-3">
            Income to savings/debt progression
            <HoverHint text="Visualizes whether income is turning into savings or consumed by expenses/debt." />
          </div>
          <div className="bar-stack">
            {incomeUseBars.map((row, idx) => (
              <div key={row.name} className="bar-row">
                <div className="bar-meta">
                  <span>{row.name}</span>
                  <span>{fmt(row.value)} {cur}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.max(4, (row.value / maxBar) * 100)}%`,
                      background: PALETTE[idx % PALETTE.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="chart-note mt-3 mb-0">
            This view helps validate whether income growth is converting into savings or being absorbed by spending/debt.
          </p>
        </div>
      </div>
    </div>
  );
}