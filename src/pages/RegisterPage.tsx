// =============================================
// ClearPath - Register Page (Route-level wrapper)
// =============================================

import Register from "../components/auth/Register";
import Navbar from "../components/common/Navbar";

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <Register />
    </>
  );
}