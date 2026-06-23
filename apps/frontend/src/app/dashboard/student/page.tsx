'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Target, CheckCircle, XCircle, Percent, Calendar, BookOpen, GraduationCap, Trophy, Loader2 } from 'lucide-react';

interface StudentStats {
  questionsAttempted: number;
  questionsCorrect: number;
  questionsIncorrect: number;
  averageScore: number;
  attendance: number;
  assignmentsCompleted: number;
  testsCompleted: number;
  currentRank: number;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/analytics/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        } else {
          setError('Failed to load statistics');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
          <Loader2 size={20} className="animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, color: '#991b1b' }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Error Loading Dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  const data = stats || { questionsAttempted: 0, questionsCorrect: 0, questionsIncorrect: 0, averageScore: 0, attendance: 0, assignmentsCompleted: 0, testsCompleted: 0, currentRank: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Student Dashboard"
        subtitle="Your learning performance overview."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<Target size={18} />} label="Questions Attempted" value={data.questionsAttempted} />
        <MetricCard icon={<CheckCircle size={18} />} label="Questions Correct" value={data.questionsCorrect} />
        <MetricCard icon={<XCircle size={18} />} label="Questions Incorrect" value={data.questionsIncorrect} />
        <MetricCard icon={<Percent size={18} />} label="Average Score" value={`${data.averageScore}%`} />
        <MetricCard icon={<Calendar size={18} />} label="Attendance" value={`${data.attendance}%`} />
        <MetricCard icon={<BookOpen size={18} />} label="Assignments Completed" value={data.assignmentsCompleted} />
        <MetricCard icon={<GraduationCap size={18} />} label="Tests Completed" value={data.testsCompleted} />
        <MetricCard icon={<Trophy size={18} />} label="Current Rank" value={`#${data.currentRank}`} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Recent Tests</h3>
          <p style={{ color: 'var(--text-secondary)' }}>View your recent test results and performance...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Upcoming Tests</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Scheduled tests and their details...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Assignments Overview</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Pending and submitted assignments...</p>
        </Card>
      </div>
    </div>
  );
}
