import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  getDebts,
  addDebt,
  updateDebt,
  deleteDebt,
  payDebt,
  type Debt,
  type DebtRequest,
} from "../api/debtApi";

type Direction = "owed_by_me" | "owed_to_me";

const CURRENCIES = [
  { code: "LKR", label: "🇱🇰 LKR – Sri Lankan Rupee" },
  { code: "USD", label: "🇺🇸 USD – US Dollar" },
  { code: "EUR", label: "🇪🇺 EUR – Euro" },
  { code: "GBP", label: "🇬🇧 GBP – British Pound" },
  { code: "AUD", label: "🇦🇺 AUD – Australian Dollar" },
  { code: "CAD", label: "🇨🇦 CAD – Canadian Dollar" },
  { code: "NZD", label: "🇳🇿 NZD – New Zealand Dollar" },
  { code: "CHF", label: "🇨🇭 CHF – Swiss Franc" },
  { code: "JPY", label: "🇯🇵 JPY – Japanese Yen" },
  { code: "CNY", label: "🇨🇳 CNY – Chinese Yuan" },
  { code: "INR", label: "🇮🇳 INR – Indian Rupee" },
  { code: "PKR", label: "🇵🇰 PKR – Pakistani Rupee" },
  { code: "BDT", label: "🇧🇩 BDT – Bangladeshi Taka" },
  { code: "SGD", label: "🇸🇬 SGD – Singapore Dollar" },
  { code: "MYR", label: "🇲🇾 MYR – Malaysian Ringgit" },
  { code: "IDR", label: "🇮🇩 IDR – Indonesian Rupiah" },
  { code: "THB", label: "🇹🇭 THB – Thai Baht" },
  { code: "ZAR", label: "🇿🇦 ZAR – South African Rand" },
  { code: "NGN", label: "🇳🇬 NGN – Nigerian Naira" },
  { code: "KES", label: "🇰🇪 KES – Kenyan Shilling" },
  { code: "AED", label: "🇦🇪 AED – UAE Dirham" },
  { code: "SAR", label: "🇸🇦 SAR – Saudi Riyal" },
  { code: "QAR", label: "🇶🇦 QAR – Qatari Riyal" },
  { code: "KWD", label: "🇰🇼 KWD – Kuwaiti Dinar" },
  { code: "BHD", label: "🇧🇭 BHD – Bahraini Dinar" },
  { code: "OMR", label: "🇴🇲 OMR – Omani Rial" },
  { code: "BRL", label: "🇧🇷 BRL – Brazilian Real" },
  { code: "MXN", label: "🇲🇽 MXN – Mexican Peso" },
  { code: "ARS", label: "🇦🇷 ARS – Argentine Peso" },
];

type FormType = {
  label: string;
  counterparty: string;
  amount: string | number;
  currency: string;
  direction: Direction;
  dueDate: string;
  notes: string;
};

const emptyForm: FormType = {
  label: "",
  counterparty: "",
  amount: "" as string | number,
  currency: "LKR",
  direction: "owed_by_me",
  dueDate: "",
  notes: "",
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "Request failed";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong";
}

