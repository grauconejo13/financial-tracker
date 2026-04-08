import { useEffect, useState } from "react";
import {
  getSavings,
  addSavings,
  withdrawSavings
} from "../api/savingsApi";

import { getTemplates, Template } from "../api/templateApi";

import {
  createGoal,
  getGoals,
  deleteGoal,
  updateGoal,
  contributeToGoal,
  Goal
} from "../api/goalApi";

const getProgressColor = (pct: number) => {
  if (pct >= 100) return "#22c55e";
  if (pct >= 60) return "#3b82f6";
  if (pct >= 30) return "#f59e0b";
  return "#ef4444";
};

const SavingsPage = () => {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");

  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalOptions, setShowGoalOptions] = useState(false);
  const [goalMode, setGoalMode] = useState<"template" | "manual" | "">("");

  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedTemplateData, setSelectedTemplateData] = useState<any>(null);
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributeError, setContributeError] = useState("");
  const [contributeSaving, setContributeSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const savings = await getSavings();
      setBalance(savings.balance);
      const goalsData = await getGoals();
      setGoals(goalsData);
      const templateData = await getTemplates();
      setTemplates(templateData);
    } catch {
      setError("Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    if (!amount) return;
    await addSavings(Number(amount));
    setAmount("");
    loadData();
  };

  const handleWithdraw = async () => {
    if (!amount) return;
    await withdrawSavings(Number(amount));
    setAmount("");
    loadData();
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    const template = templates.find((t) => t._id === value);
    if (template) {
      setGoalName(template.name);
      setSelectedTemplateData(template);
      const fields = template.sections.flatMap((section: any) =>
        section.fields.map((f: any) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          value: ""
        }))
      );
      setDynamicFields(fields);
    }
  };

  const handleCreateGoal = async () => {
    setMessage("");
    setError("");
    if (!goalName || !goalAmount || !goalDeadline) {
      setError("All fields are required.");
      return;
    }
    try {
      if (editingId) {
        await updateGoal(editingId, {
          name: goalName,
          targetAmount: Number(goalAmount),
          deadline: goalDeadline
        });
        setMessage("Goal updated successfully!");
        setEditingId(null);
      } else {
        await createGoal({
          name: goalName,
          targetAmount: Number(goalAmount),
          deadline: goalDeadline,
          templateType: selectedTemplateData?.type || null,
          fields: dynamicFields.map((f) => ({ key: f.key, value: f.value }))
        });
        setMessage("Goal created successfully!");
      }
      setGoalName("");
      setGoalAmount("");
      setGoalDeadline("");
      setSelectedTemplate("");
      setDynamicFields([]);
      setShowGoalOptions(false);
      setGoalMode("");
      loadData();
    } catch (err: any) {
      setError(err);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingId(goal._id);
    setGoalName(goal.name);
    setGoalAmount(String(goal.targetAmount));
    setGoalDeadline(goal.deadline?.split("T")[0]);
    setSelectedTemplate("");
    setShowGoalOptions(true);
    setGoalMode("manual");
  };

  const handleDelete = async (id: string) => {
    await deleteGoal(id);
    setMessage("Goal deleted");
    loadData();
  };

  const handleContribute = async () => {
    if (!contributingId) return;
    const amt = Number(contributeAmount);
    if (isNaN(amt) || amt <= 0) {
      setContributeError("Amount must be greater than 0");
      return;
    }
    setContributeSaving(true);
    setContributeError("");
    try {
      const res = await contributeToGoal(contributingId, amt);
      setGoals((prev) =>
        prev.map((g) => (g._id === contributingId ? res.goal : g))
      );
      setContributingId(null);
      setContributeAmount("");
      setMessage("Contribution added!");
    } catch (err: any) {
      setContributeError(typeof err === "string" ? err : "Failed to contribute");
    } finally {
      setContributeSaving(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Savings Dashboard</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* BALANCE */}
      <div className="card p-3 mb-4">
        <h4>Balance: ${balance}</h4>
        <input
          type="number"
          className="form-control mb-2"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="btn btn-success me-2" onClick={handleAdd}>Add Funds</button>
        <button className="btn btn-warning" onClick={handleWithdraw}>Withdraw Funds</button>
      </div>

      {/* GOALS */}
      <div className="card p-3">
        <h4>Savings Goals</h4>

        {!showGoalOptions && (
          <button className="btn btn-primary mb-3" onClick={() => setShowGoalOptions(true)}>
            Add New Goal
          </button>
        )}

        {showGoalOptions && !goalMode && (
          <div className="mb-3">
            <button className="btn btn-info me-2" onClick={() => setGoalMode("template")}>With Template</button>
            <button className="btn btn-secondary" onClick={() => setGoalMode("manual")}>Without Template</button>
          </div>
        )}

        {goalMode === "template" && (
          <>
            <select className="form-control mb-2" value={selectedTemplate} onChange={(e) => handleTemplateChange(e.target.value)}>
              <option value="">Select Template</option>
              {templates.map((t) => (<option key={t._id} value={t._id}>{t.name}</option>))}
            </select>
            {dynamicFields.map((field, index) => (
              <div key={field.key}>
                <label>{field.label}</label>
                <input
                  type={field.type}
                  className="form-control mb-2"
                  value={field.value}
                  onChange={(e) => {
                    const updated = [...dynamicFields];
                    updated[index].value = e.target.value;
                    setDynamicFields(updated);
                  }}
                />
              </div>
            ))}
            <input className="form-control mb-2" placeholder="Goal Name" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
            <input type="number" className="form-control mb-2" placeholder="Target Amount" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} />
            <input type="date" className="form-control mb-2" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} />
            <button className="btn btn-success mb-3" onClick={handleCreateGoal}>Create Goal</button>
          </>
        )}

        {goalMode === "manual" && (
          <>
            <input className="form-control mb-2" placeholder="Goal Name" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
            <input type="number" className="form-control mb-2" placeholder="Target Amount" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} />
            <input type="date" className="form-control mb-2" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} />
            <button className="btn btn-success mb-3" onClick={handleCreateGoal}>
              {editingId ? "Update Goal" : "Create Goal"}
            </button>
          </>
        )}

        {goals.length === 0 && <p>No goals yet.</p>}

        {goals.map((g) => {
          const contributed = g.contributedAmount || 0;
          const pct = Math.min(Math.round((contributed / g.targetAmount) * 100), 100);
          const color = getProgressColor(pct);
          const remaining = g.targetAmount - contributed;

          return (
            <div key={g._id} className="border rounded p-3 mb-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong style={{ fontSize: "1.05rem" }}>{g.name}</strong>
                  <p className="mb-0 text-muted" style={{ fontSize: "0.85rem" }}>
                    Target: ${g.targetAmount} &nbsp;|&nbsp; Deadline: {g.deadline?.split("T")[0]}
                  </p>
                </div>
                <div>
                  <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(g)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g._id)}>Delete</button>
                </div>
              </div>

              <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: "4px" }}>
                ${contributed.toFixed(2)} of ${g.targetAmount} saved ({pct}%)
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "12px", overflow: "hidden", marginBottom: "8px" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px", transition: "width 0.3s ease" }} />
              </div>

              {pct >= 100 ? (
                <span style={{ color: "#22c55e", fontWeight: 600, fontSize: "0.9rem" }}>🎉 Goal reached!</span>
              ) : (
                <>
                  <p style={{ fontSize: "0.8rem", color: "#777", marginBottom: "6px" }}>
                    ${remaining.toFixed(2)} remaining to reach your goal
                  </p>
                  {contributingId === g._id ? (
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <input
                        type="number"
                        className="form-control"
                        style={{ maxWidth: "160px" }}
                        placeholder="Amount to contribute"
                        value={contributeAmount}
                        onChange={(e) => setContributeAmount(e.target.value)}
                        min={0.01}
                        step={0.01}
                      />
                      <button className="btn btn-success btn-sm" onClick={handleContribute} disabled={contributeSaving}>
                        {contributeSaving ? "Saving..." : "Confirm"}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setContributingId(null); setContributeAmount(""); setContributeError(""); }} disabled={contributeSaving}>
                        Cancel
                      </button>
                      {contributeError && <span style={{ color: "red", fontSize: "0.8rem" }}>{contributeError}</span>}
                    </div>
                  ) : (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => { setContributingId(g._id); setContributeAmount(""); setContributeError(""); }}
                    >
                      + Contribute
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavingsPage;