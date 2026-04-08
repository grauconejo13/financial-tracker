import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const API_URL = `${API_BASE}/api/goals`;

/**
 * Dynamic field for template-based goals
 */
export interface GoalField {
  key: string;
  value: any;
}

/**
 * Request sent to backend
 */
export interface GoalRequest {
  name: string;
  targetAmount: number;
  deadline: string;
  templateType?: string;
  fields?: GoalField[];
}

/**
 * Goal returned from backend
 */
export interface Goal {
  _id: string;
  name: string;
  targetAmount: number;
  contributedAmount: number;
  deadline: string;
  templateType?: string;
  fields?: GoalField[];
}

/**
 * Standard response
 */
export interface GoalResponse {
  message: string;
  goal: Goal;
}

// Create goal
export const createGoal = async (data: GoalRequest): Promise<GoalResponse> => {
  try {
    const res = await axios.post(API_URL, data);
    return res.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to create goal";
  }
};

// Get all goals
export const getGoals = async (): Promise<Goal[]> => {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to fetch goals";
  }
};

// Update goal
export const updateGoal = async (
  id: string,
  data: GoalRequest
): Promise<GoalResponse> => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to update goal";
  }
};

// Delete goal
export const deleteGoal = async (id: string): Promise<GoalResponse> => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to delete goal";
  }
};

// Contribute to goal
export const contributeToGoal = async (id: string, amount: number): Promise<{ message: string; goal: Goal }> => {
  try {
    const res = await axios.post(`${API_URL}/${id}/contribute`, { amount });
    return res.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to contribute to goal";
  }
};