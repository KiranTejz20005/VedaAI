import { Router } from 'express';
import { submitReview, getReviewsForQuestion } from '../controllers/review.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Only specific roles can review questions
router.post('/', requireRole(['REVIEWER', 'HOD', 'DEPARTMENT_ADMIN']), submitReview);
router.get('/question/:questionId', getReviewsForQuestion);

export default router;
