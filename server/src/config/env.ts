import dotenv from 'dotenv';

dotenv.config();

/** Comma-separated browser origins (Vercel prod, previews, custom domains). */
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const ENV = {
  PORT: process.env.PORT || '8080',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  CORS_ORIGINS,
};

