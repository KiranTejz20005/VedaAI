'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BookOpen, FileText, Clock, CheckCircle2, GraduationCap, ArrowRight,
  RefreshCw, Library, ClipboardCheck, BarChart3, Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { ActionCard } from '@/design-system/ActionCard';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';

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

const quickLinks = [
  { href: '/student/lessons', label: 'My Lessons', description: 'Browse your assigned lessons', icon: Library },
  { href: '/student/assessments', label: 'My Assessments', description: 'Start or resume assessments', icon: ClipboardCheck },
  { href: '/student/results', label: 'My Results', description: 'View your graded assessments', icon: BarChart3 },
];

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

  if (loading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Student'}`}
        subtitle="Track your learning progress and upcoming assessments."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 12,
      }}>
        <MetricCard
          icon={<BookOpen size={18} />}
          label="Enrolled Classes"
          value={stats?.enrolledClasses ?? 0}
        />
        <MetricCard
          icon={<FileText size={18} />}
          label="Available Assessments"
          value={stats?.availableAssessments ?? 0}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Pending Submissions"
          value={stats?.pendingSubmissions ?? 0}
        />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label="Completed"
          value={stats?.completed ?? 0}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="var(--brand)" />
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>Upcoming Assessments</h3>
            </div>
            <Link href="/student/assessments" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No upcoming assessments
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.slice(0, 5).map((a) => (
                <Link key={a.id} href="/student/assessments" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{a.subject} &middot; {a.totalMarks} marks</div>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#D97706', whiteSpace: 'nowrap' }}>
                      Due: {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card padding="clamp(16px, 2vw, 20px)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--brand)" />
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Results</h3>
            </div>
            <Link href="/student/results" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No results yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentResults.slice(0, 5).map((r) => (
                <Link key={r.id} href="/student/results" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{r.subject}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: r.percentage >= 40 ? '#10B981' : '#EF4444' }}>
                        {r.score}/{r.totalMarks}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{r.percentage}% &middot; {r.grade}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 12,
      }}>
        {quickLinks.map(({ href, label, description, icon: Icon }) => (
          <ActionCard
            key={href}
            icon={<Icon size={18} />}
            label={label}
            description={description}
            href={href}
            variant="primary"
          />
        ))}
      </div>
    </div>
  );
}
