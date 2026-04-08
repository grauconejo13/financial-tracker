import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getTransactions,
  deleteTransaction,
  type Transaction
} from "../api/transactionApi";

const TransactionsPage = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await getTransactions(token);
        setTransactions(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const openDelete = (id: string) => {
    setDeleteId(id);
    setReason("");
    setError(null);
  };

  const confirmDelete = async () => {
    if (!deleteId || !token) return;
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }
    setSubmitting(true);
    try {
      await deleteTransaction(deleteId, reason, token);
      setTransactions((prev) => prev.filter((t) => t._id !== deleteId));
      setDeleteId(null);
      setReason("");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete transaction");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container py-4">Loading transactions...</div>;

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (sortBy === "date"){
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    } else {
      return sortOrder === "asc"
        ? a.amount - b.amount
        : b.amount - a.amount;
    }
  });

  return (
    <div className="container py-4">
      <h2>Transactions</h2>

      <div className="mb-3">
        <h5 className="text-success">Income: ${totalIncome.toFixed(2)}</h5>
        <h5 className="text-danger">Expenses: ${totalExpense.toFixed(2)}</h5>
        <h5>Net: ${(totalIncome - totalExpense).toFixed(2)}</h5>
      </div>

      <div className="d-flex gap-2 mb-3">
        <select
          className="form-select w-auto"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>

        <select
          className="form-select w-auto"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {transactions.length === 0 ? (
        <p>No transactions yet. Start by adding income or expenses.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((t, index) => (
              <tr key={t._id}>
                <td>{index + 1}</td>
                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td>{t.type}</td>
                <td>{t.description}</td>
                <td>${t.amount.toFixed(2)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => openDelete(t._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteId && (
        <div className="modal d-block" style={{ background: "#00000055" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete transaction</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteId(null)}
                  disabled={submitting}
                />
              </div>
              <div className="modal-body">
                <p>Please provide a reason for deleting this transaction.</p>
                <textarea
                  className="form-control"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setDeleteId(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={submitting || !reason.trim()}
                >
                  {submitting ? "Deleting..." : "Confirm delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;

