// =============================================
// ClearPath - Protected Route Component
//
// CP-03: "Prevent access to protected routes" after logout
//
// If user is not authenticated, they are redirected
// to the login page. This prevents accessing
// dashboard or any other protected page without
// a valid session.
// =============================================

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // While checking auth state (on page refresh), show loading
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f8f7fc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="spinner-border"
            role="status"
            style={{ color: "#31008D", width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: "16px", color: "#7E78BA" }}>
            Loading ClearPath...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated — render the protected content
  return <>{children}</>;
}