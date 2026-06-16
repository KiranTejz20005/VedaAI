'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, Star, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateFeedback } from '@/services/ai-tools.service';

const TONES = ['Encouraging', 'Constructive', 'Professional', 'Brief'];
const STRENGTHS = [
  'Strong analytical skills', 'Good teamwork', 'Creative problem-solving',
  'Excellent written expression', 'Consistent effort', 'Critical thinking',
  'Research skills', 'Presentation skills',
];
const IMPROVEMENTS = [
  'Needs more detailed explanations', 'Show working steps clearly',
  'Improve time management', 'Double-check calculations',
  'Provide more examples', 'Strengthen conclusions',
  'Use proper citations', 'Practice more problems',
];

export default function FeedbackWriterPage() {
  const [studentName, setStudentName] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [tone, setTone] = useState('Encouraging');
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleStrength = (s: string) => {
    setSelectedStrengths((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };
  const toggleImprovement = (s: string) => {
    setSelectedImprovements((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleGenerate = async () => {
    if (!studentName.trim()) { toast.error('Enter student name'); return; }
    setGenerating(true);
    try {
      const result = await generateFeedback({
        studentName: studentName.trim(),
        assignmentTitle: assignmentTitle.trim() || undefined,
        strengths: selectedStrengths.length > 0 ? selectedStrengths : undefined,
        improvements: selectedImprovements.length > 0 ? selectedImprovements : undefined,
        tone: tone.toLowerCase(),
        customNotes: customNotes.trim() || undefined,
      });
      setFeedback(result.feedback);
      toast.success('Feedback generated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate feedback');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={24} color="#2563EB" />
          <h1 className="page-title">Feedback Writer</h1>
        </div>
        <p className="page-subtitle">Generate personalised, constructive student feedback in seconds.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Student Details</h3>

          <div className="input-group" style={{ marginBottom: 14 }}>
            <label className="label">Student Name</label>
            <input type="text" className="input" placeholder="e.g. John Smith" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          </div>

          <div className="input-group" style={{ marginBottom: 14 }}>
            <label className="label">Assignment (optional)</label>
            <input type="text" className="input" placeholder="e.g. Mid-term Physics Exam" value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} />
          </div>

          <div className="input-group" style={{ marginBottom: 14 }}>
            <label className="label">Tone</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TONES.map((t) => (
                <button key={t} className={`btn btn-sm ${tone === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTone(t)}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label" style={{ marginBottom: 6 }}>Strengths</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STRENGTHS.map((s) => (
                <button key={s} className={`btn btn-sm ${selectedStrengths.includes(s) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleStrength(s)} style={{ fontSize: 11 }}>{s}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label" style={{ marginBottom: 6 }}>Areas for Improvement</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {IMPROVEMENTS.map((s) => (
                <button key={s} className={`btn btn-sm ${selectedImprovements.includes(s) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleImprovement(s)} style={{ fontSize: 11 }}>{s}</button>
              ))}
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 14 }}>
            <label className="label">Additional Notes</label>
            <textarea className="input" rows={2} placeholder="Any specific comments..." value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} style={{ resize: 'none' }} />
          </div>

          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} style={{ gap: 6, width: '100%' }}>
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate Feedback
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={16} color="#F59E0B" /> Generated Feedback
            </h3>
            {feedback && (
              <button className="btn btn-secondary btn-sm" onClick={handleCopy} style={{ gap: 4 }}>
                {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          {feedback ? (
            <pre style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: '#F9FAFB', borderRadius: 12, padding: 16, margin: 0 }}>{feedback}</pre>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Fill in the student details and generate feedback. It will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}