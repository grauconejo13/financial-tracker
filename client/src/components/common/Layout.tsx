import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdTrendingUp,
  MdReceiptLong,
  MdSavings,
  MdCurrencyExchange,
} from "react-icons/md";
import {
  FaGhost,
  FaCreditCard,
  FaUserCircle,
  FaSignOutAlt,
  FaWallet,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const iconStyle = { fontSize: "1.15rem", flexShrink: 0 as const };

function Layout({ children }: LayoutProps) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const displayName = user?.name?.trim() ? user.name.trim() : user?.email ?? "";

  return (
    <div className="option2 d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            ClearPath
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center">
              {token && (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link d-flex align-items-center gap-1"
                      to="/dashboard"
                    >
                      <MdDashboard style={iconStyle} aria-hidden />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link d-flex align-items-center gap-1"
                      to="/budget"
                    >
                      <FaWallet style={iconStyle} aria-hidden />
                      <span>Budget</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link d-flex align-items-center gap-1"
                      to="/ghost"
                    >
                      <FaGhost style={iconStyle} aria-hidden />
                      <span>Ghost</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link d-flex align-items-center gap-1"
                      to="/income"
                    >
                      <MdTrendingUp style={iconStyle} aria-hidden />
                      <span>Income</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link d-flex align-items-center gap-1"
                      to="/transactions"
                    >
                      <MdReceiptLong style={iconStyle} aria-hidden />
                      <span>Transactions</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link d-flex align-items-center gap-1"
                      to="/debts"
                    >
                      <FaCreditCard style={iconStyle} aria-hidden />
                      <span>Debts</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link d-flex align-items-center gap-1"
                      to="/savings"
                    >
                      <MdSavings style={iconStyle} aria-hidden />
                      <span>Savings</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link d-flex align-items-center gap-1"
                      to="/currency-settings"
                    >
                      <MdCurrencyExchange style={iconStyle} aria-hidden />
                      <span>Currency</span>
                    </Link>
                  </li>
                </>
              )}
              {token ? (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link d-flex align-items-center gap-1"
                      to="/profile"
                      title="Profile settings"
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="rounded-circle border border-light flex-shrink-0"
                          style={{ width: 26, height: 26, objectFit: "cover" }}
                        />
                      ) : (
                        <FaUserCircle style={iconStyle} aria-hidden />
                      )}
                      <span
                        className="text-truncate d-inline-block"
                        style={{ maxWidth: "10rem" }}
                      >
                        {displayName}
                      </span>
                    </Link>
                  </li>
                  <li className="nav-item ms-lg-1">
                    <button
                      type="button"
                      className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt aria-hidden />
                      <span>Logout</span>
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main className="container my-4 flex-grow-1">{children}</main>

      <footer className="bg-light text-center py-3 border-top">
        <div className="container">
          <small>© {new Date().getFullYear()} ClearPath</small>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
