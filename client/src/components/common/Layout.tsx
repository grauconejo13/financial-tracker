import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { MdMenu } from "react-icons/md";
import {
  FaUserCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { MAIN_NAV_ITEMS } from "../../config/appNav";
import ChatAssistant from "./ChatAssistant";

interface LayoutProps {
  children: ReactNode;
}

function SidebarNavLinks({ mobile }: { mobile?: boolean }) {
  const dismiss = mobile ? { "data-bs-dismiss": "offcanvas" as const } : {};

  return (
    <nav className={mobile ? "d-flex flex-column gap-1" : "cp-sidebar-nav d-flex flex-column gap-1 flex-grow-1"}>
      {MAIN_NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/dashboard"}
          {...dismiss}
          className={({ isActive }) =>
            [
              "cp-sidebar-link d-flex align-items-center gap-3 text-decoration-none",
              isActive ? "active" : "",
            ].join(" ")
          }
        >
          <Icon className="cp-sidebar-icon flex-shrink-0" aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Layout({ children }: LayoutProps) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const displayName = user?.name?.trim() ? user.name.trim() : user?.email ?? "";

  /* ——— Public layout (marketing / auth) ——— */
  if (!token) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <nav className="navbar navbar-expand-lg navbar-dark cp-navbar">
          <div className="container px-3 px-lg-4">
            <Link className="navbar-brand" to="/">
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
              <span className="navbar-toggler-icon" />
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Log in
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    Register
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <main className="container px-3 px-lg-4 cp-main flex-grow-1">{children}</main>

        <footer className="cp-footer text-center mt-auto">
          <div className="container px-3">
            <small>© {new Date().getFullYear()} ClearPath</small>
          </div>
        </footer>

        <ChatAssistant />
      </div>
    );
  }

  /* ——— Authenticated: sidebar + content ——— */
  return (
    <div className="cp-app-shell d-flex min-vh-100 w-100">
      <aside
        className="cp-sidebar d-none d-lg-flex flex-column flex-shrink-0"
        aria-label="Main navigation"
      >
        <Link to="/dashboard" className="cp-sidebar-brand text-decoration-none">
          <span className="cp-sidebar-logo">ClearPath</span>
          <span className="cp-sidebar-tagline">Finances</span>
        </Link>

        <SidebarNavLinks />

        <div className="cp-sidebar-footer mt-auto pt-3">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `cp-sidebar-link cp-sidebar-link-subtle d-flex align-items-center gap-3 text-decoration-none ${isActive ? "active" : ""}`
            }
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="rounded-circle cp-sidebar-avatar flex-shrink-0"
              />
            ) : (
              <FaUserCircle className="cp-sidebar-icon flex-shrink-0" aria-hidden />
            )}
            <span className="text-truncate">{displayName || "Profile"}</span>
          </NavLink>
          <button
            type="button"
            className="cp-sidebar-logout btn w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
            onClick={handleLogout}
          >
            <FaSignOutAlt aria-hidden />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="cp-app-main d-flex flex-column flex-grow-1 min-vh-100 min-w-0">
        {/* Mobile header + offcanvas menu */}
        <header className="cp-topbar-mobile d-flex d-lg-none align-items-center justify-content-between gap-3 px-3 py-2">
          <Link to="/dashboard" className="cp-topbar-brand text-decoration-none fw-bold">
            ClearPath
          </Link>
          <button
            type="button"
            className="btn cp-btn-icon d-flex align-items-center justify-content-center"
            data-bs-toggle="offcanvas"
            data-bs-target="#cpNavDrawer"
            aria-controls="cpNavDrawer"
            aria-label="Open menu"
          >
            <MdMenu size={24} aria-hidden />
          </button>
        </header>

        <div
          className="offcanvas offcanvas-start cp-offcanvas"
          tabIndex={-1}
          id="cpNavDrawer"
          aria-labelledby="cpNavDrawerLabel"
        >
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title fw-bold mb-0" id="cpNavDrawerLabel">
              Menu
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            />
          </div>
          <div className="offcanvas-body d-flex flex-column">
            <SidebarNavLinks mobile />
            <div className="mt-auto pt-3 border-top">
              <Link
                className="cp-sidebar-link d-flex align-items-center gap-3 text-decoration-none"
                to="/profile"
                data-bs-dismiss="offcanvas"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="rounded-circle cp-sidebar-avatar flex-shrink-0"
                  />
                ) : (
                  <FaUserCircle className="cp-sidebar-icon flex-shrink-0" aria-hidden />
                )}
                <span className="text-truncate">{displayName || "Profile"}</span>
              </Link>
              <button
                type="button"
                className="cp-sidebar-logout btn w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
                data-bs-dismiss="offcanvas"
                onClick={handleLogout}
              >
                <FaSignOutAlt aria-hidden />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>

        <main className="cp-main-app flex-grow-1">{children}</main>

        <footer className="cp-footer text-center mt-auto py-3 py-lg-2">
          <div className="cp-main-app px-3 px-lg-4">
            <small>© {new Date().getFullYear()} ClearPath</small>
          </div>
        </footer>
      </div>

      <ChatAssistant />
    </div>
  );
}

export default Layout;
