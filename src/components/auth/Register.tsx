// =============================================
// ClearPath - CP-01: User Registration Component
//
// Acceptance Tests:
// ✓ Register with valid credentials → account created, redirect to login
// ✓ Register with duplicate email → Error: "Email already exists."
// ✓ Passwords hashed using BCrypt (handled by backend)
//
// Notes:
// - confirmPassword validated on frontend before sending
// - Email normalized to lowercase on backend
// - After success, user is redirected to login page
// =============================================

import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/auth.css";

// Password strength calculator
function getPasswordStrength(password: string): {
  level: string;
  className: string;
  text: string;
} {
  if (password.length === 0) {
    return { level: "none", className: "", text: "" };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { level: "weak", className: "strength-weak", text: "Weak" };
  }
  if (score <= 3) {
    return { level: "medium", className: "strength-medium", text: "Medium" };
  }
  return { level: "strong", className: "strength-strong", text: "Strong" };
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Password strength
  const strength = getPasswordStrength(password);

  /**
   * Client-side validation before sending to backend.
   * Returns true if all fields are valid.
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please provide a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission.
   * Validates locally first, then sends to backend.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (response.success) {
        // Show success message then redirect to login
        setSuccessMessage(
          "Account created successfully! Redirecting to login..."
        );

        // Clear form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFieldErrors({});

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setErrorMessage(response.message || "Registration failed");
      }
    } catch (error: unknown) {
      // Handle axios error responses
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
              errors?: Record<string, string>;
            };
          };
        };

        const data = axiosError.response?.data;

        if (data?.errors) {
          // Validation errors from backend
          setFieldErrors(data.errors);
          setErrorMessage(data.message || "Please fix the errors below");
        } else if (data?.message) {
          // Single error message (e.g., "Email already exists.")
          setErrorMessage(data.message);
        } else {
          setErrorMessage("Registration failed. Please try again.");
        }
      } else {
        setErrorMessage(
          "Unable to connect to server. Please try again later."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand">
          <h1>ClearPath</h1>
          <p>Create your account</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="auth-alert alert-success" role="alert">
            {successMessage}
          </div>
        )}

        {/* Registration Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* First Name + Last Name side by side */}
          <div className="name-row">
            <div className="name-field mb-3">
              <label htmlFor="firstName" className="form-label">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                className={`form-control ${
                  fieldErrors.firstName ? "is-invalid" : ""
                }`}
                placeholder="John"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (fieldErrors.firstName) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.firstName;
                      return next;
                    });
                  }
                }}
                disabled={isSubmitting}
              />
              {fieldErrors.firstName && (
                <div className="invalid-feedback">
                  {fieldErrors.firstName}
                </div>
              )}
            </div>

            <div className="name-field mb-3">
              <label htmlFor="lastName" className="form-label">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                className={`form-control ${
                  fieldErrors.lastName ? "is-invalid" : ""
                }`}
                placeholder="Doe"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (fieldErrors.lastName) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.lastName;
                      return next;
                    });
                  }
                }}
                disabled={isSubmitting}
              />
              {fieldErrors.lastName && (
                <div className="invalid-feedback">
                  {fieldErrors.lastName}
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`form-control ${
                fieldErrors.email ? "is-invalid" : ""
              }`}
              placeholder="you@college.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }}
              disabled={isSubmitting}
            />
            {fieldErrors.email && (
              <div className="invalid-feedback">{fieldErrors.email}</div>
            )}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`form-control ${
                fieldErrors.password ? "is-invalid" : ""
              }`}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.password;
                    return next;
                  });
                }
              }}
              disabled={isSubmitting}
            />
            {fieldErrors.password && (
              <div className="invalid-feedback">{fieldErrors.password}</div>
            )}

            {/* Password Strength Bar */}
            {password.length > 0 && (
              <>
                <div className="password-strength">
                  <div className={`strength-bar ${strength.className}`}></div>
                </div>
                <small
                  className={`password-strength-text text-${
                    strength.level === "weak"
                      ? "danger"
                      : strength.level === "medium"
                      ? "warning"
                      : "success"
                  }`}
                >
                  {strength.text}
                </small>
              </>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={`form-control ${
                fieldErrors.confirmPassword ? "is-invalid" : ""
              }`}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.confirmPassword;
                    return next;
                  });
                }
              }}
              disabled={isSubmitting}
            />
            {fieldErrors.confirmPassword && (
              <div className="invalid-feedback">
                {fieldErrors.confirmPassword}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}