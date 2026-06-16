'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Loader2, AlertCircle, ClipboardCheck, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface PendingReview {
  id: string;
  question: string;
  difficulty: string;
  bloom: string;
  author: string;
  createdAt: string;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string }> = {
  easy: { bg: '#D1FAE5', color: '#059669' },
  medium: { bg: '#FEF3C7', color: '#D97706' },
  hard: { bg: '#FEE2E2', color: '#EF4444' },
};

export default function ReviewHubPage() {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({ approved: 0, rejected: 0 });

  useEffect(() => {
    let cancelled = false;
    apiClient.get<{ success: boolean; data: PendingReview[] }>('/reviews/pending')
      .then((res) => { if (!cancelled) setPendingReviews(res.data.data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reviews'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleReviewAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    setActionLoading(id);
    try {
      await apiClient.post('/reviews', { questionId: id, status: action, comments: '' });
      setPendingReviews(prev => prev.filter(q => q.id !== id));
      setStats((prev) => ({ ...prev, [action === 'APPROVED' ? 'approved' : 'rejected']: prev[action === 'APPROVED' ? 'approved' : 'rejected'] + 1 }));
      toast.success(action === 'APPROVED' ? 'Question approved' : 'Question rejected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck size={24} color="#0f172a" />
          <h1 className="page-title">Review Hub</h1>
        </div>
        <p className="page-subtitle">Approve or reject AI-generated and faculty-submitted questions.</p>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">Reviews</h1>
        <div style={{ width: 32 }} />
      </div>

      {stats.approved + stats.rejected > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="card" style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Check size={16} color="#10B981" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stats.approved} approved</span>
          </div>
          <div className="card" style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <X size={16} color="#EF4444" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stats.rejected} rejected</span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: 16, width: '30%', borderRadius: 6, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '50%', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle size={40} color="#EF4444" />
          <h2 className="empty-title">Failed to load</h2>
          <p className="empty-desc">{error}</p>
        </div>
      ) : pendingReviews.length === 0 ? (
        <div className="empty-state">
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ClipboardCheck size={36} color="#10B981" />
          </div>
          <h2 className="empty-title">All Caught Up!</h2>
          <p className="empty-desc">There are no questions pending your review at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingReviews.map((review, i) => {
            const diffStyle = DIFFICULTY_COLORS[review.difficulty.toLowerCase()] ?? { bg: '#F3F4F6', color: '#374151' };
            return (
              <motion.div key={review.id} className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      <span className="badge badge-pending">Needs Review</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={12} /> {review.author}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>{review.question}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span className="badge" style={{ background: diffStyle.bg, color: diffStyle.color }}>{review.difficulty}</span>
                    <span className="badge" style={{ background: '#EDE9FE', color: '#7C3AED' }}>{review.bloom}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleReviewAction(review.id, 'REJECTED')}
                    disabled={actionLoading === review.id}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: 6, color: '#EF4444', borderColor: '#FECACA' }}
                  >
                    <X size={15} /> Reject
                  </button>
                  <button
                    onClick={() => handleReviewAction(review.id, 'APPROVED')}
                    disabled={actionLoading === review.id}
                    className="btn btn-primary btn-sm"
                    style={{ gap: 6, background: '#10B981', borderColor: '#10B981' }}
                  >
                    {actionLoading === review.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    Approve
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}