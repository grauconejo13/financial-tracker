import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";

const API_URL = `${getApiOrigin()}/api/accountability`;

export type AccountabilityAction =
  | "transaction_create"
  | "transaction_edit"
  | "transaction_delete"
  | "debt_create"
  | "debt_edit"
  | "debt_delete"
  | "debt_payment"
  | "income_create"
  | "income_edit"
  | "income_delete"
  | "expense_create"
  | "expense_edit"
  | "expense_delete"
  | "goal_create"
  | "goal_edit"
  | "goal_delete"
  | "goal_contribution"
  | "savings_deposit"
  | "savings_withdraw"
  | "profile_update"
  | "password_change"
  | "currency_change"
  | "semester_set"
  | "login"
  | "login_2fa"
  | "logout"
  | "two_factor_setup"
  | "two_factor_enable"
  | "two_factor_disable"
  | "password_reset_requested"
  | "password_reset_completed";

export type AccountabilityLog = {
  _id: string;
  user: string | { _id?: string; name?: string; email?: string };
  action: AccountabilityAction;
  entityType: string;
  entityId: string;
  reason: string;
  detail?: Record<string, unknown>;
  createdAt: string;
};

export const getAccountabilityLogs = async (
  token: string,
): Promise<AccountabilityLog[]> => {
  const res = await axios.get<{ logs: AccountabilityLog[] }>(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.logs;
};
