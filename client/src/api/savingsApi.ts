import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";

const API_URL = `${getApiOrigin()}/api/savings`;

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("clearpath_token")}`,
  },
});

export const getSavings = async () => {
  const res = await axios.get(API_URL, getAuthHeaders());
  return res.data;
};

export const addSavings = async (amount: number) => {
  const res = await axios.post(`${API_URL}/add`, { amount }, getAuthHeaders());
  return res.data;
};

export const withdrawSavings = async (amount: number, reason: string) => {
  const res = await axios.post(`${API_URL}/withdraw`, {
    amount,
    reason,
  }, getAuthHeaders());
  return res.data;
};
