import { useState } from "react";
//import { addIncome, IncomeRequest } from "../api/incomeApi";
import { useNavigate } from "react-router-dom";

const AddIncomePage = () => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!amount || !reason || !date) {
      setError("All fields are required.");
      return;
    }

    try {
     // await addIncome({ amount: Number(amount), reason, date });
      setMessage("Income added successfully!");
      setAmount("");
      setReason("");
      setDate("");
    } catch (err: any) {
      setError(err || "Failed to add income.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Add New Income</h2>

      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        Back
      </button>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleAddIncome}>
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
        <button className="btn btn-primary mt-2">Add Income</button>
      </form>
    </div>
  );
};

export default AddIncomePage;
