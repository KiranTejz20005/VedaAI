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
}

const stateStyles: Record<string, { border: string; bg: string; shadow: string; iconFilter: string }> = {
  pending: {
    border: 'border-gray-100',
    bg: 'bg-white',
    shadow: 'shadow-sm',
    iconFilter: 'opacity-40 grayscale',
  },
  active: {
    border: 'border-orange-300',
    bg: 'bg-white',
    shadow: 'shadow-[0_0_20px_rgba(232,83,29,0.10)]',
    iconFilter: 'opacity-100',
  },
  completed: {
    border: 'border-emerald-300',
    bg: 'bg-emerald-50/60',
    shadow: 'shadow-[0_0_16px_rgba(16,185,129,0.10)]',
    iconFilter: 'opacity-100',
  },
  failed: {
    border: 'border-red-300',
    bg: 'bg-red-50/60',
    shadow: 'shadow-[0_0_16px_rgba(239,68,68,0.10)]',
    iconFilter: 'opacity-100',
  },
};

export function GenerationTile({ tile, state, message, index }: GenerationTileProps) {
  const s = stateStyles[state];
  const stateTag =
    state === 'completed'
      ? '[COMPLETE]'
      : state === 'active'
        ? '[PROCESSING]'
        : state === 'failed'
          ? '[FAILED]'
          : '[WAITING]';
  const tagClass =
    state === 'completed'
      ? 'bg-emerald-100 text-emerald-700'
      : state === 'active'
        ? 'bg-orange-100 text-orange-700'
        : state === 'failed'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
      className={`relative rounded-2xl border ${s.border} ${s.bg} ${s.shadow} p-4 transition-all duration-500`}
    >
      {state === 'active' && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'linear-gradient(135deg, rgba(232,83,29,0.04), rgba(232,83,29,0.01))',
            boxShadow: 'inset 0 0 0 1.5px rgba(232,83,29,0.15)',
          }}
        />
      )}

      <div className="flex items-start gap-4">
        <div className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-xl transition-all duration-500 ${s.iconFilter}`}>
          {state === 'completed' ? (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="flex h-full w-full items-center justify-center rounded-xl bg-emerald-100"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
          ) : (
            <span>{tile.icon}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-center justify-between gap-3">
            <h3 className={`text-base font-bold transition-colors duration-300 ${
              state === 'completed' ? 'text-emerald-700' :
              state === 'active' ? 'text-gray-900' :
              state === 'failed' ? 'text-red-700' :
              'text-gray-400'
            }`}>
              {tile.label}
            </h3>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide ${tagClass}`}>
              {stateTag}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {state === 'active' && (
              <span className="flex gap-1">
                <motion.span className="h-2 w-2 rounded-full bg-orange-500" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
                <motion.span className="h-2 w-2 rounded-full bg-orange-500" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
                <motion.span className="h-2 w-2 rounded-full bg-orange-500" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
              </span>
            )}
          </div>
          <p className={`text-sm mt-1 transition-colors duration-300 font-medium ${
            state === 'completed' ? 'text-emerald-600/80' :
            state === 'active' ? 'text-gray-600' :
            'text-gray-400'
          }`}>
            {state === 'active' && message ? message : tile.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
