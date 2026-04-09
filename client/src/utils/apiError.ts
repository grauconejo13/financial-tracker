import axios from 'axios';

/** User-visible message from a failed API call. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const m = (data as { message: unknown }).message;
      if (typeof m === 'string' && m.trim()) return m;
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Network error: is the API running and VITE_API_URL correct for this build?';
    }
    if (error.response?.status === 404) {
      return 'API not found (404). Redeploy the server so routes match this app version.';
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
