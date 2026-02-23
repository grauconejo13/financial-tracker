import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
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
          <Link className="nav-link" to="/login">
            Login
          </Link>
        </li>
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