'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  FileText,
  Zap,
  RefreshCw,
  Star,
} from 'lucide-react';
import { fetchAssignment, generateAssignment, fetchJobStatus } from '@/services/assignment.service';
import { fetchPaper } from '@/services/paper.service';
import { useGenerationSocket } from '@/hooks/useSocket';
import { useGenerationStore } from '@/store/generation.store';
import type { Assignment } from '@/types/assignment.types';
import type { GeneratedPaper } from '@/types/paper.types';
import type { GenerationStage } from '@/types/socket.types';

const STAGE_STEPS: { stage: GenerationStage; label: string }[] = [
  { stage: 'queued', label: 'Queued' },
  { stage: 'extracting_content', label: 'Extraction' },
  { stage: 'topic_preprocessing', label: 'Preprocess' },
  { stage: 'generation_planning', label: 'Planning' },
  { stage: 'batch_generating', label: 'Generation' },
  { stage: 'provider_retry', label: 'Provider Retry' },
  { stage: 'validation_retry', label: 'Validation Retry' },
  { stage: 'recovering_batches', label: 'Recovery' },
  { stage: 'validating', label: 'Validation' },
  { stage: 'answer_key_generating', label: 'Answer Key' },
  { stage: 'pdf_composing', label: 'PDF' },
  { stage: 'persisting', label: 'Persisting' },
  { stage: 'completed', label: 'Complete' },
];

