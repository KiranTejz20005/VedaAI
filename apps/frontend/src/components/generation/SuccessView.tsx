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

function CheckmarkCircle() {
  return (
    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-100"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-200/50"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
      />
      <motion.svg
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        className="relative z-10"
      >
        <motion.polyline points="20 6 9 17 4 12" />
      </motion.svg>
    </div>
  );
}

export function SuccessView({
  assignmentId, isPartial, generatedCount, requestedCount,
  generatedMarks, requestedMarks, duration, subject, schoolName, className,
  onRegenerate, isRetrying,
}: SuccessViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center text-center px-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <CheckmarkCircle />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-extrabold text-gray-900 tracking-tight"
      >
        {isPartial ? 'Partially Generated' : 'Assignment Ready'}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="text-sm text-gray-500 mt-1.5 max-w-md"
      >
        {isPartial
          ? `Generated ${generatedCount ?? 'some'}/${requestedCount ?? '?'} questions. Some sections need attention.`
          : 'Your assignment has been generated successfully and is ready to view.'}
      </motion.p>

      {(subject || schoolName || className) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-400"
        >
          {schoolName && <span>{schoolName}</span>}
          {subject && <span>{subject}</span>}
          {className && <span>Class: {className}</span>}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-wrap justify-center gap-4 mt-8"
      >
        {[
          { label: 'Questions', value: generatedCount !== null && generatedCount !== undefined ? `${generatedCount}/${requestedCount}` : (requestedCount ?? '—') },
          { label: 'Marks', value: generatedMarks !== null && generatedMarks !== undefined ? `${generatedMarks}/${requestedMarks}` : (requestedMarks ?? '—') },
          { label: 'Duration', value: `${duration} min` },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="flex flex-col items-center bg-white rounded-xl border border-gray-100 px-6 py-3 min-w-[100px] shadow-sm"
          >
            <span className="text-xl font-extrabold text-gray-900">{String(stat.value)}</span>
            <span className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="flex flex-wrap justify-center gap-3 mt-8"
      >
        <Link
          href={`/assignments/${assignmentId}/paper`}
          className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all"
        >
          <Zap size={15} />
          {isPartial ? 'View Partial Results' : 'View Generated Paper'}
        </Link>
        <button
          onClick={onRegenerate}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
          {isRetrying ? 'Regenerating...' : 'Regenerate'}
        </button>
      </motion.div>
    </motion.div>
  );
}
