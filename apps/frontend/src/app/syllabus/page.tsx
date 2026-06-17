'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, GraduationCap, BookOpen,
  AlertCircle, Loader2, MoreVertical,
  ChevronDown, ChevronRight,
  Atom, FlaskConical, Activity, Calculator, Compass,
  FileText, Trash2, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchSyllabuses, createSyllabus, deleteSyllabus, updateSyllabus, addTopic, updateTopic } from '@/services/syllabus.service';
import type { Syllabus, SyllabusTopic } from '@/types/syllabus.types';

const GRADES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics'];

// Helper to get nice icons for subjects
const getSubjectIcon = (subject: string) => {
  const s = subject.toLowerCase();
  if (s.includes('math')) return <Calculator size={22} color="#F97316" />;
  if (s.includes('physic')) return <Atom size={22} color="#3B82F6" />;
  if (s.includes('chemist')) return <FlaskConical size={22} color="#10B981" />;
  if (s.includes('biolog')) return <Activity size={22} color="#EC4899" />;
  if (s.includes('comp') || s.includes('code')) return <Compass size={22} color="#8B5CF6" />;
  return <BookOpen size={22} color="#6B7280" />;
};

function CreateSyllabusModal({ onClose, onCreated, defaultGrade = 'Class 10', editSyllabus }: {
  onClose: () => void;
  onCreated: (s: Syllabus) => void;
  defaultGrade?: string;
  editSyllabus?: Syllabus;
}) {
  const [title, setTitle] = useState(editSyllabus?.title || '');
  const [subject, setSubject] = useState(editSyllabus?.subject || '');
  const [grade, setGrade] = useState(editSyllabus?.grade || defaultGrade);
  const [saving, setSaving] = useState(false);
  const isEdit = !!editSyllabus;

  const handleSave = async () => {
    if (!title.trim() || !subject || !grade) {
      toast.error('Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && editSyllabus) {
        const updated = await updateSyllabus(editSyllabus.id, { title: title.trim(), subject, grade });
        toast.success('Syllabus updated');
        onCreated(updated);
      } else {
        const created = await createSyllabus({ title: title.trim(), subject, grade });
        toast.success('Syllabus created');
        onCreated(created);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{isEdit ? 'Edit Syllabus' : 'Create Subject Syllabus'}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{isEdit ? 'Update syllabus details.' : 'Define a new syllabus for your class subjects.'}</p>

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label className="label">Syllabus Title</label>
          <input type="text" className="input" placeholder="e.g. Class 10 Geometry Syllabus" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label className="label">Subject</label>
          <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Select subject...</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="input-group" style={{ marginBottom: 24 }}>
          <label className="label">Class / Grade</label>
          <select className="input" value={grade} onChange={(e) => setGrade(e.target.value)}>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : isEdit ? 'Update' : 'Create Syllabus'}
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
      <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand) 0%, #F97316 100%)', borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{pct}% ({completed}/{total})</span>
    </div>
  );
}

