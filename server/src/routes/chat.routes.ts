import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import * as chatController from '../controllers/chat.controller';

const router = Router();

router.post('/', optionalAuthenticate, chatController.chat);

export default router;
