// =============================================
// ClearPath - Login Page (Route-level wrapper)
// =============================================

import Login from "../components/auth/Login";
import Navbar from "../components/common/Navbar";

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Login />
    </>
  );
}