'use client';
import { motion } from 'framer-motion';

export interface TileConfig {
  id: string;
  icon: string;
  label: string;
  description: string;
}

interface GenerationTileProps {
  tile: TileConfig;
  state: 'pending' | 'active' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  index: number;
  reduceMotion?: boolean | null;
}

const stateStyles: Record<string, { border: string; bg: string }> = {
  pending: { border: 'border-[var(--border)]', bg: 'bg-[var(--bg-input)]' },
  active: { border: 'border-[var(--brand-border)]', bg: 'bg-white' },
  completed: { border: 'border-emerald-200', bg: 'bg-emerald-50/50' },
  failed: { border: 'border-red-200', bg: 'bg-red-50/50' },
};

export function GenerationTile({ tile, state, message, index, reduceMotion }: GenerationTileProps) {
  const s = stateStyles[state];

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className={`rounded-xl border ${s.border} ${s.bg} p-4 transition-colors duration-300`}
      aria-current={state === 'active' ? 'step' : undefined}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
            state === 'completed'
              ? 'bg-emerald-100 text-emerald-700'
              : state === 'active'
                ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                : state === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
          }`}
          aria-hidden
        >
          {state === 'completed' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            tile.icon
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium ${
              state === 'completed'
                ? 'text-emerald-800'
                : state === 'active'
                  ? 'text-[var(--text-primary)]'
                  : state === 'failed'
                    ? 'text-red-800'
                    : 'text-[var(--text-muted)]'
            }`}
          >
            {tile.label}
          </h3>
          <p
            className={`text-xs mt-0.5 leading-relaxed ${
              state === 'active' ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {state === 'active' && message ? message : tile.description}
          </p>
        </div>
      </div>
    </motion.li>
  );
}
