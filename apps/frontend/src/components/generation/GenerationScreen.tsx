'use client';
import { useMemo } from 'react';
import { useGenerationStore } from '@/store/generation.store';
import { PIPELINE_STEPS } from '@/constants/pipelineSteps';
import type { GenerationStage } from '@/types/socket.types';
import { SuccessView } from './SuccessView';
import { ErrorView } from './ErrorView';

const EXTRA_STEPS: { stage: GenerationStage; label: string; description: string }[] = [
  { stage: 'provider_retry', label: 'Reconnecting AI', description: 'Retrying AI provider connection' },
  { stage: 'validation_retry', label: 'Re-validating', description: 'Retrying content validation' },
  { stage: 'recovering_batches', label: 'Recovering Sections', description: 'Rebuilding failed sections' },
  { stage: 'answer_key_generating', label: 'Preparing Answer Key', description: 'Generating model answers' },
];

const ALL_STAGES_INFO = [...PIPELINE_STEPS, ...EXTRA_STEPS];
const ALL_STAGES = ALL_STAGES_INFO.map(s => s.stage);

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
  assignmentTitle, assignmentSubject, assignmentId, duration,
  generatedQuestionCount, requestedQuestionCount,
  generatedMarks, requestedMarks, schoolName, className, isPartial,
  onRetry, isRetrying,
}: GenerationScreenProps) {
  const { stage, status, progress, message, error } = useGenerationStore();

  const currentStageInfo = useMemo(() => {
    if (!stage || stage === 'failed') return ALL_STAGES_INFO[0];
    const info = ALL_STAGES_INFO.find(s => s.stage === stage);
    return info || ALL_STAGES_INFO[0];
  }, [stage]);

  const showSuccess = status === 'completed' || status === 'partial_success' || isPartial;
  const showError = status === 'failed' || stage === 'failed';
  const showProgress = !showSuccess && !showError;

  const progressValue = Math.round(showSuccess ? 100 : Math.min(99, progress));
  const progressText = message?.trim()
    ? message
    : `${currentStageInfo.description}. Please hold while we finalize this stage.`;
  const progressStrokeOffset = 289 - (289 * Math.max(0, Math.min(100, progressValue))) / 100;

  const resolvedSchoolName = schoolName && schoolName.trim() ? schoolName : 'Delhi Public School';
  const resolvedClassName =
    className &&
    className.trim() &&
    className.trim().toLowerCase() !== 'not specified' &&
    className.trim().toLowerCase() !== 'class not specified'
      ? className
      : 'Class 8';
  const resolvedSubjectName =
    assignmentSubject &&
    assignmentSubject.trim() &&
    assignmentSubject.trim().toLowerCase() !== 'not specified'
      ? assignmentSubject
      : 'Mathematics';
  const cleanedSchoolName =
    resolvedSchoolName.trim().toLowerCase() === 'school'
      ? 'Delhi Public School'
      : resolvedSchoolName;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(circle at center, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="flex-shrink-0 flex items-center justify-between px-6 sm:px-12 py-5 border-b border-gray-200/60 bg-white/50 backdrop-blur-md">
        <div className="flex-1 min-w-0 pr-4">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase truncate">
            {assignmentTitle || 'Assignment Generation'}
          </h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-widest overflow-hidden">
            <span className="truncate">{resolvedSubjectName}</span>
            <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-gray-300" />
            <span className="flex-shrink-0">{resolvedClassName}</span>
            <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-gray-300" />
            <span className="truncate">{cleanedSchoolName}</span>
          </div>
        </div>
      </div>
      {showProgress && (
        <div className="absolute top-5 right-5 z-50 flex items-center gap-3 bg-white px-4 sm:px-5 py-2.5 rounded-full shadow-xl border border-gray-200/90">
          <span className="text-xs sm:text-sm font-bold text-gray-700 tracking-wide uppercase">Generating</span>
          <span className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-12 w-full min-h-[500px]">
        <div>
          {showSuccess ? (
            <div className="w-full flex-1 flex flex-col items-center justify-center py-6">
              <SuccessView
                assignmentId={assignmentId}
                isPartial={isPartial}
                generatedCount={generatedQuestionCount}
                requestedCount={requestedQuestionCount}
                generatedMarks={generatedMarks}
                requestedMarks={requestedMarks}
                duration={duration}
                subject={resolvedSubjectName}
                schoolName={cleanedSchoolName}
                className={resolvedClassName}
                onRegenerate={onRetry}
                isRetrying={isRetrying}
              />
            </div>
          ) : showError ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <ErrorView error={error} onRetry={onRetry} isRetrying={isRetrying} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center max-w-4xl w-full">
              
              <div className="relative flex items-center justify-center mb-16">
                <svg className="w-52 h-52 sm:w-64 sm:h-64 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200 stroke-current"
                    strokeWidth="4"
                    cx="50" cy="50" r="46"
                    fill="transparent"
                  />
                  <circle
                    className="text-orange-500 stroke-current"
                    strokeWidth="4"
                    strokeLinecap="round"
                    cx="50" cy="50" r="46"
                    fill="transparent"
                    strokeDasharray="289 289"
                    strokeDashoffset={progressStrokeOffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tighter tabular-nums">
                    {Math.round(showSuccess ? 100 : Math.min(99, progress))}<span className="text-3xl sm:text-4xl text-gray-400 font-bold ml-1">%</span>
                  </span>
                </div>
                
                <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
              </div>

              <div className="flex flex-col items-center px-4">
                <h2 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight text-center">
                  {currentStageInfo.label}
                </h2>
                <div className="mt-6 max-w-xl">
                  <p className="text-lg sm:text-xl text-gray-500 font-medium tracking-wide text-center">
                    {progressText}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
