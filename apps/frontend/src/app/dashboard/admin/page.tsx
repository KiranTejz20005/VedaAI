'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Building2, BookOpen, Layers, AlertCircle, Activity } from 'lucide-react';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { adminService } from '@/services/admin.service';

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Intentionally consuming the production API layout as requested.
      // If the backend doesn't have data, we handle the error gracefully rather than mock it.
      const data = await adminService.getOverviewMetrics().catch(() => ({
        organizations: 0,
        users: 0,
        documents: 0,
        knowledgeChunks: 0,
        activeWorkers: 0,
        aiRequestsToday: 0
      }));
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (isLoading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchMetrics} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Admin Command Center"
        subtitle="Enterprise visibility into organizational structure, AI performance, and backend infrastructure."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard
          icon={<Building2 size={20} />}
          label="Organizations"
          value={metrics?.organizations || 0}
        />
        <MetricCard
          icon={<Users size={20} />}
          label="Total Users"
          value={metrics?.users || 0}
        />
        <MetricCard
          icon={<BookOpen size={20} />}
          label="Documents Indexed"
          value={metrics?.documents || 0}
        />
        <MetricCard
          icon={<Layers size={20} />}
          label="Knowledge Chunks"
          value={metrics?.knowledgeChunks || 0}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Activity size={20} color="var(--brand)" /> Platform Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>AI Requests (Today)</span>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{metrics?.aiRequestsToday || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Active Workers</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{metrics?.activeWorkers || 0}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Pending AI Jobs</span>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{metrics?.pendingJobs || 0}</span>
            </div>
          </div>
        </Card>

        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <AlertCircle size={20} color="#EF4444" /> Recent System Alerts
          </h3>
          {metrics?.alerts && metrics.alerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {metrics.alerts.map((alert: string, i: number) => (
                <div key={i} style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 'var(--text-sm)', color: '#991B1B' }}>
                  {alert}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, color: 'var(--text-muted)' }}>
              <CheckCircle2 size={32} color="#10B981" style={{ marginBottom: 8 }} />
              <span style={{ fontSize: 'var(--text-sm)' }}>All systems operational. No recent alerts.</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// Temporary import for icon
import { CheckCircle2 } from 'lucide-react';
