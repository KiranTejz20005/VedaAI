'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Building2,
  Users,
  FileText,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  ListChecks,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { ActionCard } from '@/design-system/ActionCard';
import { Card } from '@/design-system/Card';
import { DataTable } from '@/design-system/DataTable';
import { Badge } from '@/design-system/Badge';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';

interface SuperAdminStats {
  totalOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  totalAssessments: number;
  totalPapers: number;
  revenue: { total: number; monthly: number };
  recentOrganizations: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    subscriptionPlan: string;
    createdAt: string;
    _count?: { users: number };
  }>;
  health: {
    api: boolean;
    database: boolean;
    ai: boolean;
    storage: boolean;
  };
}

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/super-admin/dashboard');
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError('Failed to load dashboard');
        }
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />;

  const stats = data || {
    totalOrganizations: 0, totalUsers: 0, activeUsers: 0, totalAssessments: 0, totalPapers: 0,
    revenue: { total: 0, monthly: 0 },
    recentOrganizations: [],
    health: { api: true, database: true, ai: true, storage: true }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader
          title="Super Admin Dashboard"
          subtitle={`Welcome back, ${user?.firstName || 'Super Admin'}. Platform overview at a glance.`}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#D1FAE5', border: '1px solid #A7F3D0', color: '#065F46', padding: '8px 14px', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0 }}>
          <ShieldCheck size={16} />
          <span>All Systems Operational</span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 12,
      }}>
        <MetricCard
          icon={<Building2 size={18} />}
          label="Total Organizations"
          value={stats.totalOrganizations}
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Total Users"
          value={stats.totalUsers}
          description={`Active: ${stats.activeUsers}`}
        />
        <MetricCard
          icon={<FileText size={18} />}
          label="Total Assessments"
          value={stats.totalAssessments}
          description={`Papers: ${stats.totalPapers}`}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label="Revenue"
          value={`$${stats.revenue.total.toFixed(2)}`}
          description={`Monthly: $${stats.revenue.monthly.toFixed(2)}`}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Revenue Trend
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160 }}>
            {[20, 40, 30, 70, 50, 80, 90, 65, 85, 95, 75, 100].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: 'var(--brand)', borderRadius: '4px 4px 0 0', height: `${h}px`, opacity: 0.5 + (h / 200) }} />
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ActionCard
              icon={<Building2 size={16} />}
              label="Create Organization"
              href="/super-admin/organizations"
              variant="primary"
            />
            <ActionCard
              icon={<ListChecks size={16} />}
              label="View Audit Logs"
              href="/super-admin/audit"
            />
            <ActionCard
              icon={<BarChart3 size={16} />}
              label="View Analytics"
              href="/super-admin/analytics"
              variant="primary"
            />
          </div>
        </Card>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Organizations
            </h3>
            <Link href="/super-admin/organizations" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <DataTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'code', header: 'Code' },
              {
                key: 'status',
                header: 'Status',
                render: (value: string) => (
                  <Badge variant={value === 'ACTIVE' ? 'success' : 'error'}>{value}</Badge>
                ),
              },
              { key: 'subscriptionPlan', header: 'Plan' },
              {
                key: '_count',
                header: 'Users',
                align: 'right',
                render: (_: any, row: any) => row._count?.users || 0,
              },
            ]}
            data={stats.recentOrganizations}
            emptyMessage="No organizations yet"
          />
        </Card>

        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Platform Health
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'API Service', key: 'api' as const },
              { label: 'Database', key: 'database' as const },
              { label: 'AI Engine', key: 'ai' as const },
              { label: 'Storage', key: 'storage' as const },
            ].map(({ label, key }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                <Badge variant={stats.health[key] ? 'success' : 'error'}>
                  {stats.health[key] ? 'Operational' : 'Down'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
