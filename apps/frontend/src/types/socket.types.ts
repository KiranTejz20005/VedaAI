export type GenerationStage =
  | 'queued'
  | 'processing'
  | 'generating'
  | 'parsing'
  | 'saving'
  | 'pdf-generating'
  | 'completed'
  | 'failed';

export interface GenerationQueuedPayload {
  assignmentId: string;
  jobId: string;
  position: number;
}

export interface GenerationProgressPayload {
  assignmentId: string;
  progress: number;
  stage: GenerationStage;
  message?: string;
}

export interface GenerationCompletedPayload {
  assignmentId: string;
  paperId: string;
}

export interface GenerationFailedPayload {
  assignmentId: string;
  error: string;
  retryable: boolean;
}
