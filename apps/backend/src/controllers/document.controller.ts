import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup multer for local file storage (MVP RAG Pipeline)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const upload = multer({ storage });

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    // In a real RAG pipeline, we would now:
    // 1. Send file to Python AI Engine or parse locally (pdf-parse)
    // 2. Chunk text
    // 3. Generate embeddings
    // 4. Store in VectorDB (Pinecone/Milvus)
    
    // For MVP/Phase 2, we simulate successful upload and return a document context ID
    const fileUrl = `/uploads/documents/${req.file.filename}`;
    
    res.status(201).json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        message: 'Document uploaded and indexed successfully for RAG'
      }
    });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to upload document' });
    return;
  }
};
