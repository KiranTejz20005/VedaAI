'use client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  FileText,
  Brain,
  Layout,
  PenTool,
  RefreshCw,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  BookOpen,
  Save,
  Sparkles,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Zap,
  File as FileIcon,
} from 'lucide-react';
import { useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import type { GenerationStage } from '@/types/socket.types';

interface StageMeta {
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  label: string;
  description: string;
  animationClass: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  showProgress: boolean;
}

const STAGE_META: Record<string, StageMeta> = {
  queued: {
    icon: Clock,
    label: 'Queued',
    description: 'Waiting in line for processing',
    animationClass: 'timeline-dot-pulse',
    accent: '#F59E0B',
    accentBg: '#FEF3C7',
    accentBorder: '#FDE68A',
    showProgress: false,
  },
  extracting_content: {
    icon: FileText,
    label: 'Extracting Content',
    description: 'Reading uploaded material',
    animationClass: 'timeline-dot-scan',
    accent: '#8B5CF6',
    accentBg: '#F5F3FF',
    accentBorder: '#DDD6FE',
    showProgress: false,
  },
  topic_preprocessing: {
    icon: Brain,
    label: 'Understanding Topics',
    description: 'Analyzing concepts and topics',
    animationClass: 'timeline-dot-think',
    accent: '#6366F1',
    accentBg: '#EEF2FF',
    accentBorder: '#C7D2FE',
    showProgress: false,
  },
  generation_planning: {
    icon: Layout,
    label: 'Planning Assessment',
    description: 'Structuring the assessment',
    animationClass: 'timeline-dot-think',
    accent: '#3B82F6',
    accentBg: '#EFF6FF',
    accentBorder: '#BFDBFE',
    showProgress: false,
  },
  batch_generating: {
    icon: PenTool,
    label: 'Generating Questions',
    description: 'Crafting questions and answers',
    animationClass: 'timeline-dot-write',
    accent: '#059669',
    accentBg: '#ECFDF5',
    accentBorder: '#A7F3D0',
    showProgress: true,
  },
  provider_retry: {
    icon: RefreshCw,
    label: 'Reconnecting',
    description: 'Retrying AI provider connection',
    animationClass: 'timeline-dot-retry',
    accent: '#D97706',
    accentBg: '#FFFBEB',
    accentBorder: '#FDE68A',
    showProgress: false,
  },
  validation_retry: {
    icon: ShieldCheck,
    label: 'Re-validating',
    description: 'Retrying content validation',
    animationClass: 'timeline-dot-validate',
    accent: '#DC2626',
    accentBg: '#FEF2F2',
    accentBorder: '#FECACA',
    showProgress: false,
  },
  recovering_batches: {
    icon: Wrench,
    label: 'Recovering Sections',
    description: 'Rebuilding incomplete parts',
    animationClass: 'timeline-dot-pulse',
    accent: '#EA580C',
    accentBg: '#FFF7ED',
    accentBorder: '#FED7AA',
    showProgress: true,
  },
  validating: {
    icon: CheckCircle2,
    label: 'Validating',
    description: 'Running quality checks',
    animationClass: 'timeline-dot-validate',
    accent: '#0D9488',
    accentBg: '#F0FDFA',
    accentBorder: '#99F6E4',
    showProgress: false,
  },
  answer_key_generating: {
    icon: BookOpen,
    label: 'Creating Answer Key',
    description: 'Generating model answers',
    animationClass: 'timeline-dot-write',
    accent: '#7C3AED',
    accentBg: '#F5F3FF',
    accentBorder: '#DDD6FE',
    showProgress: true,
  },
  pdf_composing: {
    icon: FileIcon,
    label: 'Composing Document',
    description: 'Preparing the final document',
    animationClass: 'timeline-dot-pulse',
    accent: '#2563EB',
    accentBg: '#EFF6FF',
    accentBorder: '#BFDBFE',
    showProgress: false,
  },
  'pdf-generating': {
    icon: FileIcon,
    label: 'Composing Document',
    description: 'Generating the PDF',
    animationClass: 'timeline-dot-pulse',
    accent: '#2563EB',
    accentBg: '#EFF6FF',
    accentBorder: '#BFDBFE',
    showProgress: false,
  },
  persisting: {
    icon: Save,
    label: 'Saving',
    description: 'Saving to your account',
    animationClass: 'timeline-dot-pulse',
    accent: '#6B7280',
    accentBg: '#F3F4F6',
    accentBorder: '#E5E7EB',
    showProgress: false,
  },
  completed: {
    icon: Sparkles,
    label: 'Complete',
    description: 'Assessment is ready',
    animationClass: 'timeline-dot-sparkle',
    accent: '#10B981',
    accentBg: '#D1FAE5',
    accentBorder: '#6EE7B7',
    showProgress: false,
  },
};

const TIMELINE_STAGES = [
  'queued',
  'extracting_content',
  'topic_preprocessing',
  'generation_planning',
  'batch_generating',
  'provider_retry',
  'validation_retry',
  'recovering_batches',
  'validating',
  'answer_key_generating',
  'pdf_composing',
  'pdf-generating',
  'persisting',
  'completed',
] as const;

function TimelineConnector({ isDone }: { isDone: boolean }) {
  return (
    <div className="timeline-connector" style={{ background: isDone ? '#10B981' : '#E5E7EB' }} />
  );
}

function TimelineStageProgress({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="timeline-stage-progress">
      <motion.div
        className="timeline-stage-progress-fill"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}

function TypingDots() {
  return (
    <span className="typing-dots">
      <span className="typing-dot-1">.</span>
      <span className="typing-dot-2">.</span>
      <span className="typing-dot-3">.</span>
    </span>
  );
}

function TimelineSuccess({
  isPartial,
  generatedCount,
  requestedCount,
  assignmentId,
  onRegenerate,
  isRetrying,
}: {
  isPartial: boolean;
  generatedCount: number | null;
  requestedCount: number | null;
  assignmentId: string;
  onRegenerate: () => void;
  isRetrying: boolean;
}) {
  return (
    <motion.div
      className="timeline-success"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div
        className="timeline-success-icon"
        style={{ background: isPartial ? '#FFFBEB' : '#D1FAE5' }}
      >
        {isPartial ? (
          <AlertTriangle size={28} color="#D97706" />
        ) : (
          <span className="success-checkmark">
            <Check size={28} color="#059669" style={{ strokeWidth: 3 }} />
          </span>
        )}
      </div>
      <h3 className="timeline-success-title">
        {isPartial ? 'Partially Generated' : 'Assessment Ready'}
      </h3>
      <p className="timeline-success-desc">
        {isPartial
          ? `Generated ${generatedCount ?? 'some'}/${requestedCount ?? '?'} questions`
          : requestedCount && generatedCount
            ? `${generatedCount}/${requestedCount} questions successfully generated`
            : 'Your assessment has been generated successfully'}
      </p>
      <div className="timeline-success-actions">
        <Link href={`/assignments/${assignmentId}/paper`} className="btn btn-primary">
          <Zap size={16} />
          {isPartial ? 'View Partial Results' : 'View Paper'}
        </Link>
        <button className="btn btn-secondary" onClick={onRegenerate} disabled={isRetrying}>
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
          {isRetrying ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>
    </motion.div>
  );
}

function TimelineError({
  error,
  onRetry,
  isRetrying,
}: {
  error: string | null;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <motion.div
      className="timeline-error"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="timeline-error-icon">
        <X size={24} color="#DC2626" style={{ strokeWidth: 3 }} />
      </div>
      <h3 className="timeline-error-title">Generation Interrupted</h3>
      <p className="timeline-error-desc">{error || 'An unexpected error occurred'}</p>
      <button className="btn btn-dark btn-sm" onClick={onRetry} disabled={isRetrying}>
        <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
        {isRetrying ? 'Retrying...' : 'Try Again'}
      </button>
    </motion.div>
  );
}

function TimelineWarning({ message }: { message: string }) {
  return (
    <motion.div
      className="timeline-warning"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <span className="timeline-warning-icon">i</span>
      <div>
        <p className="timeline-warning-title">Content Notice</p>
        <p className="timeline-warning-desc">{message}</p>
      </div>
    </motion.div>
  );
}

export interface GenerationTimelineProps {
  stage: GenerationStage | null;
  status: string | null;
  progress: number;
  message: string;
  error: string | null;
  warning: string | null;
  isPartial: boolean;
  generatedQuestionCount: number | null;
  requestedQuestionCount: number | null;
  assignmentId: string;
  onRetry: () => void;
  isRetrying: boolean;
}

export function GenerationTimeline({
  stage,
  status,
  progress,
  message,
  error,
  warning,
  isPartial,
  generatedQuestionCount,
  requestedQuestionCount,
  assignmentId,
  onRetry,
  isRetrying,
}: GenerationTimelineProps) {
  const lastActiveStageRef = useRef<string | null>(null);
  const stagesRef = useRef<HTMLDivElement>(null);
  const activeNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (stage && stage !== 'failed' && stage !== 'completed') {
      lastActiveStageRef.current = stage;
    }
  }, [stage]);

  useEffect(() => {
    if (activeNodeRef.current && stagesRef.current) {
      const container = stagesRef.current;
      const node = activeNodeRef.current;
      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const offset = nodeRect.top - containerRect.top - containerRect.height / 2 + nodeRect.height / 2;
      container.scrollBy({ top: offset, behavior: 'smooth' });
    }
  }, [stage]);

  const effectiveStage = useMemo(() => {
    if (!stage || stage === 'failed') return lastActiveStageRef.current;
    return stage;
  }, [stage]);

  const stageIndex = effectiveStage ? TIMELINE_STAGES.indexOf(effectiveStage as typeof TIMELINE_STAGES[number]) : -1;

  const isRunning = stage !== 'completed' && stage !== 'failed' && stage !== null;
  const isComplete = stage === 'completed' || isPartial;
  const isFailed = stage === 'failed';

  return (
    <motion.div
      className="timeline-container"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="timeline-header" style={{ marginBottom: TIMELINE_STAGES.length > 0 ? 12 : 0 }}>
        <div
          className="timeline-header-icon-wrap"
          style={{
            background: isFailed ? '#FEF2F2' : isComplete ? '#D1FAE5' : 'var(--brand-light)',
          }}
        >
          {isFailed ? (
            <X size={18} color="#DC2626" />
          ) : isComplete ? (
            <CheckCircle2 size={18} color="#059669" />
          ) : (
            <Loader2 size={18} color="var(--brand)" className="animate-spin" />
          )}
        </div>
        <div className="timeline-header-text">
          <p className="timeline-header-title">
            {isFailed
              ? 'Generation Failed'
              : isComplete
                ? isPartial
                  ? 'Partially Generated'
                  : 'Generation Complete'
                : 'Generating Assessment'}
          </p>
          <p className="timeline-header-sub">
            {message || (stage === 'queued' ? 'Queued for processing...' : '')}
            {isRunning && !message && stage && stage !== 'queued' && STAGE_META[stage]?.description}
            {isRunning && (stage === 'batch_generating' || stage === 'answer_key_generating') && (
              <TypingDots />
            )}
          </p>
        </div>
        {isRunning && (
          <div className="timeline-header-progress">{Math.round(progress)}%</div>
        )}
      </div>

      <div className="timeline-stages" ref={stagesRef}>
        {TIMELINE_STAGES.map((s, i) => {
          const meta = STAGE_META[s];
          if (!meta) return null;

          const done = i < stageIndex;
          const active = i === stageIndex && isRunning;
          const failedDot = i === stageIndex && isFailed;
          const future = !done && !active && !failedDot;
          const isActiveNode = active || failedDot;

          return (
            <div key={s} className="timeline-node-wrapper">
              {i > 0 && <TimelineConnector isDone={i - 1 < stageIndex} />}
              <div
                className="timeline-node"
                ref={isActiveNode ? activeNodeRef : null}
                data-active={isActiveNode ? 'true' : undefined}
              >
                <div className="timeline-dot-column">
                  <div
                    className={`timeline-dot ${active ? meta.animationClass : ''}`}
                    style={{
                      background: done
                        ? meta.accent
                        : active
                          ? meta.accent
                          : failedDot
                            ? '#EF4444'
                            : '#F3F4F6',
                      borderColor: done
                        ? 'transparent'
                        : active
                          ? meta.accent
                          : failedDot
                            ? '#FECACA'
                            : '#E5E7EB',
                      boxShadow: active ? `0 0 0 4px ${meta.accentBg}` : 'none',
                    }}
                  >
                    {done ? (
                      <Check size={14} color="white" style={{ strokeWidth: 3 }} />
                    ) : active ? (
                      <meta.icon size={14} color="white" />
                    ) : failedDot ? (
                      <X size={14} color="white" style={{ strokeWidth: 3 }} />
                    ) : (
                      <div className="timeline-dot-empty" />
                    )}
                  </div>
                </div>

                <div className="timeline-content" style={{ opacity: future ? 0.4 : 1 }}>
                  <div
                    className="timeline-label"
                    style={{
                      color: done
                        ? meta.accent
                        : active
                          ? 'var(--text-primary)'
                          : failedDot
                            ? '#DC2626'
                            : 'var(--text-muted)',
                    }}
                  >
                    {meta.label}
                    {active && meta.showProgress && (
                      <span className="timeline-label-progress">
                        {Math.round(progress)}%
                      </span>
                    )}
                  </div>
                  <div className="timeline-description">
                    {active && message ? message : meta.description}
                    {active && (s === 'batch_generating' || s === 'answer_key_generating') && (
                      <TypingDots />
                    )}
                  </div>
                  {active && meta.showProgress && (
                    <TimelineStageProgress progress={progress} color={meta.accent} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {isComplete && (
          <TimelineSuccess
            isPartial={isPartial}
            generatedCount={generatedQuestionCount}
            requestedCount={requestedQuestionCount}
            assignmentId={assignmentId}
            onRegenerate={onRetry}
            isRetrying={isRetrying}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {warning && <TimelineWarning message={warning} />}
      </AnimatePresence>

      <AnimatePresence>
        {isFailed && (
          <TimelineError error={error} onRetry={onRetry} isRetrying={isRetrying} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
