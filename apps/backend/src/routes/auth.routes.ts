import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import {
  getMe,
  updateProfile,
  updatePreferences,
  updateInstitution,
  signup,
  login,
  refresh,
  logout,
  completeOnboarding,
  acceptInvite,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public auth endpoints
router.post('/signup', asyncHandler(signup));
router.post('/accept-invite', asyncHandler(acceptInvite));
router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));

// Protected auth endpoints
router.use(authenticate);

router.get('/me', asyncHandler(getMe));
router.post('/onboarding/complete', asyncHandler(completeOnboarding));
router.put('/me', asyncHandler(updateProfile));
router.put('/me/profile', asyncHandler(updateProfile));
router.put('/me/preferences', asyncHandler(updatePreferences));
router.put('/me/institution', asyncHandler(updateInstitution));

export default router;
