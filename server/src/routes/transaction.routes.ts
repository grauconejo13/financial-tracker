import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as transactionController from '../controllers/transaction.controller';

const router = Router();

// DELETE /api/transactions/:id  (CP-07)
router.put('/:id', authenticate, transactionController.editTransaction);

// DELETE /api/transactions/:id  (CP-07)
router.delete('/:id', authenticate, transactionController.deleteTransaction);

export default router;

