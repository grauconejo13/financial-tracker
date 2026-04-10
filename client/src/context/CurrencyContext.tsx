import { createContext, useContext, useState } from "react";

type CurrencyContextType = {
  currency: string;
  rate: number;
  setCurrencyData: (currency: string, rate: number) => void;
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider = ({ children }: any) => {
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);

  const setCurrencyData = (currency: string, rate: number) => {
    setCurrency(currency);
    setRate(rate);
  };

  return (
    <CurrencyContext.Provider value={{ currency, rate, setCurrencyData }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  return useContext(CurrencyContext)!;
};
