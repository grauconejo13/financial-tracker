import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAccountabilityLogs,
  type AccountabilityLog,
} from "../api/accountabilityApi";

function actionLabel(action: AccountabilityLog["action"]): string {
  if (action === "transaction_create") return "Added transaction";
  if (action === "transaction_edit") return "Edited transaction";
  if (action === "transaction_delete") return "Deleted transaction";
  return action;
}

function summarizeDetail(log: AccountabilityLog): string {
  const d = log.detail;
  if (!d) return "—";
  if (log.action === "transaction_create" && d.created && typeof d.created === "object") {
    const c = d.created as Record<string, unknown>;
    const type = c.type ?? "?";
    const amt = c.amount != null ? Number(c.amount).toFixed(2) : "?";
    const desc = String(c.description ?? "");
    return `${String(type)} · $${amt} · ${desc.slice(0, 80)}${desc.length > 80 ? "…" : ""}`;
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
      parts.push(`Description updated`);
    }
    if (b.category !== a.category) {
      parts.push(`Category: ${b.category || "—"} → ${a.category || "—"}`);
    }
    return parts.length ? parts.join(" · ") : "Updated fields";
  }
  return "—";
}

export default function AccountabilityHistoryPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AccountabilityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const data = await getAccountabilityLogs(token);
        if (!cancelled) setLogs(data);
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { message?: string } } };
        if (!cancelled) {
          setError(ax?.response?.data?.message || "Failed to load history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return <div className="container py-4">Sign in to view accountability history.</div>;
  }

  if (loading) {
    return (
      <div className="cp-card p-4 text-muted">Loading your accountability history…</div>
    );
  }

  return (
    <div>
      <header className="mb-4">
        <p className="text-muted small fw-semibold text-uppercase cp-label-overline mb-2">
          Reflection
        </p>
        <h1 className="cp-page-title mb-2">Accountability history</h1>
        <p className="cp-page-lead mb-0">
          Reasons you gave when editing or deleting transactions, with what changed.
          New entries are stored from now on when you use those actions.
        </p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {logs.length === 0 ? (
        <div className="cp-card p-4 text-muted">
          No accountability records yet. Edit or delete a transaction with a reason
          to build this log.
        </div>
      ) : (
        <div className="cp-card p-0 overflow-hidden">
          <div className="table-responsive cp-table-wrap">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Context</th>
                  <th>Your reason</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="text-nowrap small">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="fw-semibold">{actionLabel(log.action)}</span>
                    </td>
                    <td className="small text-muted" style={{ maxWidth: "22rem" }}>
                      {summarizeDetail(log)}
                    </td>
                    <td className="small" style={{ maxWidth: "24rem" }}>
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
