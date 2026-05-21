import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';
import type { GenerationJobData } from '../types/queue.types';

let generationQueue: Queue<GenerationJobData> | null = null;

export function getGenerationQueue(): Queue<GenerationJobData> {
  if (!generationQueue) {
    generationQueue = new Queue<GenerationJobData>('generation', {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      },
    });
  }
  return generationQueue;
}
