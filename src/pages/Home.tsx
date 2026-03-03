// =============================================
// ClearPath - Home / Landing Page
// Shown to unauthenticated users at root URL "/"
// =============================================

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Home() {
  const { isAuthenticated } = useAuth();

  // If already logged in, go straight to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f8f7fc 0%, #e8e6f0 100%)",
        padding: "40px 20px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "600px" }}>
        {/* Hero */}
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 700,
            color: "#31008D",
            marginBottom: "16px",
            letterSpacing: "-1px",
          }}
        >
          ClearPath
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            color: "#7E78BA",
            marginBottom: "8px",
          }}
        >
          Finance Tracker for Students
        </p>
        <p
          style={{
            fontSize: "1rem",
            color: "#666",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          Track your income, expenses, debts, and savings with accountability.
          Every financial decision you make is recorded with a reason —
          helping you build mindful spending habits throughout your
          academic semester.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/register"
            style={{
              background: "linear-gradient(135deg, #31008D, #7E78BA)",
              color: "#FFFFFF",
              padding: "14px 32px",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "1rem",
              fontWeight: 600,
              boxShadow: "0 4px 16px rgba(49, 0, 141, 0.3)",
              transition: "opacity 0.2s ease",
            }}
          >
            Get Started — It's Free
          </Link>
          <Link
            to="/login"
            style={{
              background: "#FFFFFF",
              color: "#31008D",
              padding: "14px 32px",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "1rem",
              fontWeight: 600,
              border: "2px solid #31008D",
              transition: "all 0.2s ease",
            }}
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "48px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: "📊", label: "Track Spending" },
            { icon: "👻", label: "Ghost Budgeting" },
            { icon: "🎯", label: "Savings Goals" },
            { icon: "📝", label: "Accountability" },
          ].map((feature) => (
            <div
              key={feature.label}
              style={{
                background: "#FFFFFF",
                padding: "20px",
                borderRadius: "12px",
                width: "120px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                {feature.icon}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#31008D",
                }}
              >
                {feature.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}