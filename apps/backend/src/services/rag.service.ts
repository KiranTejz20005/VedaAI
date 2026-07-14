import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { env } from '../config/env';
import { extractTextFromFile } from './grader.service';
import { logger } from '../utils/logger';
import { invalidateByPattern } from '../api/common/cache';
import { randomUUID } from 'crypto';
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

    // Native pgvector column: inject the embedding as a `vector` literal.
    const embedding = response.data[0].embedding;
    const vectorLiteral = Prisma.raw(`'[${embedding.join(',')}]'::vector`);

    // Set up metadata with hierarchical graph links
    const extendedMetadata: Record<string, any> = {
      ...chunkObj.metadata,
      chunkType: chunkObj.chunkType,
      prevChunkId: previousChunkId,
      // We will leave nextChunkId null for now, or we can update the previous one.
      // To keep it simple, we just store prevChunkId.
    };
    
    const dbChunkId = randomUUID();
    
    // Convert embedding array to string format expected by pgvector: "[1.2, 0.5, ...]"
    const vectorString = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "KnowledgeChunk" ("id", "documentId", "content", "vector", "metadata", "createdAt")
      VALUES (${dbChunkId}, ${doc.id}, ${chunkObj.content}, ${vectorString}::vector, ${extendedMetadata}::jsonb, NOW())
    `;
    const dbChunk = { id: dbChunkId };

    // Update previous chunk's nextChunkId to establish the bidirectional graph
    if (previousChunkId) {
      await prisma.$executeRaw`
        UPDATE "KnowledgeChunk" 
        SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{nextChunkId}', ${dbChunk.id}::jsonb) 
        WHERE id = ${previousChunkId}
      `;
    }

    previousChunkId = dbChunk.id;
  }

  // Invalidate cached RAG results for this organization so new embeddings are picked up
  await invalidateByPattern(`rag:${organizationId}:*`).catch(() => {});

  return doc.id;
}



export { advancedRetrieveContext as retrieveContext } from './rag/retriever.service';
