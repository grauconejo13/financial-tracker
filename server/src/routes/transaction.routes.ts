import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as transactionController from '../controllers/transaction.controller';

const router = Router();

router.get(
  '/categories',
  authenticate,
  transactionController.getMyTransactionCategories
);

router.post('/', authenticate, transactionController.createTransaction);

router.get('/', authenticate, transactionController.getMyTransactions);

router.put('/:id', authenticate, transactionController.editTransaction);

router.delete('/:id', authenticate, transactionController.deleteTransaction);

export default router;
