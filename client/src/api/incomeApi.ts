import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";

const API_URL = `${getApiOrigin()}/api/income`;

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
  const token = localStorage.getItem("clearpath_token");

  try {
    const response = await axios.post(API_URL, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data?.message || "Failed to add income";
    }
    throw "Failed to add income";
  }
};

// Get all incomes
export const getIncomes = async (): Promise<Income[]> => {
  const token = localStorage.getItem("clearpath_token");

  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data?.message || "Failed to fetch income";
    }
    throw "Something went wrong";
  }
};

// Edit income
export const editIncome = async (id: string, data: IncomeRequest) => {
  const token = localStorage.getItem("clearpath_token");

  try {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data?.message || "Failed to update income";
    }
    throw "Something went wrong";
  }
};

// Delete income
export const deleteIncome = async (id: string) => {
  const token = localStorage.getItem("clearpath_token");

  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data?.message || "Failed to delete income";
    }
    throw "Something went wrong";
  }
};