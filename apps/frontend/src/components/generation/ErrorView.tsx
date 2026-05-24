'use client';

import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface ErrorViewProps {
  error: string | null;
  onRetry: () => void;
  isRetrying: boolean;
}

export function ErrorView({ error, onRetry, isRetrying }: ErrorViewProps) {
  return (
    <motion.article
      className="gen-result-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="gen-error-icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#DC2626"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </motion.div>

      <h2 className="gen-result-title" style={{ fontSize: 'clamp(22px, 3vw, 28px)' }}>
        Generation Interrupted
      </h2>
      <p className="gen-result-desc">
        We hit a small issue while generating your assignment. You can retry or adjust your materials.
      </p>
      {error ? (
        <p
          className="gen-result-desc"
          style={{
            marginTop: 12,
            fontSize: 'var(--text-xs)',
            fontFamily: 'ui-monospace, monospace',
            background: 'var(--bg-page)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            maxWidth: '28rem',
          }}
        >
          {error}
        </p>
      ) : null}

      <div className="gen-result-actions">
        <button type="button" onClick={onRetry} disabled={isRetrying} className="gen-btn-primary">
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} aria-hidden />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    </motion.article>
  );
}
