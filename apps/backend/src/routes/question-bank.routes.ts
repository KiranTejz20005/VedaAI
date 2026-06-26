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

import { uploadMiddleware } from '../middlewares/upload.middleware';
import prisma from '../config/prisma';

const router = Router();

router.use(authenticate);

// Bank CRUD & Search
router.post('/upload', uploadMiddleware.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ success: false, error: 'User must belong to an organization' });
    return;
  }

  // Mock document parsing and question extraction
  // In a real app, you would parse the PDF/Doc, run it through an LLM, etc.
  const extractedQuestions = [
    {
      content: 'What is the powerhouse of the cell?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
      answer: 'Mitochondria',
      subject: 'Biology',
      topic: 'Cell Structure',
      difficulty: 'MEDIUM',
      bloomLevel: 'REMEMBERING',
      tags: ['biology', 'cells', 'extracted'],
      organizationId: orgId,
    },
    {
      content: 'Solve for x: 2x + 5 = 15',
      options: ['5', '10', '15', '20'],
      answer: '5',
      subject: 'Mathematics',
      topic: 'Algebra',
      difficulty: 'EASY',
      bloomLevel: 'APPLYING',
      tags: ['math', 'algebra', 'extracted'],
      organizationId: orgId,
    }
  ];

  const createdQuestions = await Promise.all(
    extractedQuestions.map((q) =>
      prisma.questionBank.create({
        data: {
          content: q.content,
          options: q.options,
          answer: q.answer,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty as any,
          bloomLevel: q.bloomLevel as any,
          tags: q.tags,
          organizationId: q.organizationId,
        },
      })
    )
  );

  res.json({
    success: true,
    message: `File uploaded successfully. Extracted ${createdQuestions.length} questions.`,
    data: createdQuestions,
  });
}));

router.get('/', asyncHandler(searchBank));
router.post('/', asyncHandler(addToBank));
router.put('/:id', asyncHandler(updateBankQuestion));
router.get('/:id/versions', asyncHandler(getQuestionVersions));

// Collections
router.post('/collections', asyncHandler(createCollection));
router.get('/collections', asyncHandler(listCollections));
router.get('/collections/:id', asyncHandler(getCollectionDetails));

export default router;