const DebtPage = () => {
  const { token } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormType>(emptyForm);
  const [form, setForm] = useState<FormType>(emptyForm);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await getDebts(token);
        setDebts(data);
      } catch (e: unknown) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (!form.label.trim()) { setError("Label is required"); return; }
    if (!form.counterparty?.trim()) { setError("Counterparty is required"); return; }
    const amountStr = String(form.amount ?? "").trim();
    if (amountStr === "") { setError("Amount is required"); return; }
    const amountNum = Number(amountStr);
    if (Number.isNaN(amountNum)) { setError("Amount must be a number"); return; }
    if (amountNum <= 0) { setError("Amount must be greater than 0"); return; }

    setSaving(true);
    try {
      const payload: DebtRequest = {
        label: form.label.trim(),
        counterparty: form.counterparty?.trim() || undefined,
        amount: amountNum,
        currency: form.currency,
        direction: form.direction,
        dueDate: form.dueDate || undefined,
        notes: form.notes?.trim() || undefined,
      };
      const created = await addDebt(payload, token);
      setDebts((prev) => [created, ...prev]);
      setForm({ ...emptyForm });
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? e.response?.data?.errors?.[0] || e.response?.data?.message || "Failed to add debt"
        : getErrorMessage(e);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (d: Debt) => {
    setEditingId(d._id);
    setEditForm({
      label: d.label,
      counterparty: d.counterparty ?? "",
      amount: String(d.amount),
      currency: d.currency,
      direction: d.direction,
      dueDate: d.dueDate ? d.dueDate.slice(0, 10) : "",
      notes: d.notes ?? "",
    });
    setError(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    if (!token || !editingId) return;
    if (!editForm.label?.trim()) { setError("Label is required"); return; }
    if (!editForm.counterparty?.trim()) { setError("Counterparty is required"); return; }
    const editAmountStr = String(editForm.amount ?? "").trim();
    if (editAmountStr === "") { setError("Amount is required"); return; }
    const editAmountNum = Number(editAmountStr);
    if (Number.isNaN(editAmountNum)) { setError("Amount must be a number"); return; }
    if (editAmountNum <= 0) { setError("Amount must be greater than 0"); return; }

    setSaving(true);
    try {
      const updated = await updateDebt(
        editingId,
        {
          label: editForm.label.trim(),
          counterparty: editForm.counterparty?.trim() || undefined,
          amount: editAmountNum,
          currency: editForm.currency,
          direction: editForm.direction,
          dueDate: editForm.dueDate || undefined,
          notes: editForm.notes?.trim() || undefined,
        },
        token
      );
      setDebts((prev) => prev.map((d) => (d._id === editingId ? updated : d)));
      setEditingId(null);
      setEditForm(emptyForm);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? e.response?.data?.errors?.[0] || e.response?.data?.message || "Update failed"
        : getErrorMessage(e);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleteId) return;
    setSaving(true);
    try {
      await deleteDebt(deleteId, token);
      setDebts((prev) => prev.filter((d) => d._id !== deleteId));
      setDeleteId(null);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? e.response?.data?.errors?.[0] || e.response?.data?.message || "Delete failed"
        : getErrorMessage(e);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!token || !paymentId) return;
    const amt = Number(payAmount);
    if (isNaN(amt) || amt <= 0) { setError("Payment amount must be greater than 0"); return; }
    setSaving(true);
    setError(null);
    try {
      const updated = await payDebt(paymentId, amt, token);
      setDebts((prev) => prev.map((d) => (d._id === paymentId ? updated : d)));
      setPaymentId(null);
      setPayAmount("");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? e.response?.data?.errors?.[0] || e.response?.data?.message || "Payment failed"
        : getErrorMessage(e);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const getPayoffPercentage = (debt: Debt) => {
    const paid = debt.paidAmount || 0;
    return Math.min(Math.round((paid / debt.amount) * 100), 100);
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return "#22c55e";
    if (pct >= 60) return "#3b82f6";
    if (pct >= 30) return "#f59e0b";
    return "#ef4444";
  };

  if (loading) return <div className="container py-4">Loading debts...</div>;

  return (
    <div className="container py-4">
      <h2>Debt records</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form className="mb-4" onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-md-4">
            <input className="form-control" name="label" placeholder="Label (e.g. Laptop)" value={form.label} onChange={handleChange} required />
          </div>
          <div className="col-md-3">
            <input className="form-control" name="counterparty" placeholder="Counterparty" value={form.counterparty} onChange={handleChange} required />
          </div>
          <div className="col-md-2">
            <input className="form-control" type="number" step={0.01} name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} required />
          </div>
          <div className="col-md-2">
            <select className="form-select" name="currency" value={form.currency} onChange={handleChange}>
              {CURRENCIES.map((c) => (<option key={c.code} value={c.code}>{c.label}</option>))}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" name="direction" value={form.direction} onChange={handleChange}>
              <option value="owed_by_me">I owe</option>
              <option value="owed_to_me">Owes me</option>
            </select>
          </div>
        </div>
        <div className="row g-2 mt-2">
          <div className="col-md-3">
            <input className="form-control" type="date" name="dueDate" value={form.dueDate || ""} onChange={handleChange} />
          </div>
          <div className="col-md-7">
            <textarea className="form-control" name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} rows={1} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" disabled={saving}>
              {saving ? "Saving..." : "Add debt"}
            </button>
          </div>
        </div>
      </form>

      {debts.length === 0 ? (
        <p>No debts recorded.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Label</th>
              <th>Counterparty</th>
              <th>Amount</th>
              <th>Direction</th>
              <th>Payoff Progress</th>
              <th>Due date</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((d, index) => {
              const pct = getPayoffPercentage(d);
              const color = getProgressColor(pct);
              const paid = d.paidAmount || 0;
              return (
                <tr key={d._id}>
                  <td>{index + 1}</td>
                  <td>{d.label}</td>
                  <td>{d.counterparty || "-"}</td>
                  <td>{d.amount} {d.currency}</td>
                  <td>{d.direction === "owed_by_me" ? "I owe" : "Owes me"}</td>
                  <td style={{ minWidth: "180px" }}>
                    <div style={{ fontSize: "0.75rem", marginBottom: "3px", color: "#555" }}>
                      {paid} / {d.amount} {d.currency} paid ({pct}%)
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px", transition: "width 0.3s ease" }} />
                    </div>
                    {pct < 100 && d.direction === "owed_by_me" && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success mt-1"
                        style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                        onClick={() => { setPaymentId(d._id); setPayAmount(""); setError(null); }}
                      >
                        + Make Payment
                      </button>
                    )}
                    {pct >= 100 && (
                      <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600 }}>✓ Paid off!</span>
                    )}
                  </td>
                  <td>{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "-"}</td>
                  <td>{d.notes || "-"}</td>
                  <td>
                    <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(d)}>Edit</button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setDeleteId(d._id); setError(null); }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Payment modal */}
      {paymentId && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Make a Payment</h5>
                <button type="button" className="btn-close" onClick={() => { setPaymentId(null); setPayAmount(""); }} disabled={saving} />
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <label className="form-label">Payment Amount</label>
                <input
                  className="form-control"
                  type="number"
                  step={0.01}
                  min={0.01}
                  placeholder="Enter amount paid"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
                {(() => {
                  const debt = debts.find((d) => d._id === paymentId);
                  if (!debt) return null;
                  const remaining = debt.amount - (debt.paidAmount || 0);
                  return <p className="mt-2 text-muted" style={{ fontSize: "0.85rem" }}>Remaining balance: {remaining.toFixed(2)} {debt.currency}</p>;
                })()}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setPaymentId(null); setPayAmount(""); }} disabled={saving}>Cancel</button>
                <button type="button" className="btn btn-success" onClick={handlePayment} disabled={saving}>
                  {saving ? "Saving..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit debt</h5>
                <button type="button" className="btn-close" onClick={() => setEditingId(null)} disabled={saving} />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Label</label>
                  <input className="form-control" name="label" value={editForm.label} onChange={handleEditChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Counterparty</label>
                  <input className="form-control" name="counterparty" value={editForm.counterparty} onChange={handleEditChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Amount</label>
                  <input className="form-control" type="number" step={0.01} name="amount" value={editForm.amount} onChange={handleEditChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Currency</label>
                  <select className="form-select" name="currency" value={editForm.currency} onChange={handleEditChange}>
                    {CURRENCIES.map((c) => (<option key={c.code} value={c.code}>{c.label}</option>))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Direction</label>
                  <select className="form-select" name="direction" value={editForm.direction} onChange={handleEditChange}>
                    <option value="owed_by_me">I owe</option>
                    <option value="owed_to_me">Owes me</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Due date</label>
                  <input className="form-control" type="date" name="dueDate" value={editForm.dueDate || ""} onChange={handleEditChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" name="notes" value={editForm.notes || ""} onChange={handleEditChange} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingId(null)} disabled={saving}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
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
                <h5 className="modal-title">Delete debt</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteId(null)} disabled={saving} />
              </div>
              <div className="modal-body">Are you sure you want to delete this debt record?</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={saving}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={saving}>
                  {saving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtPage;