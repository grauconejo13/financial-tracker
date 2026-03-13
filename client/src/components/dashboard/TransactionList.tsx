import { useEffect, useState } from "react";
import { getTransactions, TransactionItem } from "../../api/transactionApi";

function TransactionList() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getTransactions();
        setTransactions(data);
      } catch (err: any) {
        setError(err || "Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return <p>Loading transactions...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="mt-4">
      <h3 className="mb-3">Recent Transactions</h3>

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
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-capitalize">{transaction.type}</td>
                  <td>{transaction.category || "—"}</td>
                  <td>{transaction.description}</td>
                  <td
                    className={
                      transaction.type === "income"
                        ? "text-success fw-bold"
                        : "text-danger fw-bold"
                    }
                  >
                    ${transaction.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransactionList;