'use client';

import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export interface QuizFormData {
  topic: string;
  subject: string;
  difficulty: string;
  bloom_level: string;
  numQuestions: number;
  context: string;
}

interface QuizGeneratorFormProps {
  formData: QuizFormData;
  setFormData: (data: QuizFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export function QuizGeneratorForm({ formData, setFormData, onSubmit, loading }: QuizGeneratorFormProps) {
  return (
    <form onSubmit={onSubmit}>
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
          <div className="input-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="label">Number of Questions</label>
            <select className="input" value={formData.numQuestions} onChange={e => setFormData({...formData, numQuestions: parseInt(e.target.value) || 5})}>
              {Array.from({ length: 10 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1} Question{i > 0 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-group" style={{ marginTop: 14 }}>
          <label className="label">Reference Context (Optional)</label>
          <textarea rows={4} className="input" placeholder="Paste syllabus or reference material here... Avoid pasting images or file paths." value={formData.context} onChange={e => setFormData({...formData, context: e.target.value})} style={{ resize: 'none' }} />
        </div>

        <button type="submit" disabled={loading} className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, marginTop: 16, width: '100%' }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Generating Quiz...' : 'Generate with AI'}
        </button>
      </div>
    </form>
  );
}
