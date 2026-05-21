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
  setProgress: (progress: number, stage: GenerationStage, message?: string) => void;
  setCompleted: (paperId: string) => void;
  setFailed: (error: string) => void;
  setQueued: () => void;
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

  setQueued: () => set({ stage: 'queued', progress: 0, message: 'Queued for processing...', isActive: true, error: null }),
  setProgress: (progress, stage, message) => set({ progress, stage, message: message ?? '', isActive: true }),
  setCompleted: (paperId) => set({ stage: 'completed', progress: 100, paperId, isActive: false }),
  setFailed: (error) => set({ stage: 'failed', error, isActive: false }),
  setWarning: (warning) => set({ warning }),
  reset: () => set({ stage: null, progress: 0, message: '', paperId: null, error: null, warning: null, isActive: false }),
}));
