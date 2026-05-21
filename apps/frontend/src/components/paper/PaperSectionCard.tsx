'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import type { PaperSection } from '@/types';

interface PaperSectionCardProps {
  section: PaperSection;
  sectionNumber: number;
}

const typeLabels: Record<string, string> = {
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  mcq: 'Multiple Choice',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
};

const difficultyStyles: Record<string, string> = {
  easy: 'pill-easy',
  medium: 'pill-medium',
  hard: 'pill-hard',
};

export function PaperSectionCard({ section, sectionNumber }: PaperSectionCardProps) {
  const totalMarks = section.questions.reduce((s, q) => s + q.marks, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sectionNumber * 0.08 }}
      className="card-dark space-y-4"
    >
      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-600 uppercase tracking-widest font-medium mb-1">
            Section {sectionNumber}
          </div>
          <h3 className="text-lg font-bold text-zinc-100">{section.title}</h3>
          {section.instructions && (
            <p className="text-sm text-zinc-500 mt-1 italic">{section.instructions}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold gradient-text">{totalMarks}</div>
          <div className="text-xs text-zinc-600">marks</div>
        </div>
      </div>

      {/* Type badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
          {typeLabels[section.type] ?? section.type}
        </span>
        <span className="text-xs text-zinc-600">{section.questions.length} questions</span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.05]" />

      {/* Questions */}
      <div className="space-y-4">
        {section.questions.map((q, idx) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: sectionNumber * 0.08 + idx * 0.04 }}
            className="flex items-start gap-3 group"
          >
            <span className="text-xs text-zinc-600 w-5 pt-0.5 shrink-0 font-mono">
              {idx + 1}.
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 leading-relaxed">{q.question}</p>

              {/* MCQ options */}
              {q.options && q.options.length > 0 && (
                <div className="mt-2 space-y-1.5 pl-1">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2 text-xs text-zinc-500">
                      <Circle size={10} className="shrink-0 text-zinc-700" />
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer (if present — for teacher view) */}
              {q.answer && (
                <details className="mt-2">
                  <summary className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    View Answer
                  </summary>
                  <div className="mt-2 pl-3 border-l-2 border-indigo-500/30 text-xs text-zinc-400 leading-relaxed">
                    {q.answer}
                  </div>
                </details>
              )}
            </div>

            {/* Right meta */}
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <span className={difficultyStyles[q.difficulty] ?? 'text-zinc-600 text-xs'}>
                {q.difficulty}
              </span>
              <span className="text-xs text-zinc-600 font-mono">[{q.marks}m]</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
