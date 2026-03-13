import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_URL = `${API_BASE}/transactions`;

export interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export const getTransactions = async (
  token?: string
): Promise<Transaction[]> => {
  const authToken = token || localStorage.getItem("clearpath_token");

  const res = await axios.get<{ transactions: Transaction[] }>(API_URL, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  return res.data.transactions;
};

export const editTransaction = async (
  id: string,
  data: {
    amount?: number;
    description?: string;
    category?: string;
    reason: string;
  },
  token: string
): Promise<void> => {
  await axios.put(`${API_URL}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const deleteTransaction = async (
  id: string,
  reason: string,
  token: string
): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: { reason },
  });
};
