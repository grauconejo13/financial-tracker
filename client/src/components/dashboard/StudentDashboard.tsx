import { useNavigate } from "react-router-dom";
import { useEffect, useState, KeyboardEvent, useMemo } from "react";
import type { IconType } from "react-icons";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdReceiptLong,
  MdSavings,
  MdHistory,
} from "react-icons/md";
import { FaWallet, FaCreditCard } from "react-icons/fa";
import { getSemester } from "../../api/semesterApi";
import { getIncomes } from "../../api/incomeApi";
import { getExpenses } from "../../api/expenseApi";
import { fetchDashboardSummary } from "../../api/dashboardApi";
import { useAuth } from "../../context/AuthContext";
import TransactionList from "./TransactionList";
import { PieSvg } from "../charts/PieSvg";
import type { DashboardSummary } from "../../types/dashboard.types";
import "../../styles/ghostInsights.css";

type DashCard = {
  title: string;
  description: string;
  route: string;
  Icon: IconType;
  stripeClass: string;
};

const cards: DashCard[] = [
  {
    title: "Income",
    description: "View and manage your income streams",
    route: "/income",
    Icon: MdTrendingUp,
    stripeClass: "cp-stripe-income",
  },
  {
    title: "Expenses",
    description: "Track expense transactions and categories",
    route: "/expense",
    Icon: MdTrendingDown,
    stripeClass: "cp-stripe-expense",
  },
  {
    title: "Transactions",
    description: "Full history and edits in one place",
    route: "/transactions",
    Icon: MdReceiptLong,
    stripeClass: "cp-stripe-transactions",
  },
  {
    title: "Accountability",
    description: "See every reason you logged for transaction changes",
    route: "/accountability",
    Icon: MdHistory,
    stripeClass: "cp-stripe-accountability",
  },
  {
    title: "Budget",
    description: "Plan limits and stay on track",
    route: "/budget",
    Icon: FaWallet,
    stripeClass: "cp-stripe-budget",
  },
  {
    title: "Debts",
    description: "See balances and paydown progress",
    route: "/debts",
    Icon: FaCreditCard,
    stripeClass: "cp-stripe-debts",
  },
  {
    title: "Savings",
    description: "Goals and set-asides",
    route: "/savings",
    Icon: MdSavings,
    stripeClass: "cp-stripe-savings",
  },
];

