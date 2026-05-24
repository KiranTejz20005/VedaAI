'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Brain, CheckCircle2, XCircle, AlertCircle, Clock, FileText, Zap, RefreshCw, Star,
} from 'lucide-react';
import { fetchAssignment, generateAssignment, fetchJobStatus } from '@/services/assignment.service';
import { fetchPaper } from '@/services/paper.service';
import { useGenerationSocket } from '@/hooks/useSocket';
import { useGenerationStore } from '@/store/generation.store';
import { GenerationScreen } from '@/components/generation/GenerationScreen';
import type { Assignment } from '@/types/assignment.types';
import type { GeneratedPaper } from '@/types/paper.types';
import type { GenerationStage } from '@/types/socket.types';

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showGenScreen, setShowGenScreen] = useState(false);
  const hasAutoQueuedRef = useRef(false);
  const retryCooldownRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { stage, status, message, error, reset, setQueued, setWarning } = useGenerationStore();

  useGenerationSocket(id);

  useEffect(() => {
    fetchAssignment(id)
      .then(setAssignment)
      .catch((e) => { setFetchError(e instanceof Error ? e.message : 'Failed to load assignment'); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { if (fetchError) toast.error(fetchError, { id: 'fetch-error', position: 'bottom-center' }); }, [fetchError]);
  useEffect(() => { if (error) toast.error(error, { id: 'generation-error', position: 'bottom-center' }); }, [error]);

  useEffect(() => {
    if (!assignment || (assignment.status !== 'completed' && assignment.status !== 'partially_generated')) return;
    fetchPaper(id).then(setPaper).catch(() => {});
  }, [assignment, id]);

  useEffect(() => { return () => { reset(); }; }, [reset]);

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
      setShowGenScreen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to queue generation';
      if (msg.toLowerCase().includes('already in progress')) {
        setAssignment((prev) => (prev ? { ...prev, status: 'queued' } : prev));
        setShowGenScreen(true);
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
      } catch {}
    }, 5000);
    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, [id, assignment?.status, stage, setQueued]);

  const showGeneration = Boolean(stage) || ['queued', 'generating'].includes(assignment?.status ?? '');
  const genMeta = assignment?.generationMeta;
  const canonical = assignment?.generationState?.canonicalMetadata ?? paper?.canonicalMetadata;
  const requestedQuestionCount = canonical?.requestedQuestionCount ?? assignment?.questionConfig?.count ?? 0;
  const generatedQuestionCount = canonical?.generatedQuestionCount ?? genMeta?.generatedQuestionCount ?? null;
  const generatedMarks = canonical?.generatedMarks ?? genMeta?.generatedMarks ?? null;
  const requestedMarks = canonical?.requestedMarks ?? assignment?.totalMarks;
  const schoolName = canonical?.schoolName;
  const className = canonical?.className;
  const isPartial = assignment?.status === 'partially_generated';
  const failureReason = genMeta?.failureReason || error || null;

  const isGenActive = showGeneration || showGenScreen ||
    (stage !== null && status !== 'completed' && status !== 'partial_success' && status !== 'failed');

  if (loading) {
    return (
      <div style={{ maxWidth: 'min(720px, 100%)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 36, width: 'clamp(140px, 30vw, 180px)', borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="empty-state">
        <div className="empty-illustration" aria-hidden="true">
          <img src="/empty-state.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h2 className="empty-title">Assignment not found</h2>
        <p className="empty-desc">The requested assignment could not be retrieved.</p>
        <Link href="/dashboard" className="btn btn-dark btn-pill">Back to Dashboard</Link>
      </div>
    );
  }

  const qualityStatus = assignment.status === 'failed' ? 'Generation Failed'
    : status === 'partial_success' || assignment.status === 'partially_generated' ? 'Partially Generated'
    : assignment.status === 'completed' ? 'Complete'
    : 'In Progress';

  return (
    <>
      <AnimatePresence>
        {isGenActive && (
          <GenerationScreen
            assignmentTitle={assignment.title}
            assignmentSubject={assignment.subject}
            assignmentId={id}
            duration={assignment.duration}
            generatedQuestionCount={generatedQuestionCount}
            requestedQuestionCount={requestedQuestionCount}
            generatedMarks={generatedMarks}
            requestedMarks={requestedMarks}
            schoolName={schoolName}
            className={className}
            isPartial={isPartial}
            onRetry={handleGenerate}
            isRetrying={isRetrying}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isGenActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ maxWidth: 'min(720px, 100%)', width: '100%' }}
          >
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(12px, 2vw, 16px)' }}>
                <div style={{ width: 'clamp(40px, 5vw, 48px)', height: 'clamp(40px, 5vw, 48px)', borderRadius: 12, background: 'var(--brand-light)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Brain size={22} color="var(--brand)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: 'clamp(17px, 1.8vw, 20px)', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {assignment.title}
                  </h1>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', marginTop: 2 }}>{assignment.subject}</p>
                </div>
                <span className={`badge ${
                  isPartial ? 'badge-warning'
                  : qualityStatus === 'Complete' ? 'badge-completed'
                  : qualityStatus === 'Generation Failed' || assignment.status === 'failed' ? 'badge-failed'
                  : assignment.status === 'generating' || assignment.status === 'queued' ? 'badge-generating'
                  : 'badge-draft'
                }`}>{qualityStatus}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(100px, 20vw, 140px), 1fr))', gap: 'clamp(12px, 2vw, 16px)', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {[
                  { icon: Star, label: 'Marks', value: generatedMarks !== null ? `${generatedMarks}/${requestedMarks}` : requestedMarks },
                  { icon: Clock, label: 'Duration', value: `${assignment.duration} min` },
                  { icon: FileText, label: 'Questions', value: generatedQuestionCount !== null ? `${generatedQuestionCount}/${requestedQuestionCount}` : requestedQuestionCount },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <Icon size={16} color="var(--text-muted)" style={{ margin: '0 auto 4px', display: 'block' }} />
                    <div style={{ fontSize: 'clamp(16px, 1.5vw, 18px)', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {!showGeneration && (assignment.status === 'failed' || isPartial) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                background: isPartial ? '#FFFBEB' : '#FEF2F2',
                border: isPartial ? '1px solid #FDE68A' : '1px solid #FECACA',
                borderRadius: 'var(--radius-lg)', padding: 'clamp(14px, 2vw, 16px) clamp(16px, 2.5vw, 20px)',
                marginBottom: 16, display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1.5vw, 12px)', flexWrap: 'wrap',
              }}>
                {isPartial ? <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0 }} /> : <XCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: isPartial ? '#92400E' : '#991B1B', margin: 0 }}>
                    {isPartial ? `Partially Generated (${generatedQuestionCount}/${requestedQuestionCount} questions)` : 'Generation Failed'}
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: isPartial ? '#A16207' : '#9CA3AF', margin: '2px 0 0' }}>
                    {failureReason || (isPartial ? 'Some questions could not be generated.' : error ?? 'An unexpected error occurred')}
                  </p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleGenerate} disabled={isRetrying} style={{ flexShrink: 0 }}>
                  <RefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
                  {isRetrying ? 'Retrying...' : isPartial ? 'Resume Generation' : 'Retry'}
                </button>
              </motion.div>
            )}

            {paper && !showGeneration && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{
                background: isPartial ? '#FFFBEB' : '#F0FDF4',
                border: isPartial ? '1px solid #FDE68A' : '1px solid #BBF7D0',
                borderRadius: 'var(--radius-lg)', padding: 'clamp(20px, 2.5vw, 24px)', textAlign: 'center',
              }}>
                {isPartial ? <AlertCircle size={36} color="#D97706" style={{ margin: '0 auto 12px', display: 'block' }} /> : <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 12px', display: 'block' }} />}
                <h3 style={{ fontSize: 'clamp(16px, 1.5vw, 18px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {isPartial ? 'Paper Partially Generated' : 'Paper Ready!'}
                </h3>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', marginBottom: 16 }}>
                  {isPartial ? `Generated ${generatedQuestionCount}/${requestedQuestionCount} questions.` : 'Your assessment has been generated and validated successfully.'}
                </p>
                <Link href={`/assignments/${id}/paper`} className="btn btn-primary">
                  <Zap size={16} />
                  {isPartial ? 'View Partial Results' : 'View Generated Paper'}
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
