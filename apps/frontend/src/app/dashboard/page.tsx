'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  HelpCircle,
  Clock,
  Sparkles,
  BookOpen,
  Plus,
  ArrowRight,
  TrendingUp,
  Brain,
  Gauge,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { fetchDashboardStats, type DashboardStats } from '@/services/analytics.service';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardStats();
      setStats(data);
    } catch {
      setError('Could not connect to the API server.');
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 'var(--page-pad)' }}>
        {/* Header Skeleton */}
        <div>
          <div className="skeleton" style={{ height: 28, width: 220, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 340, borderRadius: 4 }} />
        </div>
        {/* Cards Row Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="skeleton" style={{ height: 16, width: '40%', borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 32, width: '30%', borderRadius: 6 }} />
            </div>
          ))}
        </div>
        {/* Charts and Actions Grid Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 20, width: '50%', borderRadius: 4 }} />
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="skeleton" style={{ height: 32, width: '100%', borderRadius: 6 }} />
            ))}
          </div>
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 20, width: '50%', borderRadius: 4 }} />
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="skeleton" style={{ height: 32, width: '100%', borderRadius: 6 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="empty-state" style={{ padding: '80px var(--page-pad)' }}>
        <h2 className="empty-title">Dashboard Unavailable</h2>
        <p className="empty-desc">{error || 'Unable to retrieve statistics.'}</p>
        <div className="empty-state-actions">
          <button type="button" onClick={getStats} className="btn btn-dark btn-pill">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Calculate difficulty total count to compute percentages
  const diffTotal = stats.difficultyDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const bloomTotal = stats.bloomDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;

  // Pretty styling properties
  const bloomColors: Record<string, string> = {
    remember: '#EF4444',
    understand: '#F59E0B',
    apply: '#10B981',
    analyze: '#3B82F6',
    evaluate: '#6366F1',
    create: '#8B5CF6',
  };

  const difficultyColors: Record<string, string> = {
    easy: '#10B981',
    medium: '#F59E0B',
    hard: '#EF4444',
  };

  return (
    <div style={{ padding: 'var(--page-pad)', display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 'var(--page-max-w)', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="desktop-page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={24} color="var(--brand)" />
          <h1 className="page-title">Institution Analytics</h1>
        </div>
        <p className="page-subtitle">Track generated content metrics, difficulty layouts, and cognitive distributions.</p>
      </div>

      <div className="mobile-page-header">
        <h1 className="mobile-header-title">Dashboard</h1>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {/* Total Questions Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(232, 83, 29, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand)',
            flexShrink: 0
          }}>
            <HelpCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>Total Questions</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{stats.totals.questions}</div>
          </div>
        </div>

        {/* Total Assessments Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366F1',
            flexShrink: 0
          }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>Assessments Generated</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{stats.totals.assessments}</div>
          </div>
        </div>

        {/* Pending Reviews Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F59E0B',
            flexShrink: 0
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>Pending Reviews</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{stats.totals.pendingReviews}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        
        {/* Bloom's Taxonomy Distribution */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Brain size={18} color="var(--brand)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Bloom&apos;s Taxonomy Levels</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stats.bloomDistribution.map((item) => {
              const count = item.count;
              const percentage = Math.round((count / bloomTotal) * 100);
              const color = bloomColors[item.level.toLowerCase()] || 'var(--brand)';
              return (
                <div key={item.level} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500 }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{item.level}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{count} ({percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
            {stats.bloomDistribution.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No cognitive distribution data.
              </div>
            )}
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Layers size={18} color="var(--brand)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Difficulty Levels Distribution</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stats.difficultyDistribution.map((item) => {
              const count = item.count;
              const percentage = Math.round((count / diffTotal) * 100);
              const color = difficultyColors[item.level.toLowerCase()] || 'var(--brand)';
              return (
                <div key={item.level} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500 }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{item.level} Level</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{count} ({percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
            {stats.difficultyDistribution.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No difficulty level statistics.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Gauge size={18} color="var(--brand)" />
          Quick Actions Launcher
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          
          <Link href="/assignments/create" style={{ textDecoration: 'none' }}>
            <div className="quick-action-link" style={{ padding: 18, border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-light)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Plus size={20} color="var(--brand)" />
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>Create Paper</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Assemble a new assignment.</div>
              </div>
            </div>
          </Link>

          <Link href="/papers" style={{ textDecoration: 'none' }}>
            <div className="quick-action-link" style={{ padding: 18, border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-light)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FileText size={20} color="var(--brand)" />
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>Paper Management</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>View and download PDF papers.</div>
              </div>
            </div>
          </Link>

          <Link href="/syllabus" style={{ textDecoration: 'none' }}>
            <div className="quick-action-link" style={{ padding: 18, border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-light)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <GraduationCap size={20} color="var(--brand)" />
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>Syllabus Preprocessor</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Parse and index syllabus files.</div>
              </div>
            </div>
          </Link>

          <Link href="/question-bank" style={{ textDecoration: 'none' }}>
            <div className="quick-action-link" style={{ padding: 18, border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-light)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <BookOpen size={20} color="var(--brand)" />
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>Question Bank</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Browse categorized templates.</div>
              </div>
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}
