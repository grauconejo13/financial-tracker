import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";

const API_URL = `${getApiOrigin()}/api/accountability`;

export type AccountabilityAction =
  | "transaction_create"
  | "transaction_edit"
  | "transaction_delete";

export type AccountabilityLog = {
  _id: string;
  user: string;
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
