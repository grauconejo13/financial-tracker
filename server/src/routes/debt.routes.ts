import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as debtController from '../controllers/debt.controller';

const router = Router();

router.get('/', authenticate, debtController.getMyDebts);
router.post('/', authenticate, debtController.createDebt);
router.put('/:id', authenticate, debtController.updateDebt);
router.delete('/:id', authenticate, debtController.deleteDebt);

export default router;

