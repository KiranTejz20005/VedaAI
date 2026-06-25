import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import * as SuperAdminController from '../controllers/super-admin.controller';
import * as SettingsController from '../controllers/settings.controller';
import prisma from '../config/prisma';

const router = Router();

// Protect all super-admin routes
router.use(authenticate, authorize(['SUPER_ADMIN']), requirePermission('MANAGE_SYSTEM'));

// Dashboard Stats
router.get('/dashboard/stats', asyncHandler(async (_req, res) => {
  const [totalOrganizations, totalUsers, securityAlerts] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.auditLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const activeSessions = Math.floor(totalUsers * 0.1); // Placeholder
  const apiUsage = 84; // Placeholder
  const systemUptime = 99.99; // Placeholder

  res.json({
    success: true,
    data: {
      totalOrganizations,
      totalUsers,
      activeSessions,
      apiUsage,
      systemUptime,
      securityAlerts,
    },
  });
}));

// Organization Management
router.post('/organizations', SuperAdminController.createOrganization);
router.get('/organizations', SuperAdminController.getOrganizations);
router.get('/organizations/:id', SuperAdminController.getOrganizationById);
router.put('/organizations/:id', SuperAdminController.updateOrganization);
router.post('/organizations/:id/update', SuperAdminController.updateOrganization);
router.delete('/organizations/:id', SuperAdminController.deleteOrganization);
router.post('/organizations/:id/suspend', SuperAdminController.suspendOrganization);

// Admin Assignment
router.post('/organizations/:id/assign-admin', SuperAdminController.assignOrganizationAdmin);

// Organization Users
router.get('/organizations/:id/users', SuperAdminController.getOrganizationUsers);

// All Users (across all organizations)
router.get('/users', SuperAdminController.getAllUsers);

// Organization Subscription
router.get('/organizations/:id/subscription', SuperAdminController.getOrganizationSubscriptions);
router.put('/organizations/:id/subscription', SuperAdminController.updateOrganizationSubscription);

// Platform Analytics
router.get('/analytics', SuperAdminController.getPlatformAnalytics);

// Global Settings
router.get('/settings', SettingsController.getSettings);
router.put('/settings', SettingsController.updateSettings);

// Integrations
router.get('/integrations', SettingsController.getIntegrations);

export default router;
