import { Router } from 'express';
import { getTemplates } from '../controllers/template.controller';

const router = Router();

/** Public read-only templates (e.g. Savings goals) */
router.get('/', getTemplates);

export default router;
