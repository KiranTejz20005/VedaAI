'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ClipboardCheck, Clock,
  AlertCircle, Filter, Plus, Zap, Calendar, BarChart3, Mail, MoreHorizontal, Timer
} from 'lucide-react';
import { api } from '@/lib/api';
import { RescheduleModal } from '@/components/student/RescheduleModal';

type DashboardCategory = 'UPCOMING' | 'COMPLETED' | 'MISSED' | 'LIVE NOW';

interface StudentAssessment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  totalMarks: number;
  duration: number;
  attemptStatus: string;
  dashboardCategory: DashboardCategory;
  submittedAt?: string;
  score?: number;
  evaluatedMarks?: number;
  teacherId?: string;
}

export default function StudentAssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleItem, setRescheduleItem] = useState<StudentAssessment | null>(null);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
          <span>Loading tests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, color: '#991b1b', margin: 24 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Error Loading Tests</h3>
        <p>{error}</p>
        <button onClick={fetchAssessments} style={{ marginTop: 12, padding: '8px 16px', background: '#991b1b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#F8F9FA', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
            Student Tests
          </h1>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '15px' }}>
            Manage and track scheduled exams, quizzes, and assessments across all subjects.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ 
            background: '#fff', color: '#374151', padding: '10px 20px', borderRadius: '9999px', 
            display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #E5E7EB', cursor: 'pointer',
            fontWeight: 500, fontSize: '14px'
          }}>
            <Filter size={16} /> Filter By
          </button>
          <button onClick={() => router.push('/student/practice')} style={{ 
            background: '#000', color: '#fff', padding: '10px 20px', borderRadius: '9999px', 
            display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 500, fontSize: '14px'
          }}>
            <Plus size={16} /> Create Practice Test
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        
        {assessments.map((a) => {
          const isUpcoming = a.dashboardCategory === 'UPCOMING';
          const isCompleted = a.dashboardCategory === 'COMPLETED';
          const isMissed = a.dashboardCategory === 'MISSED';
          const isLive = a.dashboardCategory === 'LIVE NOW';

          const dateObj = new Date(a.dueDate);
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

          if (isLive) {
            return (
              <div key={a.id} style={{ 
                background: '#fff', borderRadius: '20px', padding: '24px', 
                border: '2px solid #C2410C', boxShadow: '0 10px 15px -3px rgba(194, 65, 12, 0.1)',
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#F97316', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Timer size={24} color="#fff" />
                  </div>
                  <div style={{ background: '#C2410C', color: '#fff', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%' }} />
                    LIVE NOW
                  </div>
                </div>
                
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#111827' }}>{a.title}</h3>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px 0', fontWeight: 500 }}>{a.subject}</p>

                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em' }}>COMPLETION PROGRESS</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#C2410C' }}>In Progress</span>
                  </div>
                  <div style={{ height: '8px', background: '#FFEDD5', borderRadius: '9999px', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ width: '50%', height: '100%', background: '#C2410C', borderRadius: '9999px' }} />
                  </div>
                  
                  <button onClick={() => handleStart(a.id)} style={{ 
                    width: '100%', padding: '14px', background: '#C2410C', color: '#fff', 
                    borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
                  }}>
                    {a.attemptStatus === 'STARTED' ? 'Start Test' : 'Resume Test'}
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={a.id} style={{ 
              background: '#fff', borderRadius: '20px', padding: '24px', 
              border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', background: '#F3F4F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isCompleted ? <ClipboardCheck size={24} color="#374151" /> : isMissed ? <AlertCircle size={24} color="#EF4444" /> : <Zap size={24} color="#374151" />}
                </div>
                {isUpcoming && <div style={{ background: '#FFEDD5', color: '#EA580C', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>UPCOMING</div>}
                {isCompleted && <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>COMPLETED</div>}
                {isMissed && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>MISSED</div>}
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#111827' }}>{a.title}</h3>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px 0', fontWeight: 500 }}>{a.subject}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Calendar size={18} color="#9CA3AF" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', marginBottom: '4px' }}>DATE</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{dateStr}</div>
                  </div>
                </div>
                
                {isUpcoming && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Clock size={18} color="#9CA3AF" style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', marginBottom: '4px' }}>TIME & DURATION</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{timeStr} • {a.duration} Minutes</div>
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <BarChart3 size={18} color="#9CA3AF" style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', marginBottom: '4px' }}>YOUR SCORE</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#16A34A' }}>
                        {a.score !== undefined && a.score !== null ? `${a.score} / ${a.evaluatedMarks || a.totalMarks}` : 'Pending Review'}
                      </div>
                    </div>
                  </div>
                )}

                {isMissed && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <AlertCircle size={18} color="#9CA3AF" style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', marginBottom: '4px' }}>STATUS</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626' }}>Missed Deadline</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {isUpcoming && (
                  <>
                    <button style={{ flex: 1, padding: '12px', background: '#111827', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>View Details</button>
                    <button style={{ padding: '12px', background: '#fff', color: '#374151', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <MoreHorizontal size={20} />
                    </button>
                  </>
                )}
                {isCompleted && (
                  <button onClick={() => handleViewResult(a)} style={{ width: '100%', padding: '12px', background: '#fff', color: '#111827', borderRadius: '12px', border: '1px solid #E5E7EB', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>View Result</button>
                )}
                {isMissed && (
                  <>
                    <button onClick={() => setRescheduleItem(a)} style={{ flex: 1, padding: '12px', background: '#111827', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Request Reschedule</button>
                    <button style={{ padding: '12px', background: '#fff', color: '#374151', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Mail size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Create New Test Card */}
        <div onClick={() => router.push('/dashboard/student/practice')} style={{ 
          background: '#F9FAFB', borderRadius: '20px', padding: '24px', 
          border: '2px dashed #D1D5DB', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer',
          minHeight: '320px', transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#F9FAFB'}
        >
          <div style={{ width: '64px', height: '64px', background: '#E5E7EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Plus size={32} color="#374151" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 12px 0', color: '#111827' }}>Create Practice Test</h3>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0, maxWidth: '200px', lineHeight: 1.5 }}>
            Quickly generate quiz questions for your self-study and practice.
          </p>
        </div>

      </div>

      {rescheduleItem && (
        <RescheduleModal
          isOpen={!!rescheduleItem}
          onClose={() => setRescheduleItem(null)}
          assessmentId={rescheduleItem.id}
          courseTitle={rescheduleItem.title}
          originalDate={rescheduleItem.dueDate}
          teacherId={rescheduleItem.teacherId || ''}
        />
      )}
    </div>
  );
}
