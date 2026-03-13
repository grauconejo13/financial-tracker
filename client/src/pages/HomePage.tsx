import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HomePage() {
  const { token } = useAuth();
  const isLoggedIn = !!token;

  if (!isLoggedIn) {
    return (
      <div
        className="container text-center py-5"
        style={{ background: "var(--bg)", minHeight: "70vh" }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px",
            borderRadius: "16px",
            background: "#ffffff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
          }}
        >
          <h1
            style={{
              color: "var(--primary)",
              fontWeight: 700
            }}
          >
            Welcome to ClearPath
          </h1>

          <p
            style={{
              color: "var(--text)",
              opacity: 0.75,
              marginTop: "10px"
            }}
          >
            Take control of your finances. Track income, monitor expenses,
            manage debts, and plan your financial future.
          </p>

          <div className="mt-4">
            <Link to="/login" className="btn btn-primary m-2 px-4">
              Login
            </Link>

            <Link to="/register" className="btn btn-outline-primary m-2 px-4">
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Navigate to="/dashboard" />;
}

export default HomePage;