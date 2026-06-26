'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BarChart3, CheckCircle2, XCircle, RefreshCw, ArrowLeft, FileText, Eye, Brain
} from 'lucide-react';
import { api } from '@/lib/api';

interface QuestionResult {
  id: string;
  questionNumber: number;
  question: string;
  marksAwarded: number;
  maxMarks: number;
  isCorrect: boolean;
}

interface AssessmentResult {
  id: string;
  title: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  status: string;
  submittedAt: string;
  questions?: QuestionResult[];
}

interface PracticeSession {
  id: string;
  topic: string;
  subject: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  createdAt: string;
  questions?: any[];
}

function ResultRowSkeleton() {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} style={{ padding: '14px 12px' }}>
          <div className="skeleton" style={{ height: 16, width: i === 0 ? 160 : 70, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

export default function StudentResultsPage() {
  const [tab, setTab] = useState<'assessments' | 'practice'>('assessments');
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'assessments') {
        const res = await api.get<{ success: boolean; data: AssessmentResult[] }>('/student/results');
        setResults(res.data.data ?? []);
      } else {
        const res = await api.get<{ success: boolean; data: PracticeSession[] }>('/generate/history');
        setPracticeSessions(res.data.data ?? []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const viewDetail = async (id: string) => {
    try {
      const res = await api.get<{ success: boolean; data: AssessmentResult }>(`/student/results/${id}`);
      setSelectedResult(res.data.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load result details');
    }
  };

  if (selectedResult) {
    return (
      <div style={{ padding: 'var(--page-pad)', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <button onClick={() => setSelectedResult(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14} /> Back to Results
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color="var(--brand)" />
                <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedResult.title}</h1>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{selectedResult.subject}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: selectedResult.status === 'SUBMITTED' ? '#9CA3AF' : (selectedResult.percentage >= 40 ? '#10B981' : '#EF4444') }}>
                {selectedResult.status === 'SUBMITTED' ? 'Pending' : `${selectedResult.percentage}%`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {selectedResult.status === 'SUBMITTED' ? 'Not graded yet' : `${selectedResult.score}/${selectedResult.totalMarks} marks`}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Status', value: selectedResult.status === 'SUBMITTED' ? 'Pending' : 'Graded' },
              { label: 'Grade', value: selectedResult.status === 'SUBMITTED' ? 'Pending' : selectedResult.grade || (selectedResult.percentage >= 40 ? 'PASS' : 'FAIL') },
              { label: 'Score', value: selectedResult.status === 'SUBMITTED' ? 'Pending' : `${selectedResult.score}/${selectedResult.totalMarks}` },
              { label: 'Percentage', value: selectedResult.status === 'SUBMITTED' ? 'Pending' : `${selectedResult.percentage}%` },
              { label: 'Submitted', value: new Date(selectedResult.submittedAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {selectedResult.questions && selectedResult.questions.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              Question Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedResult.questions.map((q) => (
                <div key={q.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {q.isCorrect ? (
                      <CheckCircle2 size={18} color="#10B981" />
                    ) : (
                      <XCircle size={18} color="#EF4444" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      Q{q.questionNumber}. {q.question}
                    </div>
                    <div style={{ fontSize: 13, color: q.isCorrect ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                      {q.marksAwarded}/{q.maxMarks} marks
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      <div className="desktop-page-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={24} color="var(--brand)" />
            <h1 className="page-title">My Results</h1>
          </div>
          <p className="page-subtitle">View your graded assessment results and practice quiz history.</p>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 100 }}>
          <button 
            className={`btn btn-sm ${tab === 'assessments' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ borderRadius: 100 }}
            onClick={() => setTab('assessments')}
          >
            <FileText size={14} /> Assessments
          </button>
          <button 
            className={`btn btn-sm ${tab === 'practice' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ borderRadius: 100 }}
            onClick={() => setTab('practice')}
          >
            <Brain size={14} /> Practice Quizzes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                  {['Title/Topic', 'Subject', 'Score', 'Percentage', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => <ResultRowSkeleton key={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <h2 className="empty-title">Failed to load results</h2>
          <p className="empty-desc">{error}</p>
          <div className="empty-state-actions">
            <button onClick={fetchResults} className="btn btn-dark btn-pill"><RefreshCw size={14} /> Retry</button>
          </div>
        </div>
      ) : (tab === 'assessments' && results.length === 0) || (tab === 'practice' && practiceSessions.length === 0) ? (
        <div className="empty-state">
          <BarChart3 size={40} color="#9CA3AF" />
          <h2 className="empty-title">No results yet</h2>
          <p className="empty-desc">
            {tab === 'assessments' 
              ? 'Complete your assignments to see your results here.'
              : 'Generate and complete a practice quiz to see your history.'}
          </p>
          <div className="empty-state-actions">
            <Link href={tab === 'assessments' ? "/dashboard/student/assessments" : "/dashboard/student/practice"} className="btn btn-dark btn-pill">
              {tab === 'assessments' ? 'View Tests' : 'Start Practice'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>{tab === 'assessments' ? 'Title' : 'Topic'}</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center' }}>Score</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center' }}>Percentage</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Date</th>
                  {tab === 'assessments' && <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'right' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {tab === 'assessments' && results.map((r) => {
                  const passed = r.percentage >= 40;
                  const isPending = r.status === 'SUBMITTED';
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid #F3F4F6', fontSize: 14, transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={14} color="var(--brand)" />
                          {r.title}
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{r.subject}</td>
                      <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, color: isPending ? 'var(--text-muted)' : (passed ? '#10B981' : '#EF4444') }}>{isPending ? '-' : `${r.score}/${r.totalMarks}`}</td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                          background: isPending ? '#F3F4F6' : (passed ? '#D1FAE5' : '#FEE2E2'),
                          color: isPending ? '#6B7280' : (passed ? '#065F46' : '#991B1B'),
                        }}>
                          {isPending ? 'Pending' : `${r.percentage}%`}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" style={{ gap: 4 }} onClick={() => viewDetail(r.id)}>
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {tab === 'practice' && practiceSessions.map((p) => {
                  const percentage = Math.round((p.score / p.totalQuestions) * 100) || 0;
                  const passed = percentage >= 50;
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid #F3F4F6', fontSize: 14, transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Brain size={14} color="var(--brand)" />
                          {p.topic}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 22 }}>
                          {p.difficulty}
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{p.subject}</td>
                      <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, color: passed ? '#10B981' : '#F59E0B' }}>
                        {p.score}/{p.totalQuestions}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                          background: passed ? '#D1FAE5' : '#FEF3C7',
                          color: passed ? '#065F46' : '#92400E',
                        }}>
                          {percentage}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
