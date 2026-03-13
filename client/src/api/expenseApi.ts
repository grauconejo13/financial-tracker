import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_URL = `${API_BASE}/expense`;

export interface ExpenseRequest {
  amount: number;
  category: string;
  classification: "Necessary" | "Avoidable";
  reason: string;
  date: string;
}

export const addExpense = async (data: ExpenseRequest) => {
  try {
    const response = await axios.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to add expense";
  }
};
