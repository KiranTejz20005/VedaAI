'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { RefreshCw, Zap } from 'lucide-react';

interface SuccessViewProps {
  assignmentId: string;
  isPartial: boolean;
  generatedCount: number | null | undefined;
  requestedCount: number | null | undefined;
  generatedMarks: number | null | undefined;
  requestedMarks: number | null | undefined;
  duration: number;
  subject?: string;
  schoolName?: string;
  className?: string;
  onRegenerate: () => void;
  isRetrying: boolean;
}

const statStagger = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
};

function CheckmarkCircle() {
  return (
    <div className="gen-check-wrap">
      <motion.div
        className="gen-check-ring"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      />
      <motion.div
        className="gen-check-ring gen-check-ring--pulse"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.35] }}
        transition={{ duration: 1.2, delay: 0.25, ease: 'easeOut' }}
      />
      <motion.svg
        className="gen-check-icon"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#059669"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.polyline points="20 6 9 17 4 12" />
      </motion.svg>
    </div>
  );
}

export function SuccessView({
  assignmentId,
  isPartial,
  generatedCount,
  requestedCount,
  generatedMarks,
  requestedMarks,
  duration,
  subject,
  schoolName,
  className,
  onRegenerate,
  isRetrying,
}: SuccessViewProps) {
  const questionsValue =
    generatedCount != null ? `${generatedCount}/${requestedCount ?? '?'}` : String(requestedCount ?? '—');
  const marksValue =
    generatedMarks != null ? `${generatedMarks}/${requestedMarks ?? '?'}` : String(requestedMarks ?? '—');

  const stats = [
    { id: 'questions', value: questionsValue, label: 'Questions', isDuration: false },
    { id: 'marks', value: marksValue, label: 'Marks', isDuration: false },
    { id: 'duration', value: String(duration), label: 'Duration', isDuration: true },
  ] as const;

  return (
    <motion.article
      className={`gen-result-card${isPartial ? ' gen-result-card--partial' : ''}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <CheckmarkCircle />

      <h2 className="gen-result-title">{isPartial ? 'Partially Generated' : 'Assignment Ready'}</h2>
      <p className="gen-result-desc">
        {isPartial
          ? `Generated ${generatedCount ?? 'some'}/${requestedCount ?? '?'} questions. Some sections need attention.`
          : 'Your assignment has been generated successfully and is ready to view.'}
      </p>

      <p className="gen-result-meta">
        <span>{schoolName || 'Delhi Public School'}</span>
        <span aria-hidden="true">·</span>
        <span>{subject || 'Mathematics'}</span>
        <span aria-hidden="true">·</span>
        <span>{className || 'Class 8'}</span>
      </p>

      <motion.div
        className="gen-stats"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            className="gen-stat"
            custom={index}
            variants={statStagger}
          >
            {stat.isDuration ? (
              <div className="gen-stat-value-row">
                <span className="gen-stat-value">{stat.value}</span>
                <span className="gen-stat-unit">min</span>
              </div>
            ) : (
              <span className="gen-stat-value">{stat.value}</span>
            )}
            <span className="gen-stat-label">{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="gen-result-actions"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.35 }}
      >
        <Link href={`/assignments/${assignmentId}/paper`} className="gen-btn-primary">
          <Zap size={15} aria-hidden />
          {isPartial ? 'View Partial Results' : 'View Generated Paper'}
        </Link>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isRetrying}
          className="gen-btn-secondary"
        >
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} aria-hidden />
          {isRetrying ? 'Regenerating...' : 'Regenerate'}
        </button>
      </motion.div>
    </motion.article>
  );
}
