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

  return (
    <div className="container py-4">
      <h2>Transactions</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
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
            {transactions.map((t, index) => (
              <tr key={t._id}>
                <td>{index + 1}</td>
                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td>{t.type}</td>
                <td>{t.description}</td>
                <td>{t.amount}</td>
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

