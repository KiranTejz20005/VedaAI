'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Loader2, Library, Trash2, Eye, Calendar, Sparkles, X, Check, FileText 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface GeneratedNote {
  id: string;
  title: string;
  subject: string;
  topic: string;
  type: 'SUMMARY' | 'REVISION' | 'FLASHCARDS';
  content: string;
  createdAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<GeneratedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<GeneratedNote | null>(null);

  // Wizard state
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'SUMMARY' | 'REVISION' | 'FLASHCARDS'>('SUMMARY');
  const [generating, setGenerating] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: GeneratedNote[] }>('/notes');
      setNotes(res.data.data);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topic.trim()) {
      toast.error('All fields are required');
      return;
    }
    setGenerating(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: GeneratedNote }>('/notes', {
        title,
        subject,
        topic,
        type
      });
      toast.success('Notes generated successfully!');
      setNotes(prev => [res.data.data, ...prev]);
      setIsOpen(false);
      setTitle('');
      setTopic('');
    } catch (err) {
      toast.error('Failed to generate notes');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteNotes = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete these notes?')) return;
    try {
      await apiClient.delete(`/notes/${id}`);
      toast.success('Notes deleted');
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    } catch {
      toast.error('Failed to delete notes');
    }
  };

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="desktop-page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Library size={24} color="var(--brand)" />
              <h1 className="page-title">AI Study Notes</h1>
            </div>
            <p className="page-subtitle">Compile comprehensive summaries, brief revision checklists, or flashcards instantly.</p>
          </div>
          <button className="btn btn-dark btn-pill" onClick={() => setIsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} />
            Create Notes
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
          <Loader2 size={18} className="animate-spin" /> Loading notes list...
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <Library size={40} color="#9CA3AF" />
          <h2 className="empty-title">No Study Notes Yet</h2>
          <p className="empty-desc">Create flashcards, short revision guides, or core summaries for your classes.</p>
          <div className="empty-state-actions">
            <button className="btn btn-dark btn-pill" onClick={() => setIsOpen(true)}>Create First Note</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {notes.map((note) => (
            <div 
              key={note.id} 
              className="card" 
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}
              onClick={() => setSelectedNote(note)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#EFF6FF', color: '#1D4ED8' }}>
                    {note.type}
                  </span>
                  <button 
                    onClick={(e) => handleDeleteNotes(note.id, e)} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                    title="Delete Notes"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 8, color: 'var(--text-primary)' }}>{note.title}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {note.subject} &middot; {note.topic}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> {new Date(note.createdAt).toLocaleDateString()}
                </span>
                <span>Open Notes &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Notes Modal */}
      <AnimatePresence>
        {selectedNote && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNote(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="card"
              style={{ width: '100%', maxWidth: 720, position: 'relative', zIndex: 101, padding: 24, maxHeight: '85vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{selectedNote.title}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {selectedNote.subject} &middot; {selectedNote.topic} &middot; {selectedNote.type} Format
                  </div>
                </div>
                <button onClick={() => setSelectedNote(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>
              <div 
                style={{ fontSize: 14, lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}
              >
                {selectedNote.content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generate Wizard Modal */}
      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="card"
              style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 101, padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color="var(--brand)" />
                  AI Study Notes Builder
                </h3>
                <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleGenerateNotes} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label htmlFor="notesTitle" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Notes Topic Title
                  </label>
                  <input
                    id="notesTitle"
                    type="text"
                    required
                    placeholder="e.g. Photosynthesis Light Reaction"
                    className="input"
                    style={{ width: '100%' }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="notesSubject" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Subject
                  </label>
                  <select
                    id="notesSubject"
                    className="input"
                    style={{ width: '100%', height: 38 }}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="notesTopic" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Outline Guidelines
                  </label>
                  <input
                    id="notesTopic"
                    type="text"
                    required
                    placeholder="e.g. Chloroplast structure, electron transport chain, ATP synthesis"
                    className="input"
                    style={{ width: '100%' }}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="notesType" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Notes Format
                  </label>
                  <select
                    id="notesType"
                    className="input"
                    style={{ width: '100%', height: 38 }}
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                  >
                    <option value="SUMMARY">Comprehensive Summary</option>
                    <option value="REVISION">Brief Revision Guide</option>
                    <option value="FLASHCARDS">Question/Answer Flashcards</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="button" className="btn btn-secondary btn-pill" onClick={() => setIsOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark btn-pill" disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Generate Notes
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
