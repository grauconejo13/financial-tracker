import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '4000',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/clearpath',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me'
};

