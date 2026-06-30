import prisma from '../../config/prisma';

export interface BM25SearchResult {
  chunk: any;
  score: number;
}

export async function performBM25Search(query: string, organizationId: string): Promise<BM25SearchResult[]> {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) return [];

  const chunks = await prisma.knowledgeChunk.findMany({
    where: { document: { organizationId } },
  });

  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const content = chunk.content.toLowerCase();
    const metadata = JSON.stringify(chunk.metadata || {}).toLowerCase();
    
    // Basic term frequency matching
    for (const term of queryTerms) {
      if (content.includes(term)) score += 1;
      if (metadata.includes(term)) score += 2; // Metadata hits (like subject, keywords) are weighted higher
    }

    return { chunk, score };
  });

  // Filter out 0 scores
  return scoredChunks.filter(c => c.score > 0).sort((a, b) => b.score - a.score);
}
