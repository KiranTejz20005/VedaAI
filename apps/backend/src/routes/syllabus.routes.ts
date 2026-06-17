import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import {
  getSyllabuses,
  getSyllabus,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
  updateTopic,
  updateSubtopic,
  addTopic,
} from '../controllers/syllabus.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getSyllabuses));
router.get('/:id', asyncHandler(getSyllabus));
router.post('/', asyncHandler(createSyllabus));
router.put('/:id', asyncHandler(updateSyllabus));
router.delete('/:id', asyncHandler(deleteSyllabus));

// Topic management
router.post('/:id/topics', asyncHandler(addTopic));
router.patch('/:id/topics/:topicId', asyncHandler(updateTopic));
router.patch('/:id/topics/:topicId/subtopics/:subtopicId', asyncHandler(updateSubtopic));

export default router;
