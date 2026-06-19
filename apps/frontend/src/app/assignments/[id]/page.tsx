'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Brain, CheckCircle2, XCircle, AlertCircle, Clock, FileText, Zap, RefreshCw, Star,
  Send, ThumbsUp, ThumbsDown, Edit3, Archive, Eye, Check, Loader2
} from 'lucide-react';
import { fetchAssignment, generateAssignment, fetchJobStatus } from '@/services/assignment.service';
import { fetchPaper } from '@/services/paper.service';
import { useGenerationSocket } from '@/hooks/useSocket';
import { useGenerationStore } from '@/store/generation.store';
import { GenerationScreen } from '@/components/generation/GenerationScreen';
import { useAssignmentPhase } from '@/hooks/useAssignmentPhase';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import type { Assignment } from '@/types/assignment.types';
import type { GeneratedPaper } from '@/types/paper.types';
import type { GenerationStage } from '@/types/socket.types';

const WORKFLOW_STEPS = [
  { key: 'draft', label: 'Draft', icon: FileText },
  { key: 'generated', label: 'Generated', icon: Zap },
  { key: 'pending_approval', label: 'Pending Approval', icon: Send },
  { key: 'approved', label: 'Approved', icon: ThumbsUp },
  { key: 'published', label: 'Published', icon: CheckCircle2 },
  { key: 'completed', label: 'Completed', icon: Check },
];

const BADGE_MAP: Record<string, string> = {
  draft: 'badge-draft',
  queued: 'badge-queued',
  generating: 'badge-generating',
  completed: 'badge-completed',
  failed: 'badge-failed',
  partially_generated: 'badge-warning',
  pending_approval: 'badge-queued',
  approved: 'badge-completed',
  published: 'badge-completed',
};

function getWorkflowStep(status: string | Assignment['status']): number {
  if (status === 'draft') return 0;
  if (['queued', 'generating', 'completed', 'partially_generated', 'failed'].includes(status)) return 1;
  if (status === 'pending_approval') return 2;
  if (status === 'approved') return 3;
  if (status === 'published') return 4;
  if (status === 'completed') return 5;
  return 0;
}

interface QuestionPreview {
  id: string;
  questionNumber: number;
  question: string;
  type: string;
  marks: number;
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [questions, setQuestions] = useState<QuestionPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showGenScreen, setShowGenScreen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const hasAutoQueuedRef = useRef(false);
  const retryCooldownRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollErrorsRef = useRef(0);
  const { stage, status, message, error, reset, setQueued, setWarning } = useGenerationStore();

  const userRole = user?.role?.toUpperCase() || '';
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const isFaculty = userRole === 'TEACHER' || userRole === 'FACULTY';

  useGenerationSocket(id);

