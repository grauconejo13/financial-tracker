import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { errorHandler } from './middleware/error.middleware';
import transactionRoutes from './routes/transaction.routes';
import debtRoutes from './routes/debt.routes';
import authRoutes from './routes/auth.routes';
import incomeRoutes from './routes/income.routes';
import expenseRoutes from './routes/expense.routes';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/api/income', incomeRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/expense', expenseRoutes);

app.use(errorHandler);

export default app;

