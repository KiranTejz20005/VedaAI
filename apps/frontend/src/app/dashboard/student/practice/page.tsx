'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, X, 
  Calculator, Thermometer, Globe, Microscope, 
  ChevronRight, Filter, Settings2, BarChart2, Zap,
  Paperclip, Loader2, AlertCircle, ImageOff, History, Trash2, RotateCcw, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
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
  hint?: string;
}

interface ApiQuizSession {
  id: string;
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  timeLimitSeconds: number;
  timeTakenSeconds: number;
  totalQuestions: number;
  score: number;
  attempts: Record<string, string>;
  userId: string;
  createdAt: string;
  questions: Array<{
    id: string;
    questionIndex: number;
    questionText: string;
    options: string[];
    answer: string;
    difficulty: string;
    bloomLevel: string;
    aiConfidenceScore: number;
    hint?: string;
  }>;
}

interface HistoryQuiz {
  id: string;
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  questions: GeneratedQuestion[];
  timeLimitSeconds: number;
  timeTakenSeconds: number;
  attempts: Record<number, string>;
  score: number;
  timestamp: number;
}

const TEMPLATES = [
  {
    id: 't1',
    title: 'Algebra',
    subject: 'MATHEMATICS',
    topic: 'Quadratic equations and polynomials',
    description: 'Quadratic equations, polynomials, and complex numbers with step-by-step AI hints.',
    qCount: 124,
    icon: <Calculator size={24} color="#D97706" />,
    iconBg: '#FEF3C7'
  },
  {
    id: 't2',
    title: 'Thermodynamics',
    subject: 'PHYSICS',
    topic: 'Heat transfer and entropy',
    description: 'Heat transfer, laws of thermodynamics, and entropy visualization challenges.',
    qCount: 86,
    icon: <Thermometer size={24} color="#EA580C" />,
    iconBg: '#FFEDD5'
  },
  {
    id: 't3',
    title: 'Modern History',
    subject: 'HISTORY',
    topic: 'WWII to Digital Age',
    description: 'World War II to the Digital Age. Chronology and thematic analysis.',
    qCount: 210,
    icon: <Globe size={24} color="#2563EB" />,
    iconBg: '#DBEAFE'
  },
  {
    id: 't4',
    title: 'Cell Biology',
    subject: 'BIOLOGY',
    topic: 'Organelles and transcription',
    description: 'Micro-interactions, organelles, and genetic transcription practice.',
    qCount: 156,
    icon: <Microscope size={24} color="#059669" />,
    iconBg: '#D1FAE5'
  }
];

