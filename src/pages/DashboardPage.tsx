// =============================================
// ClearPath - Dashboard Page (Placeholder)
//
// This is a placeholder for CP-11 (teammate's task).
// It exists so that:
// 1. Login can redirect here on success (CP-02 acceptance test)
// 2. Logout can be tested from this page (CP-03)
// 3. Protected route works correctly
// =============================================

import Navbar from "../components/common/Navbar";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div
        style={{
          padding: "40px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            color: "#31008D",
            marginBottom: "8px",
          }}
        >
          Welcome, {user?.firstName}!
        </h2>
        <p style={{ color: "#7E78BA", marginBottom: "32px" }}>
          Your ClearPath dashboard is ready.
        </p>

        {/* Placeholder cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            { label: "Total Income", value: "$0.00", color: "#28a745" },
            { label: "Total Expenses", value: "$0.00", color: "#dc3545" },
            { label: "Balance", value: "$0.00", color: "#31008D" },
            { label: "Total Debt", value: "$0.00", color: "#ffc107" },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                borderLeft: `4px solid ${card.color}`,
              }}
            >
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#7E78BA",
                  marginBottom: "4px",
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: card.color,
                }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: "40px",
            padding: "20px",
            background: "#f0edf7",
            borderRadius: "12px",
            color: "#31008D",
            fontSize: "0.9rem",
            textAlign: "center",
          }}
        >
          🚧 Dashboard features (CP-11) will be built by a teammate.
          <br />
          Use the <strong>Logout</strong> button in the navbar to test CP-03.
        </p>
      </div>
    </>
  );
}