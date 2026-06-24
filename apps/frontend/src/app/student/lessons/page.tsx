'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BookOpen, RefreshCw, CheckCircle2, Circle, Clock, ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface StudentLesson {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  duration: string;
  status: string;
  completedCount: number;
  totalCount: number;
  createdAt: string;
}

function LessonCardSkeleton() {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 4, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 8, width: '100%', borderRadius: 4, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 4 }} />
    </div>
  );
}

export default function StudentLessonsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [lessons, setLessons] = useState<StudentLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: StudentLesson[] }>('/student/lessons');
      setLessons(res.data.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load lessons');
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      <div className="desktop-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={24} color="var(--brand)" />
          <h1 className="page-title">My Lessons</h1>
        </div>
        <p className="page-subtitle">Browse and track your assigned lessons.</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <LessonCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="empty-state">
          <h2 className="empty-title">Failed to load lessons</h2>
          <p className="empty-desc">{error}</p>
          <div className="empty-state-actions">
            <button onClick={fetchLessons} className="btn btn-dark btn-pill"><RefreshCw size={14} /> Retry</button>
          </div>
        </div>
      ) : lessons.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} color="#9CA3AF" />
          <h2 className="empty-title">No lessons assigned</h2>
          <p className="empty-desc">Your teacher hasn&apos;t assigned any lessons yet. Check back later.</p>
          <div className="empty-state-actions">
            <Link href="/student" className="btn btn-secondary btn-pill">Back to Dashboard</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {lessons.map((lesson, i) => {
            const progressPct = lesson.totalCount > 0 ? Math.round((lesson.completedCount / lesson.totalCount) * 100) : 0;
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, padding: 18 }}
                onClick={() => router.push(`/lessons/${lesson.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lesson.title}
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {lesson.subject} {lesson.teacher ? `\u00B7 ${lesson.teacher}` : ''}
                    </div>
                  </div>
                  {progressPct === 100 ? (
                    <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0 }} />
                  ) : progressPct > 0 ? (
                    <Clock size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
                  ) : (
                    <Circle size={18} color="#D1D5DB" style={{ flexShrink: 0 }} />
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: progressPct === 100 ? '#10B981' : 'var(--brand)', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {lesson.completedCount}/{lesson.totalCount}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> {lesson.duration}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand)', fontWeight: 600 }}>
                    View <ArrowRight size={11} />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
