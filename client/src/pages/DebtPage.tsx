import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getDebts,
  addDebt,
  updateDebt,
  deleteDebt,
  type Debt,
  type DebtRequest
} from "../api/debtApi";

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
  { code: "ARS", label: "🇦🇷 ARS – Argentine Peso" }
];

const emptyForm: DebtRequest & { dueDate?: string; notes?: string } = {
  label: "",
  counterparty: "",
  amount: 0,
  currency: "LKR",
  direction: "owed_by_me",
  dueDate: "",
  notes: ""
};

const DebtPage = () => {
  const { token } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DebtRequest & { dueDate?: string; notes?: string }>(emptyForm);

  const [form, setForm] = useState<DebtRequest & { dueDate?: string; notes?: string }>({
    label: "",
    counterparty: "",
    amount: 0,
    currency: "LKR",
    direction: "owed_by_me",
    dueDate: "",
    notes: ""
  });

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await getDebts(token);
        setDebts(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load debts");
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
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (!form.label.trim() || !form.amount || form.amount <= 0) {
      setError("Label and positive amount are required");
      return;
    }

    setSaving(true);
    try {
      const payload: DebtRequest = {
        label: form.label.trim(),
        counterparty: form.counterparty?.trim() || undefined,
        amount: form.amount,
        currency: form.currency,
        direction: form.direction,
        dueDate: form.dueDate || undefined,
        notes: form.notes?.trim() || undefined
      };
      const created = await addDebt(payload, token);
      setDebts((prev) => [created, ...prev]);
      setForm({
        label: "",
        counterparty: "",
        amount: 0,
        currency: "LKR",
        direction: "owed_by_me",
        dueDate: "",
        notes: ""
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.errors?.[0] ||
        e?.response?.data?.message ||
        "Failed to add debt";
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
      amount: d.amount,
      currency: d.currency,
      direction: d.direction,
      dueDate: d.dueDate ? d.dueDate.slice(0, 10) : "",
      notes: d.notes ?? ""
    });
    setError(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value
    }));
  };

  const saveEdit = async () => {
    if (!token || !editingId) return;
    if (!editForm.label?.trim() || !editForm.amount || editForm.amount <= 0) {
      setError("Label and positive amount required");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateDebt(
        editingId,
        {
          label: editForm.label.trim(),
          counterparty: editForm.counterparty?.trim() || undefined,
          amount: editForm.amount,
          currency: editForm.currency,
          direction: editForm.direction,
          dueDate: editForm.dueDate || undefined,
          notes: editForm.notes?.trim() || undefined
        },
        token
      );
      setDebts((prev) => prev.map((d) => (d._id === editingId ? updated : d)));
      setEditingId(null);
      setEditForm(emptyForm);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.errors?.[0] || "Update failed");
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
    } catch (e: any) {
      setError(e?.response?.data?.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container py-4">Loading debts...</div>;

  return (
    <div className="container py-4">
      <h2>Debt records</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form className="mb-4" onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-md-4">
            <input
              className="form-control"
              name="label"
              placeholder="Label (e.g. Laptop)"
              value={form.label}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              name="counterparty"
              placeholder="Counterparty"
              value={form.counterparty}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              type="number"
              min={0.01}
              step={0.01}
              name="amount"
              placeholder="Amount"
              value={form.amount || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              name="currency"
              value={form.currency}
              onChange={handleChange}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              name="direction"
              value={form.direction}
              onChange={handleChange}
            >
              <option value="owed_by_me">I owe</option>
              <option value="owed_to_me">Owes me</option>
            </select>
          </div>
        </div>
        <div className="row g-2 mt-2">
          <div className="col-md-3">
            <input
              className="form-control"
              type="date"
              name="dueDate"
              value={form.dueDate || ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-7">
            <textarea
              className="form-control"
              name="notes"
              placeholder="Notes"
              value={form.notes}
              onChange={handleChange}
              rows={1}
            />
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
              <th>Due date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((d, index) => (
              <tr key={d._id}>
                <td>{index + 1}</td>
                <td>{d.label}</td>
                <td>{d.counterparty || "-"}</td>
                <td>
                  {d.amount} {d.currency}
                </td>
                <td>{d.direction === "owed_by_me" ? "I owe" : "Owes me"}</td>
                <td>{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "-"}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-1"
                    onClick={() => openEdit(d)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => { setDeleteId(d._id); setError(null); }}
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
                  <input className="form-control" type="number" min={0.01} step={0.01} name="amount" value={editForm.amount || ""} onChange={handleEditChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Currency</label>
                  <select className="form-select" name="currency" value={editForm.currency} onChange={handleEditChange}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
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
                <h5 className="modal-title">Delete debt</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteId(null)} disabled={saving} />
              </div>
              <div className="modal-body">Are you sure you want to delete this debt record?</div>
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

export default DebtPage;

