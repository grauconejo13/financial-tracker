import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";
import type { DashboardSummary } from "../types/dashboard.types";
import { buildDashboardSummaryFallback } from "./ghostFallback";

const API_URL = `${getApiOrigin()}/api/dashboard`;

export async function fetchDashboardSummary(token?: string): Promise<DashboardSummary> {
  const authToken = token || localStorage.getItem("clearpath_token");
  if (!authToken) throw new Error("No auth token found");

  try {
    const res = await axios.get<DashboardSummary>(`${API_URL}/summary`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return res.data;
  } catch (error) {
    // Backward-compatible fallback when deployed API has not received dashboard endpoints yet.
    return buildDashboardSummaryFallback();
  }
}
