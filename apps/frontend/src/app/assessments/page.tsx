'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FileText, Search, Plus, Eye, Loader2, CheckCircle2, Clock, AlertCircle,
  FileQuestion, Archive, Send, ThumbsUp, XCircle, Edit3, RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type AssessmentStatus =
  | 'DRAFT' | 'GENERATED' | 'PENDING_APPROVAL' | 'APPROVED'
  | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED';

interface Assessment {
  id: string;
  title: string;
  subject: string;
  class: string;
  status: AssessmentStatus;
  questionCount: number;
  totalMarks: number;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<AssessmentStatus, { cls: string; label: string; icon: React.ComponentType<{ size?: number }> }> = {
  DRAFT: { cls: 'badge-draft', label: 'Draft', icon: FileText },
  GENERATED: { cls: 'badge-warning', label: 'Generated', icon: FileQuestion },
  PENDING_APPROVAL: { cls: 'badge-queued', label: 'Pending Approval', icon: Clock },
  APPROVED: { cls: 'badge-completed', label: 'Approved', icon: ThumbsUp },
  PUBLISHED: { cls: 'badge-completed', label: 'Published', icon: CheckCircle2 },
  ACTIVE: { cls: 'badge-generating', label: 'Active', icon: AlertCircle },
  COMPLETED: { cls: 'badge-completed', label: 'Completed', icon: CheckCircle2 },
};

function StatusBadge({ status }: { status: AssessmentStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.DRAFT;
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: '14px 12px' }}>
          <div className="skeleton" style={{ height: 16, width: i === 0 ? 160 : 80, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

export default function AssessmentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | 'ALL'>('ALL');

  const userRole = user?.role?.toUpperCase() || '';
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const isFaculty = userRole === 'TEACHER' || userRole === 'FACULTY';

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await api.get<{ success: boolean; data: Assessment[] }>(`/assignments?${params}`);
      setAssessments(res.data.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessments');
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const handleAction = async (action: string, id: string) => {
    try {
      await api.post(`/assessments/${id}/${action}`);
      toast.success(`Assessment ${action.replace('_', ' ')}d successfully`);
      await fetchAssessments();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action}`);
    }
  };

  const stats = {
    total: assessments.length,
    published: assessments.filter(a => a.status === 'PUBLISHED' || a.status === 'ACTIVE').length,
    pending: assessments.filter(a => a.status === 'PENDING_APPROVAL').length,
    draft: assessments.filter(a => a.status === 'DRAFT').length,
  };

  const filtered = assessments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      <div className="desktop-page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={24} color="var(--brand)" />
              <h1 className="page-title">Assessment Center</h1>
            </div>
            <p className="page-subtitle">Manage assessments, review submissions, and track progress</p>
          </div>
          {isFaculty && (
            <Link href="/assignments/create" className="btn btn-dark btn-pill" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Create Assessment
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Assessments', value: stats.total, icon: FileText, color: 'var(--brand)', bg: 'rgba(232,83,29,0.1)' },
          { label: 'Published', value: stats.published, icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Pending Approval', value: stats.pending, icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Draft', value: stats.draft, icon: FileText, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="search-filter-row" style={{ marginBottom: 20 }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input search-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 8, flexWrap: 'wrap' }}>
          {(['ALL', 'DRAFT', 'GENERATED', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE', 'COMPLETED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: 11 }}
            >
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Class</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center' }}>Questions</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center' }}>Marks</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <h2 className="empty-title">Failed to load assessments</h2>
          <p className="empty-desc">{error}</p>
          <div className="empty-state-actions">
            <button type="button" onClick={fetchAssessments} className="btn btn-dark btn-pill">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={40} color="#9CA3AF" />
          <h2 className="empty-title">{search || statusFilter !== 'ALL' ? 'No matching assessments' : 'No assessments yet'}</h2>
          <p className="empty-desc">{search || statusFilter !== 'ALL' ? 'Try adjusting your search or filters.' : 'Create your first assessment to get started.'}</p>
          {isFaculty && !search && statusFilter === 'ALL' && (
            <div className="empty-state-actions">
              <Link href="/assignments/create" className="btn btn-dark btn-pill"><Plus size={16} /> Create Assessment</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Class</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center' }}>Questions</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center' }}>Marks</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((assessment) => (
                  <tr
                    key={assessment.id}
                    style={{ borderBottom: '1px solid #F3F4F6', fontSize: 14, transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={14} color="var(--brand)" />
                        {assessment.title}
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{assessment.subject}</td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{assessment.class || '—'}</td>
                    <td style={{ padding: '14px 12px' }}><StatusBadge status={assessment.status} /></td>
                    <td style={{ padding: '14px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{assessment.questionCount}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>{assessment.totalMarks}</td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(assessment.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        {isFaculty && assessment.status === 'DRAFT' && (
                          <>
                            <button className="btn btn-secondary btn-sm" style={{ gap: 4, padding: '4px 8px' }}
                              onClick={() => router.push(`/assignments/create?id=${assessment.id}`)} title="Edit">
                              <Edit3 size={13} /> Edit
                            </button>
                            <button className="btn btn-secondary btn-sm" style={{ gap: 4, padding: '4px 8px', color: '#D97706' }}
                              onClick={() => handleAction('submit-for-approval', assessment.id)} title="Submit for Approval">
                              <Send size={13} /> Submit
                            </button>
                          </>
                        )}
                        {isAdmin && assessment.status === 'PENDING_APPROVAL' && (
                          <>
                            <button className="btn btn-secondary btn-sm" style={{ gap: 4, padding: '4px 8px', color: '#10B981' }}
                              onClick={() => handleAction('approve', assessment.id)} title="Approve">
                              <ThumbsUp size={13} /> Approve
                            </button>
                            <button className="btn btn-secondary btn-sm" style={{ gap: 4, padding: '4px 8px', color: '#EF4444' }}
                              onClick={() => handleAction('reject', assessment.id)} title="Reject">
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {isAdmin && assessment.status === 'APPROVED' && (
                          <button className="btn btn-dark btn-sm" style={{ gap: 4, padding: '4px 8px' }}
                            onClick={() => handleAction('publish', assessment.id)} title="Publish">
                            <CheckCircle2 size={13} /> Publish
                          </button>
                        )}
                        {(assessment.status === 'PUBLISHED' || assessment.status === 'ACTIVE' || assessment.status === 'COMPLETED') && (
                          <button className="btn btn-secondary btn-sm" style={{ gap: 4, padding: '4px 8px', color: '#D97706' }}
                            onClick={() => handleAction('archive', assessment.id)} title="Archive">
                            <Archive size={13} /> Archive
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm" style={{ gap: 4, padding: '4px 8px' }}
                          onClick={() => router.push(assessment.status === 'COMPLETED' || assessment.status === 'PUBLISHED' || assessment.status === 'ACTIVE' ? `/assignments/${assessment.id}/paper` : `/assignments/${assessment.id}`)} title="View">
                          <Eye size={13} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
