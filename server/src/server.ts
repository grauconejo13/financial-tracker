import app from './app';
import { ENV } from './config/env';
import { connectDB } from './config/db';

const start = async () => {
  await connectDB();

  const port = Number(ENV.PORT) || 4000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${port}`);
  });
};

start();

