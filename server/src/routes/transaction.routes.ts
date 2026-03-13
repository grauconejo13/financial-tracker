import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as transactionController from '../controllers/transaction.controller';

const router = Router();

// GET /api/transactions  (CP-13)
router.get('/', authenticate, transactionController.getTransactions);

// PUT /api/transactions/:id  (CP-07)
router.put('/:id', authenticate, transactionController.editTransaction);

// DELETE /api/transactions/:id  (CP-07)
router.delete('/:id', authenticate, transactionController.deleteTransaction);

export default router;

