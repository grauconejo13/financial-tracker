function AdminDashboard() {
  return (
    <div className="container py-4">
      <h2 className="mb-4">Admin Dashboard</h2>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h5>Total Users</h5>
              <h3>0</h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h5>Total Transactions</h5>
              <h3>0</h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h5>System Status</h5>
              <h3 className="text-success">Active</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="alert alert-info">
        Admin tools and user management will appear here.
      </div>
    </div>
  );
}

export default AdminDashboard;