'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Hourglass,
  Zap,
  BrainCircuit,
  FileCheck2,
  Database,
} from 'lucide-react';
import type { GenerationStatus } from '@/types';

interface GenerationProgressProps {
  status: GenerationStatus;
  progress: number; // 0-100
  stage: string;
  error?: string;
  onComplete?: () => void;
}

const STAGES = [
  { key: 'queued', label: 'Queued', icon: Hourglass },
  { key: 'processing', label: 'Processing', icon: Zap },
  { key: 'generating', label: 'Generating', icon: BrainCircuit },
  { key: 'parsing', label: 'Parsing', icon: FileCheck2 },
  { key: 'saving', label: 'Saving', icon: Database },
  { key: 'completed', label: 'Done', icon: CheckCircle2 },
];

const stageIndex = (stage: string) =>
  STAGES.findIndex((s) => s.key === stage);

export function GenerationProgress({
  status,
  progress,
  stage,
  error,
  onComplete,
}: GenerationProgressProps) {
  const currentIdx = stageIndex(stage);

  useEffect(() => {
    if (status === 'completed' && onComplete) {
      const t = setTimeout(onComplete, 1200);
      return () => clearTimeout(t);
    }
  }, [status, onComplete]);

  if (status === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass neon-border rounded-2xl p-6 border-red-500/30"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-red-300">Generation Failed</p>
            <p className="text-sm text-zinc-500 mt-1">{error ?? 'An unexpected error occurred.'}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass neon-border rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            {status === 'completed' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <Loader2 size={18} className="text-indigo-400 animate-spin" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">
              {status === 'completed' ? 'Paper Generated!' : 'Generating your paper…'}
            </p>
            <p className="text-xs text-zinc-500 capitalize">{stage}</p>
          </div>
        </div>
        <span className="text-sm font-mono text-indigo-400">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 progress-bar rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Stage pills */}
      <div className="flex flex-wrap gap-2">
        {STAGES.map(({ key, label, icon: Icon }, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <AnimatePresence key={key}>
              <motion.div
                layout
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  done
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : active
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                    : 'bg-white/[0.03] border-white/[0.06] text-zinc-600'
                }`}
              >
                <Icon
                  size={10}
                  className={active ? 'animate-pulse' : ''}
                />
                {label}
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>
    </motion.div>
  );
}
