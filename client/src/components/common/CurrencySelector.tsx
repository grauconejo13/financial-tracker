import { useCurrency } from "../../context/CurrencyContext";

export default function CurrencySelector() {
  const { setCurrencyData } = useCurrency();

  const handleChange = async (currency: string) => {
    const res = await fetch("/api/user/currency", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency })
    });

    // re-fetch updated rate
    const rateRes = await fetch("/api/transactions");
    const rateData = await rateRes.json();

    setCurrencyData(rateData.currency, rateData.rate);
  };

  return (
    <select onChange={(e) => handleChange(e.target.value)}>
      <option value="USD">USD</option>
      <option value="CAD">CAD</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
      <option value="JPY">JPY</option>
      <option value="AUD">AUD</option>
    </select>
  );
}
