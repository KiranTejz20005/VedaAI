'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { RefreshCw, Zap, CheckCircle2, ChevronRight, FileText, Clock, Trophy } from 'lucide-react';

interface SuccessViewProps {
  assignmentId: string;
  isPartial: boolean;
  generatedCount: number | null | undefined;
  requestedCount: number | null | undefined;
  generatedMarks: number | null | undefined;
  requestedMarks: number | null | undefined;
  duration: number;
  subject?: string;
  schoolName?: string;
  className?: string;
  onRegenerate: () => void;
  isRetrying: boolean;
}

export function SuccessView({
  assignmentId, isPartial, generatedCount, requestedCount,
  generatedMarks, requestedMarks, duration, subject, schoolName, className,
  onRegenerate, isRetrying,
}: SuccessViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 py-4 sm:py-6 gap-6 sm:gap-8 md:gap-10"
    >
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-emerald-50/80 to-transparent -z-10 pointer-events-none" />

      {/* Hero Section */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="text-center flex flex-col items-center max-w-3xl flex-shrink-0"
      >
        <div className="relative flex items-center justify-center mb-3 mt-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)] relative z-10"
          >
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" strokeWidth={2.5} />
          </motion.div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-emerald-400 rounded-full blur-lg z-0"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-[1.15] mb-2">
          {isPartial ? 'Partially Generated' : 'Assignment Ready'}
        </h1>
        
        <p className="text-sm sm:text-base text-gray-500 font-medium max-w-2xl leading-relaxed">
          {isPartial
            ? `We successfully generated ${generatedCount ?? 'some'} out of ${requestedCount ?? '?'} questions. You can view the partial results or regenerate.`
            : 'The AI has finished crafting your assignment. It is perfectly structured and ready for review.'}
        </p>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-4xl px-6 flex-shrink-0"
      >
        {[
          { label: 'Questions', value: generatedCount !== null && generatedCount !== undefined ? `${generatedCount}/${requestedCount}` : (requestedCount ?? '-'), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Marks', value: generatedMarks !== null && generatedMarks !== undefined ? `${generatedMarks}/${requestedMarks}` : (requestedMarks ?? '-'), icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Duration', value: `${duration} min`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
            className="flex flex-col items-center justify-center relative p-1 flex-shrink-0"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div>
              <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">{String(stat.value)}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xl flex-shrink-0"
      >
        <Link
          href={`/assignments/${assignmentId}/paper`}
          className="flex-1 flex items-center justify-center gap-2.5 w-full bg-gray-900 text-white rounded-full px-6 py-3.5 sm:py-4 text-base sm:text-lg font-bold shadow-lg shadow-gray-900/10 hover:bg-gray-800 hover:scale-[1.02] transition-all duration-300 min-h-[48px] sm:min-h-[54px]"
        >
          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          {isPartial ? 'View Partial Paper' : 'View Assignment'}
        </Link>
        <button
          onClick={onRegenerate}
          disabled={isRetrying}
          className="flex-1 flex items-center justify-center gap-2.5 w-full bg-white text-gray-800 border border-gray-200 rounded-full px-6 py-3.5 sm:py-4 text-base sm:text-lg font-bold shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 min-h-[48px] sm:min-h-[54px]"
        >
          <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Regenerating...' : 'Regenerate'}
        </button>
      </motion.div>
    </motion.div>
  );
}
