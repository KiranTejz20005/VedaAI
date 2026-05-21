'use client';

import { motion } from 'framer-motion';
import { Download, Printer, BookOpen, Clock, FileText, BarChart3 } from 'lucide-react';
import type { GeneratedPaperFull as GeneratedPaper } from '@/types';

interface PaperHeaderProps {
  paper: GeneratedPaper;
  onExport?: () => void;
  onPrint?: () => void;
}

const difficultyColors: Record<string, string> = {
  easy: 'text-emerald-400',
  medium: 'text-amber-400',
  hard: 'text-red-400',
};

export function PaperHeader({ paper, onExport, onPrint }: PaperHeaderProps) {
  const totalMarks = paper.sections.reduce(
    (acc, sec) => acc + sec.questions.reduce((s, q) => s + q.marks, 0),
    0,
  );
  const totalQuestions = paper.sections.reduce((acc, sec) => acc + sec.questions.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass neon-border rounded-2xl p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: info */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <BookOpen size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">{paper.title}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{paper.subject}</p>
            {paper.instructions && (
              <p className="text-xs text-zinc-600 mt-2 italic max-w-lg">{paper.instructions}</p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onPrint && (
            <button
              id="paper-print-btn"
              onClick={onPrint}
              className="btn-secondary text-sm px-3.5 py-2 flex items-center gap-1.5"
            >
              <Printer size={14} />
              Print
            </button>
          )}
          {onExport && (
            <button
              id="paper-export-btn"
              onClick={onExport}
              className="btn-primary text-sm px-3.5 py-2 flex items-center gap-1.5"
            >
              <Download size={14} />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat icon={FileText} label="Questions" value={String(totalQuestions)} />
        <Stat icon={BarChart3} label="Total Marks" value={String(totalMarks)} />
        <Stat icon={Clock} label="Duration" value={`${paper.duration} min`} />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-600 flex items-center gap-1">
            <BarChart3 size={11} />
            Difficulty
          </span>
          <span className={`text-sm font-semibold capitalize ${difficultyColors[paper.difficulty] ?? 'text-zinc-400'}`}>
            {paper.difficulty}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-zinc-600 flex items-center gap-1">
        <Icon size={11} />
        {label}
      </span>
      <span className="text-sm font-semibold text-zinc-200">{value}</span>
    </div>
  );
}
