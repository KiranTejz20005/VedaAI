'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Plus, Search, Loader2, BookOpen, Eye, Archive, Edit3, X,
  FileText, GripVertical, Save
} from 'lucide-react';
import { api } from '@/lib/api';

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
  resourceCount: number;
  createdAt: string;
  updatedAt: string;
}

const initialForm = {
  title: '',
  subject: '',
  grade: '',
  class: '',
  duration: 'DAILY' as LessonDuration,
  objectives: '',
  content: '',
  activities: [] as LessonActivity[],
  assessments: [] as LessonAssessment[],
  resources: [] as LessonResource[],
};

function StatusBadge({ status }: { status: LessonStatus }) {
  const map: Record<LessonStatus, { cls: string; label: string }> = {
    DRAFT: { cls: 'badge-draft', label: 'Draft' },
    PUBLISHED: { cls: 'badge-completed', label: 'Published' },
    ARCHIVED: { cls: 'badge-failed', label: 'Archived' },
  };
  const { cls, label } = map[status] ?? map.DRAFT;
  return <span className={`badge ${cls}`}>{label}</span>;
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: '14px 12px' }}>
          <div className="skeleton" style={{ height: 16, width: i === 0 ? 160 : 80, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

export default function LessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [statusFilter, setStatusFilter] = useState<LessonStatus | 'ALL'>('ALL');

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: Lesson[] }>('/lessons');
      setLessons(res.data.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load lessons');
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const openCreate = () => {
    setEditingLesson(null);
    setForm(initialForm);
    setDialogOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title,
      subject: lesson.subject,
      grade: lesson.grade,
      class: lesson.class,
      duration: lesson.duration,
      objectives: lesson.objectives,
      content: lesson.content,
      activities: lesson.activities ?? [],
      assessments: lesson.assessments ?? [],
      resources: lesson.resources ?? [],
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim()) {
      toast.error('Title and subject are required');
      return;
    }
    setSaving(true);
    try {
      if (editingLesson) {
        await api.put(`/lessons/${editingLesson.id}`, form);
        toast.success('Lesson updated');
      } else {
        await api.post('/lessons', form);
        toast.success('Lesson created');
      }
      setDialogOpen(false);
      await fetchLessons();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Archive this lesson?')) return;
    try {
      await api.put(`/lessons/${id}/archive`);
      toast.success('Lesson archived');
      await fetchLessons();
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive');
    }
  };

  const addActivity = () => {
    setForm(f => ({
      ...f,
      activities: [...f.activities, { id: String(Date.now()), title: '', description: '' }],
    }));
  };

  const removeActivity = (id: string) => {
    setForm(f => ({ ...f, activities: f.activities.filter(a => a.id !== id) }));
  };

  const updateActivity = (id: string, field: string, value: string) => {
    setForm(f => ({
      ...f,
      activities: f.activities.map(a => a.id === id ? { ...a, [field]: value } : a),
    }));
  };

  const addAssessmentItem = () => {
    setForm(f => ({
      ...f,
      assessments: [...f.assessments, { id: String(Date.now()), title: '', type: 'quiz', maxMarks: 10 }],
    }));
  };

  const removeAssessmentItem = (id: string) => {
    setForm(f => ({ ...f, assessments: f.assessments.filter(a => a.id !== id) }));
  };

  const updateAssessmentItem = (id: string, field: string, value: string | number) => {
    setForm(f => ({
      ...f,
      assessments: f.assessments.map(a => a.id === id ? { ...a, [field]: value } : a),
    }));
  };

  const addResource = () => {
    setForm(f => ({
      ...f,
      resources: [...f.resources, { type: 'pdf' as const, title: '', url: '' }],
    }));
  };

  const removeResource = (i: number) => {
    setForm(f => ({
      ...f,
      resources: f.resources.filter((_, idx) => idx !== i),
    }));
  };

  const updateResource = (i: number, field: string, value: string) => {
    setForm(f => ({
      ...f,
      resources: f.resources.map((r, idx) => idx === i ? { ...r, [field]: value } : r),
    }));
  };

  const filtered = lessons.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      <div className="desktop-page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={24} color="var(--brand)" />
              <h1 className="page-title">Lesson Management</h1>
            </div>
            <p className="page-subtitle">Create and manage lessons for your classes</p>
          </div>
          <button className="btn btn-dark btn-pill" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Create Lesson
          </button>
        </div>
      </div>

      <div className="search-filter-row" style={{ marginBottom: 20 }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input search-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
          {(['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-secondary'}`}
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                  {['Title', 'Subject', 'Class', 'Duration', 'Status', 'Resources', 'Created', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <h2 className="empty-title">Failed to load lessons</h2>
          <p className="empty-desc">{error}</p>
          <div className="empty-state-actions">
            <button type="button" onClick={fetchLessons} className="btn btn-dark btn-pill">Retry</button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} color="#9CA3AF" />
          <h2 className="empty-title">
            {search || statusFilter !== 'ALL' ? 'No matching lessons' : 'No lessons yet'}
          </h2>
          <p className="empty-desc">
            {search || statusFilter !== 'ALL'
              ? 'Try adjusting your search or filters.'
              : 'Create your first lesson to get started.'}
          </p>
          <div className="empty-state-actions">
            <button className="btn btn-dark btn-pill" onClick={openCreate}>
              <Plus size={16} /> Create Lesson
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Class</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Duration</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Resources</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lesson) => (
                  <tr
                    key={lesson.id}
                    style={{ borderBottom: '1px solid #F3F4F6', fontSize: 14, transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => router.push(`/lessons/${lesson.id}`)}
                  >
                    <td style={{ padding: '14px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={14} color="var(--brand)" />
                        {lesson.title}
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{lesson.subject}</td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{lesson.class || lesson.grade || '—'}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#EDE9FE', color: '#7C3AED' }}>
                        {lesson.duration}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}><StatusBadge status={lesson.status} /></td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{lesson.resourceCount ?? lesson.resources?.length ?? 0}</td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(lesson.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', gap: 4 }}
                          onClick={() => openEdit(lesson)}
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', gap: 4 }}
                          onClick={() => router.push(`/lessons/${lesson.id}`)}
                          title="Preview"
                        >
                          <Eye size={13} />
                        </button>
                        {lesson.status !== 'ARCHIVED' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', gap: 4, color: '#D97706' }}
                            onClick={() => handleArchive(lesson.id)}
                            title="Archive"
                          >
                            <Archive size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {dialogOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDialogOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="card"
              style={{ width: '100%', maxWidth: 720, position: 'relative', zIndex: 101, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={20} color="var(--brand)" />
                  {editingLesson ? 'Edit Lesson' : 'Create Lesson'}
                </h3>
                <button onClick={() => setDialogOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label className="label">Title</label>
                    <input type="text" className="input" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Lesson title" required />
                  </div>
                  <div className="input-group">
                    <label className="label">Subject</label>
                    <input type="text" className="input" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" required />
                  </div>
                  <div className="input-group">
                    <label className="label">Grade/Class</label>
                    <input type="text" className="input" value={form.grade} onChange={(e) => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="e.g. Class 10" />
                  </div>
                  <div className="input-group">
                    <label className="label">Duration</label>
                    <select className="input" value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: e.target.value as LessonDuration }))} style={{ height: 38 }}>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="label">Objectives</label>
                  <textarea className="input" value={form.objectives} onChange={(e) => setForm(f => ({ ...f, objectives: e.target.value }))} placeholder="Learning objectives..." rows={3} style={{ resize: 'vertical' }} />
                </div>

                <div className="input-group">
                  <label className="label">Content (Markdown supported)</label>
                  <textarea className="input" value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Lesson content in markdown..." rows={6} style={{ resize: 'vertical', fontFamily: 'monospace' }} />
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="label" style={{ fontSize: 14 }}>Activities</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addActivity} style={{ gap: 4 }}>
                      <Plus size={13} /> Add Activity
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.activities.map((activity) => (
                      <div key={activity.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <GripVertical size={14} color="var(--text-muted)" style={{ marginTop: 10, flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <input type="text" className="input" placeholder="Activity title" value={activity.title}
                            onChange={(e) => updateActivity(activity.id, 'title', e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />
                          <input type="text" className="input" placeholder="Description" value={activity.description}
                            onChange={(e) => updateActivity(activity.id, 'description', e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />
                        </div>
                        <button type="button" onClick={() => removeActivity(activity.id)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', marginTop: 6, padding: 4 }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="label" style={{ fontSize: 14 }}>Assessments</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addAssessmentItem} style={{ gap: 4 }}>
                      <Plus size={13} /> Add Assessment
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.assessments.map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <FileText size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <input type="text" className="input" placeholder="Assessment title" value={item.title}
                          onChange={(e) => updateAssessmentItem(item.id, 'title', e.target.value)} style={{ flex: 2, padding: '6px 10px', fontSize: 13 }} />
                        <select className="input" value={item.type} onChange={(e) => updateAssessmentItem(item.id, 'type', e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: 13, height: 30 }}>
                          <option value="quiz">Quiz</option>
                          <option value="test">Test</option>
                          <option value="assignment">Assignment</option>
                          <option value="exam">Exam</option>
                        </select>
                        <input type="number" className="input" placeholder="Marks" value={item.maxMarks}
                          onChange={(e) => updateAssessmentItem(item.id, 'maxMarks', Number(e.target.value))} style={{ width: 70, padding: '6px 10px', fontSize: 13 }} />
                        <button type="button" onClick={() => removeAssessmentItem(item.id)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="label" style={{ fontSize: 14 }}>Resources</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addResource} style={{ gap: 4 }}>
                      <Plus size={13} /> Add Resource
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.resources.map((resource, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select className="input" value={resource.type} onChange={(e) => updateResource(i, 'type', e.target.value)} style={{ width: 100, padding: '6px 10px', fontSize: 13, height: 30 }}>
                          <option value="pdf">PDF</option>
                          <option value="notes">Notes</option>
                          <option value="video">Video</option>
                        </select>
                        <input type="text" className="input" placeholder="Title" value={resource.title}
                          onChange={(e) => updateResource(i, 'title', e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} />
                        <input type="text" className="input" placeholder="URL" value={resource.url}
                          onChange={(e) => updateResource(i, 'url', e.target.value)} style={{ flex: 2, padding: '6px 10px', fontSize: 13 }} />
                        <button type="button" onClick={() => removeResource(i)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <button type="button" className="btn btn-secondary btn-pill" onClick={() => setDialogOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark btn-pill" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
