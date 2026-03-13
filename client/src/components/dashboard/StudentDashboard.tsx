import { useNavigate } from "react-router-dom";
import TransactionList from "./TransactionList";

function StudentDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Income",
      description: "View and manage your income",
      route: "/income"
    },
    {
      title: "Expenses",
      description: "Track where your money goes",
      route: "/expense"
    },
    {
      title: "Transactions",
      description: "See all financial activity",
      route: "/transactions"
    },
    {
      title: "Budget",
      description: "Plan and manage spending",
      route: "/budget"
    },
    {
      title: "Debts",
      description: "Track what you owe",
      route: "/debts"
    }
  ];

  return (
    <div className="container py-4" style={{ background: "var(--bg)" }}>
      <h2 className="mb-4" style={{ color: "var(--text)" }}>
        Dashboard
      </h2>

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
                borderLeft: "5px solid var(--accent)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 20px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <h4 style={{ color: "var(--primary)" }}>{card.title}</h4>
              <p style={{ color: "var(--text)", opacity: 0.7 }}>
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <TransactionList />
    </div>
  );
}

export default StudentDashboard;