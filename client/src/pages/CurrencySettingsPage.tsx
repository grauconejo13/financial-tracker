import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { saveCurrency } from "../api/currencyApi";

const CURRENCIES = [
  { code: "USD", label: "🇺🇸 USD – US Dollar" },
  { code: "EUR", label: "🇪🇺 EUR – Euro" },
  { code: "GBP", label: "🇬🇧 GBP – British Pound" },
  { code: "JPY", label: "🇯🇵 JPY – Japanese Yen" },
  { code: "CAD", label: "🇨🇦 CAD – Canadian Dollar" },
];

const CurrencySettingsPage = () => {
  const { token } = useAuth();
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    setMessage(null);

    try {
      await saveCurrency(currency, token);
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
          {CURRENCIES.map((c) => (
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
