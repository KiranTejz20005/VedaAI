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
  // History State
  const [history, setHistory] = useState<HistoryQuiz[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const activeTab = 'generate'; // mock for unchanged code if any
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
      const saveRes = await apiClient.post<{ success: boolean; data: { id: string } }>('/generate/session', newQuiz);
      
      toast.success(`${count} questions generated successfully! Start attempting.`);
      router.push(`/dashboard/student/practice/attempt?sessionId=${saveRes.data.data.id}`);
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
    const timeLimit = hQuiz.questions.length * 60;
    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      topic: hQuiz.topic,
      subject: hQuiz.subject,
      questions: hQuiz.questions,
      timeLimitSeconds: timeLimit,
      timeRemainingSeconds: timeLimit,
      attempts: {},
      isSubmitted: false,
      timestamp: Date.now()
    };
    setActiveQuiz(newQuiz);
    setActiveTab('generate');
    setRevealedAnswers({});
    toast.success('Retrying past quiz! Timer started.');
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

        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: showHistory ? '#F3F4F6' : '#FFFFFF',
            border: `1px solid ${showHistory ? '#D1D5DB' : 'var(--border)'}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            flexShrink: 0,
            color: 'var(--text-primary)'
          }}
          title={`History (${history.length})`}
        >
          <History size={18} />
        </button>
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
                      bottom: 8,
                      right: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
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

        </div>

        {/* History Drawer */}
        {showHistory && (
          <div className="card" style={{ width: 400, flexShrink: 0, height: 'calc(100vh - 120px)', overflowY: 'auto', position: 'sticky', top: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={18} /> Quiz History ({history.length})
              <button
                type="button"
                onClick={() => void loadHistory()}
                disabled={historyLoading}
                title="Refresh history from database"
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

          {history.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <History size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No history yet</h3>
              <p style={{ fontSize: 14 }}>Generated quizzes will show up here as single test sessions, allowing you to review scores or re-attempt them.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {history.map((hQuiz, idx) => {
                const isExpanded = expandedHistoryId === hQuiz.id;
                const percentScore = Math.round((hQuiz.score / hQuiz.questions.length) * 100);

                return (
                  <div key={hQuiz.id || idx} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Header Summary Row */}
                    <div 
                      onClick={() => setExpandedHistoryId(isExpanded ? null : hQuiz.id)}
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
                            {hQuiz.subject}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>&middot;</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {hQuiz.topic}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          {new Date(hQuiz.timestamp).toLocaleString()} &middot; {hQuiz.questions.length} Qs
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ 
                          fontSize: 13, 
                          fontWeight: 800, 
                          color: percentScore >= 70 ? '#047857' : percentScore >= 40 ? '#B45309' : '#B91C1C',
                          background: percentScore >= 70 ? '#D1FAE5' : percentScore >= 40 ? '#FEF3C7' : '#FEE2E2',
                          padding: '4px 10px',
                          borderRadius: 8
                        }}>
                          Score: {hQuiz.score} / {hQuiz.questions.length} ({percentScore}%)
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                          Duration: {formatTime(hQuiz.timeTakenSeconds)}
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReattemptHistoryQuiz(hQuiz);
                          }}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <RotateCcw size={12} /> Retry
                        </button>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Expandable Review Details */}
                    {isExpanded && (
                      <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20, background: '#FFFFFF' }}>
                        {hQuiz.questions.map((q, qIdx) => {
                          const userAttempt = hQuiz.attempts[qIdx];
                          const isCorrect = userAttempt === q.answer;
                          const isRevealed = revealedAnswers[`history-${hQuiz.id}-${qIdx}`];

                          return (
                            <div key={q.id || qIdx} style={{ paddingBottom: 16, borderBottom: qIdx < hQuiz.questions.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                  Question {qIdx + 1}
                                </span>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 8,
                                  background: isCorrect ? '#DCFCE7' : '#FEE2E2',
                                  color: isCorrect ? '#15803D' : '#B91C1C'
                                }}>
                                  {isCorrect ? <Check size={12} /> : <X size={12} />}
                                  {isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              </div>

                              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 12, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                                {q.question_text}
                              </p>

                              {q.hint && (
                                <div style={{ marginBottom: 12 }}>
                                  <button
                                    type="button"
                                    onClick={() => toggleRevealAnswer(`hint-history-${hQuiz.id}-${qIdx}`)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '2px 8px',
                                      background: '#FEF3C7',
                                      border: '1px solid #FCD34D',
                                      borderRadius: 4,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: '#D97706',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    💡 {revealedAnswers[`hint-history-${hQuiz.id}-${qIdx}`] ? 'Hide Hint' : 'Show Hint'}
                                  </button>
                                  {revealedAnswers[`hint-history-${hQuiz.id}-${qIdx}`] && (
                                    <p style={{ marginTop: 6, fontSize: 12, color: '#B45309', background: '#FFFDF5', padding: 6, borderRadius: 4, borderLeft: '3px solid #F59E0B' }}>
                                      {q.hint}
                                    </p>
                                  )}
                                </div>
                              )}

                              {q.options && q.options.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 12 }}>
                                  {q.options.map((opt, i) => {
                                    const letter = getOptionLetter(opt, i);
                                    const isThisSelected = userAttempt === letter;
                                    const isThisCorrect = q.answer === letter;
                                    
                                    let optionBg = '#F9FAFB';
                                    let optionBorder = 'var(--border)';
                                    let optionColor = 'var(--text-primary)';
                                    let icon = null;

                                    if (isThisCorrect) {
                                      optionBg = '#DCFCE7';
                                      optionBorder = '#22C55E';
                                      optionColor = '#15803D';
                                      icon = <Check size={14} style={{ color: '#22C55E', flexShrink: 0 }} />;
                                    } else if (isThisSelected) {
                                      optionBg = '#FEE2E2';
                                      optionBorder = '#EF4444';
                                      optionColor = '#B91C1C';
                                      icon = <X size={14} style={{ color: '#EF4444', flexShrink: 0 }} />;
                                    }

                                    return (
                                      <div 
                                        key={i}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '8px 12px',
                                          background: optionBg,
                                          border: `1px solid ${optionBorder}`,
                                          borderRadius: 6,
                                          fontSize: 12,
                                          color: optionColor,
                                          fontWeight: isThisSelected || isThisCorrect ? 600 : 400
                                        }}
                                      >
                                        <span>{cleanOptionText(opt)}</span>
                                        {icon}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Answer:</span>
                                <div 
                                  onClick={() => toggleRevealAnswer(`history-${hQuiz.id}-${qIdx}`)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '2px 8px',
                                    background: isRevealed ? '#D1FAE5' : '#F3F4F6',
                                    border: `1px solid ${isRevealed ? '#10B981' : '#E5E7EB'}`,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: isRevealed ? '#065F46' : '#4b5563',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  <span style={{ filter: isRevealed ? 'none' : 'blur(4px)' }}>
                                    {q.answer}
                                  </span>
                                  {!isRevealed && (
                                    <Eye size={10} style={{ opacity: 0.6 }} />
                                  )}
                                </div>
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