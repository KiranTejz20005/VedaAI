import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { getGroups, createGroup } from '../controllers/group.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getGroups));
router.post('/', asyncHandler(createGroup));

export default router;
