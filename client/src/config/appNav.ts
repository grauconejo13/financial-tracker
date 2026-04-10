import type { IconType } from "react-icons";
import {
  MdDashboard,
  MdTrendingUp,
  MdTrendingDown,
  MdReceiptLong,
  MdSavings,
  MdCurrencyExchange,
  MdHistory,
} from "react-icons/md";
import {
  FaGhost,
  FaCreditCard,
  FaWallet,
} from "react-icons/fa";

export type AppNavItem = {
  to: string;
  label: string;
  Icon: IconType;
};

/** Primary app navigation (sidebar + mobile drawer) */
export const MAIN_NAV_ITEMS: AppNavItem[] = [
  { to: "/dashboard", label: "Dashboard", Icon: MdDashboard },
  { to: "/budget", label: "Budget", Icon: FaWallet },
  { to: "/ghost", label: "Ghost", Icon: FaGhost },
  { to: "/income", label: "Income", Icon: MdTrendingUp },
  { to: "/expense", label: "Expenses", Icon: MdTrendingDown },
  { to: "/transactions", label: "Transactions", Icon: MdReceiptLong },
  { to: "/accountability", label: "Accountability", Icon: MdHistory },
  { to: "/debts", label: "Debts", Icon: FaCreditCard },
  { to: "/savings", label: "Savings", Icon: MdSavings },
  { to: "/currency-settings", label: "Currency", Icon: MdCurrencyExchange },
];
