import app from './app';
import { ENV } from './config/env';
import { connectDB } from './config/db';

const start = async () => {
  try {
    await connectDB();
    const port = Number(ENV.PORT) || 8080;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
};

void start();
