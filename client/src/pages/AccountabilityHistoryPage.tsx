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
  return action;
}

function actionBadgeClass(action: AccountabilityLog["action"]): string {
  if (action === "transaction_create") return "bg-success-subtle text-success-emphasis border border-success-subtle";
  if (action === "transaction_edit") return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
  if (action === "transaction_delete") return "bg-danger-subtle text-danger-emphasis border border-danger-subtle";
  return "bg-secondary-subtle text-secondary-emphasis border";
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
      setCopyMsg("Transaction ID copied.");
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
              Every time you <strong>add</strong>, <strong>edit</strong>, or <strong>delete</strong> a
              transaction with a reason, an entry is stored here so you can reflect on your financial
              decisions. This log is <strong>read-only</strong> for integrity—use{" "}
              <Link to="/transactions">Transactions</Link> to make new changes.
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
            <strong>Create</strong> — new rows appear automatically when you add, edit, or delete a
            transaction on the Transactions page (a reason is required).
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
            No accountability records yet. Add a transaction with a reason, or edit or delete one with
            a reason, to build this log.
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
                          title="Copy linked transaction ID"
                        >
                          Copy ID
                        </button>
                      </td>
                    </tr>
                    {expandedId === log._id && (
                      <tr className="table-light">
                        <td colSpan={5} className="small border-top-0 pt-0">
                          <div className="pb-3 px-1">
                            <div className="fw-semibold mb-1">Audit payload</div>
                            <p className="text-muted mb-2">
                              Transaction ID: <code className="user-select-all">{log.entityId}</code>
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
