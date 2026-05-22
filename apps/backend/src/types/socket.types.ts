export type GenerationStage =
  | 'queued'
  | 'extracting_content'
  | 'topic_preprocessing'
  | 'generation_planning'
  | 'batch_generating'
  | 'validating'
  | 'answer_key_generating'
  | 'pdf_composing'
  | 'persisting'
  | 'pdf-generating'
  | 'completed'
  | 'failed';

export interface GenerationQueuedPayload {
  assignmentId: string;
  jobId: string;
  jobRecordId: string;
  generationSeq: number;
  position: number;
  ts: number;
}

export interface GenerationProgressPayload {
  assignmentId: string;
  progress: number;
  stage: GenerationStage;
  message?: string;
  jobRecordId: string;
  generationSeq: number;
  ts: number;
}

export interface GenerationCompletedPayload {
  assignmentId: string;
  paperId: string;
  jobRecordId: string;
  generationSeq: number;
  ts: number;
}

export interface GenerationFailedPayload {
  assignmentId: string;
  error: string;
  retryable: boolean;
  jobRecordId: string;
  generationSeq: number;
  ts: number;
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
