import { useState, useEffect } from "react";
import { editIncome, getIncomes, Income, IncomeRequest } from "../api/incomeApi";
import { useNavigate, useParams } from "react-router-dom";

const EditIncomePage = () => {
  const [income, setIncome] = useState<Income | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch the selected income
  const fetchIncome = async () => {
    try {
      const data = await getIncomes();
      const found = data.find((inc) => inc._id === id);
      if (!found) {
        setError("Income not found.");
        return;
      }
      setIncome({
        _id: found._id,
        amount: found.amount,
        reason: found.reason,
        date: found.date,
      });
      setAmount(String(found.amount));
      setReason(found.reason);
      setDate(found.date);
    } catch (err) {
      setError("Failed to fetch income.");
    }
  };

  useEffect(() => {
    if (id) fetchIncome();
  }, [id]);

  // Handle update
  const handleEditIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!amount || !reason || !date) {
      setError("All fields are required.");
      return;
    }

    try {
      const payload: IncomeRequest = { amount: Number(amount), reason, date };
      if (id) {
        await editIncome(id, payload);
        setMessage("Income updated successfully!");
        navigate("/incomes");  
      }
    } catch (err: any) {
      setError(err || "Failed to update income.");
    }
  };

  if (!income) return <p>Loading income data...</p>;

  return (
    <div className="container mt-4">
      <h2>Edit Income</h2>

      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        Back
      </button>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleEditIncome}>
        <input
          type="number"
          className="form-control mb-2"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <input
          type="date"
          className="form-control mb-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="btn btn-primary mt-2">Update Income</button>
      </form>
    </div>
  );
};

export default EditIncomePage;
