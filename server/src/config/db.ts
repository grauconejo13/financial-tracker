import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error', err);
    process.exit(1);
  }
};

