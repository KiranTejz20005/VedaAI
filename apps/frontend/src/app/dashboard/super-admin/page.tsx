'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Users, Building, Activity, Server, Loader2 } from 'lucide-react';

interface SuperAdminStats {
  totalOrganizations: number;
  totalUsers: number;
  activeSessions: number;
  apiUsage: number;
  systemUptime: number;
  securityAlerts: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/super-admin/dashboard/stats');
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

  const data = stats || { totalOrganizations: 0, totalUsers: 0, activeSessions: 0, apiUsage: 0, systemUptime: 0, securityAlerts: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Global System Control & Monitoring."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<Building size={18} />} label="Total Organizations" value={data.totalOrganizations} />
        <MetricCard icon={<Users size={18} />} label="Total Users" value={data.totalUsers} />
        <MetricCard icon={<Activity size={18} />} label="Active Sessions" value={data.activeSessions} />
        <MetricCard icon={<Server size={18} />} label="System Uptime" value={`${data.systemUptime}%`} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Audit Logs</h3>
          <p style={{ color: 'var(--text-secondary)' }}>View global system audit logs...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Tenant Management</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Manage organizations and billing...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>System Metrics</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Infrastructure health and performance...</p>
        </Card>
      </div>
    </div>
  );
}
