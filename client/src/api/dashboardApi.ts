import axios from "axios";
import type { DashboardSummary } from "../types/dashboard.types";

const API_URL = `${import.meta.env.VITE_API_URL}/api/dashboard/summary`;

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("clearpath_token") || localStorage.getItem("token") || ""}`,
  },
});

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await axios.get<DashboardSummary>(API_URL, getAuthHeaders());
  return response.data;
};
