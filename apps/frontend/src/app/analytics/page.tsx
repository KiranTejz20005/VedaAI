'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, BarChart, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { apiClient } from '@/services/api.client';

interface AnalyticsStats {
  totals: { questions: number; assessments: number; pendingReviews: number };
  bloomDistribution: { level: string; count: number }[];
  difficultyDistribution: { level: string; count: number }[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.get<{ success: boolean; data: AnalyticsStats }>('/analytics/stats')
      .then((res) => { if (!cancelled) setStats(res.data.data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load analytics'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={24} color="#0f172a" />
          <h1 className="page-title">Analytics</h1>
        </div>
        <p className="page-subtitle">Platform wide insights on question taxonomy and difficulty.</p>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">Analytics</h1>
        <div style={{ width: 32 }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card" style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 28, width: '40%', borderRadius: 6 }} />
              </div>
            ))}
          </div>
          <div className="card" style={{ height: 200 }}><div className="skeleton" style={{ height: '100%', borderRadius: 8 }} /></div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle size={40} color="#EF4444" />
          <h2 className="empty-title">Failed to load analytics</h2>
          <p className="empty-desc">{error}</p>
        </div>
      ) : stats ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="stats-grid">
            {[
              { label: 'Total Questions', value: stats.totals.questions, color: '#6366F1' },
              { label: 'Total Assessments', value: stats.totals.assessments, color: '#10B981' },
              { label: 'Pending Reviews', value: stats.totals.pendingReviews, color: '#F59E0B' },
            ].map((kpi) => (
              <div key={kpi.label} className="stat-card">
                <div className="stat-value" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="stat-label">{kpi.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 16 }}>
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <PieChart size={18} color="var(--text-muted)" />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Bloom&apos;s Taxonomy</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.bloomDistribution.map((b) => (
                  <div key={b.level} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 100, fontSize: 12, color: 'var(--text-secondary)' }}>{b.level}</div>
                    <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(b.count / Math.max(stats.totals.questions, 1)) * 100}%` }} style={{ height: '100%', background: '#6366F1', borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 40, fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{b.count}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart size={18} color="var(--text-muted)" />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Difficulty Spread</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.difficultyDistribution.map((d) => (
                  <div key={d.level} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>{d.level}</div>
                    <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(d.count / Math.max(stats.totals.questions, 1)) * 100}%` }} style={{ height: '100%', background: d.level === 'EASY' ? '#10B981' : d.level === 'MEDIUM' ? '#F59E0B' : '#EF4444', borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 40, fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{d.count}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </div>
  );
}