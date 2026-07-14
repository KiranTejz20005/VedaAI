import OpenAI from 'openai';
import { env } from '../../config/env';
import prisma from '../../config/prisma';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || '' });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;

export interface VectorSearchResult {
  chunk: {
    id: string;
    content: string;
    metadata: any;
    documentId: string;
    document: { filename: string } | null;
  };
  score: number;
}

// Compute an embedding for the given text using the configured embedding model.
export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!env.OPENAI_API_KEY) return null;
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

// Native pgvector similarity search. Replaces the previous brute-force
// in-JS cosine computation (load ALL chunks then O(N) per query) with a
// single indexed distance query on the `vector` column.
export async function performVectorSearch(
  query: string,
  organizationId: string,
  queryVector?: number[],
  limit = 200,
): Promise<VectorSearchResult[]> {
  if (!env.OPENAI_API_KEY) return [];

  const embedding = queryVector ?? (await getEmbedding(query));
  if (!embedding || embedding.length !== EMBEDDING_DIM) return [];

  // pgvector accepts the text literal `[0.1,0.2,...]`; the value is passed
  // as a bound parameter below (parameterized, not string-concatenated).
  const vectorLiteral = `[${embedding.join(',')}]`;

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    content: string;
    metadata: any;
    documentId: string;
    documentFilename: string | null;
    score: number;
  }>>`
    SELECT
      kc."id",
      kc."content",
      kc."metadata",
      kc."documentId",
      kd."filename" AS "documentFilename",
      1 - (kc."vector" <=> ${vectorLiteral}::vector) AS "score"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeDocument" kd ON kd."id" = kc."documentId"
    WHERE kd."organizationId" = ${organizationId}
      AND kc."vector" IS NOT NULL
    ORDER BY kc."vector" <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    chunk: {
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      documentId: r.documentId,
      document: r.documentFilename ? { filename: r.documentFilename } : null,
    },
    score: typeof r.score === 'string' ? parseFloat(r.score) : r.score,
  }));
}
