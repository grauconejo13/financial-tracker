import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="option2 d-flex flex-column min-vh-100">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
  <div className="container">
    <Link className="navbar-brand fw-bold" to="/">
      ClearPath
    </Link>

    {/* Hamburger button */}
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
      <ul className="navbar-nav ms-auto">
        <li className="nav-item">
          <Link className="nav-link" to="/dashboard">
            Dashboard
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/budget">
            Budget
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/ghost">
            Ghost
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/income">
            Income
          </Link>
        </li>
        {token ? (
          <>
            <li className="nav-item">
              <span className="nav-link">{user?.email}</span>
            </li>
            <li className="nav-item">
              <button className="btn btn-outline-light btn-sm ms-1" onClick={handleLogout}>
                Logout
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

      {/* Page Content */}
      <main className="container my-4 flex-grow-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-light text-center py-3 border-top">
        <div className="container">
          <small>© {new Date().getFullYear()} ClearPath</small>
        </div>
      </footer>
    </div>
  );
}

export default Layout;