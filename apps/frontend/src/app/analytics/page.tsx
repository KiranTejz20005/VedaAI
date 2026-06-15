'use client';

import { useState, useEffect } from 'react';
import { PieChart, BarChart } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetching backend /v1/analytics/stats
    setTimeout(() => {
      setStats({
        totals: { questions: 500, assessments: 25, pendingReviews: 12 },
        bloomDistribution: [
          { level: 'REMEMBER', count: 120 },
          { level: 'UNDERSTAND', count: 85 },
          { level: 'APPLY', count: 150 },
          { level: 'ANALYZE', count: 90 },
          { level: 'EVALUATE', count: 40 },
          { level: 'CREATE', count: 15 }
        ],
        difficultyDistribution: [
          { level: 'EASY', count: 200 },
          { level: 'MEDIUM', count: 180 },
          { level: 'HARD', count: 120 }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="dashboard-view" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="desktop-page-header dashboard-header-v3">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Platform wide insights on question taxonomy and difficulty.</p>
      </div>

      {loading ? (
        <div style={{ padding: 20 }}>Loading analytics...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Total Questions', value: stats.totals.questions },
              { label: 'Total Assessments', value: stats.totals.assessments },
              { label: 'Pending Reviews', value: stats.totals.pendingReviews }
            ].map(kpi => (
              <div key={kpi.label} style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{kpi.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            {/* Bloom Distribution (Fake Chart) */}
            <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <PieChart size={18} color="#64748b" />
                <h3 style={{ fontSize: 16, fontWeight: 500 }}>Bloom's Taxonomy</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.bloomDistribution.map((b: any) => (
                  <div key={b.level} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 100, fontSize: 12, color: '#475569' }}>{b.level}</div>
                    <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#3b82f6', width: `${(b.count / stats.totals.questions) * 100}%` }} />
                    </div>
                    <div style={{ width: 40, fontSize: 12, textAlign: 'right', fontWeight: 500 }}>{b.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty Distribution (Fake Chart) */}
            <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart size={18} color="#64748b" />
                <h3 style={{ fontSize: 16, fontWeight: 500 }}>Difficulty Spread</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.difficultyDistribution.map((d: any) => (
                  <div key={d.level} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 80, fontSize: 12, color: '#475569' }}>{d.level}</div>
                    <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: d.level === 'EASY' ? '#10b981' : d.level === 'MEDIUM' ? '#f59e0b' : '#ef4444', width: `${(d.count / stats.totals.questions) * 100}%` }} />
                    </div>
                    <div style={{ width: 40, fontSize: 12, textAlign: 'right', fontWeight: 500 }}>{d.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
