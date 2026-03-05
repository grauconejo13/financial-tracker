import dotenv from 'dotenv';
dotenv.config();

export const env = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/clearpath',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  PORT: parseInt(process.env.PORT || '8080', 10),
};