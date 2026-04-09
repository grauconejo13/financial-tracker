import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { getApiOrigin } from "./config/apiOrigin";
import Layout from "./components/common/Layout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

import Home from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import BudgetPage from "./pages/BudgetPage";
import GhostPage from "./pages/GhostPage";
import AdminPage from "./pages/AdminPage";
import IncomePage from "./pages/IncomePage";
import ExpensePage from "./pages/ExpensePage";
import TransactionsPage from "./pages/TransactionsPage";
import DebtPage from "./pages/DebtPage";
import CurrencySettingsPage from "./pages/CurrencySettingsPage";
import SavingsPage from "./pages/SavingsPage";
import CategoryPage from "./pages/CategoryPage";
import TemplatePage from "./pages/TemplatePage";
import ProfilePage from "./pages/ProfilePage";
import AccountabilityHistoryPage from "./pages/AccountabilityHistoryPage";

/** Logs in production if Vite baked in localhost (VITE_API_URL missing on Vercel). */
function ProductionApiWarning() {
  useEffect(() => {
    if (import.meta.env.DEV) return;
    const origin = getApiOrigin();
    if (/localhost|127\.0\.0\.1/.test(origin)) {
      console.error(
        "[ClearPath] API URL points to localhost in this build. Set VITE_API_URL in Vercel (Production + Preview), then redeploy.",
      );
    }
  }, []);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <ProductionApiWarning />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <ProtectedRoute>
                  <BudgetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ghost"
              element={
                <ProtectedRoute>
                  <GhostPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/income"
              element={
                <ProtectedRoute>
                  <IncomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expense"
              element={
                <ProtectedRoute>
                  <ExpensePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountability"
              element={
                <ProtectedRoute>
                  <AccountabilityHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/debts"
              element={
                <ProtectedRoute>
                  <DebtPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/currency-settings"
              element={
                <ProtectedRoute>
                  <CurrencySettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/savings"
              element={
                <ProtectedRoute>
                  <SavingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute>
                  <CategoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/templates"
              element={
                <ProtectedRoute>
                  <TemplatePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
