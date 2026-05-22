import { create } from 'zustand';
import type { GenerationStage } from '../types/socket.types';

interface GenerationState {
  stage: GenerationStage | null;
  progress: number;
  message: string;
  paperId: string | null;
  error: string | null;
  warning: string | null;
  isActive: boolean;
  activeJobRecordId: string | null;
  generationSeq: number | null;
  lastEventTs: number;
  setQueued: (jobRecordId: string, generationSeq: number, ts?: number) => void;
  setProgress: (jobRecordId: string, generationSeq: number, ts: number, progress: number, stage: GenerationStage, message?: string) => void;
  setCompleted: (jobRecordId: string, generationSeq: number, ts: number, paperId: string) => void;
  setFailed: (jobRecordId: string, generationSeq: number, ts: number, error: string) => void;
  setWarning: (warning: string) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  stage: null,
  progress: 0,
  message: '',
  paperId: null,
  error: null,
  warning: null,
  isActive: false,
  activeJobRecordId: null,
  generationSeq: null,
  lastEventTs: 0,

  setQueued: (jobRecordId, generationSeq, ts) =>
    set({
      stage: 'queued',
      progress: 0,
      message: 'Queued for processing...',
      isActive: true,
      error: null,
      activeJobRecordId: jobRecordId,
      generationSeq,
      lastEventTs: Math.max(0, ts ?? Date.now()),
    }),

  setProgress: (jobRecordId, generationSeq, ts, progress, stage, message) =>
    set((s) => {
      // Ignore stale/out-of-order events.
      if (s.activeJobRecordId && s.activeJobRecordId !== jobRecordId) return s;
      if (s.generationSeq !== null && s.generationSeq !== generationSeq) return s;
      if (ts < (s.lastEventTs ?? 0)) return s;
      // Never regress terminal states for the active job.
      if (s.stage === 'completed' || s.stage === 'failed') return s;
      return {
        ...s,
        progress,
        stage,
        message: message ?? '',
        isActive: true,
        activeJobRecordId: s.activeJobRecordId ?? jobRecordId,
        generationSeq: s.generationSeq ?? generationSeq,
        lastEventTs: ts,
      };
    }),

  setCompleted: (jobRecordId, generationSeq, ts, paperId) =>
    set((s) => {
      if (s.activeJobRecordId && s.activeJobRecordId !== jobRecordId) return s;
      if (s.generationSeq !== null && s.generationSeq !== generationSeq) return s;
      if (ts < (s.lastEventTs ?? 0)) return s;
      return {
        ...s,
        stage: 'completed',
        progress: 100,
        paperId,
        isActive: false,
        error: null,
        activeJobRecordId: s.activeJobRecordId ?? jobRecordId,
        generationSeq: s.generationSeq ?? generationSeq,
        lastEventTs: ts,
      };
    }),

  setFailed: (jobRecordId, generationSeq, ts, error) =>
    set((s) => {
      if (s.activeJobRecordId && s.activeJobRecordId !== jobRecordId) return s;
      if (s.generationSeq !== null && s.generationSeq !== generationSeq) return s;
      if (ts < (s.lastEventTs ?? 0)) return s;
      // Don't allow a late failure to overwrite completion for the active job.
      if (s.stage === 'completed') return s;
      return {
        ...s,
        stage: 'failed',
        error,
        isActive: false,
        activeJobRecordId: s.activeJobRecordId ?? jobRecordId,
        generationSeq: s.generationSeq ?? generationSeq,
        lastEventTs: ts,
      };
    }),

  setWarning: (warning) => set({ warning }),
  reset: () =>
    set({
      stage: null,
      progress: 0,
      message: '',
      paperId: null,
      error: null,
      warning: null,
      isActive: false,
      activeJobRecordId: null,
      generationSeq: null,
      lastEventTs: 0,
    }),
}));
