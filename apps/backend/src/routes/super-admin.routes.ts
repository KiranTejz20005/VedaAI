import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import * as SuperAdminController from '../controllers/super-admin.controller';

const router = Router();

// Protect all super-admin routes
router.use(authenticate, requirePermission('MANAGE_SYSTEM'));

// Organization Management
router.post('/organizations', SuperAdminController.createOrganization);
router.get('/organizations', SuperAdminController.getOrganizations);
router.get('/organizations/:id', SuperAdminController.getOrganizationById);
router.put('/organizations/:id', SuperAdminController.updateOrganization);
router.delete('/organizations/:id', SuperAdminController.deleteOrganization);
router.post('/organizations/:id/suspend', SuperAdminController.suspendOrganization);

// Admin Assignment
router.post('/organizations/:id/assign-admin', SuperAdminController.assignOrganizationAdmin);

// Organization Users
router.get('/organizations/:id/users', SuperAdminController.getOrganizationUsers);

// Organization Subscription
router.get('/organizations/:id/subscription', SuperAdminController.getOrganizationSubscriptions);
router.put('/organizations/:id/subscription', SuperAdminController.updateOrganizationSubscription);

// Platform Analytics
router.get('/platform/analytics', SuperAdminController.getPlatformAnalytics);

export default router;
