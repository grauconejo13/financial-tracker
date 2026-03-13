import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as transactionController from '../controllers/transaction.controller';

const router = Router();

// GET /api/transactions  - list current user's non-deleted transactions
router.get('/', authenticate, transactionController.getMyTransactions);

// PUT /api/transactions/:id  - edit transaction (CP-06)
router.put('/:id', authenticate, transactionController.editTransaction);

// DELETE /api/transactions/:id  (CP-07)
router.delete('/:id', authenticate, transactionController.deleteTransaction);

export default router;

