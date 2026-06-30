import OpenAI from 'openai';
import { env } from '../../config/env';
import prisma from '../../config/prisma';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || '' });

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface VectorSearchResult {
  chunk: any;
  score: number;
}

export async function performVectorSearch(query: string, organizationId: string): Promise<VectorSearchResult[]> {
  if (!env.OPENAI_API_KEY) return [];

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const queryVector = response.data[0].embedding;

  // Retrieve chunks for metadata filter organizationId
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { document: { organizationId } },
  });

  const scoredChunks = chunks.map(chunk => {
    const chunkVector = chunk.vector as number[];
    return {
      chunk,
      score: cosineSimilarity(queryVector, chunkVector),
    };
  });

  // Sort strictly by vector score descending
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks;
}
