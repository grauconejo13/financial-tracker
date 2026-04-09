/**
 * Backend origin only (e.g. http://localhost:4000), no trailing slash, no `/api`.
 * Accepts `VITE_API_URL` as either the origin or `.../api` and normalizes.
 */
export function getApiOrigin(): string {
  let base =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    "http://localhost:4000";
  base = base.trim().replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }
  return base;
}
