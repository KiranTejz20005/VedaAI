import prisma from '../config/prisma';
import OpenAI from 'openai';
import { env } from '../config/env';
import { extractTextFromFile } from './grader.service';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || '' });

import { parseDocumentIntoSemanticChunks } from './document-parser.service';

export async function ingestDocument(fileUrl: string, fileType: string, organizationId: string, filename: string): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    logger.warn('No OPENAI_API_KEY found, RAG embeddings will be skipped.');
    return '';
  }

  const text = await extractTextFromFile(fileUrl, fileType);
  if (!text) return '';

  const semanticChunks = await parseDocumentIntoSemanticChunks(text);
  
  const doc = await prisma.knowledgeDocument.create({
    data: {
      filename,
      fileUrl,
      organizationId,
    }
  });

  let previousChunkId: string | null = null;
  
  for (let i = 0; i < semanticChunks.length; i++) {
    const chunkObj = semanticChunks[i];
    
    // Generate embedding
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunkObj.content,
    });
    
    // Set up metadata with hierarchical graph links
    const extendedMetadata: Record<string, any> = {
      ...chunkObj.metadata,
      chunkType: chunkObj.chunkType,
      prevChunkId: previousChunkId,
      // We will leave nextChunkId null for now, or we can update the previous one.
      // To keep it simple, we just store prevChunkId.
    };
    
    const dbChunk: any = await prisma.knowledgeChunk.create({
      data: {
        documentId: doc.id,
        content: chunkObj.content,
        vector: response.data[0].embedding,
        metadata: extendedMetadata,
      }
    });

    // Update previous chunk's nextChunkId to establish the bidirectional graph
    if (previousChunkId) {
      await prisma.$executeRaw`
        UPDATE "KnowledgeChunk" 
        SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{nextChunkId}', ${`"${dbChunk.id}"`}::jsonb) 
        WHERE id = ${previousChunkId}
      `;
    }

    previousChunkId = dbChunk.id;
  }

  return doc.id;
}



export { advancedRetrieveContext as retrieveContext } from './rag/retriever.service';
