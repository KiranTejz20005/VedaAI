'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Loader2, BookOpen, Trash2, Eye, Calendar, Sparkles, X, Check, FileText 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  objectives: string;
  content: string;
  createdAt: string;
}

export default function LessonPlannerPage() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);

  // Wizard state
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [grade, setGrade] = useState('Class 10');
  const [duration, setDuration] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [objectives, setObjectives] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: LessonPlan[] }>('/lessons');
      setPlans(res.data.data);
    } catch {
      toast.error('Failed to load lesson plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !objectives.trim()) {
      toast.error('All fields are required');
      return;
    }
    setGenerating(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: LessonPlan }>('/lessons', {
        title,
        subject,
        grade,
        duration,
        objectives
      });
      toast.success('Lesson plan generated successfully!');
      setPlans(prev => [res.data.data, ...prev]);
      setIsOpen(false);
      setTitle('');
      setObjectives('');
    } catch (err) {
      toast.error('Failed to generate lesson plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeletePlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this lesson plan?')) return;
    try {
      await apiClient.delete(`/lessons/${id}`);
      toast.success('Lesson plan deleted');
      setPlans(prev => prev.filter(p => p.id !== id));
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
    } catch {
      toast.error('Failed to delete lesson plan');
    }
  };

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="desktop-page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={24} color="var(--brand)" />
              <h1 className="page-title">AI Lesson Planner</h1>
            </div>
            <p className="page-subtitle">Design daily, weekly, or monthly syllabus curriculum plans powered by AI.</p>
          </div>
          <button className="btn btn-dark btn-pill" onClick={() => setIsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} />
            Generate Lesson Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
          <Loader2 size={18} className="animate-spin" /> Loading lesson plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} color="#9CA3AF" />
          <h2 className="empty-title">No Lesson Plans Yet</h2>
          <p className="empty-desc">Create daily, weekly, or monthly lesson blueprints with structured objectives and activities.</p>
          <div className="empty-state-actions">
            <button className="btn btn-dark btn-pill" onClick={() => setIsOpen(true)}>Generate Lesson Plan</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className="card" 
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}
              onClick={() => setSelectedPlan(plan)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#EDE9FE', color: '#7C3AED' }}>
                    {plan.duration}
                  </span>
                  <button 
                    onClick={(e) => handleDeletePlan(plan.id, e)} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                    title="Delete Plan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 8, color: 'var(--text-primary)' }}>{plan.title}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {plan.subject} &middot; {plan.grade}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> {new Date(plan.createdAt).toLocaleDateString()}
                </span>
                <span>View Details &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Plan Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlan(null)}
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
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{selectedPlan.title}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {selectedPlan.subject} &middot; {selectedPlan.grade} &middot; {selectedPlan.duration} Plan
                  </div>
                </div>
                <button onClick={() => setSelectedPlan(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>
              <div 
                style={{ fontSize: 14, lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}
              >
                {selectedPlan.content}
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
              style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 101, padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color="var(--brand)" />
                  AI Lesson Plan Builder
                </h3>
                <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleGeneratePlan} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label htmlFor="planTitle" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Topic Name / Title
                  </label>
                  <input
                    id="planTitle"
                    type="text"
                    required
                    placeholder="e.g. Introduction to Sorting Algorithms"
                    className="input"
                    style={{ width: '100%' }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label htmlFor="planSubject" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Subject
                    </label>
                    <select
                      id="planSubject"
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
                    <label htmlFor="planGrade" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Grade Level
                    </label>
                    <input
                      id="planGrade"
                      type="text"
                      required
                      placeholder="e.g. Class 10"
                      className="input"
                      style={{ width: '100%' }}
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="planDuration" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Plan Type
                  </label>
                  <select
                    id="planDuration"
                    className="input"
                    style={{ width: '100%', height: 38 }}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as any)}
                  >
                    <option value="DAILY">Daily (1 Class)</option>
                    <option value="WEEKLY">Weekly Plan</option>
                    <option value="MONTHLY">Monthly Outline</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="planObjectives" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Learning Objectives & Outline
                  </label>
                  <textarea
                    id="planObjectives"
                    required
                    placeholder="Describe what students should learn and any specific guidelines..."
                    className="input"
                    style={{ width: '100%', minHeight: 100 }}
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="button" className="btn btn-secondary btn-pill" onClick={() => setIsOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark btn-pill" disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Generate Outline
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
