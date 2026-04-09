import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as accountabilityController from '../controllers/accountability.controller';

const router = Router();

router.get('/', authenticate, accountabilityController.getMyAccountabilityLogs);

export default router;
