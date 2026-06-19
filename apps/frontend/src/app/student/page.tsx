'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BookOpen, FileText, Clock, CheckCircle2, GraduationCap, ArrowRight,
  TrendingUp, Loader2, RefreshCw, Sparkles, Library, ClipboardCheck, BarChart3
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface StudentStats {
  enrolledClasses: number;
  availableAssessments: number;
  pendingSubmissions: number;
  completed: number;
}

interface UpcomingAssessment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  totalMarks: number;
}

interface RecentResult {
  id: string;
  title: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  submittedAt: string;
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingAssessment[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, upcomingRes, resultsRes] = await Promise.all([
        api.get<{ success: boolean; data: StudentStats }>('/student/stats').catch(() => ({ data: { data: null } })),
        api.get<{ success: boolean; data: UpcomingAssessment[] }>('/student/assessments/upcoming').catch(() => ({ data: { data: [] } })),
        api.get<{ success: boolean; data: RecentResult[] }>('/student/results').catch(() => ({ data: { data: [] } })),
      ]);
      setStats(statsRes.data.data ?? { enrolledClasses: 0, availableAssessments: 0, pendingSubmissions: 0, completed: 0 });
      setUpcoming(upcomingRes.data.data ?? []);
      setRecentResults(resultsRes.data.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
        <div className="skeleton" style={{ height: 28, width: 280, borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: 200, borderRadius: 4, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card"><div className="skeleton" style={{ height: 80, borderRadius: 12 }} /></div>
          ))}
        </div>
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ padding: '80px var(--page-pad)' }}>
        <h2 className="empty-title">Dashboard Unavailable</h2>
        <p className="empty-desc">{error}</p>
        <div className="empty-state-actions">
          <button onClick={fetchData} className="btn btn-dark btn-pill"><RefreshCw size={14} /> Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      <div className="desktop-page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap size={24} color="var(--brand)" />
          Welcome back, {user?.firstName || 'Student'}
        </h1>
        <p className="page-subtitle">Track your learning progress and upcoming assessments.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Enrolled Classes', value: stats?.enrolledClasses ?? 0, icon: BookOpen, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Available Assessments', value: stats?.availableAssessments ?? 0, icon: FileText, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Pending Submissions', value: stats?.pendingSubmissions ?? 0, icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 28 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="var(--brand)" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Upcoming Assessments</h3>
              </div>
              <Link href="/student/assessments" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
                View all <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No upcoming assessments</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.slice(0, 5).map((a) => (
                  <Link key={a.id} href={`/student/assessments`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 8, transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.background = 'var(--brand-light)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-page)'; }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.subject} &middot; {a.totalMarks} marks</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#D97706' }}>Due: {new Date(a.dueDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={18} color="var(--brand)" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Results</h3>
              </div>
              <Link href="/student/results" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
                View all <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </Link>
            </div>
            {recentResults.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No results yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentResults.slice(0, 5).map((r) => (
                  <Link key={r.id} href={`/student/results`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 8, transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.background = 'var(--brand-light)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-page)'; }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.subject}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: r.percentage >= 40 ? '#10B981' : '#EF4444' }}>
                          {r.score}/{r.totalMarks}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.percentage}% &middot; {r.grade}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <Link href="/student/lessons" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 20, border: '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-light)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Library size={24} color="var(--brand)" />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>My Lessons</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Browse your assigned lessons</div>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/student/assessments" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 20, border: '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-light)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ClipboardCheck size={24} color="var(--brand)" />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>My Assessments</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Start or resume assessments</div>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/student/results" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 20, border: '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-light)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <BarChart3 size={24} color="var(--brand)" />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>My Results</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>View your graded assessments</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
