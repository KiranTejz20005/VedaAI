import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';
import type { GenerationJobData } from '../types/queue.types';

let generationQueue: Queue<GenerationJobData> | null = null;

export function getGenerationQueue(): Queue<GenerationJobData> {
  if (!generationQueue) {
    generationQueue = new Queue<GenerationJobData>('generation', {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return generationQueue;
}
