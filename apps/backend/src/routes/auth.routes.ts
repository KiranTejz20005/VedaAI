import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import {
  getMe,
  updateProfile,
  updatePreferences,
  updateOrganization,
  getAvailableOrganizations,
  switchOrganization,
  signup,
  login,
  refresh,
  logout,
  completeOnboarding,
  acceptInvite,
  ssoLogin,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public auth endpoints
router.post('/signup', asyncHandler(signup));
router.post('/accept-invite', asyncHandler(acceptInvite));
router.post('/login', asyncHandler(login));
router.post('/sso', asyncHandler(ssoLogin));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));

// Protected auth endpoints
router.use(authenticate);

router.get('/me', asyncHandler(getMe));
router.post('/onboarding/complete', asyncHandler(completeOnboarding));
router.put('/me', asyncHandler(updateProfile));
router.put('/me/profile', asyncHandler(updateProfile));
router.put('/me/preferences', asyncHandler(updatePreferences));
router.get('/me/organizations', asyncHandler(getAvailableOrganizations));
router.post('/me/switch-organization', asyncHandler(switchOrganization));
router.put('/me/organization', asyncHandler(updateOrganization));

export default router;
