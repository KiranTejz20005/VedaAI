// Type-only re-exports for backward compatibility.
// All runtime operations now use Prisma (see config/prisma.ts).
export interface IGenerationJob {
  id: string;
  assignmentId: string;
  bullmqJobId: string;
  generationSeq: number;
  progressVersion: number;
  stageIndex: number;
  status: string;
  progress: number;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
