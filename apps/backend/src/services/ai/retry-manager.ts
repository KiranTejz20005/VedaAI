export interface RetryContext {
  provider: string;
  correlationId: string;
  maxAttempts: number;
}

export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
  reason: string;
}

export function buildAdaptiveRetryPrompt(originalPrompt: string, failureReason: string): string {
  return `${originalPrompt}\n\nYour previous response failed validation (${failureReason}).\nHard requirements:\n1) Return EXACTLY the requested number of questions (NO MORE, NO LESS).\n2) Return marks that sum EXACTLY to the requested total marks.\n3) Preserve requested type quotas and section completeness.\n4) No placeholder text, no duplicate questions, no duplicate options.\n5) Output ONLY strict valid JSON. No markdown, no prose, no code fences.`;
}

export function retryDecision(attempt: number, context: RetryContext, retryable: boolean): RetryDecision {
  if (!retryable) {
    return { shouldRetry: false, delayMs: 0, reason: 'not_retryable' };
  }
  if (attempt >= context.maxAttempts) {
    return { shouldRetry: false, delayMs: 0, reason: 'attempt_limit_reached' };
  }
  const delayMs = Math.min(1500 * attempt, 5000) + Math.floor(Math.random() * 500);
  return { shouldRetry: true, delayMs, reason: 'retryable_error' };
}
