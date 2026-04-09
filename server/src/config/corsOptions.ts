import type { Request, Response, NextFunction } from 'express';
import { ENV } from './env';

/**
 * Static allowlist + env (CORS_ORIGINS) + any *.vercel.app host.
 */
const STATIC = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://financial-tracker-kappa-wine.vercel.app',
  ...ENV.CORS_ORIGINS
]);

/** Any deployment on Vercel (prod, previews, branch URLs). */
const VERCEL_APP = /^https:\/\/[^\s/]+\.vercel\.app$/i;
const LOCALHOST = /^http:\/\/localhost:\d+$/;
const LOOPBACK = /^http:\/\/127.0.0.1:\d+$/;

const ALLOW_METHODS = 'GET,POST,PUT,DELETE,OPTIONS,PATCH';
const ALLOW_HEADERS =
  'Authorization,Content-Type,X-Requested-With,Accept,Origin';

export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (STATIC.has(origin)) return true;
  if (VERCEL_APP.test(origin)) return true;
  if (LOCALHOST.test(origin) || LOOPBACK.test(origin)) return true;
  return false;
}

/**
 * Explicit CORS (replaces cors package) so preflight + Authorization always get
 * the right headers on Render and other proxies.
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.get('Origin') ?? undefined;

  if (origin && isAllowedCorsOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    if (origin && isAllowedCorsOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Methods', ALLOW_METHODS);
      res.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS);
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }
    return res.status(403).end();
  }

  next();
}
