'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, AlertCircle, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface GeneratedQuestion {
  id: string;
  question_text: string;
  options?: string[];
  answer?: string;
  difficulty: string;
  bloomLevel: string;
  ai_confidence_score: number;
}

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    subject: '',
    difficulty: 'MEDIUM',
    bloom_level: 'APPLY',
    marks: 5,
    context: ''
  });
  const [generatedQuestion, setGeneratedQuestion] = useState<GeneratedQuestion | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedQuestion(null);
    setGenerationError(null);
    try {
      const res = await apiClient.post<{ success: boolean; data: GeneratedQuestion }>('/generate/question', {
        topic: formData.topic,
        subject: formData.subject,
        difficulty: formData.difficulty,
        bloomLevel: formData.bloom_level,
        context: formData.context || undefined,
      });
      setGeneratedQuestion(res.data.data);
      toast.success('Question generated successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setGenerationError(message);
      if (message.includes('image') || message.includes('png') || message.includes('jpg')) {
        toast.error('Image references detected. Please use text-only content.');
      } else if (message.includes('AI provider') || message.includes('API key')) {
        toast.error('AI service unavailable. Please check your API configuration.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={24} color="#0f172a" />
          <h1 className="page-title">Generate Question</h1>
        </div>
        <p className="page-subtitle">Use AI to generate high-quality questions aligned with Bloom&apos;s Taxonomy.</p>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">Generate</h1>
        <div style={{ width: 32 }} />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="label">Topic</label>
              <input required type="text" className="input" placeholder="e.g. Machine Learning Basics" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="label">Subject</label>
              <input required type="text" className="input" placeholder="e.g. Computer Science" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
            <div className="input-group" style={{ flex: 1, minWidth: 150 }}>
              <label className="label">Difficulty</label>
              <select className="input" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: 150 }}>
              <label className="label">Bloom Level</label>
              <select className="input" value={formData.bloom_level} onChange={e => setFormData({...formData, bloom_level: e.target.value})}>
                <option value="REMEMBER">Remember</option>
                <option value="UNDERSTAND">Understand</option>
                <option value="APPLY">Apply</option>
                <option value="ANALYZE">Analyze</option>
                <option value="EVALUATE">Evaluate</option>
                <option value="CREATE">Create</option>
              </select>
            </div>
          </div>

          <div className="input-group" style={{ marginTop: 14 }}>
            <label className="label">Reference Context (Optional)</label>
            <textarea rows={4} className="input" placeholder="Paste syllabus or reference material here... Avoid pasting images or file paths." value={formData.context} onChange={e => setFormData({...formData, context: e.target.value})} style={{ resize: 'none' }} />
          </div>

          <button type="submit" disabled={loading} className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, marginTop: 16, width: '100%' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>
      </form>

      {generationError && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ background: '#FEF2F2', borderColor: '#FECACA', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {generationError.includes('image') ? <ImageOff size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} /> : <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>
                {generationError.includes('image') ? 'Image Content Detected' : 'Generation Failed'}
              </h4>
              <p style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.5 }}>{generationError}</p>
            </div>
          </div>
        </motion.div>
      )}

      {generatedQuestion && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CheckCircle size={20} color="#10B981" />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Generated Question</h3>
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 16 }}>{generatedQuestion.question_text}</p>

          {generatedQuestion.options && generatedQuestion.options.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {generatedQuestion.options.map((opt, i) => (
                <div key={i} style={{ padding: '10px 14px', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>{opt}</div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            {generatedQuestion.answer && (
              <span style={{ fontWeight: 600, color: '#059669', fontSize: 13 }}>Answer: {generatedQuestion.answer}</span>
            )}
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{generatedQuestion.difficulty} &middot; {generatedQuestion.bloomLevel}</span>
              <span>Confidence: {(generatedQuestion.ai_confidence_score * 100).toFixed(0)}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}