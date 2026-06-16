import { Router } from 'express';
import { getMe, updateProfile, updatePreferences } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.put('/me/profile', updateProfile);
router.put('/me/preferences', updatePreferences);

export default router;
