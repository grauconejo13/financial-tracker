import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../Layout.css';

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header-bar">
        <span className="header-brand">ClearPath</span>
        {!token && <Link to="/login" className="header-login">Login</Link>}
      </header>
      <div className="layout-body">
        {token && (
          <aside className="sidebar">
            <nav className="sidebar-nav">
              <Link className="nav-link" to="/">Dashboard</Link>
              <Link className="nav-link" to="/budget">Budget</Link>
              <Link className="nav-link" to="/ghost">Ghost</Link>
              <Link className="nav-link" to="/debts">Debts</Link>
              <Link className="nav-link" to="/savings">Savings</Link>
              <Link className="nav-link" to="/settings">Settings</Link>
            </nav>
            <div className="sidebar-footer">
              <span className="nav-user">{user?.displayName || user?.email}</span>
              <button className="nav-btn" onClick={handleLogout}>Log out</button>
            </div>
          </aside>
        )}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <footer className="footer">© 2026 ClearPath</footer>
    </div>
  );
}