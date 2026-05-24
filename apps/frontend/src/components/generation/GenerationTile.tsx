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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
      className={`relative rounded-2xl border ${s.border} ${s.bg} ${s.shadow} p-5 transition-all duration-500`}
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
        <div className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-xl transition-all duration-500 ${s.iconFilter}`}>
          {state === 'completed' ? (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="flex h-full w-full items-center justify-center rounded-xl bg-emerald-100"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
          ) : (
            <span>{tile.icon}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold transition-colors duration-300 ${
              state === 'completed' ? 'text-emerald-700' :
              state === 'active' ? 'text-gray-900' :
              state === 'failed' ? 'text-red-700' :
              'text-gray-400'
            }`}>
              {tile.label}
            </h3>
            {state === 'active' && (
              <span className="flex gap-0.5">
                <motion.span className="h-1.5 w-1.5 rounded-full bg-orange-500" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
                <motion.span className="h-1.5 w-1.5 rounded-full bg-orange-500" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
                <motion.span className="h-1.5 w-1.5 rounded-full bg-orange-500" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
              </span>
            )}
            {state === 'completed' && (
              <span className="text-emerald-500 text-xs font-medium">Done</span>
            )}
          </div>
          <p className={`text-xs mt-0.5 transition-colors duration-300 ${
            state === 'completed' ? 'text-emerald-600/70' :
            state === 'active' ? 'text-gray-500' :
            'text-gray-300'
          }`}>
            {state === 'active' && message ? message : tile.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
