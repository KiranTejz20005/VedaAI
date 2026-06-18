'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Loader2, FileText, Trash2, Eye, Calendar, Sparkles, X, Check, BookOpen 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface Worksheet {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  content: string;
  answerKey: string;
  createdAt: string;
}

export default function WorksheetsPage() {
  const [sheets, setSheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<Worksheet | null>(null);
  const [sheetTab, setSheetTab] = useState<'worksheet' | 'answers'>('worksheet');

  // Wizard state
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [generating, setGenerating] = useState(false);

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: Worksheet[] }>('/worksheets');
      setSheets(res.data.data);
    } catch {
      toast.error('Failed to load worksheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  const handleGenerateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topic.trim()) {
      toast.error('All fields are required');
      return;
    }
    setGenerating(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: Worksheet }>('/worksheets', {
        title,
        subject,
        topic,
        difficulty
      });
      toast.success('Worksheet generated successfully!');
      setSheets(prev => [res.data.data, ...prev]);
      setIsOpen(false);
      setTitle('');
      setTopic('');
    } catch (err) {
      toast.error('Failed to generate worksheet');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSheet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this worksheet?')) return;
    try {
      await apiClient.delete(`/worksheets/${id}`);
      toast.success('Worksheet deleted');
      setSheets(prev => prev.filter(s => s.id !== id));
      if (selectedSheet?.id === id) setSelectedSheet(null);
    } catch {
      toast.error('Failed to delete worksheet');
    }
  };

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="desktop-page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={24} color="var(--brand)" />
              <h1 className="page-title">Worksheet Generator</h1>
            </div>
            <p className="page-subtitle">Instantly generate student revision sheets and matching step-by-step teacher keys.</p>
          </div>
          <button className="btn btn-dark btn-pill" onClick={() => setIsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} />
            Generate Worksheet
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
          <Loader2 size={18} className="animate-spin" /> Loading sheets...
        </div>
      ) : sheets.length === 0 ? (
        <div className="empty-state">
          <FileText size={40} color="#9CA3AF" />
          <h2 className="empty-title">No Worksheets Yet</h2>
          <p className="empty-desc">Create custom practice sheets with matching answer guides for homework or exam prep.</p>
          <div className="empty-state-actions">
            <button className="btn btn-dark btn-pill" onClick={() => setIsOpen(true)}>Generate Worksheet</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {sheets.map((sheet) => (
            <div 
              key={sheet.id} 
              className="card" 
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}
              onClick={() => { setSelectedSheet(sheet); setSheetTab('worksheet'); }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span className={`badge ${sheet.difficulty === 'EASY' ? 'badge-completed' : sheet.difficulty === 'HARD' ? 'badge-failed' : 'badge-pending'}`}>
                    {sheet.difficulty}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSheet(sheet.id, e)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                    title="Delete Worksheet"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 8, color: 'var(--text-primary)' }}>{sheet.title}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {sheet.subject} &middot; {sheet.topic}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> {new Date(sheet.createdAt).toLocaleDateString()}
                </span>
                <span>View Sheet &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Worksheet / Answer Key Modal */}
      <AnimatePresence>
        {selectedSheet && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSheet(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="card"
              style={{ width: '100%', maxWidth: 720, position: 'relative', zIndex: 101, padding: 24, maxHeight: '85vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{selectedSheet.title}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {selectedSheet.subject} &middot; {selectedSheet.topic}
                  </div>
                </div>
                <button onClick={() => setSelectedSheet(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Toggle Worksheet/AnswerKey */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 16, fontSize: 13, marginBottom: 16 }}>
                <button
                  onClick={() => setSheetTab('worksheet')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '8px 4px',
                    fontWeight: 600,
                    color: sheetTab === 'worksheet' ? 'var(--brand)' : 'var(--text-secondary)',
                    borderBottom: sheetTab === 'worksheet' ? '2px solid var(--brand)' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  Student Worksheet
                </button>
                <button
                  onClick={() => setSheetTab('answers')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '8px 4px',
                    fontWeight: 600,
                    color: sheetTab === 'answers' ? 'var(--brand)' : 'var(--text-secondary)',
                    borderBottom: sheetTab === 'answers' ? '2px solid var(--brand)' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  Teacher Answer Key
                </button>
              </div>

              <div 
                style={{ fontSize: 14, lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}
              >
                {sheetTab === 'worksheet' ? selectedSheet.content : selectedSheet.answerKey}
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
                  AI Worksheet Builder
                </h3>
                <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleGenerateSheet} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label htmlFor="sheetTitle" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Worksheet Title
                  </label>
                  <input
                    id="sheetTitle"
                    type="text"
                    required
                    placeholder="e.g. Calculus Derivatives Homework"
                    className="input"
                    style={{ width: '100%' }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="sheetSubject" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Subject
                  </label>
                  <select
                    id="sheetSubject"
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
                  <label htmlFor="sheetTopic" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Topic Coverage details
                  </label>
                  <input
                    id="sheetTopic"
                    type="text"
                    required
                    placeholder="e.g. Chain rule, quotient rule, and product rule"
                    className="input"
                    style={{ width: '100%' }}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="sheetDiff" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Difficulty level
                  </label>
                  <select
                    id="sheetDiff"
                    className="input"
                    style={{ width: '100%', height: 38 }}
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="button" className="btn btn-secondary btn-pill" onClick={() => setIsOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark btn-pill" disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Generate Worksheet
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