export default function PracticeDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedId = searchParams.get('sharedId');

  const [history, setHistory] = useState<HistoryQuiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingTemplateId, setGeneratingTemplateId] = useState<string | null>(null);
  
  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // Stats
  const [avgScore, setAvgScore] = useState(0);
  const [timePerQuest, setTimePerQuest] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [weekActivity, setWeekActivity] = useState<boolean[]>([false, false, false, false, false, false, false]); // M to S

  const mapSessionToHistory = (s: ApiQuizSession): HistoryQuiz => ({
    id: s.id,
    topic: s.topic,
    subject: s.subject,
    difficulty: s.difficulty,
    bloomLevel: s.bloomLevel,
    questions: s.questions.map((q) => ({
      id: q.id,
      question_text: q.questionText,
      options: q.options,
      answer: q.answer,
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel,
      ai_confidence_score: q.aiConfidenceScore,
      hint: q.hint,
    })),
    timeLimitSeconds: s.timeLimitSeconds,
    timeTakenSeconds: s.timeTakenSeconds,
    attempts: s.attempts as Record<number, string>,
    score: s.score,
    timestamp: new Date(s.createdAt).getTime(),
  });

  const loadHistory = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: ApiQuizSession[] }>('/generate/history');
      const mapped = res.data.data.map(mapSessionToHistory);
      setHistory(mapped);
      calculateStats(mapped);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  function calculateStats(data: HistoryQuiz[]) {
    if (data.length === 0) {
      setAvgScore(0);
      setTimePerQuest(0);
      setStreakDays(0);
      return;
    }

    // Avg Score & Time per question
    let totalScore = 0;
    let totalQuestions = 0;
    let totalTime = 0;
    let totalAttemptedQuestions = 0;

    data.forEach(q => {
      totalScore += q.score;
      totalQuestions += q.questions.length;
      totalTime += (q.timeTakenSeconds || 0);
      totalAttemptedQuestions += Object.keys(q.attempts).length;
    });

    const scorePct = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    setAvgScore(scorePct);

    const tpq = totalAttemptedQuestions > 0 ? Math.round(totalTime / totalAttemptedQuestions) : 0;
    setTimePerQuest(tpq);

    // Streak & Week Activity
    const dates = data.map(q => {
      const d = new Date(q.timestamp);
      d.setHours(0,0,0,0);
      return d.getTime();
    });
    const uniqueDates = Array.from(new Set(dates)).sort((a,b) => b - a);
    
    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    const currentMs = currentDate.getTime();
    
    // Check if practiced today or yesterday to continue streak
    if (uniqueDates.includes(currentMs) || uniqueDates.includes(currentMs - 86400000)) {
      let checkMs = uniqueDates.includes(currentMs) ? currentMs : currentMs - 86400000;
      while (uniqueDates.includes(checkMs)) {
        streak++;
        checkMs -= 86400000;
      }
    }
    setStreakDays(streak);

    // Week Activity (Monday = 0, Sunday = 6)
    const week = [false, false, false, false, false, false, false];
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sun = 0, Mon = 1, etc.
    const dist = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // distance to last Monday
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - dist);
    lastMonday.setHours(0,0,0,0);

    uniqueDates.forEach(dMs => {
      const d = new Date(dMs);
      if (d >= lastMonday) {
        let idx = d.getDay() - 1;
        if (idx === -1) idx = 6; // Sunday
        week[idx] = true;
      }
    });
    setWeekActivity(week);
  };

  const handleStartPractice = async (template: typeof TEMPLATES[0]) => {
    setGeneratingTemplateId(template.id);
    try {
      const count = 5; // default 5 questions for template
      const res = await apiClient.post<{ success: boolean; data: GeneratedQuestion[] }>('/generate/questions', {
        topic: template.topic,
        subject: template.subject,
        difficulty: 'MEDIUM',
        bloomLevel: 'APPLY',
        count,
      });
      const questions = res.data.data;
      const timeLimit = count * 60;
      const newQuiz = {
        topic: template.topic,
        subject: template.subject,
        difficulty: 'MEDIUM',
        bloomLevel: 'APPLY',
        timeLimitSeconds: timeLimit,
        timeTakenSeconds: 0,
        score: 0,
        attempts: {},
        questions
      };
      
      const saveRes = await apiClient.post<{ success: boolean; data: { id: string } }>('/generate/session', newQuiz);
      router.push(`/dashboard/student/practice/attempt?sessionId=${saveRes.data.data.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate practice module');
    } finally {
      setGeneratingTemplateId(null);
    }
  };

  // Mock bar chart heights (0-100)
  const chartBars = [40, 70, 50, 90, 60, 100, 75];

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isTemplateModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isTemplateModalOpen]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: '#0F172A', background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Top Banner */}
      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', marginBottom: 24, flexWrap: 'wrap', gap: 24 }}>
        <div style={{ maxWidth: 500 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF7ED', color: '#EA580C', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
            <Zap size={14} fill="#EA580C" /> AI POWERED
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Generate a Custom Practice Quiz in Seconds
          </h1>
          <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.5, marginBottom: 24 }}>
            Our AI analyzes your curriculum and performance gaps to create the perfect study session tailored just for you.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => router.push('/dashboard/student/practice/generate')}
              style={{ background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 24, padding: '12px 24px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <Sparkles size={16} /> Generate Quiz
            </button>
            <button 
              onClick={() => setIsTemplateModalOpen(true)}
              style={{ background: '#FFFFFF', color: '#0F172A', border: '2px solid #E2E8F0', borderRadius: 24, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              View Templates
            </button>
          </div>
        </div>
        
        {/* Banner Illustration */}
        <div style={{ width: 240, height: 240, background: '#FFF7ED', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 100, height: 100, background: '#FFFFFF', borderRadius: 20, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(10deg)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <circle cx="10" cy="13" r="2"></circle>
              <path d="m14 17-2.5-2.5"></path>
              <path d="M15.5 13a2.5 2.5 0 0 0-2.5 2.5"></path>
            </svg>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Column */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: 24, flexShrink: 0 }}>
          
          {/* Recent Performance */}
          <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Recent Performance</h3>
              <div style={{ letterSpacing: 2, color: '#94A3B8', fontWeight: 900, cursor: 'pointer' }}>...</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, marginBottom: 24, gap: 8 }}>
              {chartBars.map((height, i) => (
                <div key={i} style={{ flex: 1, background: height === 100 ? '#B45309' : '#F8FAFC', height: `${height}%`, borderRadius: 4, transition: 'all 0.3s ease' }}></div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: '#F8FAFC', borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: 0.5, marginBottom: 4 }}>AVG SCORE</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{avgScore}%</div>
              </div>
              <div style={{ flex: 1, background: '#F8FAFC', borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: 0.5, marginBottom: 4 }}>TIME/QUEST</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{timePerQuest}s</div>
              </div>
            </div>
          </div>

          {/* Practice Streak */}
          <div style={{ background: '#0F172A', borderRadius: 24, padding: 24, color: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, zIndex: 2, position: 'relative' }}>Practice Streak</h3>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, marginBottom: 24, zIndex: 2, position: 'relative' }}>
              You've practiced for {streakDays} consecutive days. Keep it up!
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 2, position: 'relative' }}>
              {['M','T','W','T','F','S','S'].map((day, i) => {
                const isActive = weekActivity[i];
                return (
                  <div key={i} style={{ 
                    width: 32, height: 32, borderRadius: '50%', 
                    background: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.1)', 
                    color: isActive ? '#0F172A' : '#94A3B8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700
                  }}>
                    {day}
                  </div>
                )
              })}
            </div>

            {/* Background Star decoration */}
            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.05, transform: 'rotate(15deg)', zIndex: 1 }}>
              <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Available Topics</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Filter size={14} /> Filter
              </button>
              <button style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Settings2 size={14} /> Difficulty
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {TEMPLATES.map(t => (
              <div key={t.id} style={{ background: '#FFFFFF', borderRadius: 24, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {t.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{t.title}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 24, flex: 1 }}>
                  {t.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 11, fontWeight: 600 }}>
                    <BarChart2 size={14} /> {t.qCount} Questions
                  </div>
                  <button 
                    onClick={() => handleStartPractice(t)}
                    disabled={generatingTemplateId === t.id}
                    style={{ background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: generatingTemplateId === t.id ? 'default' : 'pointer', opacity: generatingTemplateId === t.id ? 0.7 : 1 }}
                  >
                    {generatingTemplateId === t.id ? 'Loading...' : 'Start Practice'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div style={{ background: '#E2E8F0', borderRadius: 24, padding: 32, marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24, overflow: 'hidden', position: 'relative' }}>
        <div style={{ maxWidth: 500, zIndex: 2 }}>
          <div style={{ display: 'inline-block', background: '#B45309', color: '#FFFFFF', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, marginBottom: 16 }}>
            NEW MODULE
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em', color: '#0F172A' }}>
            Quantum Physics Basics:<br/>Visual Concept Quiz
          </h2>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, marginBottom: 24 }}>
            Experience our new interactive quiz module with 3D models and real-time AI explanations for complex phenomena.
          </p>
          <button style={{ background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 24, padding: '12px 24px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            Explore Module <ChevronRight size={16} />
          </button>
        </div>
        
        {/* Abstract Placeholder for the image */}
        <div style={{ width: 300, height: 180, background: '#0F172A', borderRadius: 16, position: 'relative', overflow: 'hidden', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="100%" height="100%" viewBox="0 0 280 160" preserveAspectRatio="none">
            <path d="M0 80 Q 70 20 140 80 T 280 80" fill="none" stroke="#38BDF8" strokeWidth="2" opacity="0.5" />
            <path d="M0 80 Q 70 140 140 80 T 280 80" fill="none" stroke="#818CF8" strokeWidth="2" opacity="0.5" />
            <path d="M0 80 Q 70 50 140 80 T 280 80" fill="none" stroke="#C084FC" strokeWidth="2" opacity="0.5" />
            <circle cx="140" cy="80" r="4" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* View Templates Modal (Strict overlay) */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Backdrop strictly blocks all background interactions */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
              onClick={(e) => { e.stopPropagation(); setIsTemplateModalOpen(false); }}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: '#FFFFFF', width: '90%', maxWidth: 700, borderRadius: 24, padding: 32, position: 'relative', zIndex: 10000, maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()} // Stop clicks from reaching backdrop
            >
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                style={{ position: 'absolute', top: 24, right: 24, background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={16} />
              </button>
              
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: '#0F172A' }}>Quiz Templates</h2>
              <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Select a pre-configured template to instantly start practicing. Models are generated dynamically using your syllabus.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {TEMPLATES.map(t => (
                  <div 
                    key={`modal-${t.id}`} 
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid #E2E8F0', borderRadius: 16, transition: 'all 0.2s ease', cursor: 'pointer', background: '#F8FAFC' }} 
                    onClick={() => { setIsTemplateModalOpen(false); handleStartPractice(t); }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {t.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, color: '#0F172A' }}>{t.title}</h4>
                      <p style={{ fontSize: 13, color: '#64748B' }}>{t.description}</p>
                    </div>
                    <ChevronRight size={20} color="#CBD5E1" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}