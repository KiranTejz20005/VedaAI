'use client';

import React from 'react';
import { BloomLevel } from './BloomClassificationBadge';

const BLOOM_OPTIONS: BloomLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

interface BloomOverrideSelectProps {
  currentLevel: BloomLevel;
  predictedLevel?: BloomLevel;
  onChange: (newLevel: BloomLevel) => void;
  disabled?: boolean;
}

export function BloomOverrideSelect({
  currentLevel,
  predictedLevel,
  onChange,
  disabled = false,
}: BloomOverrideSelectProps) {
  const isOverridden = predictedLevel && currentLevel !== predictedLevel;

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentLevel}
        onChange={(e) => onChange(e.target.value as BloomLevel)}
        disabled={disabled}
        className={`text-xs font-semibold rounded-md border px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors ${
          isOverridden
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
        }`}
        aria-label="Select Bloom Level Override"
      >
        {BLOOM_OPTIONS.map((lvl) => (
          <option key={lvl} value={lvl}>
            {lvl} {predictedLevel === lvl ? '(AI Auto)' : ''}
          </option>
        ))}
      </select>
      {isOverridden && predictedLevel && (
        <button
          type="button"
          onClick={() => onChange(predictedLevel)}
          className="text-[10px] text-slate-500 hover:text-indigo-600 underline font-medium"
          title={`Reset to AI prediction (${predictedLevel})`}
        >
          Reset
        </button>
      )}
    </div>
  );
}
