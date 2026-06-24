'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ClipboardCheck, Play, Eye, RefreshCw, Clock, FileText,
  CheckCircle2, AlertCircle, BarChart3
} from 'lucide-react';
import { api } from '@/lib/api';

type StudentAssessmentStatus = 'AVAILABLE' | 'STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

interface StudentAssessment {
  id: string;
  title: string;
  subject: string;
  status: StudentAssessmentStatus;
  dueDate: string;
  totalMarks: number;
  duration: number;
  score?: number;
  percentage?: number;
  submittedAt?: string;
}

const statusConfig: Record<StudentAssessmentStatus, { cls: string; label: string; icon: React.ComponentType<{ size?: number }> }> = {
  AVAILABLE: { cls: 'badge-draft', label: 'Available', icon: FileText },
  STARTED: { cls: 'badge-generating', label: 'Started', icon: AlertCircle },
  IN_PROGRESS: { cls: 'badge-queued', label: 'In Progress', icon: Clock },
  SUBMITTED: { cls: 'badge-warning', label: 'Submitted', icon: CheckCircle2 },
  GRADED: { cls: 'badge-completed', label: 'Graded', icon: BarChart3 },
};

function StatusBadge({ status }: { status: StudentAssessmentStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.AVAILABLE;
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} style={{ padding: '14px 12px' }}>
          <div className="skeleton" style={{ height: 16, width: i === 0 ? 160 : 80, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

export default function StudentAssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: StudentAssessment[] }>('/student/assessments');
      setAssessments(res.data.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessments');
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const handleStart = async (id: string) => {
    try {
      await api.post(`/student/assessments/${id}/start`);
      toast.success('Assessment started');
      await fetchAssessments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start assessment');
    }
  };

  const handleViewResult = (assessment: StudentAssessment) => {
    router.push(`/student/results?id=${assessment.id}`);
  };

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      <div className="desktop-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck size={24} color="var(--brand)" />
          <h1 className="page-title">My Assessments</h1>
        </div>
        <p className="page-subtitle">View and take your assigned assessments.</p>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Due Date</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center' }}>Marks</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center' }}>Duration</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'right' }}>Action</th>
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
            <button onClick={fetchAssessments} className="btn btn-dark btn-pill"><RefreshCw size={14} /> Retry</button>
          </div>
        </div>
      ) : assessments.length === 0 ? (
        <div className="empty-state">
          <ClipboardCheck size={40} color="#9CA3AF" />
          <h2 className="empty-title">No assessments available</h2>
          <p className="empty-desc">You don&apos;t have any assessments assigned yet.</p>
          <div className="empty-state-actions">
            <Link href="/student" className="btn btn-secondary btn-pill">Back to Dashboard</Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'left' }}>Due Date</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center' }}>Marks</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'center' }}>Duration</th>
                  <th style={{ padding: '14px 12px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr
                    key={a.id}
                    style={{ borderBottom: '1px solid #F3F4F6', fontSize: 14, transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={14} color="var(--brand)" />
                        {a.title}
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{a.subject}</td>
                    <td style={{ padding: '14px 12px' }}><StatusBadge status={a.status} /></td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: 13 }}>
                      <span style={{ color: new Date(a.dueDate) < new Date() ? '#EF4444' : 'inherit' }}>
                        {new Date(a.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {a.status === 'GRADED' && a.score !== undefined ? `${a.score}/${a.totalMarks}` : a.totalMarks}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{a.duration} min</td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      {(a.status === 'AVAILABLE') && (
                        <button className="btn btn-dark btn-sm" style={{ gap: 4 }} onClick={() => handleStart(a.id)}>
                          <Play size={13} /> Start
                        </button>
                      )}
                      {(a.status === 'STARTED' || a.status === 'IN_PROGRESS') && (
                        <button className="btn btn-dark btn-sm" style={{ gap: 4 }} onClick={() => handleStart(a.id)}>
                          <Play size={13} /> Resume
                        </button>
                      )}
                      {a.status === 'SUBMITTED' && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Awaiting grade</span>
                      )}
                      {a.status === 'GRADED' && (
                        <button className="btn btn-secondary btn-sm" style={{ gap: 4 }} onClick={() => handleViewResult(a)}>
                          <Eye size={13} /> View Result
                        </button>
                      )}
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
