import { useEffect, useState } from "react";
import {
  getTransactions,
  editTransaction,
  Transaction,
} from "../../api/transactionApi";

function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editReason, setEditReason] = useState("");

  const fetchTransactions = async () => {
    try {
      setError("");
      const data = await getTransactions();
      setTransactions(data);
    } catch (err: any) {
      setError(err || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const startEditing = (transaction: Transaction) => {
    setMessage("");
    setError("");
    setEditingId(transaction._id);
    setEditAmount(String(transaction.amount));
    setEditDescription(transaction.description);
    setEditCategory(transaction.category || "");
    setEditReason("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditAmount("");
    setEditDescription("");
    setEditCategory("");
    setEditReason("");
  };

  const handleSave = async (id: string) => {
    try {
      setMessage("");
      setError("");

      if (!editAmount || Number(editAmount) <= 0) {
        setError("Amount must be greater than zero.");
        return;
      }

      if (!editDescription.trim()) {
        setError("Description cannot be empty.");
        return;
      }

      if (!editReason.trim()) {
        setError("Edit reason is required.");
        return;
      }

      const token = localStorage.getItem("clearpath_token");
      if (!token) {
        setError("Missing authentication token.");
        return;
      }

      await editTransaction(
        id,
        {
          amount: Number(editAmount),
          description: editDescription.trim(),
          category: editCategory.trim(),
          reason: editReason.trim(),
        },
        token
      );

      setMessage("Transaction updated successfully.");
      cancelEditing();
      fetchTransactions();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update transaction."
  );
}
  };

  if (loading) {
    return <p>Loading transactions...</p>;
  }

  return (
    <div className="mt-4">
      <h3 className="mb-3">Recent Transactions</h3>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {transactions.length === 0 ? (
        <div className="alert alert-info">No transactions found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped align-middle">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const isEditing = editingId === transaction._id;

                return (
                  <tr key={transaction._id}>
                    <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>

                    <td className="text-capitalize">{transaction.type}</td>

                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-control"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                        />
                      ) : (
                        transaction.category || "—"
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <div>
                          <input
                            type="text"
                            className="form-control mb-2"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                          />
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Reason for edit"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                          />
                        </div>
                      ) : (
                        transaction.description
                      )}
                    </td>

                    <td
                      className={
                        transaction.type === "income"
                          ? "text-success fw-bold"
                          : "text-danger fw-bold"
                      }
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                        />
                      ) : (
                        `$${transaction.amount.toFixed(2)}`
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleSave(transaction._id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => startEditing(transaction)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransactionList;