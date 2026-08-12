import { performVectorSearch, getEmbedding } from './vector-search.service';
import { performBM25Search } from './bm25.service';
import { expandContextWithGraph } from './graph-traversal.service';
import { buildContextString } from './context-builder.service';
import { logger } from '../../utils/logger';
import { getOrSet, CacheTTL } from '../../api/common/cache';
import crypto from 'crypto';

export interface RrfOptions {
  rrfK?: number;
  semanticWeight?: number;
  keywordWeight?: number;
}

function hashQuery(query: string): string {
  return crypto.createHash('sha256').update(query.trim().toLowerCase()).digest('hex').substring(0, 16);
}

// Reciprocal Rank Fusion (RRF) algorithm merging vector similarity and full-text keyword ranks
export function performRRF(
  vectorResults: Array<{ chunk: any; score: number }>,
  keywordResults: Array<{ chunk: any; score: number }>,
  options: RrfOptions = {}
): Array<{ chunk: any; rrfScore: number }> {
  const rrfK = options.rrfK ?? 60;
  const semanticWeight = options.semanticWeight ?? 1.0;
  const keywordWeight = options.keywordWeight ?? 1.0;

  const scoreMap = new Map<string, { chunk: any; rrfScore: number }>();

  // 1. Process Semantic Vector Search Ranks (1-indexed)
  vectorResults.forEach((v, index) => {
    const rank = index + 1;
    const rrfContribution = semanticWeight / (rrfK + rank);
    const existing = scoreMap.get(v.chunk.id);
    if (existing) {
      existing.rrfScore += rrfContribution;
    } else {
      scoreMap.set(v.chunk.id, { chunk: v.chunk, rrfScore: rrfContribution });
    }
  });

  // 2. Process Full-Text Keyword Search Ranks (1-indexed)
  keywordResults.forEach((k, index) => {
    const rank = index + 1;
    const rrfContribution = keywordWeight / (rrfK + rank);
    const existing = scoreMap.get(k.chunk.id);
    if (existing) {
      existing.rrfScore += rrfContribution;
    } else {
      scoreMap.set(k.chunk.id, { chunk: k.chunk, rrfScore: rrfContribution });
    }
  });

  // 3. Sort merged candidates by RRF score descending
  return Array.from(scoreMap.values()).sort((a, b) => b.rrfScore - a.rrfScore);
}

export async function advancedRetrieveContext(
  query: string,
  organizationId: string,
  limit = 5
): Promise<string> {
  const cacheKey = `rag:${organizationId}:${hashQuery(query)}`;
  try {
    return await getOrSet(cacheKey, async () => {
      // 1. Compute query vector (utilizes 1-hour Redis embedding cache)
      const queryVector = await getEmbedding(query);

      // 2. Parallel hybrid retrieval: Vector Search + GIN-indexed Keyword Search
      const candidateLimit = Math.max(limit * 10, 50);
      const [vectorResults, bm25Results] = await Promise.all([
        queryVector ? performVectorSearch(query, organizationId, queryVector, candidateLimit) : Promise.resolve([]),
        performBM25Search(query, organizationId, candidateLimit),
      ]);

      // 3. Reciprocal Rank Fusion (RRF)
      const fusedResults = performRRF(vectorResults, bm25Results).slice(0, limit);
      
      if (fusedResults.length === 0) return '';

      // 4. Graph Traversal Context Expansion
      const topChunkIds = fusedResults.map((r) => r.chunk.id);
      const expandedChunks = await expandContextWithGraph(topChunkIds);

      // 5. Context Builder
      return buildContextString(expandedChunks);
    }, CacheTTL.SHORT);
  } catch (error) {
    logger.error(`Error in advancedRetrieveContext: ${error}`);
    return '';
  }
}
