'use client';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGenerationStore } from '@/store/generation.store';
import type { GenerationStage } from '@/types/socket.types';
import { GenerationTile, type TileConfig } from './GenerationTile';
import { SuccessView } from './SuccessView';
import { ErrorView } from './ErrorView';

/* ── Stage-to-tile mapping ── */
const TILE_MAP: { stage: GenerationStage; tile: TileConfig }[] = [
  { stage: 'queued',              tile: { id: 'queued',              icon: '📋', label: 'Queued for Processing',   description: 'Preparing your request' } },
  { stage: 'extracting_content',  tile: { id: 'extracting_content',  icon: '📄', label: 'Reading Uploaded PDFs',   description: 'Extracting text from your files' } },
  { stage: 'topic_preprocessing', tile: { id: 'topic_preprocessing', icon: '🧠', label: 'Understanding Concepts',  description: 'Analyzing topics and content' } },
  { stage: 'generation_planning', tile: { id: 'generation_planning', icon: '📐', label: 'Planning Assessment',    description: 'Structuring the assessment' } },
  { stage: 'batch_generating',    tile: { id: 'batch_generating',    icon: '✍️', label: 'Generating Questions',    description: 'Crafting questions with AI' } },
  { stage: 'provider_retry',      tile: { id: 'provider_retry',      icon: '🔄', label: 'Reconnecting AI',        description: 'Retrying connection' } },
  { stage: 'validation_retry',    tile: { id: 'validation_retry',    icon: '🔄', label: 'Re-validating',          description: 'Retrying validation' } },
  { stage: 'recovering_batches',  tile: { id: 'recovering_batches',  icon: '🔧', label: 'Recovering Sections',    description: 'Rebuilding parts' } },
  { stage: 'validating',          tile: { id: 'validating',          icon: '✅', label: 'Validating Content',     description: 'Running quality checks' } },
  { stage: 'answer_key_generating', tile: { id: 'answer_key_generating', icon: '📝', label: 'Preparing Answer Key', description: 'Generating model answers' } },
  { stage: 'pdf_composing',       tile: { id: 'pdf_composing',       icon: '📦', label: 'Composing Document',    description: 'Assembling final document' } },
  { stage: 'pdf-generating',      tile: { id: 'pdf-generating',      icon: '📦', label: 'Generating PDF',        description: 'Creating the PDF file' } },
  { stage: 'persisting',          tile: { id: 'persisting',          icon: '💾', label: 'Saving Assignment',     description: 'Saving to your account' } },
  { stage: 'completed',           tile: { id: 'completed',           icon: '✨', label: 'Complete',              description: 'Assessment is ready' } },
];

const ALL_STAGES = TILE_MAP.map((m) => m.stage);

function getTileState(stage: GenerationStage | null, currentStageIdx: number, tileIdx: number, status: string | null): 'pending' | 'active' | 'completed' | 'failed' {
  if (!stage || status === 'failed') {
    return tileIdx === currentStageIdx && status === 'failed' ? 'failed' : 'pending';
  }
  if (tileIdx < currentStageIdx) return 'completed';
  if (tileIdx === currentStageIdx) return 'active';
  return 'pending';
}

/* ── AI Orb ── */
function AnimatedOrb() {
  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500"
        animate={{ scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="relative z-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 w-8 h-8 flex items-center justify-center shadow-lg shadow-orange-500/30"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 6-2-2-4-4-4-6a4 4 0 0 1 4-4z" />
          <path d="M8 14h8" /><path d="M8 17h5" /><path d="M10 20h4" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
}

/* ── Props ── */
export interface GenerationScreenProps {
  assignmentTitle: string;
  assignmentSubject: string;
  assignmentId: string;
  duration: number;
  generatedQuestionCount: number | null;
  requestedQuestionCount: number | null;
  generatedMarks: number | null | undefined;
  requestedMarks: number | null | undefined;
  isPartial: boolean;
  onRetry: () => void;
  isRetrying: boolean;
}

export function GenerationScreen({
  assignmentTitle, assignmentSubject, assignmentId, duration,
  generatedQuestionCount, requestedQuestionCount,
  generatedMarks, requestedMarks, isPartial,
  onRetry, isRetrying,
}: GenerationScreenProps) {
  const { stage, status, progress, message, error } = useGenerationStore();

  const currentStageIdx = useMemo(() => {
    if (!stage || stage === 'failed') return ALL_STAGES.length - 1;
    const idx = ALL_STAGES.indexOf(stage);
    return idx >= 0 ? idx : 0;
  }, [stage]);

  const showSuccess = status === 'completed' || status === 'partial_success' || isPartial;
  const showError = status === 'failed' || stage === 'failed';
  const showProgress = !showSuccess && !showError;

  const tiles = useMemo(() => {
    return TILE_MAP.map((m, i) => {
      const tileState = getTileState(stage, currentStageIdx, i, status);
      return (
        <GenerationTile
          key={m.tile.id}
          tile={m.tile}
          state={tileState}
          message={tileState === 'active' ? message : undefined}
          index={i}
        />
      );
    });
  }, [stage, currentStageIdx, status, message]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <AnimatedOrb />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-gray-900 truncate">{assignmentTitle}</h1>
              {showProgress && (
                <span className="text-xs text-orange-500 font-medium flex-shrink-0">{Math.round(progress)}%</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{assignmentSubject}</p>
          </div>
          {showProgress && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Generating Assignment
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-start justify-center px-6 py-8 sm:py-12">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <SuccessView
                  assignmentId={assignmentId}
                  isPartial={isPartial}
                  generatedCount={generatedQuestionCount}
                  requestedCount={requestedQuestionCount}
                  generatedMarks={generatedMarks}
                  requestedMarks={requestedMarks}
                  duration={duration}
                  onRegenerate={onRetry}
                  isRetrying={isRetrying}
                />
              </motion.div>
            ) : showError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <ErrorView error={error} onRetry={onRetry} isRetrying={isRetrying} />
              </motion.div>
            ) : (
              <motion.div key="progress" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tiles}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      {showProgress && (
        <div className="flex-shrink-0 border-t border-gray-100 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-xs text-gray-400">
              AI is working on your assignment
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">{Math.round(progress)}%</span>
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
