import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as debtController from '../controllers/debt.controller';

const router = Router();

// POST /api/debts  (CP-08 create)
router.post('/', authenticate, debtController.createDebt);

// GET /api/debts  (CP-08 list)
router.get('/', authenticate, debtController.getMyDebts);

export default router;

