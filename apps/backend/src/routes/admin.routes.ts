import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Enforce auth and admin role requirements
router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN', 'INSTITUTION_ADMIN']));

// ── 1. Institution Management ──
router.get('/institutions', asyncHandler(AdminController.getInstitutions));
router.post('/institutions', asyncHandler(AdminController.createInstitution));
router.put('/institutions/:id', asyncHandler(AdminController.updateInstitution));
router.delete('/institutions/:id', asyncHandler(AdminController.deleteInstitution));
router.put('/institutions/:id/suspend', asyncHandler(AdminController.suspendInstitution));
router.get('/institutions/:id/analytics', asyncHandler(AdminController.getInstitutionAnalytics));

// ── 2. Department Management ──
router.get('/departments', asyncHandler(AdminController.getDepartments));
router.post('/departments', asyncHandler(AdminController.createDepartment));
router.put('/departments/:id', asyncHandler(AdminController.updateDepartment));
router.delete('/departments/:id', asyncHandler(AdminController.archiveDepartment));
router.post('/departments/:id/assign-hod', asyncHandler(AdminController.assignHOD));
router.post('/departments/transfer-faculty', asyncHandler(AdminController.transferFaculty));

// ── 3. User Management ──
router.get('/users', asyncHandler(AdminController.getUsers));
router.post('/users', asyncHandler(AdminController.createUser));
router.put('/users/:id', asyncHandler(AdminController.updateUser));
router.delete('/users/:id', asyncHandler(AdminController.deleteUser));
router.put('/users/:id/suspend', asyncHandler(AdminController.suspendUser));
router.post('/users/:id/reset-password', asyncHandler(AdminController.resetPassword));
router.post('/users/:id/impersonate', asyncHandler(AdminController.impersonateUser));
router.post('/users/self/reset-password-force', asyncHandler(AdminController.forceResetOwnPassword));

// ── 4. Role & Permission Management ──
router.get('/roles', asyncHandler(AdminController.getRoles));
router.post('/roles', asyncHandler(AdminController.createRole));
router.put('/roles/:id', asyncHandler(AdminController.updateRole));
router.delete('/roles/:id', asyncHandler(AdminController.deleteRole));
router.get('/permissions', asyncHandler(AdminController.getPermissions));
router.post('/roles/:id/permissions', asyncHandler(AdminController.assignPermissions));

// ── 5. Class Management ──
router.get('/classes', asyncHandler(AdminController.getClasses));
router.post('/classes', asyncHandler(AdminController.createClass));
router.put('/classes/:id', asyncHandler(AdminController.updateClass));
router.delete('/classes/:id', asyncHandler(AdminController.deleteClass));
router.post('/classes/:id/assign-faculty', asyncHandler(AdminController.assignClassFaculty));
router.post('/classes/:id/assign-students', asyncHandler(AdminController.assignClassStudents));
router.get('/classes/:id/analytics', asyncHandler(AdminController.getClassAnalytics));

// ── 6. Group Management ──
router.get('/groups', asyncHandler(AdminController.getGroups));
router.post('/groups', asyncHandler(AdminController.createGroup));
router.put('/groups/:id', asyncHandler(AdminController.updateGroup));
router.delete('/groups/:id', asyncHandler(AdminController.deleteGroup));
router.post('/groups/:id/assign-faculty', asyncHandler(AdminController.assignGroupFaculty));
router.post('/groups/:id/assign-students', asyncHandler(AdminController.assignGroupStudents));
router.post('/groups/:id/import', asyncHandler(AdminController.importGroupStudents));
router.post('/groups/:id/assign-papers', asyncHandler(AdminController.assignGroupPapers));

// ── 7. Paper Management ──
router.get('/papers', asyncHandler(AdminController.getPapers));
router.put('/papers/:id/archive', asyncHandler(AdminController.archivePaper));
router.delete('/papers/:id', asyncHandler(AdminController.deletePaper));
router.post('/papers/:id/regenerate', asyncHandler(AdminController.regeneratePaper));
router.post('/papers/:id/reassign', asyncHandler(AdminController.reassignPaper));
router.get('/papers/analytics/stats', asyncHandler(AdminController.getPaperAnalytics));

// ── 8. Question Bank Management ──
router.get('/question-bank', asyncHandler(AdminController.getQuestionBank));
router.put('/question-bank/:id', asyncHandler(AdminController.editQuestion));
router.delete('/question-bank/:id', asyncHandler(AdminController.deleteQuestion));
router.post('/question-bank/bulk-import', asyncHandler(AdminController.bulkImportQuestions));
router.post('/question-bank/:id/tag', asyncHandler(AdminController.tagQuestion));

// ── 9. Assignment Management ──
router.get('/assignments', asyncHandler(AdminController.getAssignments));
router.post('/assignments/:id/reassign', asyncHandler(AdminController.reassignAssignment));
router.put('/assignments/:id/close', asyncHandler(AdminController.closeAssignment));
router.put('/assignments/:id/reopen', asyncHandler(AdminController.reopenAssignment));
router.get('/assignments/:id/export', asyncHandler(AdminController.exportAssignmentResults));

// ── 10. Analytics Dashboard ──
router.get('/analytics', asyncHandler(AdminController.getAnalytics));

// ── 11. Audit Logs ──
router.get('/audit', asyncHandler(AdminController.getAuditLogs));

// ── 12. Billing & Subscription Management ──
router.get('/billing/subscriptions', asyncHandler(AdminController.getBillingSubscriptions));
router.get('/billing/subscriptions/:institutionId', asyncHandler(AdminController.getSubscription));
router.put('/billing/subscriptions/:institutionId', asyncHandler(AdminController.updateSubscription));
router.get('/billing/invoices/:subscriptionId', asyncHandler(AdminController.getSubscriptionInvoices));
router.post('/billing/invoices', asyncHandler(AdminController.createSubscriptionInvoice));
router.get('/billing/usage/:institutionId', asyncHandler(AdminController.getBillingUsage));

// ── 13. AI Provider Management ──
router.get('/ai-providers', asyncHandler(AdminController.getAiProviders));
router.post('/ai-providers/health', asyncHandler(AdminController.testProviderHealth));
router.put('/ai-providers/failover', asyncHandler(AdminController.updateFailoverSettings));

// ── 14. Queue Management ──
router.get('/queues/health', asyncHandler(AdminController.getQueueHealth));
router.get('/queues/failed', asyncHandler(AdminController.getFailedJobs));
router.post('/queues/retry', asyncHandler(AdminController.retryQueueJob));

// ── 15. System Settings ──
router.get('/settings', asyncHandler(AdminController.getSystemSettings));
router.put('/settings', asyncHandler(AdminController.updateSystemSettings));

export default router;
