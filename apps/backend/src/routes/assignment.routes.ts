import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { paperGenerationRateLimiter, uploadRateLimiter } from '../middlewares/rate-limit.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import fs from 'fs';
import {
  createAssignmentHandler,
  generateAssignmentHandler,
  listAssignmentsHandler,
  getAssignmentHandler,
  deleteAssignmentHandler,
} from '../controllers/assignment.controller';

const router = Router();

router.use(authenticate);

// GET /api/assignments
router.get('/', asyncHandler(listAssignmentsHandler));

// POST /api/assignments  (with optional file uploads)
router.post(
  '/',
  uploadMiddleware.array('files', 10),
  asyncHandler(async (req, res, next) => {
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      let limitTriggered = false;
      await new Promise<void>((resolve) => {
        uploadRateLimiter(req, res, (err) => {
          if (err) {
            limitTriggered = true;
          }
          resolve();
        });
      });

      if (res.headersSent || limitTriggered) {
        const files = req.files as Express.Multer.File[];
        for (const file of files) {
          try {
            fs.unlinkSync(file.path);
          } catch {
            // Ignore unlinking errors
          }
        }
        return;
      }
    }
    next();
  }),
  paperGenerationRateLimiter,
  asyncHandler(createAssignmentHandler)
);

// GET /api/assignments/:id
router.get('/:id', asyncHandler(getAssignmentHandler));

// DELETE /api/assignments/:id
router.delete('/:id', asyncHandler(deleteAssignmentHandler));

// POST /api/assignments/:id/generate
router.post('/:id/generate', paperGenerationRateLimiter, asyncHandler(generateAssignmentHandler));

export default router;
