import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAccountabilityLogs,
  type AccountabilityAction,
  type AccountabilityLog,
} from "../api/accountabilityApi";
import { getApiErrorMessage } from "../utils/apiError";

function actionLabel(action: AccountabilityLog["action"]): string {
  if (action === "transaction_create") return "Added";
  if (action === "transaction_edit") return "Edited";
  if (action === "transaction_delete") return "Deleted";
  if (action === "debt_create") return "Debt added";
  if (action === "debt_edit") return "Debt edited";
  if (action === "debt_delete") return "Debt deleted";
  if (action === "debt_payment") return "Debt payment";
  if (action === "income_create") return "Income added";
  if (action === "income_edit") return "Income edited";
  if (action === "income_delete") return "Income deleted";
  if (action === "expense_create") return "Expense added";
  if (action === "expense_edit") return "Expense edited";
  if (action === "expense_delete") return "Expense deleted";
  if (action === "goal_create") return "Goal created";
  if (action === "goal_edit") return "Goal edited";
  if (action === "goal_delete") return "Goal deleted";
  if (action === "goal_contribution") return "Goal contribution";
  if (action === "savings_deposit") return "Savings deposit";
  if (action === "savings_withdraw") return "Savings withdrawal";
  if (action === "profile_update") return "Profile updated";
  if (action === "password_change") return "Password changed";
  if (action === "currency_change") return "Currency changed";
  if (action === "semester_set") return "Semester updated";
  if (action === "login") return "Login";
  if (action === "login_2fa") return "2FA login";
  if (action === "logout") return "Logout";
  if (action === "two_factor_setup") return "2FA setup";
  if (action === "two_factor_enable") return "2FA enabled";
  if (action === "two_factor_disable") return "2FA disabled";
  if (action === "password_reset_requested") return "Password reset requested";
  if (action === "password_reset_completed") return "Password reset completed";
  return action;
}

function actionBadgeClass(action: AccountabilityLog["action"]): string {
  if (action === "transaction_create") return "bg-success-subtle text-success-emphasis border border-success-subtle";
  if (action === "transaction_edit") return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
  if (action === "transaction_delete") return "bg-danger-subtle text-danger-emphasis border border-danger-subtle";
  if (action === "debt_create") return "bg-success-subtle text-success-emphasis border border-success-subtle";
  if (action === "debt_edit") return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
  if (action === "debt_delete") return "bg-danger-subtle text-danger-emphasis border border-danger-subtle";
  if (action === "debt_payment") return "bg-info-subtle text-info-emphasis border border-info-subtle";
  if (action.endsWith("_create") || action === "goal_contribution" || action === "savings_deposit") return "bg-success-subtle text-success-emphasis border border-success-subtle";
  if (action.endsWith("_edit") || action === "profile_update" || action === "currency_change" || action === "semester_set") return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
  if (action.endsWith("_delete") || action === "savings_withdraw" || action === "password_change" || action === "two_factor_disable") return "bg-danger-subtle text-danger-emphasis border border-danger-subtle";
  if (action === "login" || action === "login_2fa" || action === "logout" || action === "two_factor_setup" || action === "two_factor_enable" || action === "password_reset_requested" || action === "password_reset_completed") return "bg-info-subtle text-info-emphasis border border-info-subtle";
  return "bg-secondary-subtle text-secondary-emphasis border";
}

function actorLabel(log: AccountabilityLog): string {
  if (typeof log.user === "string") return "You";
  return log.user.name?.trim() || log.user.email?.trim() || "You";
}

