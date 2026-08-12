import { performVectorSearch, getEmbedding } from './vector-search.service';
import { performBM25Search } from './bm25.service';
import { expandContextWithGraph } from './graph-traversal.service';
import { buildContextString } from './context-builder.service';
import { logger } from '../../utils/logger';
import { getOrSet, CacheTTL } from '../../api/common/cache';

function hashQuery(query: string): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export interface RagSourceCitation {
  chunkId: string;
  documentId: string;
  filename: string;
  topic?: string;
  subject?: string;
  chunkType?: string;
  excerpt: string;
  score: number;
}

interface FusedRetrievalResult {
  context: string;
  sources: RagSourceCitation[];
}

async function fuseAndBuildContext(
  query: string,
  organizationId: string,
  limit: number
): Promise<FusedRetrievalResult> {
  const queryVector = await getEmbedding(query);

  const [vectorResults, bm25Results] = await Promise.all([
    queryVector ? performVectorSearch(query, organizationId, queryVector) : Promise.resolve([]),
    performBM25Search(query, organizationId),
  ]);

  const chunkScores = new Map<string, { chunk: any; score: number }>();

  for (const v of vectorResults) {
    if (v.score > 0.5) {
      chunkScores.set(v.chunk.id, { chunk: v.chunk, score: v.score * 2 });
    }
  }

  for (const b of bm25Results) {
    const existing = chunkScores.get(b.chunk.id);
    if (existing) {
      existing.score += b.score * 0.5;
    } else {
      chunkScores.set(b.chunk.id, { chunk: b.chunk, score: b.score });
    }
  }

  const fusedResults = Array.from(chunkScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (fusedResults.length === 0) {
    return { context: '', sources: [] };
  }

  const topChunkIds = fusedResults.map((r) => r.chunk.id);
  const expandedChunks = await expandContextWithGraph(topChunkIds);
  const finalContext = buildContextString(expandedChunks);

  const sources: RagSourceCitation[] = fusedResults.map(({ chunk, score }) => {
    const metadata = (chunk.metadata ?? {}) as Record<string, unknown>;
    return {
      chunkId: chunk.id,
      documentId: chunk.documentId,
      filename: chunk.document?.filename ?? 'Institution document',
      topic: typeof metadata.topic === 'string' ? metadata.topic : undefined,
      subject: typeof metadata.subject === 'string' ? metadata.subject : undefined,
      chunkType: typeof metadata.chunkType === 'string' ? metadata.chunkType : undefined,
      excerpt: String(chunk.content ?? '').slice(0, 180),
      score,
    };
  });

  return { context: finalContext, sources };
}

export async function advancedRetrieveContext(query: string, organizationId: string, limit = 5): Promise<string> {
  const cacheKey = `rag:${organizationId}:${hashQuery(query)}`;
  try {
    return await getOrSet(cacheKey, async () => {
      const { context } = await fuseAndBuildContext(query, organizationId, limit);
      return context;
    }, CacheTTL.SHORT);
  } catch (error) {
    logger.error(`Error in advancedRetrieveContext: ${error}`);
    return '';
  }
}

export async function retrieveContextWithSources(
  query: string,
  organizationId: string,
  limit = 5
): Promise<FusedRetrievalResult> {
  const cacheKey = `rag:${organizationId}:${hashQuery(query)}:sources`;
  try {
    return await getOrSet(cacheKey, async () => {
      return fuseAndBuildContext(query, organizationId, limit);
    }, CacheTTL.SHORT);
  } catch (error) {
    logger.error(`Error in retrieveContextWithSources: ${error}`);
    return { context: '', sources: [] };
  }
}
