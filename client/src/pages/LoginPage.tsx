import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [pending2FA, setPending2FA] = useState('');
  const { login, complete2FALogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
  const message = (location.state as { message?: string })?.message;

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.twoFactorToken) {
        setPending2FA(result.twoFactorToken);
        setStep(2);
        return;
      }
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await complete2FALogin(pending2FA, otpCode);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 400 }}>
      <h2>Log in</h2>
      {message && <div className="alert alert-success">{message}</div>}

      {step === 1 ? (
        <form onSubmit={handleStep1}>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleStep2}>
          {error && <div className="alert alert-danger">{error}</div>}
          <p className="text-muted small">Enter the 6-digit code from your authenticator app.</p>
          <div className="mb-3">
            <label className="form-label">Authenticator code</label>
            <input
              type="text"
              className="form-control"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\s/g, ''))}
              placeholder="000000"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 mb-2" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & continue'}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary w-100"
            disabled={loading}
            onClick={() => {
              setStep(1);
              setOtpCode('');
              setError('');
              setPending2FA('');
            }}
          >
            Back
          </button>
        </form>
      )}

      <p className="mt-2 text-center">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
      <p className="mt-3 text-center">
        Don&apos;t have an account? <Link to="/register">Create account</Link>
      </p>
    </div>
  );
}
