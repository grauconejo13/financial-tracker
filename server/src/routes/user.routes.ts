import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as userController from '../controllers/user.controller';
import * as twoFactorController from '../controllers/twoFactor.controller';

const router = Router();

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/password', authenticate, userController.updatePassword);
router.post('/currency', authenticate, userController.saveCurrencyPreference);
router.get('/export', authenticate, userController.exportMyData);
router.post('/account/delete', authenticate, userController.deleteMyAccount);

router.post('/2fa/setup', authenticate, twoFactorController.setupTwoFactor);
router.post('/2fa/enable', authenticate, twoFactorController.enableTwoFactor);
router.post('/2fa/disable', authenticate, twoFactorController.disableTwoFactor);

export default router;
