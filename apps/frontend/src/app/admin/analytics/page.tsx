'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DollarSign, Cpu, BrainCircuit, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';

interface AnalyticsData {
  totals: {
    users: number;
    activeUsers: number;
    papersGenerated: number;
    assignmentsCreated: number;
  };
  aiAnalytics: {
    totalTokens: number;
    totalCost: number;
    providerUsage: Record<string, { tokens: number; cost: number }>;
  };
  departmentPerformance: Array<{
    departmentId: string;
    name: string;
    papersCount: number;
    averageScore: number;
  }>;
}

export default function AnalyticsAdmin() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.get('/admin/analytics');
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError('Failed to load system analytics');
        }
      } catch {
        setError('Failed to load system analytics');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />;

  const totals = data?.totals || { users: 0, activeUsers: 0, papersGenerated: 0, assignmentsCreated: 0 };
  const aiStats = data?.aiAnalytics || { totalTokens: 0, totalCost: 0, providerUsage: {} };

  const providerColors: Record<string, string> = {
    openai: '#10B981',
    anthropic: '#F97316',
    gemini: '#3B82F6',
    nvidia: '#84CC16',
    groq: '#8B5CF6',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="System Telemetry Control Room"
        subtitle="Extended platform performance indicators, LLM response loads, and cost metrics."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 12,
      }}>
        <MetricCard
          icon={<DollarSign size={18} />}
          label="AI Costs"
          value={`$${aiStats.totalCost.toFixed(2)}`}
          description="Total estimated API expenses across LLMs."
        />
        <MetricCard
          icon={<Cpu size={18} />}
          label="Tokens Processed"
          value={aiStats.totalTokens.toLocaleString()}
          description="Total input and completion token tallies."
        />
        <MetricCard
          icon={<BrainCircuit size={18} />}
          label="Generations Count"
          value={totals.papersGenerated}
          description="Finalized papers generated successfully."
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
            AI Provider Load Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(aiStats.providerUsage).map(([provider, details]) => {
              const percentage = aiStats.totalTokens > 0 ? (details.tokens / aiStats.totalTokens) * 100 : 0;
              const color = providerColors[provider] || '#6B7280';
              return (
                <div key={provider} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{provider}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{(details.tokens / 1000).toFixed(0)}K tokens</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 8, background: 'var(--bg-hover)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: color, borderRadius: 'var(--radius-pill)', width: `${percentage}%`, transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
            {Object.keys(aiStats.providerUsage).length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                No provider data available
              </div>
            )}
          </div>
        </Card>

        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
            Growth & Performance Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data?.departmentPerformance.map((dept) => (
              <div key={dept.departmentId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                    <Award size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{dept.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{dept.papersCount} exam templates</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: '#10B981' }}>{dept.averageScore}%</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Grade</div>
                </div>
              </div>
            ))}
            {(!data?.departmentPerformance || data.departmentPerformance.length === 0) && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                No department data available
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