function entityLabel(entityType: string): string {
  return entityType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function summarizeDetail(log: AccountabilityLog): string {
  const d = log.detail;
  if (!d) return "—";
  if (log.action === "transaction_create" && d.created && typeof d.created === "object") {
    const c = d.created as Record<string, unknown>;
    const type = c.type ?? "?";
    const amt = c.amount != null ? Number(c.amount).toFixed(2) : "?";
    const desc = String(c.description ?? "");
    const datePart =
      typeof c.transactionDate === "string" && c.transactionDate
        ? ` · ${c.transactionDate}`
        : "";
    return `${String(type)} · $${amt}${datePart} · ${desc.slice(0, 72)}${desc.length > 72 ? "…" : ""}`;
  }
  if (log.action === "transaction_delete" && d.deleted && typeof d.deleted === "object") {
    const del = d.deleted as Record<string, unknown>;
    const type = del.type ?? "?";
    const amt = del.amount != null ? Number(del.amount).toFixed(2) : "?";
    const desc = String(del.description ?? "");
    return `${String(type)} · $${amt} · ${desc.slice(0, 80)}${desc.length > 80 ? "…" : ""}`;
  }
  if (log.action === "transaction_edit" && d.before && d.after) {
    const b = d.before as Record<string, unknown>;
    const a = d.after as Record<string, unknown>;
    const parts: string[] = [];
    if (b.amount !== a.amount) parts.push(`Amount: ${b.amount} → ${a.amount}`);
    if (b.description !== a.description) {
      parts.push("Description updated");
    }
    if (b.category !== a.category) {
      parts.push(`Category: ${b.category || "—"} → ${a.category || "—"}`);
    }
    return parts.length ? parts.join(" · ") : "Updated fields";
  }
  if (log.action.startsWith("debt_")) {
    if (log.action === "debt_create" && d.created && typeof d.created === "object") {
      const c = d.created as Record<string, unknown>;
      const label = String(c.label ?? "Debt");
      const amt = c.amount != null ? Number(c.amount).toFixed(2) : "?";
      const currency = String(c.currency ?? "").toUpperCase();
      const dir = c.direction === "owed_to_me" ? "Owes me" : "I owe";
      return `${label} · ${dir} · ${amt} ${currency}`;
    }
    if (log.action === "debt_delete" && d.deleted && typeof d.deleted === "object") {
      const del = d.deleted as Record<string, unknown>;
      const label = String(del.label ?? "Debt");
      const amt = del.amount != null ? Number(del.amount).toFixed(2) : "?";
      const currency = String(del.currency ?? "").toUpperCase();
      const dir = del.direction === "owed_to_me" ? "Owed to me" : "I owed";
      return `${label} · ${dir} · ${amt} ${currency}`;
    }
    if (log.action === "debt_edit" && d.before && d.after) {
      const b = d.before as Record<string, unknown>;
      const a = d.after as Record<string, unknown>;
      const parts: string[] = [];
      if (b.amount !== a.amount) parts.push(`Amount: ${b.amount} → ${a.amount}`);
      if (b.label !== a.label) parts.push("Label updated");
      if (b.counterparty !== a.counterparty) parts.push("Counterparty updated");
      return parts.length ? parts.join(" · ") : "Debt fields updated";
    }
    if (log.action === "debt_payment" && d.payment && typeof d.payment === "object") {
      const p = d.payment as Record<string, unknown>;
      const amt = p.amount != null ? Number(p.amount).toFixed(2) : "?";
      const newPaid = p.newPaidAmount != null ? Number(p.newPaidAmount).toFixed(2) : "?";
      const total = p.totalAmount != null ? Number(p.totalAmount).toFixed(2) : "?";
      return `Payment ${amt} · Paid ${newPaid} of ${total}`;
    }
  }
  if ((log.action === "income_create" || log.action === "income_delete") && (d.created || d.deleted)) {
    const row = ((d.created || d.deleted) as Record<string, unknown>);
    return `$${Number(row.amount ?? 0).toFixed(2)} · ${String(row.reason ?? "")}`;
  }
  if (log.action === "income_edit" && d.before && d.after) {
    const b = d.before as Record<string, unknown>;
    const a = d.after as Record<string, unknown>;
    const parts: string[] = [];
    if (b.amount !== a.amount) parts.push(`Amount: ${b.amount} → ${a.amount}`);
    if (b.reason !== a.reason) parts.push("Reason updated");
    return parts.length ? parts.join(" · ") : "Income updated";
  }
  if ((log.action === "expense_create" || log.action === "expense_delete") && (d.created || d.deleted)) {
    const row = ((d.created || d.deleted) as Record<string, unknown>);
    return `${String(row.category ?? "Expense")} · $${Number(row.amount ?? 0).toFixed(2)} · ${String(row.classification ?? "")}`;
  }
  if (log.action === "expense_edit" && d.before && d.after) {
    const b = d.before as Record<string, unknown>;
    const a = d.after as Record<string, unknown>;
    const parts: string[] = [];
    if (b.amount !== a.amount) parts.push(`Amount: ${b.amount} → ${a.amount}`);
    if (b.category !== a.category) parts.push(`Category: ${b.category} → ${a.category}`);
    if (b.classification !== a.classification) parts.push(`Type: ${b.classification} → ${a.classification}`);
    return parts.length ? parts.join(" · ") : "Expense updated";
  }
  if ((log.action === "goal_create" || log.action === "goal_delete") && (d.created || d.deleted)) {
    const row = ((d.created || d.deleted) as Record<string, unknown>);
    return `${String(row.name ?? "Goal")} · target $${Number(row.targetAmount ?? 0).toFixed(2)}`;
  }
  if (log.action === "goal_edit" && d.before && d.after) {
    const b = d.before as Record<string, unknown>;
    const a = d.after as Record<string, unknown>;
    const parts: string[] = [];
    if (b.name !== a.name) parts.push("Name updated");
    if (b.targetAmount !== a.targetAmount) parts.push(`Target: ${b.targetAmount} → ${a.targetAmount}`);
    return parts.length ? parts.join(" · ") : "Goal updated";
  }
  if (log.action === "goal_contribution" && d.contribution) {
    const c = d.contribution as Record<string, unknown>;
    return `Added $${Number(c.amount ?? 0).toFixed(2)} · saved ${Number(c.newContributedAmount ?? 0).toFixed(2)} of ${Number(c.targetAmount ?? 0).toFixed(2)}`;
  }
  if (log.action === "savings_deposit" && d.deposit) {
    const c = d.deposit as Record<string, unknown>;
    return `Added $${Number(c.amount ?? 0).toFixed(2)} · balance ${Number(c.previousBalance ?? 0).toFixed(2)} → ${Number(c.newBalance ?? 0).toFixed(2)}`;
  }
  if (log.action === "savings_withdraw" && d.withdraw) {
    const c = d.withdraw as Record<string, unknown>;
    return `Withdrew $${Number(c.amount ?? 0).toFixed(2)} · balance ${Number(c.previousBalance ?? 0).toFixed(2)} → ${Number(c.newBalance ?? 0).toFixed(2)}`;
  }
  if (log.action === "profile_update") {
    const changedFields = Array.isArray((d as Record<string, unknown>).changedFields)
      ? ((d as Record<string, unknown>).changedFields as string[])
      : [];
    return changedFields.length ? `Changed: ${changedFields.join(", ")}` : "Profile updated";
  }
  if (log.action === "currency_change" && d.after) {
    const after = d.after as Record<string, unknown>;
    return `Preferred currency: ${String(after.preferredCurrency ?? "—")}`;
  }
  if (log.action === "semester_set" && d.after) {
    const after = d.after as Record<string, unknown>;
    return `${String(after.startDate ?? "—")} → ${String(after.endDate ?? "—")}`;
  }
  if (log.action === "password_change") return "Security credentials updated";
  if (log.action === "login") return "Signed in";
  if (log.action === "login_2fa") return "Signed in with 2FA";
  if (log.action === "logout") return "Signed out";
  if (log.action === "two_factor_setup") return "Started authenticator setup";
  if (log.action === "two_factor_enable") return "Authenticator protection enabled";
  if (log.action === "two_factor_disable") return "Authenticator protection disabled";
  if (log.action === "password_reset_requested") return "Password reset link requested";
  if (log.action === "password_reset_completed") return "Password reset completed";
  return "—";
}

function formatDetailBlock(log: AccountabilityLog): string {
  try {
    return JSON.stringify(log.detail ?? {}, null, 2);
  } catch {
    return String(log.detail);
  }
}

type ActionFilter = "all" | AccountabilityAction;

export default function AccountabilityHistoryPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AccountabilityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await getAccountabilityLogs(token);
      setLogs(data);
    } catch (e: unknown) {
      setLogs([]);
      setError(getApiErrorMessage(e, "Failed to load accountability history"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (!q) return true;
      const hay = [
        actorLabel(log),
        entityLabel(log.entityType),
        log.reason,
        summarizeDetail(log),
        actionLabel(log.action),
        log.entityId,
        new Date(log.createdAt).toLocaleString(),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [logs, actionFilter, search]);

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopyMsg("Entity ID copied.");
      setTimeout(() => setCopyMsg(null), 2000);
    } catch {
      setCopyMsg("Could not copy to clipboard.");
      setTimeout(() => setCopyMsg(null), 2500);
    }
  };

  if (!token) {
    return (
      <div className="container py-4">
        <p className="text-muted mb-0">Sign in to view accountability history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-4">
        <div className="cp-card p-4 text-muted">Loading accountability history…</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <header className="mb-4">
        <p className="text-muted small fw-semibold text-uppercase cp-label-overline mb-2">
          Reflection
        </p>
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-2">
          <div>
            <h1 className="cp-page-title mb-2">Accountability history</h1>
            <p className="cp-page-lead mb-0">
              This activity log records meaningful actions you perform after signing in, including financial
              updates and account/security changes. It is <strong>read-only</strong> for integrity, so you can
              review what changed, who performed it, and when.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/transactions" className="btn btn-primary">
              Go to Transactions
            </Link>
            <button type="button" className="btn btn-outline-secondary" onClick={() => void loadLogs()}>
              Refresh
            </button>
          </div>
        </div>
      </header>

      {copyMsg && (
        <div className="alert alert-secondary py-2 small mb-3" role="status">
          {copyMsg}
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="cp-card p-3 p-md-4 mb-4">
        <h2 className="h6 fw-bold text-uppercase text-muted mb-3">Find entries</h2>
        <div className="row g-3 align-items-end">
          <div className="col-md-4 col-lg-3">
            <label className="form-label" htmlFor="acc-filter-action">
              Action type
            </label>
            <select
              id="acc-filter-action"
              className="form-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
            >
              <option value="all">All actions</option>
              <option value="transaction_create">Added transaction</option>
              <option value="transaction_edit">Edited transaction</option>
              <option value="transaction_delete">Deleted transaction</option>
              <option value="debt_create">Added debt</option>
              <option value="debt_edit">Edited debt</option>
              <option value="debt_delete">Deleted debt</option>
              <option value="debt_payment">Debt payment</option>
              <option value="income_create">Added income</option>
              <option value="income_edit">Edited income</option>
              <option value="income_delete">Deleted income</option>
              <option value="expense_create">Added expense</option>
              <option value="expense_edit">Edited expense</option>
              <option value="expense_delete">Deleted expense</option>
              <option value="goal_create">Created goal</option>
              <option value="goal_edit">Edited goal</option>
              <option value="goal_delete">Deleted goal</option>
              <option value="goal_contribution">Goal contribution</option>
              <option value="savings_deposit">Savings deposit</option>
              <option value="savings_withdraw">Savings withdrawal</option>
              <option value="profile_update">Profile update</option>
              <option value="password_change">Password change</option>
              <option value="currency_change">Currency change</option>
              <option value="semester_set">Semester update</option>
              <option value="login">Login</option>
              <option value="login_2fa">2FA login</option>
              <option value="logout">Logout</option>
              <option value="two_factor_setup">2FA setup</option>
              <option value="two_factor_enable">Enable 2FA</option>
              <option value="two_factor_disable">Disable 2FA</option>
              <option value="password_reset_requested">Password reset requested</option>
              <option value="password_reset_completed">Password reset completed</option>
            </select>
          </div>
          <div className="col-md-8 col-lg-5">
            <label className="form-label" htmlFor="acc-search">
              Search
            </label>
            <input
              id="acc-search"
              type="search"
              className="form-control"
              placeholder="Reason, amount, description, date…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="col-lg-4 text-lg-end">
            <p className="small text-muted mb-0">
              Showing <strong>{filteredLogs.length}</strong> of {logs.length} entries
            </p>
          </div>
        </div>
      </div>

      <div className="cp-card p-3 mb-3 border-info-subtle bg-info-subtle">
        <h3 className="h6 fw-bold mb-2">About this screen</h3>
        <ul className="small mb-0 ps-3">
          <li>
            <strong>Read</strong> — browse, filter, and expand rows for full audit detail.
          </li>
          <li>
            <strong>Create</strong> — new rows appear automatically when you perform tracked financial,
            profile, or security actions while signed in.
          </li>
          <li>
            <strong>No edit/delete of log rows</strong> — audit entries are permanent so your history
            stays trustworthy.
          </li>
        </ul>
      </div>

      {logs.length === 0 ? (
        <div className="cp-card p-4 text-muted">
          <p className="mb-3">
            No activity records yet. Start using the app while signed in and your actions will appear here.
          </p>
          <Link to="/transactions" className="btn btn-primary">
            Open Transactions
          </Link>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="cp-card p-4 text-muted">
          No entries match your filters.{" "}
          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => {
            setActionFilter("all");
            setSearch("");
          }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="cp-card p-0 overflow-hidden">
          <div className="table-responsive cp-table-wrap rounded-3 border">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Entity</th>
                  <th scope="col">Action</th>
                  <th scope="col">Context</th>
                  <th scope="col">Your reason</th>
                  <th scope="col" className="text-end">
                    Row actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <Fragment key={log._id}>
                    <tr>
                      <td className="text-nowrap small text-muted">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="small">{actorLabel(log)}</td>
                      <td className="small text-muted">{entityLabel(log.entityType)}</td>
                      <td>
                        <span className={`badge rounded-pill px-2 py-1 ${actionBadgeClass(log.action)}`}>
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td className="small text-muted" style={{ maxWidth: "20rem" }}>
                        {summarizeDetail(log)}
                      </td>
                      <td className="small" style={{ maxWidth: "18rem" }}>
                        {log.reason}
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() =>
                            setExpandedId((id) => (id === log._id ? null : log._id))
                          }
                          aria-expanded={expandedId === log._id}
                        >
                          {expandedId === log._id ? "Hide detail" : "View detail"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => void copyId(log.entityId)}
                          title="Copy linked entity ID"
                        >
                          Copy ID
                        </button>
                      </td>
                    </tr>
                    {expandedId === log._id && (
                      <tr className="table-light">
                        <td colSpan={7} className="small border-top-0 pt-0">
                          <div className="pb-3 px-1">
                            <div className="fw-semibold mb-1">Audit payload</div>
                            <p className="text-muted mb-2">
                              {entityLabel(log.entityType)} ID: <code className="user-select-all">{log.entityId}</code>
                            </p>
                            <pre
                              className="mb-0 p-3 rounded border bg-white overflow-auto"
                              style={{ maxHeight: "16rem", fontSize: "0.75rem" }}
                            >
                              {formatDetailBlock(log)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
