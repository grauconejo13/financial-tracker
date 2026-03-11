import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware';
import transactionRoutes from './routes/transaction.routes';
import debtRoutes from './routes/debt.routes';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/debts', debtRoutes);

app.use(errorHandler);

export default app;

