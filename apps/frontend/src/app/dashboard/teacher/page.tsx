'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Users, UserCheck, UserX, FileText, UploadCloud, Percent, ClipboardList, Loader2 } from 'lucide-react';

interface TeacherStats {
  totalStudents: number;
  presentToday: number;
  absent: number;
  testsConducted: number;
  assignmentsCreated: number;
  averageClassScore: number;
  pendingEvaluations: number;
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/teacher/dashboard/stats');
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

  const data = stats || { totalStudents: 0, presentToday: 0, absent: 0, testsConducted: 0, assignmentsCreated: 0, averageClassScore: 0, pendingEvaluations: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Teacher Dashboard"
        subtitle="Class Monitoring & Assessment Overview."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<Users size={18} />} label="Total Students" value={data.totalStudents} />
        <MetricCard icon={<UserCheck size={18} />} label="Present Today" value={data.presentToday} />
        <MetricCard icon={<UserX size={18} />} label="Absent" value={data.absent} />
        <MetricCard icon={<FileText size={18} />} label="Tests Conducted" value={data.testsConducted} />
        <MetricCard icon={<UploadCloud size={18} />} label="Assignments Created" value={data.assignmentsCreated} />
        <MetricCard icon={<Percent size={18} />} label="Average Class Score" value={`${data.averageClassScore}%`} />
        <MetricCard icon={<ClipboardList size={18} />} label="Pending Evaluations" value={data.pendingEvaluations} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Recent Test Statistics</h3>
          <p style={{ color: 'var(--text-secondary)' }}>View your test performance metrics...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Student Performance Table</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Student leaderboard and performance details...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Create Test | Create Assignment | Upload Material</p>
        </Card>
      </div>
    </div>
  );
}
