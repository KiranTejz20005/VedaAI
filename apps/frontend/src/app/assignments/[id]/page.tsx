'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileText,
  Zap,
  RefreshCw,
  Star,
} from 'lucide-react';
import { fetchAssignment } from '@/services/assignment.service';
import { useGenerationSocket } from '@/hooks/useSocket';
import { useGenerationStore } from '@/store/generation.store';
import type { Assignment } from '@/types/assignment.types';
import type { GenerationStage } from '@/types/socket.types';

const STAGE_STEPS: { stage: GenerationStage; label: string }[] = [
  { stage: 'queued', label: 'Queued' },
  { stage: 'processing', label: 'Processing' },
  { stage: 'generating', label: 'Generating' },
  { stage: 'parsing', label: 'Validating' },
  { stage: 'saving', label: 'Saving' },
  { stage: 'completed', label: 'Complete' },
];

function GenerationProgress({
  stage,
  progress,
  message,
}: {
  stage: GenerationStage | null;
  progress: number;
  message: string;
}) {
  const currentStageIndex = STAGE_STEPS.findIndex((s) => s.stage === stage);
  const isFailed = stage === 'failed';
  const isCompleted = stage === 'completed';

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
            background: isFailed ? '#FEE2E2' : isCompleted ? '#D1FAE5' : '#E0E7FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isCompleted ? (
            <CheckCircle2 size={20} color="#059669" />
          ) : isFailed ? (
            <XCircle size={20} color="#DC2626" />
          ) : (
            <Loader2 size={20} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {isCompleted ? 'Generation Complete!' : isFailed ? 'Generation Failed' : 'Generating Assessment…'}
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
            background: isFailed ? '#EF4444' : isCompleted ? '#10B981' : 'var(--brand)',
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Stage pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {STAGE_STEPS.map(({ stage: s, label }, i) => {
          const isDone = currentStageIndex > i || isCompleted;
          const isActive = currentStageIndex === i && !isCompleted;
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
  const [loading, setLoading] = useState(true);
  const { stage, progress, message, paperId, error, reset } = useGenerationStore();

  useGenerationSocket(id);

  useEffect(() => {
    fetchAssignment(id)
      .then(setAssignment)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (paperId) {
      setTimeout(() => router.push(`/assignments/${id}/paper`), 1500);
    }
  }, [paperId, id, router]);

  useEffect(() => {
    return () => { reset(); };
  }, [reset]);

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

  const isActiveStage = stage && !['completed', 'failed'].includes(stage);
  const showGeneration = Boolean(stage) || ['queued', 'generating'].includes(assignment.status);

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
              assignment.status === 'completed'
                ? 'badge-completed'
                : assignment.status === 'failed'
                ? 'badge-failed'
                : assignment.status === 'generating' || assignment.status === 'queued'
                ? 'badge-generating'
                : 'badge-draft'
            }`}
          >
            {assignment.status}
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
            { icon: Star, label: 'Total Marks', value: assignment.totalMarks },
            { icon: Clock, label: 'Duration', value: `${assignment.duration} min` },
            { icon: FileText, label: 'Questions', value: assignment.questionConfig.count },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <Icon size={16} color="var(--text-muted)" style={{ margin: '0 auto 4px', display: 'block' }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
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
              progress={progress}
              message={message}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {(stage === 'failed' || assignment.status === 'failed') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <XCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', margin: 0 }}>
              Generation failed
            </p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>
              {error ?? 'An unexpected error occurred'}
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.reload()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </motion.div>
      )}

      {/* Completed CTA */}
      {(stage === 'completed' || assignment.status === 'completed') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Paper Ready!
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
            Your assessment has been generated and validated successfully.
          </p>
          <Link href={`/assignments/${id}/paper`} className="btn btn-primary">
            <Zap size={16} />
            View Generated Paper
          </Link>
        </motion.div>
      )}
    </div>
  );
}
