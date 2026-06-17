import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { getMe, updateProfile, updatePreferences, updateInstitution } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/me', asyncHandler(getMe));
router.put('/me', asyncHandler(updateProfile));
router.put('/me/profile', asyncHandler(updateProfile));
router.put('/me/preferences', asyncHandler(updatePreferences));
router.put('/me/institution', asyncHandler(updateInstitution));

export default router;
