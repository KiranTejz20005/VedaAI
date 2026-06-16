'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, AlertCircle, ImageOff, Check, X, Eye, History, Trash2, RotateCcw, Clock, Award, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
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
  questions: GeneratedQuestion[];
  timeLimitSeconds: number;
  timeTakenSeconds: number;
  attempts: Record<number, string>;
  score: number;
  timestamp: number;
}

export default function GeneratePage() {
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
  
  // History State
  const [history, setHistory] = useState<HistoryQuiz[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shiksha_generate_quizzes');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Save history helper
  const saveHistory = (newHistory: HistoryQuiz[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('shiksha_generate_quizzes', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save history', e);
    }
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

  const handleAutoSubmit = (quiz: Quiz) => {
    toast.error("Time is up! Quiz submitted automatically.");
    submitQuizData(quiz);
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
    const historyQuiz: HistoryQuiz = {
      id: quiz.id,
      topic: quiz.topic,
      subject: quiz.subject,
      questions: quiz.questions,
      timeLimitSeconds: quiz.timeLimitSeconds,
      timeTakenSeconds: timeTaken,
      attempts: quiz.attempts,
      score,
      timestamp: Date.now()
    };

    saveHistory([historyQuiz, ...history]);
    setActiveQuiz(prev => prev ? { ...prev, isSubmitted: true, score, timeTakenSeconds: timeTaken } : null);
    toast.success(`Quiz Completed! You scored ${score}/${quiz.questions.length}`);
  };

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
      const promises = Array.from({ length: count }).map(() =>
        apiClient.post<{ success: boolean; data: GeneratedQuestion }>('/generate/question', {
          topic: formData.topic,
          subject: formData.subject,
          difficulty: formData.difficulty,
          bloomLevel: formData.bloom_level,
          context: formData.context || undefined,
        })
      );
      const responses = await Promise.all(promises);
      const questions = responses.map(res => res.data.data);

      const timeLimit = count * 60; // 1 minute per question
      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        topic: formData.topic,
        subject: formData.subject,
        questions,
        timeLimitSeconds: timeLimit,
        timeRemainingSeconds: timeLimit,
        attempts: {},
        isSubmitted: false,
        timestamp: Date.now()
      };

      setActiveQuiz(newQuiz);
      toast.success(`${count} questions generated successfully! Start attempting.`);
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

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your quiz history?')) {
      saveHistory([]);
      toast.success('History cleared.');
    }
  };

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={24} color="#0f172a" />
            <h1 className="page-title">Generate Quiz</h1>
          </div>
          <p className="page-subtitle">Instantly generate syllabus-aligned multiple choice quizzes to test student concepts.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
          <button 
            type="button" 
            onClick={() => setActiveTab('generate')} 
            style={{ 
              padding: '6px 14px', 
              borderRadius: 8, 
              fontSize: 13, 
              fontWeight: 600, 
              background: activeTab === 'generate' ? '#ffffff' : 'transparent',
              color: activeTab === 'generate' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'generate' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Sparkles size={14} /> Quiz Room
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('history')} 
            style={{ 
              padding: '6px 14px', 
              borderRadius: 8, 
              fontSize: 13, 
              fontWeight: 600, 
              background: activeTab === 'history' ? '#ffffff' : 'transparent',
              color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <History size={14} /> History ({history.length})
          </button>
        </div>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">{activeTab === 'history' ? 'History' : 'Quiz Room'}</h1>
        <div style={{ width: 32 }} />
      </div>

      {activeTab === 'generate' ? (
        <>
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
                  <textarea rows={4} className="input" placeholder="Paste syllabus or reference material here... Avoid pasting images or file paths." value={formData.context} onChange={e => setFormData({...formData, context: e.target.value})} style={{ resize: 'none' }} />
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

          {activeQuiz && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Header Quiz Banner */}
              <div className="card" style={{
                background: activeQuiz.isSubmitted ? '#ECFDF5' : '#EFF6FF',
                borderColor: activeQuiz.isSubmitted ? '#10B981' : '#3B82F6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                padding: '16px 20px'
              }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1E3A8A' }}>
                    {activeQuiz.topic} Quiz
                  </h2>
                  <p style={{ fontSize: 12, color: '#3B82F6', marginTop: 2, fontWeight: 500 }}>
                    Subject: {activeQuiz.subject} &middot; {activeQuiz.questions.length} Questions
                  </p>
                </div>

                {!activeQuiz.isSubmitted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: activeQuiz.timeRemainingSeconds < 30 ? '#EF4444' : '#1E3A8A', background: '#FFFFFF', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <Clock size={16} className={activeQuiz.timeRemainingSeconds < 30 ? 'animate-pulse' : ''} />
                      <span>{formatTime(activeQuiz.timeRemainingSeconds)}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleSubmitQuiz} 
                      className="btn btn-dark btn-pill" 
                      style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700 }}
                    >
                      Submit Quiz
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#065F46', background: '#D1FAE5', padding: '6px 14px', borderRadius: 8 }}>
                      <Award size={18} />
                      <span>Score: {activeQuiz.score} / {activeQuiz.questions.length} ({Math.round((activeQuiz.score || 0) / activeQuiz.questions.length * 100)}%)</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#065F46', fontWeight: 600 }}>
                      Time Taken: {formatTime(activeQuiz.timeTakenSeconds || 0)}
                    </div>
                  </div>
                )}
              </div>

              {/* Questions Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {activeQuiz.questions.map((q, qIdx) => {
                  const userAttempt = activeQuiz.attempts[qIdx];
                  const isAttempted = !!userAttempt;
                  const isCorrect = userAttempt === q.answer;
                  const isRevealed = revealedAnswers[`active-${qIdx}`] || activeQuiz.isSubmitted;

                  return (
                    <motion.div key={q.id || qIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle size={20} color={isAttempted || isRevealed ? '#10B981' : '#9ca3af'} />
                          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Question {qIdx + 1}</h3>
                        </div>
                        {activeQuiz.isSubmitted && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 12,
                            background: isCorrect ? '#DCFCE7' : '#FEE2E2',
                            color: isCorrect ? '#15803D' : '#B91C1C'
                          }}>
                            {isCorrect ? <Check size={14} /> : <X size={14} />}
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 20, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                        {q.question_text}
                      </p>

                      {q.options && q.options.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                          {q.options.map((opt, i) => {
                            const letter = getOptionLetter(opt, i);
                            const isThisSelected = userAttempt === letter;
                            const isThisCorrect = q.answer === letter;
                            
                            let optionBg = '#F9FAFB';
                            let optionBorder = 'var(--border)';
                            let optionColor = 'var(--text-primary)';
                            let iconToShow = null;

                            if (activeQuiz.isSubmitted) {
                              if (isThisCorrect) {
                                optionBg = '#DCFCE7';
                                optionBorder = '#22C55E';
                                optionColor = '#15803D';
                                iconToShow = <Check size={16} style={{ color: '#22C55E', flexShrink: 0 }} />;
                              } else if (isThisSelected) {
                                optionBg = '#FEE2E2';
                                optionBorder = '#EF4444';
                                optionColor = '#B91C1C';
                                iconToShow = <X size={16} style={{ color: '#EF4444', flexShrink: 0 }} />;
                              } else {
                                optionBg = '#F9FAFB';
                                optionBorder = 'var(--border)';
                                optionColor = 'var(--text-muted)';
                              }
                            } else {
                              if (isThisSelected) {
                                optionBg = '#EFF6FF';
                                optionBorder = '#3B82F6';
                                optionColor = '#1E40AF';
                              }
                            }

                            return (
                              <button
                                key={i}
                                disabled={activeQuiz.isSubmitted}
                                onClick={() => handleSelectOption(qIdx, letter)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '12px 16px',
                                  background: optionBg,
                                  border: `1px solid ${optionBorder}`,
                                  borderRadius: 'var(--radius-md)',
                                  fontSize: 13,
                                  color: optionColor,
                                  cursor: activeQuiz.isSubmitted ? 'default' : 'pointer',
                                  transition: 'all 0.2s ease',
                                  fontWeight: isThisSelected || (activeQuiz.isSubmitted && isThisCorrect) ? 600 : 400,
                                }}
                                className={!activeQuiz.isSubmitted ? 'generate-option-btn' : ''}
                                type="button"
                              >
                                <span>{cleanOptionText(opt)}</span>
                                {iconToShow}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          {q.answer && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Answer:</span>
                              <div 
                                onClick={() => toggleRevealAnswer(`active-${qIdx}`)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '4px 10px',
                                  background: isRevealed ? '#D1FAE5' : '#F3F4F6',
                                  border: `1px solid ${isRevealed ? '#10B981' : '#E5E7EB'}`,
                                  borderRadius: 6,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: isRevealed ? '#065F46' : '#4b5563',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  transition: 'all 0.2s ease',
                                }}
                                title={isRevealed ? '' : 'Click to reveal answer'}
                              >
                                <span style={{ filter: isRevealed ? 'none' : 'blur(4px)' }}>
                                  {q.answer}
                                </span>
                                {!isRevealed && (
                                  <Eye size={12} style={{ opacity: 0.6 }} />
                                )}
                              </div>
                              {!isRevealed && (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  (Click to reveal)
                                </span>
                              )}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span>{q.difficulty} &middot; {q.bloomLevel}</span>
                            <span>Confidence: {(q.ai_confidence_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={18} /> Quiz History ({history.length})
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