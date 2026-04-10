import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";
import type { GhostOverview } from "../types/dashboard.types";
import { buildGhostOverviewFallback } from "./ghostFallback";

const API_URL = `${getApiOrigin()}/api/ghost`;

export async function fetchGhostOverview(token?: string): Promise<GhostOverview> {
  const authToken = token || localStorage.getItem("clearpath_token");
  if (!authToken) throw new Error("No auth token found");

  try {
    const res = await axios.get<GhostOverview>(`${API_URL}/overview`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return res.data;
  } catch (error) {
    // Backward-compatible fallback when deployed API has not received ghost endpoints yet.
    return buildGhostOverviewFallback();
  }
}
