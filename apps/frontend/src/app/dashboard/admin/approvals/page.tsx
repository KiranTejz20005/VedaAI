'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Clock,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { format } from 'date-fns';
import { LoadingState } from '@/design-system/LoadingState';
import { EmptyState } from '@/design-system/EmptyState';

interface PendingApproval {
  id: string;
  title: string;
  subject: string;
  typeBreakdown: string | null;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ApprovalsOverview() {
  const { user } = useAuthStore();
  const { activeOrganizationId } = useAdminAuthStore();
  
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/approvals');
      if (res.data?.success) {
        setApprovals(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load pending approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (activeOrganizationId || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN')) {
      fetchApprovals();
    }
  }, [activeOrganizationId, user]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/admin/approvals/${id}/approve`);
      toast.success('Approved successfully');
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/admin/approvals/${id}/reject`, { reviewComments: 'Rejected by admin' });
      toast.success('Rejected successfully');
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const stats = {
    quizzes: approvals.filter(a => a.title.toLowerCase().includes('quiz') || a.typeBreakdown?.toLowerCase().includes('quiz')).length,
    assignments: approvals.filter(a => !a.title.toLowerCase().includes('quiz') && !a.title.toLowerCase().includes('exam')).length,
    exams: approvals.filter(a => a.title.toLowerCase().includes('exam')).length
  };

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Approval Section</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
            <FileText size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>PENDING QUIZZES</p>
            <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 0', color: 'var(--text-primary)' }}>{stats.quizzes}</h3>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>ASSIGNMENTS TO REVIEW</p>
            <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 0', color: 'var(--text-primary)' }}>{stats.assignments}</h3>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>FINAL EXAM APPROVALS</p>
            <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 0', color: 'var(--text-primary)' }}>{stats.exams}</h3>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Submission Queue</h2>
        </div>
        
        {loading ? (
          <LoadingState lines={5} />
        ) : approvals.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={40} />}
            title="All caught up!"
            description="There are no pending approvals in the queue right now."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>FACULTY NAME</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>TYPE</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>SUBJECT</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>SUBMISSION DATE</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((item) => {
                  const author = item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : 'Unknown Faculty';
                  let type = 'Assignment';
                  if (item.title.toLowerCase().includes('quiz')) type = 'Quiz';
                  if (item.title.toLowerCase().includes('exam')) type = 'Final Exam';

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontWeight: 600, fontSize: '13px' }}>
                            {author.charAt(0)}
                          </div>
                          <span>{author}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{type}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{item.subject}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{format(new Date(item.createdAt), 'MMM dd, yyyy')}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleApprove(item.id)} title="Approve" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={18} />
                          </button>
                          <button onClick={() => handleReject(item.id)} title="Reject" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <XCircle size={18} />
                          </button>
                          <button title="View" onClick={() => window.open(`/assignments/${item.id}`, '_blank')} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