  useEffect(() => {
    fetchAssignment(id)
      .then(setAssignment)
      .catch((e) => { setFetchError(e instanceof Error ? e.message : 'Failed to load assignment'); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!assignment) return;
    const loadPaperAndQuestions = async () => {
      if (assignment.status === 'completed' || assignment.status === 'partially_generated') {
        try {
          const p = await fetchPaper(id);
          setPaper(p);
          const qs: QuestionPreview[] = [];
          if (p.sections) {
            p.sections.forEach((section) => {
              section.questions.forEach((q, idx) => {
                qs.push({
                  id: q.id,
                  questionNumber: idx + 1,
                  question: q.question,
                  type: q.type,
                  marks: q.marks,
                });
              });
            });
          }
          setQuestions(qs);
        } catch { /* ignore */ }
      }
    };
    void loadPaperAndQuestions();
  }, [assignment, id]);

  useEffect(() => { if (fetchError) toast.error(fetchError, { id: 'fetch-error', position: 'bottom-center' }); }, [fetchError]);
  useEffect(() => { if (error) toast.error(error, { id: 'generation-error', position: 'bottom-center' }); }, [error]);

  useEffect(() => {
    if (!assignment || (assignment.status !== 'completed' && assignment.status !== 'partially_generated')) return;
    router.replace(`/assignments/${id}/paper`);
  }, [assignment, id, router]);

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

    const poll = async () => {
      try {
        const jobStatus = await fetchJobStatus(id);
        pollErrorsRef.current = 0;
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
      } catch (err) {
        pollErrorsRef.current += 1;
        if (pollErrorsRef.current >= 3) {
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          toast.error(err instanceof Error ? err.message : 'Lost connection to server. Please refresh.', { id: 'poll-error', position: 'bottom-center' });
        }
      }
    };

    void poll();
    pollingRef.current = setInterval(() => void poll(), 8000);
    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      pollErrorsRef.current = 0;
    };
  }, [id, assignment?.status]);

  const handleWorkflowAction = async (action: string) => {
    setActionLoading(action);
    try {
      await api.post(`/assignments/${id}/${action}`);
      toast.success(`Assessment ${action.replace('_', ' ')}ed successfully`);
      const updated = await fetchAssignment(id);
      setAssignment(updated);
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const showGeneration = Boolean(stage) || ['queued', 'generating'].includes(assignment?.status ?? '');
  const genMeta = assignment?.generationMeta;
  const canonical = assignment?.generationState?.canonicalMetadata ?? paper?.canonicalMetadata;
  const requestedQuestionCount = canonical?.requestedQuestionCount ?? assignment?.questionConfig?.count ?? 0;
  const generatedQuestionCount = canonical?.generatedQuestionCount ?? genMeta?.generatedQuestionCount ?? null;
  const generatedMarks = canonical?.generatedMarks ?? genMeta?.generatedMarks ?? null;
  const requestedMarks = canonical?.requestedMarks ?? assignment?.totalMarks;
  const isPartial = assignment?.status === 'partially_generated';
  const failureReason = genMeta?.failureReason || error || null;

  const isGenActive = showGeneration || showGenScreen ||
    (stage !== null && status !== 'completed' && status !== 'partial_success' && status !== 'failed');
  const phase = useAssignmentPhase({
    isLoading: loading,
    error: fetchError,
    isProcessing: isGenActive,
    isComplete: !isGenActive && (assignment?.status === 'completed' || assignment?.status === 'partially_generated'),
  });

  if (loading) {
    return (
      <div className="assignment-page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 36, width: 'clamp(140px, 30vw, 180px)', borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
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
          <Image src="/empty-state.png" alt="" fill sizes="(max-width: 768px) 100vw, 320px" style={{ objectFit: 'contain' }} />
        </div>
        <h2 className="empty-title">Assignment not found</h2>
        <p className="empty-desc">The requested assignment could not be retrieved.</p>
        <Link href="/dashboard" className="btn btn-dark btn-pill">Back to Dashboard</Link>
      </div>
    );
  }

  const currentStep = getWorkflowStep(assignment.status);
  const assignStatus = assignment.status as string;
  const qualityStatus = assignment.status === 'failed' ? 'Generation Failed'
    : status === 'partial_success' || assignment.status === 'partially_generated' ? 'Partially Generated'
    : assignment.status === 'completed' ? 'Complete'
    : 'In Progress';

  return (
    <>
      <AnimatePresence>
        {phase === 'processing' && (
          <GenerationScreen
            assignmentTitle={assignment.title}
            assignmentSubject={assignment.subject}
            assignmentId={id}
            duration={assignment.duration}
            generatedQuestionCount={generatedQuestionCount}
            requestedQuestionCount={requestedQuestionCount}
            generatedMarks={generatedMarks}
            requestedMarks={requestedMarks}
            schoolName=""
            className=""
            isPartial={isPartial}
            onRetry={handleGenerate}
            isRetrying={isRetrying}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase !== 'processing' && (
          <motion.div
            className="assignment-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                <span className={`badge ${BADGE_MAP[assignment.status] ?? 'badge-draft'}`}>
                  {assignment.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(100px, 20vw, 140px), 1fr))', gap: 'clamp(12px, 2vw, 16px)', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {[
                  { icon: Star, label: 'Marks', value: generatedMarks !== null ? `${generatedMarks}/${requestedMarks}` : `${requestedMarks}` },
                  { icon: Clock, label: 'Duration', value: `${assignment.duration} min` },
                  { icon: FileText, label: 'Questions', value: generatedQuestionCount !== null ? `${generatedQuestionCount}/${requestedQuestionCount}` : `${requestedQuestionCount}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <Icon size={16} color="var(--text-muted)" style={{ margin: '0 auto 4px', display: 'block' }} />
                    <div style={{ fontSize: 'clamp(16px, 1.5vw, 18px)', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Status Workflow</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-page)' }}>
                {WORKFLOW_STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isActive = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px', background: isCurrent ? 'var(--brand-light)' : 'transparent', borderRight: idx < WORKFLOW_STEPS.length - 1 ? '1px solid var(--border)' : 'none', transition: 'all 0.2s' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'var(--brand)' : '#E5E7EB', color: isActive ? 'white' : '#9CA3AF', transition: 'all 0.3s' }}>
                        <StepIcon size={14} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: isCurrent ? 700 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {(isFaculty || isAdmin) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Actions</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {isFaculty && assignment.status === 'draft' && (
                    <button className="btn btn-secondary btn-sm" style={{ gap: 4 }} onClick={() => router.push(`/assignments/create?id=${assignment.id}`)}>
                      <Edit3 size={14} /> Edit
                    </button>
                  )}
                  {isFaculty && (assignment.status === 'completed' || assignment.status === 'partially_generated') && (
                    <button
                      className="btn btn-dark btn-sm"
                      style={{ gap: 4 }}
                      onClick={() => handleWorkflowAction('submit-for-approval')}
                      disabled={actionLoading === 'submit-for-approval'}
                    >
                      {actionLoading === 'submit-for-approval' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Submit for Approval
                    </button>
                  )}
                  {isAdmin && assignStatus === 'pending_approval' && (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ gap: 4 }}
                        onClick={() => handleWorkflowAction('approve')}
                        disabled={actionLoading === 'approve'}
                      >
                        {actionLoading === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                        Approve
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ gap: 4, color: '#EF4444' }}
                        onClick={() => handleWorkflowAction('reject')}
                        disabled={actionLoading === 'reject'}
                      >
                        {actionLoading === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                        Reject
                      </button>
                    </>
                  )}
                  {isAdmin && assignStatus === 'approved' && (
                    <button
                      className="btn btn-dark btn-sm"
                      style={{ gap: 4 }}
                      onClick={() => handleWorkflowAction('publish')}
                      disabled={actionLoading === 'publish'}
                    >
                      {actionLoading === 'publish' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Publish
                    </button>
                  )}
                  {(assignStatus === 'published' || assignStatus === 'completed') && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ gap: 4, color: '#D97706' }}
                      onClick={() => handleWorkflowAction('archive')}
                      disabled={actionLoading === 'archive'}
                    >
                      {actionLoading === 'archive' ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                      Archive
                    </button>
                  )}
                  {(assignment.status === 'completed' || assignment.status === 'partially_generated') && (
                    <Link href={`/assignments/${id}/paper`} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                      <Eye size={14} /> Preview Paper
                    </Link>
                  )}
                </div>
              </motion.div>
            )}

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

            {questions.length > 0 && !showGeneration && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Questions Preview ({questions.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {questions.slice(0, 20).map((q) => (
                    <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: 'var(--brand)', width: 28, flexShrink: 0, textAlign: 'right' }}>Q{q.questionNumber}.</span>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                        {q.question}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', background: '#F3F4F6', padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                        {q.type}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{q.marks} mk</span>
                    </div>
                  ))}
                  {questions.length > 20 && (
                    <Link href={`/assignments/${id}/paper`} style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, textAlign: 'center', padding: 8 }}>
                      View all {questions.length} questions &rarr;
                    </Link>
                  )}
                </div>
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
                <Link href={`/assignments/${id}/paper`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
