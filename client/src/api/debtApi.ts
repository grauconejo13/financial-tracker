import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_URL = `${API_BASE}/debts`;

export interface Debt {
  _id: string;
  label: string;
  counterparty?: string;
  amount: number;
  currency: string;
  direction: "owed_by_me" | "owed_to_me";
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

export interface DebtRequest {
  label: string;
  counterparty?: string;
  amount: number;
  currency?: string;
  direction?: "owed_by_me" | "owed_to_me";
  dueDate?: string;
  notes?: string;
}

export const getDebts = async (token: string): Promise<Debt[]> => {
  const res = await axios.get<{ debts: Debt[] }>(API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.debts;
};

export const addDebt = async (payload: DebtRequest, token: string): Promise<Debt> => {
  const res = await axios.post<{ debt: Debt }>(API_URL, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  return res.data.debt;
};

export const updateDebt = async (
  id: string,
  payload: Partial<DebtRequest>,
  token: string
): Promise<Debt> => {
  const res = await axios.put<{ debt: Debt }>(`${API_URL}/${id}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  return res.data.debt;
};

export const deleteDebt = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

