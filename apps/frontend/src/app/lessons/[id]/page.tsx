'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BookOpen, Calendar, CheckCircle2, Circle, Download, FileText,
  Video, Link as LinkIcon, ArrowLeft, Loader2, CheckCheck, Target, ListTodo, FileQuestion
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface LessonResource {
  type: 'pdf' | 'notes' | 'video';
  title: string;
  url: string;
}

interface LessonActivity {
  id: string;
  title: string;
  description: string;
}

interface LessonAssessment {
  id: string;
  title: string;
  type: string;
  maxMarks: number;
}

type LessonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type LessonDuration = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  class: string;
  duration: LessonDuration;
  status: LessonStatus;
  objectives: string;
  content: string;
  activities: LessonActivity[];
  assessments: LessonAssessment[];
  resources: LessonResource[];
  createdAt: string;
  updatedAt: string;
}

const resourceIcons: Record<string, React.ReactNode> = {
  pdf: <FileText size={16} />,
  notes: <FileText size={16} />,
  video: <Video size={16} />,
};

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: Lesson }>(`/lessons/${id}`);
      setLesson(res.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load lesson');
      toast.error('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  const fetchCompletion = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: { completed: boolean } }>(`/lessons/${id}/completion`);
      setCompleted(res.data.data?.completed ?? false);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    if (user?.role === 'STUDENT') fetchCompletion();
  }, [user, fetchCompletion]);

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      if (completed) {
        await api.delete(`/lessons/${id}/completion`);
        setCompleted(false);
        toast.success('Marked as incomplete');
      } else {
        await api.post(`/lessons/${id}/completion`);
        setCompleted(true);
        toast.success('Lesson marked as complete!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update completion');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--page-pad)', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div className="skeleton" style={{ height: 32, width: 200, borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: 300, borderRadius: 4, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 160, borderRadius: 16, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="empty-state" style={{ padding: '80px var(--page-pad)' }}>
        <h2 className="empty-title">Lesson not found</h2>
        <p className="empty-desc">{error || 'The requested lesson could not be loaded.'}</p>
        <div className="empty-state-actions">
          <button type="button" onClick={fetchLesson} className="btn btn-dark btn-pill">Retry</button>
          <Link href="/lessons" className="btn btn-secondary btn-pill">Back to Lessons</Link>
        </div>
      </div>
    );
  }

  const isStudent = user?.role === 'STUDENT';

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <button
        onClick={() => router.back()}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <BookOpen size={22} color="var(--brand)" />
              <h1 style={{ fontSize: 'clamp(18px, 2vw, 22px)', fontWeight: 800, color: 'var(--text-primary)' }}>{lesson.title}</h1>
            </div>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', marginTop: 2 }}>
              {lesson.subject} &middot; {lesson.class || lesson.grade} &middot;
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#EDE9FE', color: '#7C3AED', marginLeft: 6 }}>
                {lesson.duration}
              </span>
            </p>
          </div>
          {isStudent && (
            <button
              onClick={handleMarkComplete}
              disabled={completing}
              className={`btn ${completed ? 'btn-secondary' : 'btn-primary'} btn-pill`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            >
              {completing ? <Loader2 size={14} className="animate-spin" /> : completed ? <CheckCheck size={16} /> : <Circle size={16} />}
              {completed ? 'Completed' : 'Mark as Complete'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={13} /> Created: {new Date(lesson.createdAt).toLocaleDateString()}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={13} /> Updated: {new Date(lesson.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </motion.div>

      {lesson.objectives && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Target size={18} color="var(--brand)" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Objectives</h3>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{lesson.objectives}</div>
        </motion.div>
      )}

      {lesson.content && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Content</h3>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-page)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
            {lesson.content}
          </div>
        </motion.div>
      )}

      {lesson.activities && lesson.activities.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ListTodo size={18} color="var(--brand)" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Activities ({lesson.activities.length})</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lesson.activities.map((activity, i) => (
              <div key={activity.id} style={{ padding: '12px 14px', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {i + 1}. {activity.title}
                </div>
                {activity.description && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{activity.description}</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {lesson.assessments && lesson.assessments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileQuestion size={18} color="var(--brand)" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Assessments ({lesson.assessments.length})</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lesson.assessments.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8, textTransform: 'capitalize' }}>{item.type}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{item.maxMarks} marks</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {lesson.resources && lesson.resources.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Resources</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lesson.resources.map((resource, i) => (
              <a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-page)',
                  border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'inherit', transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.background = 'var(--brand-light)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-page)'; }}
              >
                <span style={{ color: 'var(--brand)' }}>
                  {resource.type === 'pdf' ? <FileText size={16} /> : resource.type === 'video' ? <Video size={16} /> : <FileText size={16} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{resource.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{resource.type}</div>
                </div>
                <Download size={14} color="var(--text-muted)" />
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {isStudent && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={handleMarkComplete}
            disabled={completing}
            className={`btn ${completed ? 'btn-secondary' : 'btn-primary'} btn-pill`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {completing ? <Loader2 size={14} className="animate-spin" /> : completed ? <CheckCheck size={16} /> : <Circle size={16} />}
            {completed ? 'Completed' : 'Mark as Complete'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
