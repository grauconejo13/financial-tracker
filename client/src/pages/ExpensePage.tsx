import { useState, useEffect } from "react";
import {
  addExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
  type Expense,
  type ExpenseRequest,
} from "../api/expenseApi";

const categories = [
  "Food",
  "Transport",
  "Rent",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Other",
];

const classifications = ["Necessary", "Avoidable"] as const;

const ExpensePage = () => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [classification, setClassification] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExpenseRequest>({
    amount: 0,
    category: "",
    classification: "Necessary",
    reason: "",
    date: "",
  });

  //Load expenses on page load
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error("Failed to load expenses", err);
    }
  };

  //Add expense
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!amount || !category || !classification || !reason || !date) {
      setError("All fields are required.");
      return;
    }

    try {
      await addExpense({
        amount: Number(amount),
        category,
        classification: classification as "Necessary" | "Avoidable",
        reason,
        date,
      });

      setMessage("Expense added successfully!");

      // reset form
      setAmount("");
      setCategory("");
      setClassification("");
      setReason("");
      setDate("");

      loadExpenses(); 
    } catch (err: any) {
      setError(err || "Failed to add expense.");
    }
  };

  // Delete expense
  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      loadExpenses();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const openEdit = (exp: Expense) => {
    setEditingId(exp._id);
    setEditForm({
      amount: exp.amount,
      category: exp.category,
      classification: exp.classification,
      reason: exp.reason,
      date: exp.date.slice(0, 10),
    });
    setError("");
    setMessage("");
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        name === "amount"
          ? Number(value)
          : (value as ExpenseRequest[keyof ExpenseRequest]),
    }));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setMessage("");
    setError("");

    if (
      !editForm.amount ||
      !editForm.category ||
      !editForm.classification ||
      !editForm.reason ||
      !editForm.date
    ) {
      setError("All fields are required.");
      return;
    }

    try {
      await updateExpense(editingId, editForm);
      setEditingId(null);
      await loadExpenses();
      setMessage("Expense updated successfully!");
    } catch (err: any) {
      setError(err || "Failed to update expense.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Add Expense</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          className="form-control mb-3"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          className="form-control mb-3"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select category</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="form-control mb-3"
          value={classification}
          onChange={(e) => setClassification(e.target.value)}
        >
          <option value="">Select classification</option>
          {classifications.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <input
          type="date"
          className="form-control mb-3"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button className="btn btn-primary">Add Expense</button>
      </form>

      {/*  EXPENSE LIST */}
      <h3 className="mt-4">Your Expenses</h3>

      {expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <ul className="list-group">
          {expenses.map((exp) => (
            <li
              key={exp._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <strong>${exp.amount}</strong> - {exp.category} ({exp.classification})
                <br />
                <small>
                  {exp.reason} |{" "}
                  {new Date(exp.date).toLocaleDateString()}
                </small>
              </div>

              <button
                className="btn btn-outline-primary btn-sm me-2"
                onClick={() => openEdit(exp)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(exp._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {editingId && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit expense</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingId(null)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <input
                  type="number"
                  className="form-control mb-3"
                  name="amount"
                  placeholder="Amount"
                  value={editForm.amount}
                  onChange={handleEditChange}
                />
                <select
                  className="form-control mb-3"
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                >
                  <option value="">Select category</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  className="form-control mb-3"
                  name="classification"
                  value={editForm.classification}
                  onChange={handleEditChange}
                >
                  <option value="">Select classification</option>
                  {classifications.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="form-control mb-3"
                  name="reason"
                  placeholder="Reason"
                  value={editForm.reason}
                  onChange={handleEditChange}
                />
                <input
                  type="date"
                  className="form-control mb-3"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveEdit}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensePage;
