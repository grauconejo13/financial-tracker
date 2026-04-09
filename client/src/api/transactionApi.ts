import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";

const API_URL = `${getApiOrigin()}/api/transactions`;

export interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TransactionFilters = {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
};

export const getTransactions = async (
  token?: string,
  filters?: TransactionFilters,
): Promise<Transaction[]> => {
  const authToken = token || localStorage.getItem("clearpath_token");

  if (!authToken) {
    throw new Error("No auth token found");
  }

  const params = new URLSearchParams();
  if (filters?.category?.trim()) params.set("category", filters.category.trim());
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  const qs = params.toString();
  const url = qs ? `${API_URL}?${qs}` : API_URL;

  try {
    const res = await axios.get<{ transactions: Transaction[] }>(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return res.data.transactions;
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }
};

export const getTransactionCategories = async (
  token?: string,
): Promise<string[]> => {
  const authToken = token || localStorage.getItem("clearpath_token");
  if (!authToken) throw new Error("No auth token found");
  const res = await axios.get<{ categories: string[] }>(
    `${API_URL}/categories`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    },
  );
  return res.data.categories;
};

export const editTransaction = async (
  id: string,
  data: {
    amount?: number;
    description?: string;
    category?: string;
    reason: string;
  },
  token: string,
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
  token: string,
): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: { reason },
  });
};

export const createTransaction = async (
  body: {
    type: "income" | "expense";
    amount: number;
    description: string;
    category?: string;
    reason: string;
  },
  token: string,
): Promise<Transaction> => {
  const res = await axios.post<{ transaction: Transaction }>(API_URL, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.data.transaction;
};
