export const currencyLabelMap: Record<string, string> = {
  USD: "US Dollar",
  CAD: "Canadian Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  AUD: "Australian Dollar"
};

export const getCurrencyLabel = (code: string) => {
  return currencyLabelMap[code] || code;
};
