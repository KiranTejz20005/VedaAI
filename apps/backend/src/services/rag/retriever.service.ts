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

export async function advancedRetrieveContext(query: string, organizationId: string, limit = 5): Promise<string> {
  const cacheKey = `rag:${organizationId}:${hashQuery(query)}`;
  try {
    return await getOrSet(cacheKey, async () => {
    // 1 & 2. Hybrid Search: Run Vector and Keyword search in parallel.
    // The vector portion now uses native pgvector similarity (DB-ranked);
    // we compute the embedding once and pass it down to avoid recomputation.
    const queryVector = await getEmbedding(query);

    const [vectorResults, bm25Results] = await Promise.all([
      queryVector ? performVectorSearch(query, organizationId, queryVector) : Promise.resolve([]),
      performBM25Search(query, organizationId)
    ]);

    // 3. Hybrid Score Fusion
    // We normalize scores by simply summing them into a map for this proof of concept.
    // In production, weights could be applied.
    const chunkScores = new Map<string, { chunk: any, score: number }>();
    
    // Weight vector heavily if similarity is high
    for (const v of vectorResults) {
      if (v.score > 0.5) { // Confidence threshold
        chunkScores.set(v.chunk.id, { chunk: v.chunk, score: v.score * 2 });
      }
    }

    // Weight keywords
    for (const b of bm25Results) {
      const existing = chunkScores.get(b.chunk.id);
      if (existing) {
        existing.score += b.score * 0.5; // Boost score if found by both
      } else {
        chunkScores.set(b.chunk.id, { chunk: b.chunk, score: b.score });
      }
    }

    // Sort by combined score
    const fusedResults = Array.from(chunkScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
      
    if (fusedResults.length === 0) return '';

    // 4. Graph Traversal Context Expansion
    const topChunkIds = fusedResults.map(r => r.chunk.id);
    const expandedChunks = await expandContextWithGraph(topChunkIds);

    // 5. Context Builder
    const finalContext = buildContextString(expandedChunks);
    
    return finalContext;
    }, CacheTTL.SHORT);
  } catch (error) {
    logger.error(`Error in advancedRetrieveContext: ${error}`);
    return '';
  }
}
