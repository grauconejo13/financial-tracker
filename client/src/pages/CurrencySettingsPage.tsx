import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { saveCurrency } from "../api/currencyApi";
import { PROFILE_CURRENCIES } from "../data/profileOptions";
import { normalizeUser } from "../utils/normalizeUser";

const CurrencySettingsPage = () => {
  const { token, user, setUserFromServer } = useAuth();
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (user?.preferredCurrency) {
      setCurrency(user.preferredCurrency);
    }
  }, [user?.preferredCurrency]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    setMessage(null);

    try {
      const data = await saveCurrency(currency, token);
      if (data?.user) {
        setUserFromServer(normalizeUser(data.user));
      }
      setMessage("Currency preference saved.");
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setMessage(e.response?.data?.message || "Failed to save currency");
      } else {
        setMessage("Failed to save currency");
      }
    } finally {
      setSaving(false); // ✅ FIX
    }
  };

  return (
    <div className="container py-4">
      <h2>Home Currency</h2>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="mb-3">
        <label className="form-label">Select Currency</label>

        <select
          className="form-select"
          value={currency}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setCurrency(e.target.value)
          }
        >
          {PROFILE_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Currency"}
      </button>
    </div>
  );
};

export default CurrencySettingsPage;
