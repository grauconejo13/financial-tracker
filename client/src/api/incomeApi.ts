import axios from "axios";

const API_URL = "http://localhost:4000/api/income";

export interface IncomeRequest {
  amount: number;
  reason: string;
  date: string;
}

export interface Income {
    _id: string;
    amount: number;
    reason: string;
    date: string;
}

export interface IncomeResponse {
    _id: string;
    income: Income;
}

// Add income
export const addIncome = async (data: IncomeRequest) => {
  try {
    const response = await axios.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to add income";
  };
};

// Get all incomes
export const getIncomes = async (): Promise<Income[]> => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to fetch incomes";
  }
};

// Edit income
export const editIncome = async (id: string, data: IncomeRequest) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to update income";
  }
};

// Delete income
export const deleteIncome = async (id: string) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to delete income";
  }
};
