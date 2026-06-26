'use client';
/* eslint-disable react-hooks/purity */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Paperclip, Sparkles, Loader2, AlertCircle, ImageOff, Check, X, Eye, History, Trash2, RotateCcw, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
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

interface Quiz {
  id: string;
  topic: string;
  subject: string;
  questions: GeneratedQuestion[];
  timeLimitSeconds: number;
  timeRemainingSeconds: number;
  timeTakenSeconds?: number;
  attempts: Record<number, string>; // question index -> option letter
  isSubmitted: boolean;
  score?: number;
  timestamp: number;
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

// Shape returned by GET /api/v1/generate/history
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

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sharedId = searchParams.get('sharedId');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    subject: '',
    difficulty: 'MEDIUM',
    bloom_level: 'APPLY',
    numQuestions: 5,
    context: ''
  });

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', f);
    try {
      const res = await apiClient.post<{success:boolean, data:{content:string}}>('/generate/parse', fd);
      setFormData(prev => ({ ...prev, context: res.data.data.content }));
      toast.success('Document parsed!');
    } catch {
      toast.error('Failed to parse document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleShareQuiz = async () => {
    if (!activeQuiz) return;
    try {
      const res = await apiClient.post<{success:boolean, data:{sharedId:string}}>('/generate/share', { 
        topic: activeQuiz.topic, 
        subject: activeQuiz.subject, 
        questions: activeQuiz.questions 
      });
      const url = `${window.location.origin}/dashboard/student/practice?sharedId=${res.data.data.sharedId}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard!');
    } catch {
      toast.error('Failed to share quiz');
    }
  };

  const handleShareHistoryQuiz = async (hQuiz: HistoryQuiz) => {
    try {
      const res = await apiClient.post<{success:boolean, data:{sharedId:string}}>('/generate/share', { 
        topic: hQuiz.topic, 
        subject: hQuiz.subject, 
        questions: hQuiz.questions 
      });
      const url = `${window.location.origin}/dashboard/student/practice?sharedId=${res.data.data.sharedId}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard!');
    } catch {
      toast.error('Failed to share quiz');
    }
  };

  const handleRetakeQuiz = async () => {
    if(!activeQuiz) return;
    try {
      const newQuiz = {
        topic: activeQuiz.topic,
        subject: activeQuiz.subject,
        difficulty: formData.difficulty,
        bloomLevel: formData.bloom_level,
        timeLimitSeconds: activeQuiz.timeLimitSeconds,
        timeTakenSeconds: 0,
        score: 0,
        attempts: {},
        questions: activeQuiz.questions
      };
      const saveRes = await apiClient.post<{ success: boolean; data: { id: string } }>('/generate/session', newQuiz);
      router.push(`/dashboard/student/practice/attempt?sessionId=${saveRes.data.data.id}`);
    } catch {
      toast.error('Failed to retake quiz');
    }
  };

  const handleRetakeQuizGroup = async (hQuiz: HistoryQuiz) => {
    toast.success('Starting a new attempt...');
    try {
      const newQuiz = {
        topic: hQuiz.topic,
        subject: hQuiz.subject,
        difficulty: hQuiz.difficulty,
        bloomLevel: hQuiz.bloomLevel,
        timeLimitSeconds: hQuiz.timeLimitSeconds,
        timeTakenSeconds: 0,
        score: 0,
        attempts: {},
        questions: hQuiz.questions
      };
      const saveRes = await apiClient.post<{ success: boolean; data: { id: string } }>('/generate/session', newQuiz);
      router.push(`/dashboard/student/practice/attempt?sessionId=${saveRes.data.data.id}`);
    } catch {
      toast.error('Failed to start retry session');
    }
  };

  // History State
  const [history, setHistory] = useState<HistoryQuiz[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showGeneratorForm, setShowGeneratorForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Convert API session to HistoryQuiz
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

  // Load history from database
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: ApiQuizSession[] }>('/generate/history');
      setHistory(res.data.data.map(mapSessionToHistory));
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Group history by subject + topic
  const groupedHistoryMap = new Map<string, HistoryQuiz[]>();
  history.forEach(hq => {
    const key = `${hq.subject}:::${hq.topic}`;
    if (!groupedHistoryMap.has(key)) groupedHistoryMap.set(key, []);
    groupedHistoryMap.get(key)!.push(hq);
  });
  const groupedHistory = Array.from(groupedHistoryMap.entries()).map(([key, quizzes]) => ({
    key,
    subject: quizzes[0].subject,
    topic: quizzes[0].topic,
    quizzes
  }));

  // Load shared quiz
  useEffect(() => {
    if (sharedId) {
      setLoading(true);
      apiClient.get<{success: boolean, data: ApiQuizSession}>('/generate/shared/' + sharedId).then(async (res) => {
        const sharedData = res.data.data;
        const newQuiz = {
          topic: sharedData.topic,
          subject: sharedData.subject,
          difficulty: sharedData.difficulty,
          bloomLevel: sharedData.bloomLevel,
          timeLimitSeconds: sharedData.timeLimitSeconds,
          timeTakenSeconds: 0,
          score: 0,
          attempts: {},
          questions: sharedData.questions.map(q => ({
            id: q.id,
            question_text: q.questionText || '',
            options: q.options,
            answer: q.answer,
            difficulty: q.difficulty,
            bloomLevel: q.bloomLevel,
            ai_confidence_score: q.aiConfidenceScore,
            hint: q.hint
          }))
        };
        const saveRes = await apiClient.post<{ success: boolean; data: { id: string } }>('/generate/session', newQuiz);
        router.push(`/dashboard/student/practice/attempt?sessionId=${saveRes.data.data.id}`);
      }).catch(() => toast.error('Shared quiz not found')).finally(() => setLoading(false));
    }
  }, [sharedId, router]);

  // Load history on mount
  useEffect(() => { void loadHistory(); }, [loadHistory]);

  // Save a completed quiz session to database
  const persistSession = async (quiz: Quiz, score: number, timeTaken: number): Promise<string | null> => {
    try {
      const res = await apiClient.post<{ success: boolean; data: { id: string } }>('/generate/session', {
        topic: quiz.topic,
        subject: quiz.subject,
        difficulty: formData.difficulty,
        bloomLevel: formData.bloom_level,
        timeLimitSeconds: quiz.timeLimitSeconds,
        timeTakenSeconds: timeTaken,
        score,
        attempts: quiz.attempts,
        questions: quiz.questions,
      });
      return res.data.data.id;
    } catch {
      return null;
    }
  };

  const submitQuizData = (quiz: Quiz) => {
    // Calculate score
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      const attempt = quiz.attempts[idx];
      if (attempt === q.answer) {
        score++;
      }
    });

    const timeTaken = quiz.timeLimitSeconds - quiz.timeRemainingSeconds;

    // Build optimistic history entry for immediate UI update
    const historyQuiz: HistoryQuiz = {
      id: quiz.id,
      topic: quiz.topic,
      subject: quiz.subject,
      difficulty: formData.difficulty,
      bloomLevel: formData.bloom_level,
      questions: quiz.questions,
      timeLimitSeconds: quiz.timeLimitSeconds,
      timeTakenSeconds: timeTaken,
      attempts: quiz.attempts,
      score,
      timestamp: Date.now()
    };

    // Optimistic UI update, then persist to DB
    setHistory(prev => [historyQuiz, ...prev]);
    void persistSession(quiz, score, timeTaken).then(() => { void loadHistory(); });

    setActiveQuiz(prev => prev ? { ...prev, isSubmitted: true, score, timeTakenSeconds: timeTaken } : null);
    toast.success(`Quiz Completed! You scored ${score}/${quiz.questions.length}`);
  };

  const handleAutoSubmit = (quiz: Quiz) => {
    toast.error("Time is up! Quiz submitted automatically.");
    submitQuizData(quiz);
  };

  // Timer Effect
  useEffect(() => {
    if (!activeQuiz || activeQuiz.isSubmitted) return;

    const timer = setInterval(() => {
      setActiveQuiz(prev => {
        if (!prev) return null;
        if (prev.timeRemainingSeconds <= 1) {
          clearInterval(timer);
          // Auto submit
          handleAutoSubmit(prev);
          return {
            ...prev,
            timeRemainingSeconds: 0,
            isSubmitted: true
          };
        }
        return {
          ...prev,
          timeRemainingSeconds: prev.timeRemainingSeconds - 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz?.id, activeQuiz?.isSubmitted]);

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    const unansweredCount = activeQuiz.questions.length - Object.keys(activeQuiz.attempts).length;
    if (unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered questions. Submit anyway?`)) {
        return;
      }
    }
    submitQuizData(activeQuiz);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActiveQuiz(null);
    setGenerationError(null);
    setRevealedAnswers({});
    try {
      const count = formData.numQuestions;
      const res = await apiClient.post<{ success: boolean; data: GeneratedQuestion[] }>('/generate/questions', {
        topic: formData.topic,
        subject: formData.subject,
        difficulty: formData.difficulty,
        bloomLevel: formData.bloom_level,
        context: formData.context || undefined,
        count,
      });
      const questions = res.data.data;

      const timeLimit = count * 60; // 1 minute per question
      const newQuiz = {
        topic: formData.topic,
        subject: formData.subject,
        difficulty: formData.difficulty,
        bloomLevel: formData.bloom_level,
        timeLimitSeconds: timeLimit,
        timeTakenSeconds: 0,
        score: 0,
        attempts: {},
        questions
      };

      // Instantly save to database
      await apiClient.post<{ success: boolean; data: { id: string } }>('/generate/session', newQuiz);
      
      toast.success(`${count} questions generated successfully!`);
      setShowGeneratorForm(false);
      void loadHistory();
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

  const getOptionLetter = (optionText: string, index: number): string => {
    const match = optionText.trim().match(/^([A-Da-d])\s*[\.\)]/);
    if (match) {
      return match[1].toUpperCase();
    }
    return String.fromCharCode(65 + index); // Fallback
  };

  const cleanOptionText = (optionText: string): string => {
    return optionText;
  };

  const handleSelectOption = (qIdx: number, letter: string) => {
    if (!activeQuiz || activeQuiz.isSubmitted) return;
    setActiveQuiz(prev => {
      if (!prev) return null;
      return {
        ...prev,
        attempts: {
          ...prev.attempts,
          [qIdx]: letter
        }
      };
    });
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const toggleRevealAnswer = (key: string) => {
    setRevealedAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReattemptHistoryQuiz = (hQuiz: HistoryQuiz) => {
    toast.success('Retrying past quiz! Navigating to quiz room...');
    router.push(`/dashboard/student/practice/attempt?sessionId=${hQuiz.id}&retake=true`);
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your quiz history?')) return;
    try {
      await apiClient.delete('/generate/history');
      setHistory([]);
      toast.success('History cleared.');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={24} color="#0f172a" />
            <h1 className="page-title">Generate Quiz</h1>
          </div>
          <p className="page-subtitle">Instantly generate syllabus-aligned multiple choice quizzes to test student concepts.</p>
        </div>

      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">{activeTab === 'history' ? 'History' : 'Quiz Room'}</h1>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Generator Form (Only show when not in active quiz or after submitting) */}
          {(!activeQuiz || activeQuiz.isSubmitted) && (
            <>
              {!showGeneratorForm ? (
                <div 
                  className="card" 
                  style={{ marginBottom: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', border: '2px dashed var(--border)', background: '#FFFFFF', transition: 'all 0.2s ease' }}
                  onClick={() => setShowGeneratorForm(true)}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Sparkles size={24} color="var(--brand)" />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Generate Quiz</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Click here to create a new AI-generated practice quiz</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="card" style={{ marginBottom: 20, position: 'relative' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowGeneratorForm(false)}
                      style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: '#F3F4F6', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Configure Quiz</h3>
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
                  <div style={{ position: 'relative' }}>
                    <textarea 
                      rows={4} 
                      className="input" 
                      placeholder="Paste syllabus or reference material here... Avoid pasting images or file paths." 
                      value={formData.context} 
                      onChange={e => setFormData({...formData, context: e.target.value})} 
                      style={{ resize: 'none', paddingBottom: 44 }} 
                    />
                    <label style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: isUploading ? 'default' : 'pointer',
                      color: 'var(--text-secondary)',
                      opacity: isUploading ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                      {isUploading ? 'Parsing...' : 'Attach File'}
                      <input type="file" accept=".pdf,.txt" style={{display:'none'}} onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, marginTop: 16, width: '100%' }}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {loading ? 'Generating Quiz...' : 'Generate with AI'}
                </button>
              </div>
            </form>
              )}
            </>
          )}

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

          {(!activeQuiz || activeQuiz.isSubmitted) && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <History size={20} /> Your Quizzes
                  <button
                    type="button"
                    onClick={() => void loadHistory()}
                    disabled={historyLoading}
                    title="Refresh history"
                    style={{ background: 'none', border: 'none', cursor: historyLoading ? 'default' : 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <RefreshCw size={14} style={{ opacity: 0.5, animation: historyLoading ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </h2>
                {history.length > 0 && (
                  <button 
                    type="button" 
                    onClick={handleClearHistory} 
                    style={{ 
                      background: '#FEE2E2', 
                      border: '1px solid #FECACA', 
                      color: '#B91C1C', 
                      padding: '6px 12px', 
                      borderRadius: 8, 
                      fontSize: 12, 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Trash2 size={14} /> Clear History
                  </button>
                )}
              </div>

              {historyLoading ? (
                <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></div>
              ) : history.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                  <History size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No generated quiz available</h3>
                  <p style={{ fontSize: 14 }}>Create your first AI-generated quiz using the button above.</p>
                </div>
              ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {groupedHistory.map((group, groupIdx) => {
                const isExpanded = expandedHistoryId === group.key;
                const quizzes = group.quizzes;
                const bestQuiz = quizzes.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), quizzes[0]);
                const percentScore = Math.round((bestQuiz.score / bestQuiz.questions.length) * 100);
                const hasUntaken = quizzes.some(q => Object.keys(q.attempts).length === 0 && q.timeTakenSeconds === 0);
                const latestUntaken = quizzes.find(q => Object.keys(q.attempts).length === 0 && q.timeTakenSeconds === 0);

                return (
                  <div key={group.key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div 
                      onClick={() => setExpandedHistoryId(isExpanded ? null : group.key)}
                      style={{ 
                        padding: '16px 20px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        background: '#F9FAFB',
                        flexWrap: 'wrap',
                        gap: 12
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>
                            {group.subject}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>&middot;</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {group.topic}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          {quizzes.length} Attempt{quizzes.length > 1 ? 's' : ''} &middot; {quizzes[0].questions.length} Qs
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {hasUntaken && quizzes.length === 1 ? (
                          <div style={{ 
                            fontSize: 13, 
                            fontWeight: 700, 
                            color: '#4B5563',
                            background: '#F3F4F6',
                            padding: '4px 10px',
                            borderRadius: 8
                          }}>
                            Not attempted
                          </div>
                        ) : (
                          <div style={{ 
                            fontSize: 13, 
                            fontWeight: 800, 
                            color: percentScore >= 70 ? '#047857' : percentScore >= 40 ? '#B45309' : '#B91C1C',
                            background: percentScore >= 70 ? '#D1FAE5' : percentScore >= 40 ? '#FEF3C7' : '#FEE2E2',
                            padding: '4px 10px',
                            borderRadius: 8
                          }}>
                            Best: {bestQuiz.score} / {bestQuiz.questions.length} ({percentScore}%)
                          </div>
                        )}

                        {hasUntaken ? (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/student/practice/attempt?sessionId=${latestUntaken!.id}`);
                            }}
                            style={{
                              background: 'var(--brand)',
                              border: 'none',
                              color: '#FFF',
                              borderRadius: 6,
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            <Sparkles size={14} /> Resume
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetakeQuizGroup(quizzes[0]);
                            }}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <RotateCcw size={14} /> Retake
                          </button>
                        )}
                        
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareHistoryQuiz(quizzes[0]);
                          }}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: '6px 14px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                          Share
                        </button>

                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, background: '#FFFFFF' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Attempt History</h4>
                        {quizzes.map((q, i) => {
                          const attemptScore = Math.round((q.score / q.questions.length) * 100);
                          const isAttemptUntaken = Object.keys(q.attempts).length === 0 && q.timeTakenSeconds === 0;
                          return (
                            <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid var(--border)' }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                  Attempt {quizzes.length - i}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  {new Date(q.timestamp).toLocaleString()}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {isAttemptUntaken ? (
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', padding: '4px 8px', background: '#E5E7EB', borderRadius: 6 }}>Not Attempted</span>
                                ) : (
                                  <>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: attemptScore >= 70 ? '#047857' : attemptScore >= 40 ? '#B45309' : '#B91C1C' }}>
                                      Score: {q.score}/{q.questions.length} ({attemptScore}%)
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(q.timeTakenSeconds)}</span>
                                  </>
                                )}
                                <button 
                                  onClick={() => router.push(`/dashboard/student/practice/attempt?sessionId=${q.id}&retake=true`)}
                                  style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)' }}
                                >
                                  {isAttemptUntaken ? 'Resume' : 'Review'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
            </div>
          )}
        </div>
      </div>
      
      {/* Styles for option hover transitions */}
      <style jsx global>{`
        .generate-option-btn:hover {
          background: #F3F4F6 !important;
          border-color: #9CA3AF !important;
          transform: translateY(-1px);
        }
        .generate-option-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="dashboard-view"><Loader2 className="animate-spin" /></div>}>
      <GeneratePageContent />
    </Suspense>
  );
}