function formatMoney(n: number) {
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function StudentDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [semesterStart, setSemesterStart] = useState<string | null>(null);
  const [semesterEnd, setSemesterEnd] = useState<string | null>(null);

  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState("");

  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const firstName = useMemo(() => {
    const raw = user?.name?.trim() || user?.email?.split("@")[0] || "";
    const first = raw.split(/\s+/)[0];
    return first || "there";
  }, [user?.name, user?.email]);

  const netFlow = incomeTotal - expenseTotal;

  useEffect(() => {
    async function loadSemester() {
      try {
        const semester = await getSemester(token);

        if (semester?.startDate && semester?.endDate) {
          setSemesterStart(semester.startDate);
          setSemesterEnd(semester.endDate);

          const today = new Date();
          const end = new Date(semester.endDate);

          const diff = end.getTime() - today.getTime();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

          setDaysRemaining(days);
        }
      } catch {
        const mockStart = "2026-01-10";
        const mockEnd = "2026-05-15";

        setSemesterStart(mockStart);
        setSemesterEnd(mockEnd);

        const today = new Date();
        const end = new Date(mockEnd);

        const diff = end.getTime() - today.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        setDaysRemaining(days);
      }
    }

    loadSemester();
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTxError("");
      setTxLoading(true);
      try {
        const [incomeList, expenseList] = await Promise.all([getIncomes(), getExpenses()]);
        if (cancelled) return;
        let inc = 0;
        let exp = 0;
        for (const t of incomeList) inc += Number(t.amount) || 0;
        for (const t of expenseList) exp += Number(t.amount) || 0;
        setIncomeTotal(inc);
        setExpenseTotal(exp);
        setTxCount(incomeList.length + expenseList.length);
      } catch (e) {
        if (!cancelled) {
          setTxError("Could not load activity summary.");
          setIncomeTotal(0);
          setExpenseTotal(0);
          setTxCount(0);
        }
      } finally {
        if (!cancelled) setTxLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchDashboardSummary(token || undefined);
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const go = (route: string) => navigate(route);

  const onCardKeyDown =
    (route: string) =>
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go(route);
      }
    };

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const expensePie = summary?.expenseByCategory || [];
  const gapPie = summary?.gapByCategory || [];

  return (
    <div className="pb-2">
      <header className="mb-4 mb-lg-5">
        <p className="text-muted small fw-semibold text-uppercase cp-label-overline mb-2">
          Overview
        </p>
        <h1 className="cp-page-title mb-3">
          Hi, {firstName}
        </h1>
        <p className="cp-page-lead mb-0">
          Here’s a snapshot of your semester and money movement. Add data in each
          area to make this dashboard more insightful over time.
        </p>
      </header>

      {txError && (
        <div className="alert alert-warning small py-2 mb-4" role="status">
          {txError}
        </div>
      )}

      <section className="mb-4 mb-lg-5" aria-label="Summary">
        <h2 className="h5 fw-bold mb-3">Activity summary</h2>
        <p className="text-muted small mb-3">
          Totals from your logged transactions (same source as the table below).
        </p>
        <div className="cp-kpi-grid">
          <div className="cp-kpi-card">
            <div className="cp-kpi-label">Income logged</div>
            <div className={`cp-kpi-value ${txLoading ? "text-muted" : "cp-kpi-pos"}`}>
              {txLoading ? "…" : formatMoney(incomeTotal)}
            </div>
          </div>
          <div className="cp-kpi-card">
            <div className="cp-kpi-label">Expense transactions logged</div>
            <div className={`cp-kpi-value ${txLoading ? "text-muted" : "cp-kpi-neg"}`}>
              {txLoading ? "…" : formatMoney(expenseTotal)}
            </div>
          </div>
          <div className="cp-kpi-card">
            <div className="cp-kpi-label">Net (income − expense transactions)</div>
            <div
              className={`cp-kpi-value ${txLoading ? "text-muted" : ""} ${
                netFlow >= 0 ? "cp-kpi-pos" : "cp-kpi-neg"
              }`}
            >
              {txLoading ? "…" : formatMoney(netFlow)}
            </div>
          </div>
          <div className="cp-kpi-card">
            <div className="cp-kpi-label">Transactions</div>
            <div className={`cp-kpi-value ${txLoading ? "text-muted" : ""}`}>
              {txLoading ? "…" : txCount.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      {daysRemaining !== null && semesterStart && semesterEnd && (
        <section className="mb-4 mb-lg-5" aria-label="Semester">
          <h2 className="h5 fw-bold mb-3">Semester</h2>
          <div className="cp-semester-banner">
            <div className="cp-semester-label">Current semester</div>
            <p className="mb-2 fw-semibold" style={{ color: "var(--cp-primary)" }}>
              {new Date(semesterStart).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              –{" "}
              {new Date(semesterEnd).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="cp-page-title mb-0" style={{ fontSize: "1.35rem" }}>
              {daysRemaining > 0
                ? `${daysRemaining} days remaining`
                : "Semester ended"}
            </p>
          </div>
        </section>
      )}

      <section className="mb-2" aria-label="Shortcuts">
        <h2 className="h5 fw-bold mb-3">Quick actions</h2>
        <div className="row g-3 g-md-4 mb-4">
          {cards.map(({ title, description, route, Icon, stripeClass }) => (
            <div key={title} className="col-md-6 col-xl-4">
              <div
                role="button"
                tabIndex={0}
                className={`cp-card-interactive h-100 ${stripeClass}`}
                onClick={() => go(route)}
                onKeyDown={onCardKeyDown(route)}
                aria-label={`Open ${title}: ${description}`}
              >
                <div className="cp-dash-icon" aria-hidden>
                  <Icon />
                </div>
                <h3 className="cp-dash-title">{title}</h3>
                <p className="cp-dash-desc">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {summary && (
        <section className="cp-ghost-insights mb-4" aria-label="Ghost insights and charts">
          <div className="cp-ghost-balance-grid mb-3">
            <div className="cp-ghost-balance-card">
              <div className="cp-ghost-balance-label">Real balance</div>
              <div className="cp-ghost-balance-value">
                {fmt(summary.ghost.realBalance)} {summary.currency}
              </div>
            </div>
            <div className="cp-ghost-balance-card cp-ghost-balance-card--ghost">
              <div className="cp-ghost-balance-label">Ghost balance</div>
              <div className="cp-ghost-balance-value">
                {fmt(summary.ghost.ghostBalance)} {summary.currency}
              </div>
            </div>
            <div className="cp-ghost-balance-card">
              <div className="cp-ghost-balance-label">Ghost gap (potential)</div>
              <div className="cp-ghost-balance-value">
                {fmt(summary.ghost.totalGap)} {summary.currency}
              </div>
            </div>
          </div>

          <div className="cp-ghost-chart-grid">
            <div className="cp-ghost-chart-card">
              <h3>Expense category breakdown</h3>
              {expensePie.length > 0 ? (
                <PieSvg
                  data={expensePie}
                  colors={["#5b5f97", "#3a0ca3", "#4cc9f0", "#f72585", "#7209b7", "#4361ee", "#06d6a0", "#ff9e00"]}
                  formatValue={(v) => `${fmt(v)} ${summary.currency}`}
                />
              ) : (
                <p className="text-muted small mb-0">Add categorized expense transactions to render this chart.</p>
              )}
            </div>

            <div className="cp-ghost-chart-card">
              <h3>Ghost gap by category</h3>
              {gapPie.length > 0 ? (
                <PieSvg
                  data={gapPie}
                  colors={["#5b5f97", "#3a0ca3", "#4cc9f0", "#f72585", "#7209b7", "#4361ee", "#06d6a0", "#ff9e00"]}
                  formatValue={(v) => `${fmt(v)} ${summary.currency}`}
                />
              ) : (
                <p className="text-muted small mb-0">No category gap yet. Add more spending records.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <TransactionList />
    </div>
  );
}

export default StudentDashboard;
