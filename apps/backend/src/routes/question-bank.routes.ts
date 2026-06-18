import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middlewares/auth.middleware';
import {
  addToBank,
  searchBank,
  updateBankQuestion,
  getQuestionVersions,
  createCollection,
  listCollections,
  getCollectionDetails,
} from '../controllers/question-bank.controller';

const router = Router();

router.use(authenticate);

// Bank CRUD & Search
router.get('/', asyncHandler(searchBank));
router.post('/', asyncHandler(addToBank));
router.put('/:id', asyncHandler(updateBankQuestion));
router.get('/:id/versions', asyncHandler(getQuestionVersions));

// Collections
router.post('/collections', asyncHandler(createCollection));
router.get('/collections', asyncHandler(listCollections));
router.get('/collections/:id', asyncHandler(getCollectionDetails));

export default router;
