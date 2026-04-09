import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    status: "Active",
  });

  const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/api/admin/stats`);
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching stats", err);
      }
    };

    fetchStats();
  }, [API]);

  return (
    <div className="container py-4" style={{ background: "var(--bg)" }}>
      <h2 className="mb-4" style={{ color: "var(--text)" }}>
        Admin Dashboard
      </h2>

      {/* 📊 STATS */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h5>Total Users</h5>
              <h3>{stats.totalUsers}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h5>Active Users</h5>
              <h3>{stats.activeUsers}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h5>Total Transactions</h5>
              <h3>{stats.totalTransactions}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h5>Status</h5>
              <h3>{stats.status}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ⚙️ ACTIONS */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <Link to="/admin/categories">
            <div className="card text-center p-3">Manage Categories</div>
          </Link>
        </div>

        <div className="col-md-6">
          <Link to="/admin/templates">
            <div className="card text-center p-3">Manage Templates</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
