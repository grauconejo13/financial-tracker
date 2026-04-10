import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";

const API_URL = `${getApiOrigin()}/api/expense`;

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("clearpath_token")}`,
  },
});

export interface ExpenseRequest {
  amount: number;
  category: string;
  classification: "Necessary" | "Avoidable";
  reason: string;
  date: string;
}

export interface Expense {
  _id: string;
  amount: number;
  category: string;
  classification: "Necessary" | "Avoidable";
  reason: string;
  date: string;
}

export const addExpense = async (data: ExpenseRequest) => {
  try {
    const response = await axios.post(API_URL, data, getAuthHeaders());
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data?.message || "Failed to add expense";
    }

    throw "Something went wrong";
  }
};

//Get all expenses
export const getExpenses = async (): Promise<Expense[]> => {
  const response = await axios.get<Expense[]>(API_URL, getAuthHeaders());
  return response.data;
};

//Delete expense
export const deleteExpense = async (id: string) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
  return response.data;
};

//Update expense
export const updateExpense = async (id: string, data: ExpenseRequest) => {
  const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
  return response.data;
};