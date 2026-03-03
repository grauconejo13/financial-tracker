// =============================================
// ClearPath - Navigation Bar Component
//
// CP-03: LOGOUT
// The logout button lives here.
//
// Acceptance Tests:
// ✓ Session ends when logout button is clicked
// ✓ Session must be inactivated for security purposes
// ✓ User is redirected to login screen after logout
// ✓ Protected routes become inaccessible after logout
// =============================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * CP-03: Handle logout button click.
   *
   * 1. Calls backend to blacklist the JWT token
   * 2. Clears localStorage (token + user)
   * 3. Clears React state
   * 4. Redirects to login screen
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      // Always redirect to login, even if backend call fails
      navigate("/login");
    }
  };

  return (
    <nav
      style={{
        background: "linear-gradient(135deg, #31008D, #7E78BA)",
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(49, 0, 141, 0.3)",
      }}
    >
      {/* Left: Brand */}
      <Link
        to={isAuthenticated ? "/dashboard" : "/"}
        style={{
          color: "#FFFFFF",
          fontSize: "1.4rem",
          fontWeight: 700,
          textDecoration: "none",
          letterSpacing: "-0.5px",
        }}
      >
        ClearPath
      </Link>

      {/* Right: User info + Logout */}
      {isAuthenticated && user ? (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* User greeting */}
          <span
            style={{
              color: "#FFFFFF",
              fontSize: "0.9rem",
              opacity: 0.9,
            }}
          >
            Hi, {user.firstName}
          </span>

          {/* Role badge */}
          <span
            style={{
              background:
                user.role === "ADMIN"
                  ? "#4DD0E1"
                  : "rgba(255,255,255,0.2)",
              color: user.role === "ADMIN" ? "#31008D" : "#FFFFFF",
              padding: "2px 10px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {user.role}
          </span>

          {/* CP-03: Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "#FFFFFF",
              padding: "6px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              opacity: isLoggingOut ? 0.6 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isLoggingOut) {
                e.currentTarget.style.background =
                  "rgba(255, 255, 255, 0.25)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "rgba(255, 255, 255, 0.15)";
            }}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            to="/login"
            style={{
              color: "#FFFFFF",
              textDecoration: "none",
              fontSize: "0.9rem",
              padding: "6px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.3)",
              transition: "all 0.2s ease",
            }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            style={{
              color: "#31008D",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
              padding: "6px 16px",
              borderRadius: "8px",
              background: "#FFFFFF",
              transition: "all 0.2s ease",
            }}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}