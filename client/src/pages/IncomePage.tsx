import { useEffect, useState } from "react";
import {
  getIncomes,
  addIncome,
  editIncome,
  deleteIncome,
  type Income
} from "../api/incomeApi";

const IncomePage = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editDate, setEditDate] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadIncomes = async () => {
    try {
      const data = await getIncomes();
      setIncomes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load incomes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!amount || !reason || !date) {
      setError("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      await addIncome({
        amount: Number(parseFloat(amount).toFixed(2)),
        reason,
        date
      });
      setMessage("Income added successfully!");
      setAmount("");
      setReason("");
      setDate("");
      await loadIncomes();
    } catch (err: any) {
      setError(err?.response?.data?.message || err || "Failed to add income.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (inc: Income) => {
    setEditingId(inc._id);
    setEditAmount(String(inc.amount));
    setEditReason(inc.reason);
    setEditDate(inc.date?.toString().slice(0, 10) || "");
    setError("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editAmount || !editReason || !editDate) {
      setError("Amount, reason and date are required.");
      return;
    }
    setSaving(true);
    try {
      await editIncome(editingId, {
        amount: Number(parseFloat(editAmount).toFixed(2)),
        reason: editReason,
        date: editDate
      });
      setEditingId(null);
      await loadIncomes();
      setMessage("Income updated.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await deleteIncome(deleteId);
      setIncomes((prev) => prev.filter((i) => i._id !== deleteId));
      setDeleteId(null);
      setMessage("Income deleted.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Delete failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container py-4">Loading incomes...</div>;

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="container py-4">
      <h2>Income</h2>
      <h4 className="mb-3">Total Income: ${totalIncome.toFixed(2)}</h4>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label">Amount</label>
            <input
              type="number"
              className="form-control"
              placeholder="Amount"
              value={amount}
              step="0.01"
              min="0"
              onChange={(e) => {
                const value = e.target.value;

                // Only allow numbers up to 2 decimal places
                if (/^\d*\.?\d{0,2}$/.test(value)) {
                  setAmount(value);
                }
              }}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Reason</label>
            <input
              type="text"
              className="form-control"
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100" disabled={saving}>
              {saving ? "Adding..." : "Add Income"}
            </button>
          </div>
        </div>
      </form>

      {incomes.length === 0 ? (
        <p>No income records yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incomes.map((inc, index) => (
              <tr key={inc._id}>
                <td>{index + 1}</td>
                <td>{inc.date ? new Date(inc.date).toLocaleDateString() : "-"}</td>
                <td>${inc.amount.toFixed(2)}</td>
                <td>{inc.reason}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-1"
                    onClick={() => openEdit(inc)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => { setDeleteId(inc._id); setError(""); }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit modal */}
      {editingId && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit income</h5>
                <button type="button" className="btn-close" onClick={() => setEditingId(null)} disabled={saving} />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editAmount}
                    step="0.01"
                    min="0"
                    onChange={(e) => {
                      const value = e.target.value;
                      
                      // Only allow numbers up to 2 decimal places
                      if (/^\d*\.?\d{0,2}$/.test(value)){
                      setEditAmount(value);
                    }
                  }}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Reason</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingId(null)} disabled={saving}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete income</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteId(null)} disabled={saving} />
              </div>
              <div className="modal-body">Are you sure you want to delete this income record?</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={saving}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={saving}>{saving ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomePage;
