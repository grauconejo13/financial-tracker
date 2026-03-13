import axios from "axios";

const API_URL = "http://localhost:4000/api/transactions";

export interface TransactionItem {
  _id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export const getTransactions = async (): Promise<TransactionItem[]> => {
  try {
    const token = localStorage.getItem("clearpath_token");

    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.transactions;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to fetch transactions";
  }
};