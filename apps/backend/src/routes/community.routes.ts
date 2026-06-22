import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import * as CommunityController from '../controllers/community.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['STUDENT', 'TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN']));

router.post('/posts', asyncHandler(CommunityController.createPost));
router.get('/posts/feed', asyncHandler(CommunityController.getFeed));

router.post('/groups', asyncHandler(CommunityController.createGroup));
router.get('/groups', asyncHandler(CommunityController.getGroups));
router.post('/groups/:groupId/join', asyncHandler(CommunityController.joinGroup));

export default router;