function GenerationProgress({
  stage,
  progress,
  message,
  status,
}: {
  stage: GenerationStage | null;
  progress: number;
  message: string;
  status: string | null;
}) {
  const currentStageIndex = STAGE_STEPS.findIndex((s) => s.stage === stage);
  const isFailed = stage === 'failed';
  const isCompleted = stage === 'completed';
  const isPartial = status === 'partial_success';

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: isFailed ? '#FEE2E2' : isPartial ? '#FFFBEB' : isCompleted ? '#D1FAE5' : '#E0E7FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isPartial ? (
            <AlertCircle size={20} color="#D97706" />
          ) : isCompleted ? (
            <CheckCircle2 size={20} color="#059669" />
          ) : isFailed ? (
            <XCircle size={20} color="#DC2626" />
          ) : (
            <Loader2 size={20} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {isPartial ? 'Partial Success' : isCompleted ? 'Generation Complete!' : isFailed ? 'Generation Failed' : 'Generating Assessment…'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
            {message || 'Processing…'}
          </p>
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>{progress}%</span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          background: 'var(--border)',
          borderRadius: 100,
          overflow: 'hidden',
          marginBottom: 14,
        }}
      >
        <motion.div
          style={{
            height: '100%',
            borderRadius: 100,
            background: isFailed ? '#EF4444' : isPartial ? '#F59E0B' : isCompleted ? '#10B981' : 'var(--brand)',
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Stage pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {STAGE_STEPS.map(({ stage: s, label }, i) => {
          const isDone = currentStageIndex > i || isCompleted || isPartial;
          const isActive = currentStageIndex === i && !isCompleted && !isPartial;
          return (
            <div
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 100,
                fontSize: 11.5,
                fontWeight: 600,
                background: isDone ? '#D1FAE5' : isActive ? '#E0E7FF' : 'var(--bg-hover)',
                color: isDone ? '#065F46' : isActive ? '#3730A3' : 'var(--text-muted)',
                border: isActive ? '1px solid #C7D2FE' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {isDone && <CheckCircle2 size={10} />}
              {isActive && <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />}
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const hasAutoQueuedRef = useRef(false);
  const retryCooldownRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { stage, status, progress, message, paperId, error, warning, reset, setQueued, setWarning } = useGenerationStore();

  useGenerationSocket(id);

  useEffect(() => {
    fetchAssignment(id)
      .then(setAssignment)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!assignment) return;
    if (assignment.status !== 'completed' && assignment.status !== 'partially_generated') return;
    fetchPaper(id).then(setPaper).catch(() => undefined);
  }, [assignment, id]);

  useEffect(() => {
    if (paperId) {
      const t = setTimeout(() => router.push(`/assignments/${id}/paper`), 1500);
      return () => clearTimeout(t);
    }
  }, [paperId, id, router]);

  useEffect(() => {
    return () => { reset(); };
  }, [reset]);

  useEffect(() => {
    if (message?.includes('image references removed')) {
      setWarning('Your uploaded content contained image references which were removed for text-only processing.');
    }
  }, [message, setWarning]);

  const handleGenerate = useCallback(async () => {
    if (retryCooldownRef.current) return;
    retryCooldownRef.current = true;
    setIsRetrying(true);
    try {
      const queued = await generateAssignment(id);
      setQueued(queued.jobRecordId, queued.generationSeq, 0, Date.now());
      setAssignment((prev) => (prev ? { ...prev, status: 'queued' } : prev));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to queue generation';
      if (msg.toLowerCase().includes('already in progress')) {
        // If a job is already in progress, the socket/polling loop will reconcile.
        setAssignment((prev) => (prev ? { ...prev, status: 'queued' } : prev));
        return;
      }
      toast.error(msg);
    } finally {
      setIsRetrying(false);
      setTimeout(() => { retryCooldownRef.current = false; }, 3000);
    }
  }, [id, setQueued]);

  useEffect(() => {
    if (!assignment || assignment.status !== 'draft' || hasAutoQueuedRef.current) return;
    hasAutoQueuedRef.current = true;
    handleGenerate();
  }, [assignment, id, handleGenerate]);

  useEffect(() => {
    const isTerminal = ['completed', 'failed', 'partially_generated'].includes(assignment?.status ?? '');
    if (!['queued', 'generating'].includes(assignment?.status ?? '') && !stage) return;
    if (isTerminal) return;

    pollingRef.current = setInterval(async () => {
      try {
        const jobStatus = await fetchJobStatus(id);
        if (jobStatus) {
          const jobRecordId = jobStatus.jobRecordId ?? 'polling-unknown';
          const genSeq = jobStatus.generationSeq ?? 0;
          const ts = jobStatus.ts ?? Date.now();
          const version = jobStatus.version ?? 0;
          if (jobStatus.status === 'completed' && jobStatus.paperId) {
            useGenerationStore.getState().setCompleted(jobRecordId, genSeq, version, ts, jobStatus.paperId);
            if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          } else if (jobStatus.status === 'failed') {
            useGenerationStore.getState().setFailed(jobRecordId, genSeq, version, ts, jobStatus.error ?? 'Generation failed');
            if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          } else if (['queued', 'extracting_content', 'topic_preprocessing', 'generation_planning', 'batch_generating', 'validating', 'answer_key_generating', 'pdf_composing', 'persisting', 'pdf-generating'].includes(jobStatus.status)) {
            useGenerationStore.getState().setProgress(jobRecordId, genSeq, version, ts, jobStatus.progress, jobStatus.status as GenerationStage);
          }
        }
        const updated = await fetchAssignment(id);
        setAssignment(updated);
        if (['completed', 'failed', 'partially_generated'].includes(updated.status)) {
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        }
      } catch {
        // Polling failure is non-critical
      }
    }, 5000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [id, assignment?.status, stage, setQueued]);

  if (loading) {
    return (
      <div style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 36, width: 180, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 32px',
          textAlign: 'center',
        }}
      >
        <XCircle size={40} style={{ color: '#EF4444', marginBottom: 12 }} />
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Assignment not found</p>
        <Link href="/dashboard" className="btn btn-secondary btn-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const showGeneration = Boolean(stage) || ['queued', 'generating'].includes(assignment.status);
  const genMeta = assignment.generationMeta;
  const canonical = assignment.generationState?.canonicalMetadata ?? paper?.canonicalMetadata;
  const requestedQuestionCount = canonical?.requestedQuestionCount ?? assignment.questionConfig?.count ?? 0;
  const generatedQuestionCount = canonical?.generatedQuestionCount ?? genMeta?.generatedQuestionCount ?? null;
  const generatedMarks = canonical?.generatedMarks ?? genMeta?.generatedMarks ?? null;
  const requestedMarks = canonical?.requestedMarks ?? assignment.totalMarks;
  const isPartial = assignment.status === 'partially_generated';
  const failureReason = genMeta?.failureReason || error || null;

  const qualityStatus = assignment.status === 'failed'
    ? 'Generation Failed'
    : status === 'partial_success' || assignment.status === 'partially_generated'
    ? 'Partially Generated'
    : assignment.status === 'completed'
    ? 'Complete'
    : 'In Progress';

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Back link */}
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14,
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          marginBottom: 20,
          fontWeight: 500,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Assignment header card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--brand-light)',
              border: '1px solid var(--brand-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Brain size={24} color="var(--brand)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {assignment.title}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
              {assignment.subject}
            </p>
          </div>
          <span
            className={`badge ${
              isPartial
                ? 'badge-warning'
                : qualityStatus === 'Complete'
                ? 'badge-completed'
                : qualityStatus === 'Generation Failed' || assignment.status === 'failed'
                ? 'badge-failed'
                : assignment.status === 'generating' || assignment.status === 'queued'
                ? 'badge-generating'
                : 'badge-draft'
            }`}
          >
            {qualityStatus}
          </span>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
          }}
        >
          {[
            {
              icon: Star,
              label: 'Marks',
              value:
                generatedMarks !== null
                  ? `${generatedMarks}/${requestedMarks}`
                  : requestedMarks,
            },
            { icon: Clock, label: 'Duration', value: `${assignment.duration} min` },
            {
              icon: FileText,
              label: 'Questions',
              value:
                generatedQuestionCount !== null
                  ? `${generatedQuestionCount}/${requestedQuestionCount}`
                  : requestedQuestionCount,
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <Icon size={16} color="var(--text-muted)" style={{ margin: '0 auto 4px', display: 'block' }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {(assignment.status === 'completed' || isPartial) && generatedQuestionCount !== null && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                Generated: {generatedQuestionCount}/{requestedQuestionCount} Questions, {generatedMarks ?? 0}/{requestedMarks} Marks
              </p>
              {isPartial && (
                <span className="badge badge-warning" style={{ fontSize: 11 }}>
                  Partial Generation
                </span>
              )}
            </div>
            {failureReason && (
              <p style={{ margin: 0, fontSize: 11, color: '#9A3412', lineHeight: 1.4 }}>
                {failureReason}
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Generation progress */}
      <AnimatePresence>
        {showGeneration && (
          <motion.div
            key="generation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ marginBottom: 16 }}
          >
            <GenerationProgress
              stage={stage ?? (assignment.status === 'queued' ? 'queued' : null)}
              status={status}
              progress={progress}
              message={message}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info banner for content sanitization */}
      {warning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>i</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#92400E', margin: 0 }}>
              Content Notice
            </p>
            <p style={{ fontSize: 12, color: '#A16207', margin: '2px 0 0' }}>
              {warning}
            </p>
          </div>
        </motion.div>
      )}

      {/* Error/Partial state */}
      {(stage === 'failed' || assignment.status === 'failed' || isPartial) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: isPartial ? '#FFFBEB' : '#FEF2F2',
            border: isPartial ? '1px solid #FDE68A' : '1px solid #FECACA',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {isPartial ? (
            <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0 }} />
          ) : (
            <XCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: isPartial ? '#92400E' : '#991B1B', margin: 0 }}>
              {isPartial ? `Partially Generated (${generatedQuestionCount}/${requestedQuestionCount} questions)` : 'Generation Failed'}
            </p>
            <p style={{ fontSize: 12, color: isPartial ? '#A16207' : '#9CA3AF', margin: '2px 0 0' }}>
              {failureReason || (isPartial ? 'Some questions could not be generated.' : error ?? 'An unexpected error occurred')}
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleGenerate}
            disabled={isRetrying}
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <RefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
            {isRetrying ? 'Retrying…' : isPartial ? 'Resume Generation' : 'Retry'}
          </button>
        </motion.div>
      )}

      {/* Completed CTA */}
      {paper && assignment.status !== 'draft' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: isPartial ? '#FFFBEB' : '#F0FDF4',
            border: isPartial ? '1px solid #FDE68A' : '1px solid #BBF7D0',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          {isPartial ? (
            <AlertCircle size={36} color="#D97706" style={{ margin: '0 auto 12px', display: 'block' }} />
          ) : (
            <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 12px', display: 'block' }} />
          )}
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {isPartial ? 'Paper Partially Generated' : 'Paper Ready!'}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
            {isPartial
              ? `Generated ${generatedQuestionCount}/${requestedQuestionCount} questions. View partial results below.`
              : 'Your assessment has been generated and validated successfully.'}
          </p>
          <Link href={`/assignments/${id}/paper`} className="btn btn-primary">
            <Zap size={16} />
            {isPartial ? 'View Partial Results' : 'View Generated Paper'}
          </Link>
        </motion.div>
      )}
    </div>
  );
}
