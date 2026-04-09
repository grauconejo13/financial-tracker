import type { CorsOptions } from 'cors';
import { ENV } from './env';

/**
 * Static allowlist + env (CORS_ORIGINS) + any Vercel deployment (*.vercel.app)
 * so POST/PUT from production and preview URLs work without redeploying the API
 * for every new preview subdomain.
 */
const STATIC = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://financial-tracker-kappa-wine.vercel.app',
  ...ENV.CORS_ORIGINS
]);

const VERCEL_APP = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const LOCALHOST = /^http:\/\/localhost:\d+$/;
const LOOPBACK = /^http:\/\/127\.0\.0\.1:\d+$/;

export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (STATIC.has(origin)) return true;
  if (VERCEL_APP.test(origin)) return true;
  if (LOCALHOST.test(origin) || LOOPBACK.test(origin)) return true;
  return false;
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (isAllowedCorsOrigin(origin)) {
      callback(null, origin);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
};
