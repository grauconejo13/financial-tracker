import { Link } from "react-router-dom";

function AdminDashboard() {
  return (
    <div className="container py-4" style={{ background: "var(--bg)" }}>
      <h2 className="mb-4" style={{ color: "var(--text)" }}>
        Admin Dashboard
      </h2>

      {/* 📊 STATS CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div
            className="card shadow-sm text-center"
            style={{
              borderRadius: "12px",
              borderLeft: "5px solid var(--primary)",
            }}
          >
            <div className="card-body">
              <h5 style={{ color: "var(--text)" }}>Total Users</h5>
              <h3 style={{ color: "var(--primary)" }}>0</h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div
            className="card shadow-sm text-center"
            style={{
              borderRadius: "12px",
              borderLeft: "5px solid var(--accent)",
            }}
          >
            <div className="card-body">
              <h5 style={{ color: "var(--text)" }}>Total Transactions</h5>
              <h3 style={{ color: "var(--secondary)" }}>0</h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div
            className="card shadow-sm text-center"
            style={{
              borderRadius: "12px",
              borderLeft: "5px solid var(--secondary)",
            }}
          >
            <div className="card-body">
              <h5 style={{ color: "var(--text)" }}>System Status</h5>
              <h3 style={{ color: "var(--accent)" }}>Active</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ⚙️ ADMIN ACTIONS */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <Link to="/admin/categories" style={{ textDecoration: "none" }}>
            <div
              className="card shadow-sm text-center"
              style={{
                borderRadius: "12px",
                cursor: "pointer",
                borderLeft: "5px solid var(--primary)",
              }}
            >
              <div className="card-body">
                <h5 style={{ color: "var(--text)" }}>Manage Categories</h5>
                <p style={{ color: "var(--secondary)" }}>
                  Add, edit, or remove expense & income categories
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-6">
          <Link to="/admin/templates" style={{ textDecoration: "none" }}>
            <div
              className="card shadow-sm text-center"
              style={{
                borderRadius: "12px",
                cursor: "pointer",
                borderLeft: "5px solid var(--accent)",
              }}
            >
              <div className="card-body">
                <h5 style={{ color: "var(--text)" }}>Manage Templates</h5>
                <p style={{ color: "var(--secondary)" }}>
                  Create and update savings or financial templates
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 📢 INFO */}
      <div
        className="alert"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--accent)",
          color: "var(--text)",
        }}
      >
        Select an admin tool above to manage system data.
      </div>
    </div>
  );
}

export default AdminDashboard;