export default function SyllabusPage() {
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editSyllabus, setEditSyllabus] = useState<Syllabus | null>(null);
  
  const [selectedGrade, setSelectedGrade] = useState('Class 10');
  const [expandedSyllabusId, setExpandedSyllabusId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Add Chapter Form State
  const [newChapterTitle, setNewChapterTitle] = useState<Record<string, string>>({});
  const [addingChapterId, setAddingChapterId] = useState<string | null>(null);

  const loadSyllabuses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSyllabuses();
      // Normalize grade names in fetched data if they have "Grade 10" style
      const normalized = data.map(s => {
        let gradeVal = s.grade;
        if (gradeVal.startsWith('Grade ')) {
          gradeVal = `Class ${gradeVal.replace('Grade ', '')}`;
        }
        return { ...s, grade: gradeVal };
      });
      setSyllabuses(normalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load syllabuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyllabuses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this syllabus?')) return;
    try {
      await deleteSyllabus(id);
      setSyllabuses((prev) => prev.filter((s) => s.id !== id));
      toast.success('Syllabus deleted successfully');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const handleToggleTopic = async (syllabusId: string, topicId: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted;
    // Optimistic update
    setSyllabuses(prev => prev.map(s =>
      s.id === syllabusId
        ? { ...s, topics: s.topics.map(t => t.id === topicId ? { ...t, completed: newCompleted } : t) }
        : s
    ));
    try {
      await updateTopic(syllabusId, topicId, newCompleted);
    } catch (e) {
      toast.error('Failed to sync status with server');
      loadSyllabuses();
    }
  };

  const handleAddChapter = async (syllabusId: string) => {
    const title = newChapterTitle[syllabusId]?.trim();
    if (!title) {
      toast.error('Please enter a chapter name');
      return;
    }

    const syllabus = syllabuses.find(s => s.id === syllabusId);
    if (!syllabus) return;

    setAddingChapterId(syllabusId);
    try {
      const newTopic = await addTopic(syllabusId, { title, duration: 60 });
      setSyllabuses(prev => prev.map(s => s.id === syllabusId ? { ...s, topics: [...s.topics, newTopic] } : s));
      setNewChapterTitle(prev => ({ ...prev, [syllabusId]: '' }));
      toast.success('Chapter added successfully!');
    } catch (e) {
      toast.error('Failed to add chapter');
    } finally {
      setAddingChapterId(null);
    }
  };

  // Filter syllabuses by Class tab and Search query
  const filtered = syllabuses.filter((s) => {
    const matchesGrade = s.grade === selectedGrade;
    const matchesSearch = !search || 
      s.title.toLowerCase().includes(search.toLowerCase()) || 
      s.subject.toLowerCase().includes(search.toLowerCase()) ||
      s.topics.some(t => t.title.toLowerCase().includes(search.toLowerCase()));
    return matchesGrade && matchesSearch;
  });

  return (
    <div className="dashboard-view">
      {/* Header */}
      <div className="desktop-page-header dashboard-header-v3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={24} color="#0f172a" />
            <h1 className="page-title">Syllabus Directory</h1>
          </div>
          <p className="page-subtitle">Track completion metrics, manage curriculum chapters, and organize syllabus topics.</p>
        </div>

        <button className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Add Subject
        </button>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">Syllabus</h1>
        <div style={{ width: 32 }} />
      </div>

      {/* Class Level Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 24, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {GRADES.map((grade) => (
          <button
            key={grade}
            type="button"
            onClick={() => {
              setSelectedGrade(grade);
              setExpandedSyllabusId(null);
            }}
            style={{
              padding: '8px 20px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
              background: selectedGrade === grade ? 'var(--brand)' : '#FFFFFF',
              color: selectedGrade === grade ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${selectedGrade === grade ? 'var(--brand)' : 'var(--border)'}`,
              cursor: 'pointer',
              boxShadow: selectedGrade === grade ? '0 2px 8px rgba(232,83,29,0.25)' : '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
            }}
          >
            {grade}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="search-filter-row search-filter-row-v3" style={{ marginBottom: 20 }}>
        <div className="search-wrap" style={{ maxWidth: '100%' }}>
          <Search size={15} className="search-icon" />
          <input type="text" placeholder="Search chapters or subjects..." className="input search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 100 }} />
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle size={40} color="#EF4444" />
          <h2 className="empty-title">Failed to load</h2>
          <p className="empty-desc">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <GraduationCap size={36} color="var(--brand)" />
          </div>
          <h2 className="empty-title">No syllabuses found</h2>
          <p className="empty-desc">No syllabus directory defined for {selectedGrade} yet. Add subjects to begin organizing your curriculum.</p>
          <button className="btn btn-dark btn-pill" onClick={() => setShowCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
            <Plus size={15} /> Add Subject Syllabus
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((syllabus) => {
            const isExpanded = expandedSyllabusId === syllabus.id;
            const isMenuOpen = menuOpenId === syllabus.id;

            return (
              <motion.div key={syllabus.id} layout className="card" style={{ padding: 0, overflow: 'hidden' }}>
                
                {/* Subject Header Row */}
                <div 
                  onClick={() => setExpandedSyllabusId(isExpanded ? null : syllabus.id)}
                  style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? '#F9FAFB' : '#FFFFFF', borderBottom: isExpanded ? '1px solid var(--border)' : 'none', transition: 'background 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getSubjectIcon(syllabus.subject)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {syllabus.subject}
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        {syllabus.grade} &middot; {syllabus.topics.length} Chapters
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} onClick={e => e.stopPropagation()}>
                    {/* Progress indicator */}
                    {syllabus.topics.length > 0 && (
                      <div className="hide-mobile" style={{ width: 140 }}>
                        <TopicProgress topics={syllabus.topics} />
                      </div>
                    )}

                    {/* Expand Trigger */}
                    <button 
                      onClick={() => setExpandedSyllabusId(isExpanded ? null : syllabus.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>

                    {/* Menu Trigger */}
                    <div style={{ position: 'relative' }}>
                      <button 
                        className="menu-btn" 
                        onClick={() => setMenuOpenId(isMenuOpen ? null : syllabus.id)} 
                        aria-label="Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="dropdown-menu" style={{ right: 0, left: 'auto', zIndex: 10 }}>
                            <button className="dropdown-item" onClick={() => { setMenuOpenId(null); setEditSyllabus(syllabus); }}>
                              <FileText size={14} style={{ marginRight: 6 }} /> Edit Syllabus
                            </button>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item danger" onClick={() => { setMenuOpenId(null); handleDelete(syllabus.id); }}>
                              <Trash2 size={14} style={{ marginRight: 6 }} /> Delete Syllabus
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Progress bar for mobile (collapsed only) */}
                {!isExpanded && syllabus.topics.length > 0 && (
                  <div className="hide-desktop" style={{ padding: '0 24px 16px 24px' }}>
                    <TopicProgress topics={syllabus.topics} />
                  </div>
                )}

                {/* Expandable Chapter List */}
                {isExpanded && (
                  <div style={{ padding: '24px', background: '#FFFFFF', borderTop: '1px solid var(--border)' }}>
                    
                    {/* Chapters List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                      {syllabus.topics.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '12px 0' }}>
                          No chapters defined. Add one below!
                        </p>
                      ) : (
                        syllabus.topics.map((topic, tIdx) => (
                          <div 
                            key={topic.id || tIdx} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '12px 16px', 
                              background: topic.completed ? '#ECFDF5' : '#F9FAFB', 
                              border: `1px solid ${topic.completed ? '#10B981' : 'var(--border)'}`, 
                              borderRadius: 10,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                              <button
                                type="button"
                                onClick={() => handleToggleTopic(syllabus.id, topic.id, topic.completed)}
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 6,
                                  border: `2px solid ${topic.completed ? '#10B981' : '#CBD5E1'}`,
                                  background: topic.completed ? '#10B981' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#FFFFFF',
                                  cursor: 'pointer',
                                  padding: 0,
                                  flexShrink: 0,
                                }}
                              >
                                {topic.completed && <Check size={14} strokeWidth={3} />}
                              </button>
                              
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                  fontSize: 13, 
                                  fontWeight: 600, 
                                  color: topic.completed ? '#065F46' : 'var(--text-primary)',
                                  textDecoration: topic.completed ? 'line-through' : 'none'
                                }}>
                                  {topic.title}
                                </div>
                                {topic.subtopics && topic.subtopics.length > 0 && (
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                                    {topic.subtopics.map(st => (
                                      <span key={st.id} style={{ fontSize: 10, background: '#FFFFFF', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
                                        {st.title}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 12 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: '#FFFFFF', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6 }}>
                                {topic.duration} min
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Chapter Section */}
                    <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                      <input 
                        type="text" 
                        placeholder="New chapter title..." 
                        className="input" 
                        style={{ flex: 1, fontSize: 13 }}
                        value={newChapterTitle[syllabus.id] || ''}
                        onChange={e => setNewChapterTitle(prev => ({ ...prev, [syllabus.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddChapter(syllabus.id);
                        }}
                      />
                      <button 
                        type="button" 
                        disabled={addingChapterId === syllabus.id}
                        onClick={() => handleAddChapter(syllabus.id)} 
                        className="btn btn-dark" 
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '10px 18px' }}
                      >
                        {addingChapterId === syllabus.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Add Chapter
                      </button>
                    </div>

                  </div>
                )}

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateSyllabusModal
            defaultGrade={selectedGrade}
            onClose={() => setShowCreate(false)}
            onCreated={(s) => { 
              setSyllabuses((prev) => [s, ...prev]); 
              setShowCreate(false); 
              setExpandedSyllabusId(s.id);
            }}
          />
        )}
        {editSyllabus && (
          <CreateSyllabusModal
            editSyllabus={editSyllabus}
            onClose={() => setEditSyllabus(null)}
            onCreated={(updated) => {
              setSyllabuses((prev) => prev.map(s => s.id === updated.id ? updated : s));
              setEditSyllabus(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}