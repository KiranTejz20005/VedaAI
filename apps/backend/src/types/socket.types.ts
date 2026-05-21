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

export interface ServerToClientEvents {
  'generation:queued': (payload: GenerationQueuedPayload) => void;
  'generation:processing': (payload: GenerationProgressPayload) => void;
  'generation:progress': (payload: GenerationProgressPayload) => void;
  'generation:completed': (payload: GenerationCompletedPayload) => void;
  'generation:failed': (payload: GenerationFailedPayload) => void;
}

export interface ClientToServerEvents {
  'subscribe:assignment': (data: { assignmentId: string }) => void;
  'unsubscribe:assignment': (data: { assignmentId: string }) => void;
}
