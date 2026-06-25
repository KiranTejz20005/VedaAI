import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import {
  getMe,
  updateProfile,
  updatePreferences,
  updateOrganization,
  getAvailableOrganizations,
  getPublicOrganizations,
  switchOrganization,
  getSessions,
  revokeSessionById,
  changePassword,
  getStorageUsage,
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
router.get('/public-organizations', asyncHandler(getPublicOrganizations));
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

router.get('/me/sessions', asyncHandler(getSessions));
router.delete('/me/sessions/:id', asyncHandler(revokeSessionById));
router.put('/me/password', asyncHandler(changePassword));
router.get('/me/storage', asyncHandler(getStorageUsage));

export default router;
