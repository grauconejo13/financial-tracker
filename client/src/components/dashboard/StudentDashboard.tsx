import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSemester } from "../../api/semesterApi";
import TransactionList from "./TransactionList";

function StudentDashboard() {
  const navigate = useNavigate();

  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [semesterStart, setSemesterStart] = useState<string | null>(null);
  const [semesterEnd, setSemesterEnd] = useState<string | null>(null);


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

 useEffect(() => {
  async function loadSemester() {
    try {
      const semester = await getSemester(1);

      if (semester?.startDate && semester?.endDate) {

        setSemesterStart(semester.startDate);
        setSemesterEnd(semester.endDate);

        const today = new Date();
        const end = new Date(semester.endDate);

        const diff = end.getTime() - today.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        setDaysRemaining(days);
      }

    } catch (err) {
      console.warn("Using mock semester data");

      const mockStart = "2026-01-10";
      const mockEnd = "2026-05-15";

      setSemesterStart(mockStart);
      setSemesterEnd(mockEnd);

      const today = new Date();
      const end = new Date(mockEnd);

      const diff = end.getTime() - today.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      setDaysRemaining(days);
    }
  }

  loadSemester();
}, []);

  return (
    <div className="container py-4" style={{ background: "var(--bg)" }}>
      <h2 className="mb-4" style={{ color: "var(--text)" }}>
        Dashboard
      </h2>

    {daysRemaining !== null && semesterStart && semesterEnd && (
      <div
        className="mb-4"
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "20px",
          borderLeft: "5px solid var(--secondary)"
        }}
      >
        <h5 style={{ color: "var(--primary)" }}>
          Current Semester
        </h5>

        <p style={{ color: "var(--text)", opacity: 0.7 }}>
          {new Date(semesterStart).toLocaleDateString()} –{" "}
          {new Date(semesterEnd).toLocaleDateString()}
        </p>

        <h3 style={{ color: "var(--text)" }}>
          {daysRemaining > 0
            ? `${daysRemaining} days remaining`
            : "Semester ended"}
        </h3>
      </div>
    )}

      {/* Navigation Cards */}
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