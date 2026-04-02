import axios from "axios";
import type { GhostOverview } from "../types/dashboard.types";

const API_URL = `${import.meta.env.VITE_API_URL}/api/ghost/overview`;

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${
      localStorage.getItem("clearpath_token") || localStorage.getItem("token") || ""
    }`,
  },
});

export const fetchGhostOverview = async (): Promise<GhostOverview> => {
  const response = await axios.get<GhostOverview>(API_URL, getAuthHeaders());
  return response.data;
};
