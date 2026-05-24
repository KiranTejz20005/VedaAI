'use client';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useGenerationStore } from '@/store/generation.store';
import { useMounted } from '@/hooks/useMounted';
import { GenerationPipeline } from './GenerationPipeline';
import { SuccessView } from './SuccessView';
import { ErrorView } from './ErrorView';

export interface GenerationScreenProps {
  assignmentTitle: string;
  assignmentSubject: string;
  assignmentId: string;
  duration: number;
  generatedQuestionCount: number | null;
  requestedQuestionCount: number | null;
  generatedMarks: number | null | undefined;
  requestedMarks: number | null | undefined;
  schoolName?: string;
  className?: string;
  isPartial: boolean;
  onRetry: () => void;
  isRetrying: boolean;
}

export function GenerationScreen({
  assignmentTitle,
  assignmentSubject,
  assignmentId,
  duration,
  generatedQuestionCount,
  requestedQuestionCount,
  generatedMarks,
  requestedMarks,
  schoolName,
  className,
  isPartial,
  onRetry,
  isRetrying,
}: GenerationScreenProps) {
  const { stage, status, progress, message, error } = useGenerationStore();
  const reduceMotion = useReducedMotion();
  const mounted = useMounted();

  const resolvedSchoolName =
    schoolName?.trim() && schoolName.trim().toLowerCase() !== 'school'
      ? schoolName
      : 'Delhi Public School';
  const resolvedClassName =
    className?.trim() &&
    !['not specified', 'class not specified'].includes(className.trim().toLowerCase())
      ? className
      : 'Class 8';
  const resolvedSubjectName =
    assignmentSubject?.trim() && assignmentSubject.trim().toLowerCase() !== 'not specified'
      ? assignmentSubject
      : 'Mathematics';

  const showSuccess = status === 'completed' || status === 'partial_success' || isPartial;
  const showError = status === 'failed' || stage === 'failed';
  const showProgress = !showSuccess && !showError;

  if (!mounted) return null;

  return createPortal(
    <motion.div
      className="generation-overlay"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="generation-title"
    >
      <header className="generation-overlay__header">
        <div className="generation-overlay__header-inner">
          <h1 id="generation-title" className="generation-overlay__title">
            {assignmentTitle}
          </h1>
          <p className="generation-overlay__meta">
            {resolvedSubjectName} · {resolvedClassName} · {resolvedSchoolName}
          </p>
        </div>
      </header>

      <main className="generation-overlay__main">
        <div className="generation-overlay__main-inner">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <SuccessView
                  assignmentId={assignmentId}
                  isPartial={isPartial}
                  generatedCount={generatedQuestionCount}
                  requestedCount={requestedQuestionCount}
                  generatedMarks={generatedMarks}
                  requestedMarks={requestedMarks}
                  duration={duration}
                  subject={resolvedSubjectName}
                  schoolName={resolvedSchoolName}
                  className={resolvedClassName}
                  onRegenerate={onRetry}
                  isRetrying={isRetrying}
                />
              </motion.div>
            ) : showError ? (
              <motion.div
                key="error"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <ErrorView error={error} onRetry={onRetry} isRetrying={isRetrying} />
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                aria-live="polite"
                aria-busy="true"
              >
                <GenerationPipeline
                  stage={stage}
                  status={status}
                  progress={progress}
                  message={message}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>,
    document.body,
  );
}
