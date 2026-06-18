import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middlewares/auth.middleware';
import { 
  generateNotes, 
  getNotes, 
  getNote, 
  removeNote 
} from '../controllers/notes.controller';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(generateNotes));
router.get('/', asyncHandler(getNotes));
router.get('/:id', asyncHandler(getNote));
router.delete('/:id', asyncHandler(removeNote));

export default router;
