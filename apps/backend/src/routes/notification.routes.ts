import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getNotifications));
router.get('/unread-count', asyncHandler(getUnreadCount));
router.put('/:id/read', asyncHandler(markAsRead));
router.put('/read-all', asyncHandler(markAllAsRead));

export default router;
