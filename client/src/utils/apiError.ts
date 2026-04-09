import axios from "axios";
import { getApiOrigin } from "../config/apiOrigin";

function explainNetworkFailure(): string {
  const origin = getApiOrigin();

  if (typeof window !== "undefined") {
    const pageIsHttps = window.location.protocol === "https:";
    const apiIsHttp = origin.startsWith("http:");

    if (pageIsHttps && apiIsHttp) {
      return (
        "This page is HTTPS (Vercel) but your API URL uses HTTP. Browsers block that. " +
        "In Vercel set VITE_API_URL to your API’s HTTPS address (e.g. https://your-api.onrender.com), then redeploy."
      );
    }
  }

  if (import.meta.env.PROD && /localhost|127\.0\.0\.1/i.test(origin)) {
    return (
      "This build is still using localhost for the API. In Vercel → Settings → Environment Variables, " +
      "set VITE_API_URL to your live API (https://…), save, and redeploy."
    );
  }

  return `Could not reach the API at ${origin}. Check that the server is up, ` +
    `VITE_API_URL is correct for this deployment, and CORS allows this site.`;
}

/** User-visible message from a failed API call. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data) {
      const m = (data as { message: unknown }).message;
      if (typeof m === "string" && m.trim()) return m;
    }
    if (error.code === "ERR_NETWORK" || error.message === "Network Error" || !error.response) {
      return explainNetworkFailure();
    }
    if (error.response?.status === 404) {
      return "API not found (404). Redeploy the server so routes match this app version.";
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
