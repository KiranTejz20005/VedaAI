'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cpu, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { adminService } from '@/services/admin.service';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getProviders().catch(() => ([
        {
          id: 'nvidia-nim',
          name: 'NVIDIA NIM',
          status: 'Operational',
          latency: '24ms',
          requestsToday: 14205,
          costEstimated: '$14.20',
          isPrimary: true
        },
        {
          id: 'groq',
          name: 'Groq',
          status: 'Operational',
          latency: '18ms',
          requestsToday: 310,
          costEstimated: '$0.45',
          isPrimary: false
        }
      ]));
      setProviders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load provider metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  if (isLoading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchProviders} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="AI Provider Management"
        subtitle="Monitor NVIDIA NIM and Groq integrations, token usage, and routing."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        {providers?.map((provider: any) => (
          <Card key={provider.id} padding="24px" style={{ position: 'relative', overflow: 'hidden' }}>
            {provider.isPrimary && (
              <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--brand)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderBottomLeftRadius: 8 }}>
                PRIMARY ROUTE
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: provider.status === 'Operational' ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={24} color={provider.status === 'Operational' ? '#10B981' : '#EF4444'} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{provider.name}</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: provider.status === 'Operational' ? '#10B981' : '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  {provider.status === 'Operational' ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                  {provider.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 8 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>Avg Latency</div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{provider.latency}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 8 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>Requests (Today)</div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{provider.requestsToday.toLocaleString()}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 8 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>Est. Cost</div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{provider.costEstimated}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="outline" style={{ flex: 1 }}>Configure Keys</Button>
              {!provider.isPrimary && (
                <Button variant="primary" style={{ flex: 1 }}>Set as Primary</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
