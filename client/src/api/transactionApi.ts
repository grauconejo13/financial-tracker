import axios from "axios";
import {getIncomes} from "./incomeApi";
import { getExpenses } from "./expenseApi";
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
  sortBy?: "date" | "amount";
  sortOrder?: "asc" | "desc";
};

export const getTransactions = async (
  filters?: TransactionFilters,
): Promise<Transaction[]> => {
  try {
    const [incomes, expenses] = await Promise.all([
      getIncomes(),
      getExpenses(),
    ]);

    const normalizedIncomes: Transaction[] = incomes.map((i: any) => ({
      _id: i._id || i.id,
      amount: i.amount,
      description: i.description || "Income",
      category: i.category,
      createdAt: i.date,
      type: "income",
    }));

    const normalizedExpenses: Transaction[] = expenses.map((e) => ({
      _id: e._id,
      amount: e.amount,
      description: e.reason || "Expense",
      category: e.category,
      createdAt: e.date,
      type: "expense",
    }));

    let combined = [...normalizedIncomes, ...normalizedExpenses];

    // ✅ Apply filters
    if (filters) {
      combined = combined.filter((tx) => {
        if (filters.category?.trim() && tx.category !== filters.category) {
          return false;
        }

        if (filters.dateFrom && tx.createdAt < filters.dateFrom) {
          return false;
        }

        if (filters.dateTo && tx.createdAt > filters.dateTo) {
          return false;
        }

        return true;
      });
    }

    const sortBy = filters?.sortBy || "date";
    const sortOrder = filters?.sortOrder || "desc";

    combined.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "date") {
        comparison =
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime();
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return combined;
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

  const res = await axios.get(`${getApiOrigin()}/api/admin/categories`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  // map Category objects → names
  return res.data.map((c: any) => c.name);
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
