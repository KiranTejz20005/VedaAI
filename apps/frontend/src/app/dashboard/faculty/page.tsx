'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Users, GraduationCap, Building2, BarChart2, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface FacultyStats {
  totalTeachers: number;
  totalStudents: number;
  activeClasses: number;
  averageAttendance: number;
  departmentPerformance: string;
  ongoingExams: number;
}

export default function FacultyDashboard() {
  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/faculty/dashboard/stats');
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

  const data = stats || { totalTeachers: 0, totalStudents: 0, activeClasses: 0, averageAttendance: 0, departmentPerformance: 'N/A', ongoingExams: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Faculty Dashboard"
        subtitle="Department Monitoring & Overview."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<Users size={18} />} label="Total Teachers" value={data.totalTeachers} />
        <MetricCard icon={<GraduationCap size={18} />} label="Total Students" value={data.totalStudents} />
        <MetricCard icon={<Building2 size={18} />} label="Active Classes" value={data.activeClasses} />
        <MetricCard icon={<BarChart2 size={18} />} label="Average Attendance" value={`${data.averageAttendance}%`} />
        <MetricCard icon={<CheckCircle size={18} />} label="Department Performance" value={data.departmentPerformance} />
        <MetricCard icon={<Clock size={18} />} label="Ongoing Exams" value={data.ongoingExams} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Teacher Performance</h3>
          <p style={{ color: 'var(--text-secondary)' }}>View teacher performance metrics...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Class Reports</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Class performance charts and analytics...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Exam Overview</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Ongoing and upcoming exams...</p>
        </Card>
      </div>
    </div>
  );
}
