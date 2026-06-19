import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import * as SuperAdminController from '../controllers/super-admin.controller';

const router = Router();

// Protect all super-admin routes
router.use(authenticate, requirePermission('MANAGE_SYSTEM'));

// Institution Management
router.post('/institutions', SuperAdminController.createInstitution);
router.get('/institutions', SuperAdminController.getInstitutions);
router.get('/institutions/:id', SuperAdminController.getInstitutionById);
router.put('/institutions/:id', SuperAdminController.updateInstitution);
router.delete('/institutions/:id', SuperAdminController.deleteInstitution);
router.post('/institutions/:id/suspend', SuperAdminController.suspendInstitution);

// Admin Assignment
router.post('/institutions/:id/assign-admin', SuperAdminController.assignInstitutionAdmin);

// Platform Analytics
router.get('/platform/analytics', SuperAdminController.getPlatformAnalytics);

export default router;
