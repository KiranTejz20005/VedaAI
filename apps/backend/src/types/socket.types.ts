export type GenerationStage =
  | 'queued'
  | 'extracting_content'
  | 'topic_preprocessing'
  | 'generation_planning'
  | 'batch_generating'
  | 'provider_retry'
  | 'validation_retry'
  | 'recovering_batches'
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
  version: number;
  ts: number;
}

export interface GenerationProgressPayload {
  assignmentId: string;
  progress: number;
  stage: GenerationStage;
  message?: string;
  jobRecordId: string;
  generationSeq: number;
  version: number;
  ts: number;
}

export interface GenerationCompletedPayload {
  assignmentId: string;
  paperId: string;
  jobRecordId: string;
  generationSeq: number;
  partial?: boolean;
  status?: 'complete' | 'partial_success';
  generatedQuestionCount?: number;
  requestedQuestionCount?: number;
  generatedMarks?: number;
  requestedMarks?: number;
  version: number;
  ts: number;
}

export interface GenerationFailedPayload {
  assignmentId: string;
  error: string;
  retryable: boolean;
  jobRecordId: string;
  generationSeq: number;
  version: number;
  ts: number;
}

export interface GenerationPdfReadyPayload {
  assignmentId: string;
  paperId: string;
  pdfUrl: string;
  ts: number;
}

export interface ServerToClientEvents {
  'generation:queued': (payload: GenerationQueuedPayload) => void;
  'generation:processing': (payload: GenerationProgressPayload) => void;
  'generation:progress': (payload: GenerationProgressPayload) => void;
  'generation:completed': (payload: GenerationCompletedPayload) => void;
  'generation:failed': (payload: GenerationFailedPayload) => void;
  'generation:pdf_ready': (payload: GenerationPdfReadyPayload) => void;
  'presence:online': (payload: { userId: string }) => void;
  'presence:offline': (payload: { userId: string }) => void;
  'presence:sync': (payload: { onlineUserIds: string[] }) => void;
  'chat:message': (payload: any) => void;
  'chat:typing': (payload: { userId: string; isTyping: boolean }) => void;
}

export interface ClientToServerEvents {
  'subscribe:assignment': (data: { assignmentId: string }) => void;
  'unsubscribe:assignment': (data: { assignmentId: string }) => void;
  'authenticate': (data: { userId: string }) => void;
  'join:group': (data: { groupId: string }) => void;
  'leave:group': (data: { groupId: string }) => void;
  'typing': (data: { groupId: string; isTyping: boolean }) => void;
}
