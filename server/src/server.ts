import 'dotenv/config';
import { connectDB } from './config/db.js';
import app from './app.js';
import { env } from './config/env.js';

// Start server first so it responds even while DB connects
app.listen(env.PORT, () => {
  console.log(`ClearPath API running on port ${env.PORT}`);
  connectDB().catch((err) => {
    console.error('MongoDB connection failed. Register/Login will not work until MongoDB is running:', err.message);
    console.log('Tip: Install MongoDB locally or use MongoDB Atlas (free): https://www.mongodb.com/atlas');
  });
});
