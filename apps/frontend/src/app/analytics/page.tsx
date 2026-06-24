'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart as PieIcon, BarChart as BarIcon, Loader2, AlertCircle, TrendingUp, Sparkles, RefreshCw, Award 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface AnalyticsStats {
  totals: { questions: number; assessments: number; pendingReviews: number };
  bloomDistribution: { level: string; count: number }[];
  difficultyDistribution: { level: string; count: number }[];
}

interface Group {
  id: string;
  name: string;
  subject?: string;
  students: number;
}

interface GroupStats {
  groupId: string;
  averageScore: number;
  distribution: { A: number; B: number; C: number; D: number; F: number };
  topStudents: { name: string; avg: number }[];
  weakPerformers: { name: string; avg: number }[];
  recommendation: string | null;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'platform' | 'groups'>('platform');
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Group performance states
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [loadingGroupStats, setLoadingGroupStats] = useState(false);
  const [generatingRecs, setGeneratingRecs] = useState(false);

  // Load Platform Stats
  useEffect(() => {
    let cancelled = false;
    apiClient.get<{ success: boolean; data: AnalyticsStats }>('/analytics/stats')
      .then((res) => { if (!cancelled) setStats(res.data.data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load analytics'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Load Groups list when switching tabs
  useEffect(() => {
    if (activeTab === 'groups' && groups.length === 0) {
      apiClient.get<{ success: boolean; data: Group[] }>('/groups')
        .then((res) => {
          setGroups(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedGroupId(res.data.data[0].id);
          }
        })
        .catch(() => toast.error('Failed to load class groups'));
    }
  }, [activeTab]);

  // Load Group stats when selection changes
  useEffect(() => {
    if (!selectedGroupId) return;
    setLoadingGroupStats(true);
    apiClient.get<{ success: boolean; data: GroupStats }>(`/analytics/group/${selectedGroupId}`)
      .then((res) => setGroupStats(res.data.data))
      .catch(() => toast.error('Failed to load performance metrics'))
      .finally(() => setLoadingGroupStats(false));
  }, [selectedGroupId]);

  const handleGenerateRecommendation = async () => {
    if (!selectedGroupId) return;
    setGeneratingRecs(true);
    try {
      await apiClient.post('/analytics/recommendations', {
        targetId: selectedGroupId,
        type: 'CLASS'
      });
      toast.success('AI Remedial recommendations generated!');
      // Reload stats
      const res = await apiClient.get<{ success: boolean; data: GroupStats }>(`/analytics/group/${selectedGroupId}`);
      setGroupStats(res.data.data);
    } catch (err) {
      toast.error('Failed to run AI evaluation');
    } finally {
      setGeneratingRecs(false);
    }
  };

  return (
    <div className="dashboard-view">
      {/* Header */}
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={24} color="var(--brand)" />
          <h1 className="page-title">Performance Analytics</h1>
        </div>
        <p className="page-subtitle">Track institution curriculum mappings, student growth, and class performance trends.</p>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">Analytics</h1>
        <div style={{ width: 32 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 24, fontSize: 14, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('platform')}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '12px 4px',
            fontWeight: 600,
            color: activeTab === 'platform' ? 'var(--brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'platform' ? '2px solid var(--brand)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Platform Stats
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '12px 4px',
            fontWeight: 600,
            color: activeTab === 'groups' ? 'var(--brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'groups' ? '2px solid var(--brand)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Class Group Performance
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
          <Loader2 size={18} className="animate-spin" /> Loading analytics engine...
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle size={40} color="#ef4444" />
          <h2 className="empty-title">Failed to load analytics</h2>
          <p className="empty-desc">{error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'platform' ? (
            <motion.div
              key="platform-stats"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div className="stats-grid">
                {[
                  { label: 'Total Questions Pool', value: stats?.totals.questions, color: '#6366F1' },
                  { label: 'Total Papers Generated', value: stats?.totals.assessments, color: '#10B981' },
                  { label: 'Pending Reviews', value: stats?.totals.pendingReviews, color: '#F59E0B' },
                ].map((kpi) => (
                  <div key={kpi.label} className="stat-card">
                    <div className="stat-value" style={{ color: kpi.color }}>{kpi.value}</div>
                    <div className="stat-label">{kpi.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 16 }}>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <PieIcon size={18} color="var(--text-muted)" />
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>Bloom&apos;s Taxonomy Mapping</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats?.bloomDistribution.map((b) => (
                      <div key={b.level} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 110, fontSize: 12, color: 'var(--text-secondary)' }}>{b.level}</div>
                        <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(b.count / Math.max(stats.totals.questions, 1)) * 100}%`, background: '#6366F1', borderRadius: 4 }} />
                        </div>
                        <div style={{ width: 40, fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{b.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <BarIcon size={18} color="var(--text-muted)" />
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>Difficulty Distribution</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats?.difficultyDistribution.map((d) => (
                      <div key={d.level} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>{d.level}</div>
                        <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(d.count / Math.max(stats.totals.questions, 1)) * 100}%`, background: d.level === 'EASY' ? '#10B981' : d.level === 'MEDIUM' ? '#F59E0B' : '#EF4444', borderRadius: 4 }} />
                        </div>
                        <div style={{ width: 40, fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{d.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="groups-stats"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Group Selector */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label htmlFor="groupSelect" style={{ fontSize: 14, fontWeight: 600 }}>Select Class Group:</label>
                  {groups.length === 0 ? (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No groups created yet. Create groups in Classrooms view first.</span>
                  ) : (
                    <select
                      id="groupSelect"
                      className="input"
                      style={{ width: 220, height: 38 }}
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name} ({g.subject || 'General'})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {loadingGroupStats ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
                  <Loader2 size={18} className="animate-spin" /> Loading group statistics...
                </div>
              ) : groupStats ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Top Stats */}
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: 'var(--brand)' }}>{groupStats.averageScore.toFixed(1)}%</div>
                      <div className="stat-label">Class Average Score</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: '#10B981' }}>{groupStats.topStudents[0]?.name || 'N/A'}</div>
                      <div className="stat-label">Top Performer</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: '#EF4444' }}>{groupStats.weakPerformers[0]?.name || 'N/A'}</div>
                      <div className="stat-label">Needs Revision</div>
                    </div>
                  </div>

                  {/* Distribution & Leaders */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 16 }}>
                    {/* Grade Distribution */}
                    <div className="card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <BarIcon size={18} color="var(--text-muted)" />
                        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Grade Scale Spread</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {Object.entries(groupStats.distribution).map(([grade, val]) => (
                          <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 60, fontSize: 12, fontWeight: 600 }}>Grade {grade}</div>
                            <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(val / Math.max(Object.values(groupStats.distribution).reduce((a,b)=>a+b,0), 1)) * 100}%`, background: 'var(--brand)', borderRadius: 4 }} />
                            </div>
                            <div style={{ width: 30, fontSize: 12, textAlign: 'right' }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Students Ranks */}
                    <div className="card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Award size={18} color="#10B981" />
                        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Top Performers</h3>
                      </div>
                      {groupStats.topStudents.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No graded submissions yet.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {groupStats.topStudents.map((stud, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                              <span style={{ fontWeight: 600 }}>{idx + 1}. {stud.name}</span>
                              <span style={{ color: '#10B981', fontWeight: 700 }}>{stud.avg.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Remedial recommendations section */}
                  <div className="card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                        <Sparkles size={16} color="var(--brand)" /> AI Curriculum Remediation Insights
                      </h3>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}
                        onClick={handleGenerateRecommendation}
                        disabled={generatingRecs}
                      >
                        {generatingRecs ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        Analyze Class & Generate
                      </button>
                    </div>

                    {groupStats.recommendation ? (
                      <div style={{ fontSize: 14, lineHeight: 1.6, color: '#334155', background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', whiteSpace: 'pre-wrap' }}>
                        {groupStats.recommendation}
                      </div>
                    ) : (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No recommendation generated yet. Click the button above to request generative AI insights based on current submission history.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}