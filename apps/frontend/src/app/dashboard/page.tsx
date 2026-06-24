'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  Plus,
  UserPlus,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { ActionCard } from '@/design-system/ActionCard';
import { ActivityCard } from '@/design-system/ActivityCard';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { useAuthStore } from '@/store/auth.store';

interface DashboardData {
  stats: {
    totalFaculty: number;
    totalStudents: number;
    totalClasses: number;
    pendingApprovals: number;
  };
  recentActivity: Array<{
    id: string;
    description: string;
    timestamp: string;
    type: string;
  }>;
  summary: {
    publishedAssessments: number;
    activeLessons: number;
    submissionRate: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeOrganizationId = useAdminAuthStore((s) => s.activeOrganizationId);
  const user = useAuthStore((s) => s.user);
  
  // Check if user is an admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN';

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await api.get('/admin/analytics');
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError('Failed to load analytics');
        }
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [activeOrganizationId, isAdmin]);

  if (loading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />;

  // Non-admin users see a different dashboard
  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <PageHeader
          title="Dashboard"
          subtitle="Welcome to your dashboard."
        />
        <Card padding="clamp(16px, 2vw, 20px)">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            You don't have access to the admin analytics dashboard. Please contact your administrator if you need to view organizational statistics.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ActionCard
              icon={<BookOpen size={16} />}
              label="View My Lessons"
              href="/lessons"
            />
            <ActionCard
              icon={<Users size={16} />}
              label="My Classes"
              href="/classes"
            />
            <ActionCard
              icon={<CheckCircle size={16} />}
              label="View Assignments"
              href="/assignments"
            />
          </div>
        </Card>
      </div>
    );
  }

  const stats = data?.stats || { totalFaculty: 0, totalStudents: 0, totalClasses: 0, pendingApprovals: 0 };
  const activity = data?.recentActivity || [];
  const summary = data?.summary || { publishedAssessments: 0, activeLessons: 0, submissionRate: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Organization Admin Dashboard"
        subtitle="Monitor your institution at a glance."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 12,
      }}>
        <MetricCard
          icon={<GraduationCap size={18} />}
          label="Total Faculty"
          value={stats.totalFaculty}
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Total Students"
          value={stats.totalStudents}
        />
        <MetricCard
          icon={<BookOpen size={18} />}
          label="Total Classes"
          value={stats.totalClasses}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Pending Approvals"
          value={stats.pendingApprovals}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 16,
      }}>
        <ActivityCard
          title="Recent Activity"
          items={activity.slice(0, 5)}
          emptyMessage="No recent activity"
          viewAllHref="/admin/audit"
        />

        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ActionCard
              icon={<GraduationCap size={16} />}
              label="Create Faculty"
              href="/admin/users"
              variant="primary"
            />
            <ActionCard
              icon={<UserPlus size={16} />}
              label="Add Student"
              href="/admin/students"
              variant="primary"
            />
            <ActionCard
              icon={<Plus size={16} />}
              label="Create Class"
              href="/admin/classes"
            />
            <ActionCard
              icon={<CheckCircle size={16} />}
              label="View Approvals"
              href="/admin/approvals"
              variant="warning"
            />
          </div>
        </Card>

        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Stats Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Published Assessments', value: summary.publishedAssessments, color: '#3B82F6' },
              { label: 'Active Lessons', value: summary.activeLessons, color: '#8B5CF6' },
              { label: 'Submission Rate', value: `${summary.submissionRate}%`, color: '#10B981' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-hover)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: item.color,
                    borderRadius: 'var(--radius-pill)',
                    width: `${typeof item.value === 'number' ? Math.min(item.value * 10, 100) : summary.submissionRate}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <TrendingUp size={12} color="#10B981" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Submission rate is {summary.submissionRate >= 70 ? 'healthy' : 'needs improvement'}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
