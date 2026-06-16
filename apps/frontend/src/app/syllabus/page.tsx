'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  GraduationCap,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { fetchSyllabuses, createSyllabus, deleteSyllabus } from '@/services/syllabus.service';
import type { Syllabus, SyllabusTopic } from '@/types/syllabus.types';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics'];
const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

function CreateSyllabusModal({ onClose, onCreated }: { onClose: () => void; onCreated: (s: Syllabus) => void }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !subject || !grade) {
      toast.error('Please fill all fields');
      return;
    }
    setCreating(true);
    try {
      const created = await createSyllabus({ title: title.trim(), subject, grade });
      toast.success('Syllabus created');
      onCreated(created);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create syllabus');
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Create Syllabus</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Define a new syllabus for your curriculum.</p>

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label className="label">Syllabus Title</label>
          <input type="text" className="input" placeholder="e.g. Class 8 Mathematics Syllabus" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label className="label">Subject</label>
          <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Select subject...</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="input-group" style={{ marginBottom: 24 }}>
          <label className="label">Grade</label>
          <select className="input" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">Select grade...</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create Syllabus'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TopicProgress({ topics }: { topics: SyllabusTopic[] }) {
  const total = topics.length;
  const completed = topics.filter((t) => t.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand)', borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{completed}/{total}</span>
    </div>
  );
}

function SyllabusCard({ syllabus, onDelete }: { syllabus: Syllabus; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div layout className="card" style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={20} color="var(--brand)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="card-title">{syllabus.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{syllabus.subject} &middot; {syllabus.grade}</div>
          </div>
        </div>
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Options"><MoreVertical size={15} /></button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="dropdown-menu" style={{ right: 0, left: 'auto' }}>
                <button className="dropdown-item" onClick={() => { setMenuOpen(false); toast.success('Edit coming soon'); }}>Edit</button>
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={async () => { setMenuOpen(false); await onDelete(syllabus.id); }}>Delete</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {syllabus.topics.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <TopicProgress topics={syllabus.topics} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BookOpen size={13} /> {syllabus.topics.length} topics
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={13} /> {new Date(syllabus.updatedAt).toLocaleDateString()}
        </span>
      </div>

      <AnimatePresence>
        {expanded && syllabus.topics.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              {syllabus.topics.map((topic) => (
                <div key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  {topic.completed ? <CheckCircle2 size={15} color="#10B981" /> : <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid #D1D5DB' }} />}
                  <span style={{ flex: 1, fontSize: 13, fontWeight: topic.completed ? 500 : 400, color: topic.completed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {topic.title}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{topic.duration} min</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{expanded ? 'Less' : 'View Topics'}</span>
      </div>
    </motion.div>
  );
}

export default function SyllabusPage() {
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSyllabuses()
      .then((data) => { if (!cancelled) setSyllabuses(data); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load syllabuses'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = syllabuses.filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this syllabus?')) return;
    try {
      await deleteSyllabus(id);
      setSyllabuses((prev) => prev.filter((s) => s.id !== id));
      toast.success('Syllabus deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap size={24} color="#0f172a" />
          <h1 className="page-title">Syllabus</h1>
        </div>
        <p className="page-subtitle">Manage your curriculum syllabuses and track topic progress.</p>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">Syllabus</h1>
        <div style={{ width: 32 }} />
      </div>

      <div className="search-filter-row search-filter-row-v3">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input type="text" placeholder="Search syllabuses..." className="input search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Syllabus
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 18, width: '60%', borderRadius: 6, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle size={40} color="#EF4444" />
          <h2 className="empty-title">Failed to load</h2>
          <p className="empty-desc">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <GraduationCap size={36} color="var(--brand)" />
          </div>
          <h2 className="empty-title">{search ? 'No matching syllabuses' : 'No syllabuses yet'}</h2>
          <p className="empty-desc">{search ? 'Try a different search term.' : 'Create your first syllabus to start organizing your curriculum.'}</p>
          {!search && (
            <button className="btn btn-dark btn-pill" onClick={() => setShowCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> Create Syllabus
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((syllabus) => (
            <SyllabusCard key={syllabus.id} syllabus={syllabus} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateSyllabusModal
            onClose={() => setShowCreate(false)}
            onCreated={(s) => { setSyllabuses((prev) => [s, ...prev]); setShowCreate(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}