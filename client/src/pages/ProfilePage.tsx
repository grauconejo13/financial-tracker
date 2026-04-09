import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProfile,
  updateProfile,
  updatePassword,
  exportMyData,
  deleteMyAccount,
  setupTwoFA,
  enableTwoFA,
  disableTwoFA,
} from "../api/profileApi";
import { normalizeUser } from "../utils/normalizeUser";
import {
  PROFILE_CURRENCIES,
  PROFILE_LANGUAGES,
  COUNTRIES,
  TIMEZONES,
} from "../data/profileOptions";

const AVATAR_MAX_BYTES = 350_000;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { token, user, refreshUser, setUserFromServer, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [language, setLanguage] = useState("en");
  const [studentId, setStudentId] = useState("");
  const [program, setProgram] = useState("");
  const [monthlyBudgetTarget, setMonthlyBudgetTarget] = useState<string>("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [twofaQr, setTwofaQr] = useState<string | null>(null);
  const [twofaManual, setTwofaManual] = useState<string | null>(null);
  const [twofaEnableCode, setTwofaEnableCode] = useState("");
  const [twofaMsg, setTwofaMsg] = useState<string | null>(null);
  const [twofaErr, setTwofaErr] = useState<string | null>(null);
  const [twofaBusy, setTwofaBusy] = useState(false);
  const [disable2faPassword, setDisable2faPassword] = useState("");
  const [disable2faCode, setDisable2faCode] = useState("");

  const [exportBusy, setExportBusy] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const applyUserToForm = (n: ReturnType<typeof normalizeUser>) => {
    setName(n.name);
    setEmail(n.email);
    setPhone(n.phone);
    setCountry(n.country);
    setPreferredCurrency(n.preferredCurrency || "USD");
    setTimezone(n.timezone);
    setAvatar(n.avatar || "");
    setLanguage(n.language || "en");
    setStudentId(n.studentId || "");
    setProgram(n.program || "");
    setMonthlyBudgetTarget(
      n.monthlyBudgetTarget === null || n.monthlyBudgetTarget === undefined
        ? ""
        : String(n.monthlyBudgetTarget)
    );
    setNotifyEmail(n.notifyEmail !== false);
    setNotifyPush(n.notifyPush === true);
    setTwoFactorEnabled(n.twoFactorEnabled === true);
  };

  useEffect(() => {
    if (!token) return;

    (async () => {
      setLoading(true);
      try {
        const { user: u } = await getProfile(token);
        applyUserToForm(normalizeUser(u));
      } catch {
        if (user) applyUserToForm(normalizeUser(user));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > AVATAR_MAX_BYTES) {
      setProfileErr("Image is too large. Please use a file under ~350KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileMsg(null);
    setProfileErr(null);
    setSavingProfile(true);
    try {
      const budgetVal = monthlyBudgetTarget.trim();
      let budgetPayload: number | null = null;
      if (budgetVal !== "") {
        const n = Number.parseFloat(budgetVal);
        if (Number.isNaN(n) || n < 0) {
          setProfileErr("Monthly budget must be a non-negative number.");
          setSavingProfile(false);
          return;
        }
        budgetPayload = n;
      }
      const { user: u } = await updateProfile(
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country,
          preferredCurrency,
          timezone,
          avatar: avatar || null,
          language,
          studentId: studentId.trim(),
          program: program.trim(),
          monthlyBudgetTarget: budgetPayload,
          notifyEmail,
          notifyPush,
        },
        token
      );
      setUserFromServer(u);
      applyUserToForm(normalizeUser(u));
      setProfileMsg("Profile saved successfully.");
      await refreshUser();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setProfileErr(
          (err.response?.data as { message?: string })?.message ||
            "Could not save profile"
        );
      } else {
        setProfileErr("Could not save profile");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const saveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileMsg(null);
    setProfileErr(null);
    setSavingProfile(true);
    try {
      const { user: u } = await updateProfile({ notifyEmail, notifyPush }, token);
      setUserFromServer(u);
      setProfileMsg("Notification preferences saved.");
      await refreshUser();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setProfileErr(
          (err.response?.data as { message?: string })?.message ||
            "Could not save"
        );
      } else setProfileErr("Could not save");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPasswordMsg(null);
    setPasswordErr(null);

    if (newPassword.length < 6) {
      setPasswordErr("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await updatePassword(currentPassword, newPassword, token);
      setPasswordMsg(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPasswordErr(
          (err.response?.data as { message?: string })?.message ||
            "Could not update password"
        );
      } else {
        setPasswordErr("Could not update password");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleStart2FA = async () => {
    if (!token) return;
    setTwofaMsg(null);
    setTwofaErr(null);
    setTwofaBusy(true);
    try {
      const res = await setupTwoFA(token);
      setTwofaQr(res.qrDataUrl);
      setTwofaManual(res.manualKey);
      setTwofaMsg(res.message);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setTwofaErr(
          (err.response?.data as { message?: string })?.message ||
            "Could not start 2FA setup"
        );
      } else setTwofaErr("Could not start 2FA setup");
    } finally {
      setTwofaBusy(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setTwofaMsg(null);
    setTwofaErr(null);
    setTwofaBusy(true);
    try {
      const res = await enableTwoFA(twofaEnableCode, token);
      setTwofaMsg(res.message);
      if (res.user) setUserFromServer(res.user);
      setTwoFactorEnabled(true);
      setTwofaEnableCode("");
      setTwofaQr(null);
      setTwofaManual(null);
      await refreshUser();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setTwofaErr(
          (err.response?.data as { message?: string })?.message ||
            "Invalid code"
        );
      } else setTwofaErr("Invalid code");
    } finally {
      setTwofaBusy(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setTwofaMsg(null);
    setTwofaErr(null);
    setTwofaBusy(true);
    try {
      const res = await disableTwoFA(
        disable2faPassword,
        twoFactorEnabled ? disable2faCode : undefined,
        token
      );
      setTwofaMsg(res.message);
      if (res.user) setUserFromServer(res.user);
      setTwoFactorEnabled(false);
      setDisable2faPassword("");
      setDisable2faCode("");
      setTwofaQr(null);
      setTwofaManual(null);
      await refreshUser();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setTwofaErr(
          (err.response?.data as { message?: string })?.message ||
            "Could not disable 2FA"
        );
      } else setTwofaErr("Could not disable 2FA");
    } finally {
      setTwofaBusy(false);
    }
  };

  const handleExport = async () => {
    if (!token) return;
    setExportBusy(true);
    try {
      const data = await exportMyData(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clearpath-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Try again when logged in.");
    } finally {
      setExportBusy(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setDeleteErr(null);
    setDeleteBusy(true);
    try {
      await deleteMyAccount(deletePassword, deleteConfirm, token);
      await logout();
      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setDeleteErr(
          (err.response?.data as { message?: string })?.message ||
            "Could not delete account"
        );
      } else {
        setDeleteErr("Could not delete account");
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-4">Your profile</h2>
      <p className="text-muted small mb-4">
        Manage your account, security, notifications, and data.
      </p>

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">Profile photo &amp; account</div>
        <div className="card-body">
          <form onSubmit={handleSaveProfile}>
            {profileMsg && (
              <div className="alert alert-success py-2">{profileMsg}</div>
            )}
            {profileErr && (
              <div className="alert alert-danger py-2">{profileErr}</div>
            )}

            <div className="d-flex align-items-start gap-3 mb-3">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="rounded-circle border"
                  style={{ width: 72, height: 72, objectFit: "cover" }}
                />
              ) : (
                <div
                  className="rounded-circle bg-secondary-subtle border d-flex align-items-center justify-content-center text-muted small"
                  style={{ width: 72, height: 72 }}
                >
                  No photo
                </div>
              )}
              <div className="flex-grow-1">
                <label className="form-label">Avatar</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={onAvatarFile}
                />
                <button
                  type="button"
                  className="btn btn-link btn-sm px-0"
                  onClick={() => setAvatar("")}
                >
                  Remove photo
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Full name</label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                autoComplete="tel"
              />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Student ID</label>
                <input
                  className="form-control"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Program / major</label>
                <input
                  className="form-control"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Monthly budget target</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="form-control"
                value={monthlyBudgetTarget}
                onChange={(e) => setMonthlyBudgetTarget(e.target.value)}
                placeholder="Leave empty for none"
              />
              <div className="form-text">
                Reference amount in your home currency (not enforced app-wide yet).
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Preferred language</label>
              <select
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {PROFILE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Country / region</label>
              <select
                className="form-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Select…</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Home currency</label>
              <select
                className="form-select"
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
              >
                {PROFILE_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Timezone</label>
              <select
                className="form-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="">Not set</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </form>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">Notifications</div>
        <div className="card-body">
          <form onSubmit={saveNotifications}>
            <div className="form-check form-switch mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="notifyEmail"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="notifyEmail">
                Email summaries &amp; reminders
              </label>
            </div>
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="notifyPush"
                checked={notifyPush}
                onChange={(e) => setNotifyPush(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="notifyPush">
                Push notifications
              </label>
              <div className="form-text">
                Preferences are saved on your profile. Browser / app push requires
                extra setup and is not wired for all devices yet.
              </div>
            </div>
            <button type="submit" className="btn btn-outline-primary btn-sm">
              Save notification preferences
            </button>
          </form>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">Security — password</div>
        <div className="card-body">
          <form onSubmit={handleChangePassword}>
            {passwordMsg && (
              <div className="alert alert-success py-2">{passwordMsg}</div>
            )}
            {passwordErr && (
              <div className="alert alert-danger py-2">{passwordErr}</div>
            )}
            <div className="mb-3">
              <label className="form-label">Current password</label>
              <input
                type="password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">New password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm new password</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-outline-primary"
              disabled={savingPassword}
            >
              {savingPassword ? "Updating…" : "Change password"}
            </button>
          </form>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">
          Two-factor authentication (TOTP)
        </div>
        <div className="card-body">
          {twofaMsg && (
            <div className="alert alert-success py-2">{twofaMsg}</div>
          )}
          {twofaErr && (
            <div className="alert alert-danger py-2">{twofaErr}</div>
          )}

          {!twoFactorEnabled ? (
            <>
              <p className="small text-muted">
                Use an app like Google Authenticator or 1Password. After setup,
                you&apos;ll enter a code when signing in.
              </p>
              <button
                type="button"
                className="btn btn-outline-primary mb-3"
                disabled={twofaBusy}
                onClick={handleStart2FA}
              >
                {twofaBusy ? "Working…" : "Generate QR & secret"}
              </button>
              {twofaQr && (
                <div className="mb-3">
                  <img src={twofaQr} alt="2FA QR" className="border rounded p-2 bg-white" />
                  {twofaManual && (
                    <p className="small mt-2">
                      Manual key:{" "}
                      <code className="user-select-all">{String(twofaManual)}</code>
                    </p>
                  )}
                  <form onSubmit={handleEnable2FA} className="mt-3">
                    <label className="form-label">Enter 6-digit code to enable</label>
                    <input
                      className="form-control mb-2"
                      value={twofaEnableCode}
                      onChange={(e) =>
                        setTwofaEnableCode(e.target.value.replace(/\s/g, ""))
                      }
                      inputMode="numeric"
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={twofaBusy}
                    >
                      Enable 2FA
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleDisable2FA}>
              <p className="text-success small mb-2">Two-factor auth is on.</p>
              <div className="mb-2">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={disable2faPassword}
                  onChange={(e) => setDisable2faPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label">Authenticator code</label>
                <input
                  className="form-control"
                  value={disable2faCode}
                  onChange={(e) => setDisable2faCode(e.target.value.replace(/\s/g, ""))}
                  inputMode="numeric"
                  required
                />
              </div>
              <button type="submit" className="btn btn-outline-danger" disabled={twofaBusy}>
                Turn off 2FA
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="card shadow-sm mb-4 border-secondary">
        <div className="card-header bg-white fw-semibold">Your data (GDPR-style)</div>
        <div className="card-body">
          <p className="small text-muted">
            Export downloads a JSON copy of your profile, transactions, and debts.
            Deleting your account removes those records from this service (cannot be undone).
          </p>
          <button
            type="button"
            className="btn btn-outline-primary me-2 mb-2"
            disabled={exportBusy}
            onClick={handleExport}
          >
            {exportBusy ? "Preparing…" : "Download my data"}
          </button>

          <hr />
          <h6 className="text-danger">Delete account</h6>
          <form onSubmit={handleDeleteAccount}>
            {deleteErr && (
              <div className="alert alert-danger py-2">{deleteErr}</div>
            )}
            <div className="mb-2">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-2">
              <label className="form-label">Type DELETE to confirm</label>
              <input
                className="form-control"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={deleteBusy}
            >
              {deleteBusy ? "Deleting…" : "Permanently delete my account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
