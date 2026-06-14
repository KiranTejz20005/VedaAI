'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [generatedQuestion, setGeneratedQuestion] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real application, this calls our backend API which orchestrates the Python AI Engine
      // We'll mock the fetch response for MVP UI demonstration
      setTimeout(() => {
        setGeneratedQuestion({
          question_text: `Based on ${formData.topic}, generate a ${formData.difficulty} question.`,
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 'Option 1',
          ai_confidence_score: 0.92
        });
        toast.success('Question generated successfully!');
        setLoading(false);
      }, 2000);
    } catch (err) {
      toast.error('Generation failed');
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-view" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="desktop-page-header dashboard-header-v3">
        <h1 className="page-title">Generate Assessment</h1>
        <p className="page-subtitle">Use AI to generate high-quality questions aligned with Bloom's Taxonomy.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, background: 'white', padding: 24, borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Topic</label>
            <input required type="text" className="input" placeholder="e.g. Machine Learning Basics" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Subject</label>
            <input required type="text" className="input" placeholder="e.g. Computer Science" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Difficulty</label>
            <select className="input" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Bloom Level</label>
            <select className="input" value={formData.bloom_level} onChange={e => setFormData({...formData, bloom_level: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }}>
              <option value="REMEMBER">Remember</option>
              <option value="UNDERSTAND">Understand</option>
              <option value="APPLY">Apply</option>
              <option value="ANALYZE">Analyze</option>
              <option value="EVALUATE">Evaluate</option>
              <option value="CREATE">Create</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Reference Context (Optional for RAG)</label>
          <textarea rows={4} className="input" placeholder="Paste syllabus or reference material here..." value={formData.context} onChange={e => setFormData({...formData, context: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>

        <button type="submit" disabled={loading} className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Generating...' : 'Generate with AI'}
        </button>
      </form>

      {generatedQuestion && (
        <div style={{ marginTop: 24, padding: 24, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Generated Question</h3>
          <p style={{ fontSize: 16, color: '#334155', marginBottom: 16 }}>{generatedQuestion.question_text}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {generatedQuestion.options?.map((opt: string, i: number) => (
              <div key={i} style={{ padding: 12, background: 'white', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                {opt}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: '#16a34a' }}>Answer: {generatedQuestion.answer}</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>AI Confidence: {(generatedQuestion.ai_confidence_score * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
