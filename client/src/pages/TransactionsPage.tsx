import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getTransactions,
  getTransactionCategories,
  deleteTransaction,
  createTransaction,
  editTransaction,
  type Transaction,
  type TransactionFilters,
} from "../api/transactionApi";
import { getApiErrorMessage } from "../utils/apiError";

/** Local calendar date for date inputs (YYYY-MM-DD). */
function localDateInputValue(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TransactionsPage = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<"income" | "expense">("expense");
  const [addAmount, setAddAmount] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addTransactionDate, setAddTransactionDate] = useState(localDateInputValue);
  const [addReason, setAddReason] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editReason, setEditReason] = useState("");

  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<TransactionFilters>({});
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadCategories = useCallback(async () => {
    if (!token) return;
    try {
      const cats = await getTransactionCategories(token);
      setCategories(cats);
    } catch {
      setCategories([]);
    }
  }, [token]);

  const loadTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions(token, appliedFilters);
      const sorted = [...data].sort((a, b) => {
        let valA: number;
        let valB: number;

        if (sortBy === "amount") {
          valA = Number(a.amount);
          valB = Number(b.amount);
        } else {
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
        }

        return sortOrder === "asc" ? valA - valB : valB - valA;
      });

      setTransactions(sorted);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to load transactions"));
    } finally {
      setLoading(false);
    }
  }, [token, appliedFilters]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const applyFilters = () => {
    setError(null);
    if (filterDateFrom && filterDateTo && filterDateFrom > filterDateTo) {
      setError("“From” date must be on or before “To” date.");
      return;
    }
    const next: TransactionFilters = {};

    if (filterCategory.trim()) next.category = filterCategory.trim();
    if (filterDateFrom) next.dateFrom = filterDateFrom;
    if (filterDateTo) next.dateTo = filterDateTo;

    next.sortBy = sortBy;
    next.sortOrder = sortOrder;

    setAppliedFilters(next);
  };

  const clearFilters = () => {
    setFilterCategory("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setAppliedFilters({});
  };

  const openDelete = (id: string) => {
    setDeleteId(id);
    setReason("");
    setError(null);
  };

  const confirmAdd = async () => {
    if (!token) return;
    const amt = Number(addAmount);
    if (!addDescription.trim() || Number.isNaN(amt) || amt <= 0) {
      setError("Valid amount and description are required");
      return;
    }
    if (addReason.trim().length < 5) {
      setError("Reason must be at least 5 characters (accountability log)");
      return;
    }
    if (!addTransactionDate.trim()) {
      setError("Transaction date is required.");
      return;
    }
    setAddSubmitting(true);
    setError(null);
    try {
      await createTransaction(
        {
          type: addType,
          amount: amt,
          description: addDescription.trim(),
          category: addCategory.trim() || undefined,
          reason: addReason.trim(),
          transactionDate: addTransactionDate.trim(),
        },
        token,
      );
      setShowAdd(false);
      setAddAmount("");
      setAddDescription("");
      setAddCategory("");
      setAddTransactionDate(localDateInputValue());
      setAddReason("");
      setAppliedFilters({});
      setFilterCategory("");
      setFilterDateFrom("");
      setFilterDateTo("");
      await loadTransactions();
      await loadCategories();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to add transaction"));
    } finally {
      setAddSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId || !token) return;
    const r = reason.trim();
    if (r.length < 5) {
      setError("Reason must be at least 5 characters");
      return;
    }
    setSubmitting(true);
    try {
      await deleteTransaction(deleteId, r, token);
      setTransactions((prev) => prev.filter((t) => t._id !== deleteId));
      setDeleteId(null);
      setReason("");
      void loadCategories();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message || "Failed to delete transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (t: Transaction) => {
    setEditId(t._id);
    setEditAmount(String(t.amount));
    setEditDescription(t.description);
    setEditCategory(t.category ?? "");
    setEditReason("");
    setError(null);
  };

  const confirmEdit = async () => {
    if (!token || !editId) return;
    const amt = editAmount.trim() ? Number(editAmount) : undefined;
    if (amt !== undefined && (Number.isNaN(amt) || amt <= 0)) {
      setError("Edited amount must be a positive number");
      return;
    }
    if (!editDescription.trim()) {
      setError("Description is required");
      return;
    }
    if (editReason.trim().length < 5) {
      setError("Reason must be at least 5 characters (accountability log)");
      return;
    }
    setSubmitting(true);
    try {
      await editTransaction(
        editId,
        {
          amount: amt,
          description: editDescription.trim(),
          category: editCategory.trim() || undefined,
          reason: editReason.trim(),
        },
        token,
      );
      setEditId(null);
      setEditAmount("");
      setEditDescription("");
      setEditCategory("");
      setEditReason("");
      await loadTransactions();
      setError(null);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to update transaction"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="mb-4 d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h1 className="cp-page-title mb-2">Transactions</h1>
          <p className="cp-page-lead mb-0">
            Add entries with a reason (logged), filter by category or dates, and review
            your list.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowAdd(true);
            setAddTransactionDate(localDateInputValue());
            setError(null);
          }}
        >
          Add transaction
        </button>
      </header>

      <div className="cp-card p-3 p-md-4 mb-4">
        <h2 className="h6 fw-bold text-uppercase text-muted mb-3">Filters</h2>
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label" htmlFor="tx-filter-category">
              Category
            </label>
            <input
              id="tx-filter-category"
              className="form-control"
              list="tx-category-options"
              placeholder="Type or pick a category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            />
            <datalist id="tx-category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="col-md-3 col-lg-2">
            <label className="form-label" htmlFor="tx-filter-from">
              From
            </label>
            <input
              id="tx-filter-from"
              type="date"
              className="form-control"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div className="col-md-3 col-lg-2">
            <label className="form-label" htmlFor="tx-filter-to">
              To
            </label>
            <input
              id="tx-filter-to"
              type="date"
              className="form-control"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          <div className="col-md-4 col-lg-3">
            <label className="form-label">Sort</label>
            <select
              className="form-select"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split("-");
                setSortBy(by as "date" | "amount");
                setSortOrder(order as "asc" | "desc");
              }}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Highest amount</option>
              <option value="amount-asc">Lowest amount</option>
            </select>
          </div>
          <div className="col-md-8 col-lg-4 d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={applyFilters}
            >
              Apply filters
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </div>
        {(appliedFilters.category ||
          appliedFilters.dateFrom ||
          appliedFilters.dateTo) && (
          <p className="small text-muted mt-3 mb-0">
            Showing results for{" "}
            {[
              appliedFilters.category && `category “${appliedFilters.category}”`,
              appliedFilters.dateFrom && `from ${appliedFilters.dateFrom}`,
              appliedFilters.dateTo && `through ${appliedFilters.dateTo}`,
            ]
              .filter(Boolean)
              .join(" · ")}
            .
          </p>
        )}
      </div>

      {error && !deleteId && !showAdd && (
        <div className="alert alert-danger">{error}</div>
      )}

      {loading ? (
        <div className="cp-card p-4 text-muted">Loading transactions…</div>
      ) : transactions.length === 0 ? (
        <p className="text-muted">No transactions match these filters.</p>
      ) : (
        <div className="cp-card p-0 overflow-hidden">
          <div className="table-responsive cp-table-wrap rounded-3 border">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="text-end">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, index) => (
                  <tr key={t._id}>
                    <td>{index + 1}</td>
                    <td className="text-nowrap">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="text-capitalize">{t.type}</td>
                    <td>{t.category ?? "—"}</td>
                    <td>{t.description}</td>
                    <td
                      className={`text-end fw-semibold ${
                        t.type === "income" ? "text-success" : "text-danger"
                      }`}
                    >
                      ${Number(t.amount).toFixed(2)}
                    </td>
                    <td className="text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openEdit(t)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
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
          </div>
        </div>
      )}

      {showAdd && (
        <div className="modal d-block" style={{ background: "#00000055" }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add transaction</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => !addSubmitting && setShowAdd(false)}
                  disabled={addSubmitting}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <p className="small text-muted">
                  Your reason will appear in <strong>Accountability history</strong> with
                  this entry.
                </p>
                {error && showAdd && (
                  <div className="alert alert-danger small py-2">{error}</div>
                )}
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="add-tx-date">
                      Transaction date <span className="text-danger">*</span>
                    </label>
                    <input
                      id="add-tx-date"
                      type="date"
                      className="form-control"
                      required
                      value={addTransactionDate}
                      onChange={(e) => setAddTransactionDate(e.target.value)}
                    />
                    <p className="form-text small text-muted mb-0">
                      When this income or expense happened. Used for lists and date filters
                      (stored as start of that day, UTC).
                    </p>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="add-type">
                      Type
                    </label>
                    <select
                      id="add-type"
                      className="form-select"
                      value={addType}
                      onChange={(e) =>
                        setAddType(e.target.value as "income" | "expense")
                      }
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="add-amount">
                      Amount
                    </label>
                    <input
                      id="add-amount"
                      type="number"
                      min={0.01}
                      step="0.01"
                      className="form-control"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="add-desc">
                      Description
                    </label>
                    <input
                      id="add-desc"
                      type="text"
                      className="form-control"
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="add-cat">
                      Category (optional)
                    </label>
                    <input
                      id="add-cat"
                      className="form-control"
                      list="tx-category-options-add"
                      value={addCategory}
                      onChange={(e) => setAddCategory(e.target.value)}
                    />
                    <datalist id="tx-category-options-add">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="add-reason">
                      Reason (min 5 characters)
                    </label>
                    <textarea
                      id="add-reason"
                      className="form-control"
                      rows={3}
                      value={addReason}
                      onChange={(e) => setAddReason(e.target.value)}
                      placeholder="Why are you recording this?"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAdd(false)}
                  disabled={addSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmAdd}
                  disabled={
                    addSubmitting ||
                    addReason.trim().length < 5 ||
                    !addDescription.trim()
                  }
                >
                  {addSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
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
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <p>
                  Please provide a reason for deleting this transaction (minimum 5
                  characters). This will appear in your{" "}
                  <strong>Accountability history</strong>.
                </p>
                {error && <div className="alert alert-danger small py-2">{error}</div>}
                <textarea
                  className="form-control"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Why are you removing this entry?"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteId(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={submitting || reason.trim().length < 5}
                >
                  {submitting ? "Deleting…" : "Confirm delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editId && (
        <div className="modal d-block" style={{ background: "#00000055" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit transaction</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditId(null)}
                  disabled={submitting}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <p className="small text-muted">
                  Your edit reason will appear in <strong>Accountability history</strong> for this
                  transaction.
                </p>
                {error && (
                  <div className="alert alert-danger small py-2">
                    {error}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label" htmlFor="edit-amount">
                    Amount
                  </label>
                  <input
                    id="edit-amount"
                    type="number"
                    min={0.01}
                    step="0.01"
                    className="form-control"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="edit-desc">
                    Description
                  </label>
                  <input
                    id="edit-desc"
                    type="text"
                    className="form-control"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="edit-cat">
                    Category (optional)
                  </label>
                  <input
                    id="edit-cat"
                    className="form-control"
                    list="tx-category-options"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="edit-reason">
                    Reason for change (min 5 characters)
                  </label>
                  <textarea
                    id="edit-reason"
                    className="form-control"
                    rows={3}
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Why are you changing this entry?"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditId(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmEdit}
                  disabled={submitting || editReason.trim().length < 5}
                >
                  {submitting ? "Saving…" : "Save changes"}
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
