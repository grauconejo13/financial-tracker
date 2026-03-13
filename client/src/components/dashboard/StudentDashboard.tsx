import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Income",
      description: "View and manage your income",
      route: "/income",
      color: "#22c55e"
    },
    {
      title: "Expenses",
      description: "Track where your money goes",
      route: "/expense",
      color: "#ef4444"
    },
    {
      title: "Transactions",
      description: "See all financial activity",
      route: "/transactions",
      color: "#3b82f6"
    },
    {
      title: "Budget",
      description: "Plan and manage spending",
      route: "/budget",
      color: "#8b5cf6"
    },
    {
      title: "Debts",
      description: "Track what you owe",
      route: "/debts",
      color: "#f59e0b"
    }
  ];

  return (
    <div className="container py-4">
      <h2 className="mb-4">Dashboard</h2>

      <div className="row g-4">
        {cards.map((card) => (
          <div key={card.title} className="col-md-4">
            <div
              onClick={() => navigate(card.route)}
              style={{
                cursor: "pointer",
                borderRadius: "12px",
                padding: "24px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <h4 style={{ color: card.color }}>{card.title}</h4>
              <p className="text-muted">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentDashboard;