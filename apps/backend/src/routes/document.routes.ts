import { Router } from 'express';
import { upload, uploadDocument } from '../controllers/document.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Faculty and above can upload reference documents
router.post('/upload', requireRole(['FACULTY', 'DEPARTMENT_ADMIN', 'INSTITUTION_ADMIN']), upload.single('file'), uploadDocument);

export default router;
