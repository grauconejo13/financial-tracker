import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

function Layout({ children }: Props) {
  return (
    <div>
      <nav style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
        <Link to="/">Home</Link> |{" "}
        <Link to="/dashboard">Dashboard</Link> |{" "}
        <Link to="/budget">Budget</Link> |{" "}
        <Link to="/ghost">Ghost</Link>
      </nav>

      <main style={{ padding: "1rem" }}>{children}</main>
    </div>
  );
}

export default Layout;