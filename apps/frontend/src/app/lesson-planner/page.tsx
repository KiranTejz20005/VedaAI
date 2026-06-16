'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Clock, BookOpen, Target, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateLessonPlan } from '@/services/ai-tools.service';

interface LessonSection {
  title: string;
  duration: string;
  content: string;
}

interface LessonPlan {
  title: string;
  subject: string;
  grade: string;
  duration: string;
  objectives: string[];
  materials: string[];
  sections: LessonSection[];
  assessment: string;
}

export default function LessonPlannerPage() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [duration, setDuration] = useState('45');
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleGenerate = async () => {
    if (!topic.trim() || !subject || !grade) { toast.error('Please fill all fields'); return; }
    setGenerating(true);
    try {
      const result = await generateLessonPlan({ topic: topic.trim(), subject, grade, duration });
      setPlan(result);
      toast.success('Lesson plan generated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate lesson plan');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={24} color="#7C3AED" />
          <h1 className="page-title">Lesson Planner</h1>
        </div>
        <p className="page-subtitle">Generate structured lesson plans aligned to your curriculum.</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 2, minWidth: 200 }}>
            <label className="label">Topic</label>
            <input type="text" className="input" placeholder="e.g. Photosynthesis, Quadratic Equations" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="label">Subject</label>
            <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Select...</option>
              {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: 120 }}>
            <label className="label">Grade</label>
            <select className="input" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">Select...</option>
              {Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`).map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ flex: 0, minWidth: 80 }}>
            <label className="label">Duration</label>
            <input type="number" className="input" value={duration} onChange={(e) => setDuration(e.target.value)} min={10} max={180} style={{ width: 80 }} />
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} style={{ gap: 6, height: 40 }}>
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate Plan
          </button>
        </div>
      </div>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{plan.title}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{plan.subject} &middot; {plan.grade} &middot; {plan.duration}</p>
              </div>
              {expanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
            </div>
          </div>

          {expanded && (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target size={16} color="var(--brand)" /> Learning Objectives
                </h3>
                <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {plan.objectives.map((obj, i) => <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{obj}</li>)}
                </ul>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={16} color="var(--brand)" /> Materials Needed
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {plan.materials.map((m, i) => (
                    <span key={i} style={{ fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 100, background: '#F3F4F6', color: 'var(--text-secondary)' }}>{m}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {plan.sections.map((section, i) => (
                  <div key={i} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="var(--brand)" /> {section.title}
                      </h4>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-light)', padding: '2px 10px', borderRadius: 100 }}>{section.duration}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{section.content}</p>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Assessment</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{plan.assessment}</p>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}