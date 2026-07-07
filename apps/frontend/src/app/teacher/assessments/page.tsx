'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { FileText, Clock, CheckCircle2, Users, BookOpen, Sparkles, Edit2, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Homework {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  totalStudents: number;
  submitted: number;
  graded: number;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED';
}

export default function HomeworkHubPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlyCompleted, setRecentlyCompleted] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    let currentHomeworks: Homework[] = [];
    
    const fetchAssignments = async (isPolling = false) => {
      try {
        if (!isPolling) setLoading(true);
        const res = await api.get('/assignments');
        if (res.data?.success) {
          const formatted = res.data.data.map((a: any) => ({
            id: a.id,
            title: a.title,
            course: a.subject,
            dueDate: new Date(a.dueDate).toLocaleDateString(),
            totalStudents: a._count?.submissions || 0,
            submitted: a.submissions?.length || 0,
            graded: a.submissions?.filter((s: any) => s.status === 'GRADED').length || 0,
            status: a.status
          }));
          
          if (isPolling) {
            const newlyCompleted = formatted.filter((newHw: Homework) => 
              ['COMPLETED', 'PENDING_APPROVAL', 'DRAFT'].includes(newHw.status) && 
              currentHomeworks.some(oldHw => oldHw.id === newHw.id && ['GENERATING', 'QUEUED'].includes(oldHw.status))
            );
            if (newlyCompleted.length > 0) {
              setRecentlyCompleted(r => [...r, ...newlyCompleted.map((n: Homework) => n.id)]);
              newlyCompleted.forEach((n: Homework) => {
                setTimeout(() => {
                  setRecentlyCompleted(r => r.filter(id => id !== n.id));
                }, 2000);
              });
            }
          }
          
          currentHomeworks = formatted;
          setHomeworks(formatted);
        }
      } catch (err) {
        if (!isPolling) toast.error('Failed to load assignments');
      } finally {
        if (!isPolling) setLoading(false);
      }
    };
    
    fetchAssignments();

    const interval = setInterval(() => {
      if (currentHomeworks.some(hw => ['GENERATING', 'QUEUED'].includes(hw.status))) {
        fetchAssignments(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleBulkGrade = async (id: string) => {
    toast.success('Initiating Bulk AI Grading...');
    try {
      const res = await api.post(`/grader/assignments/${id}/bulk-evaluate`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Assignments graded successfully!');
        // Refresh the page
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Bulk grading failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await api.delete(`/assignments/${id}`);
      if (res.data?.success) {
        setHomeworks(prev => prev.filter(hw => hw.id !== id));
        toast.success('Assignment deleted successfully');
      }
    } catch (err) {
      toast.error('Failed to delete assignment');
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading assessments...</div>;
  }

  if (homeworks.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No Assignments Yet</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>You haven't created any assignments for your classes.</p>
        <Button variant="primary" onClick={() => router.push('/teacher/assessments/create')}>Create Assignment</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Homework Management Hub"
          subtitle="Track submissions, late policies, and bulk grading."
        />
        <Button variant="primary" onClick={() => router.push('/teacher/assessments/create')}>Create Assignment</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {homeworks.map((hw) => (
          <Card key={hw.id} padding="24px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={20} color="var(--brand)" /> {hw.title}
                </h3>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{hw.course} &middot; Due: <span style={{ color: hw.status === 'COMPLETED' ? 'inherit' : '#EF4444', fontWeight: 600 }}>{hw.dueDate}</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 16, fontSize: 'var(--text-xs)', fontWeight: 600, background: hw.status === 'ACTIVE' ? '#DBEAFE' : '#F3F4F6', color: hw.status === 'ACTIVE' ? '#1D4ED8' : '#4B5563' }}>
                  {recentlyCompleted.includes(hw.id) ? (
                    <CheckCircle2 size={14} color="#10B981" style={{ animation: 'zoomIn 0.3s ease-out' }} />
                  ) : ['GENERATING', 'QUEUED'].includes(hw.status) ? (
                    <Loader2 size={14} color="#F97316" className="animate-spin" />
                  ) : null}
                  {hw.status}
                </div>
                <button onClick={() => router.push(`/teacher/assessments/${hw.id}/edit`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(hw.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', padding: 4 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24, padding: '16px', background: 'var(--bg-muted)', borderRadius: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14}/> Total</span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{hw.totalStudents}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={14}/> Submitted</span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{hw.submitted}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14}/> Pending</span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: hw.status === 'ACTIVE' ? '#F59E0B' : 'inherit' }}>{hw.totalStudents - hw.submitted}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14}/> Graded</span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: '#10B981' }}>{hw.graded}/{hw.submitted}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              {hw.submitted > hw.graded && (
                <Button variant="outline" onClick={() => handleBulkGrade(hw.id)}>
                  <Sparkles size={16} style={{ marginRight: 8, color: 'var(--brand)' }} />
                  Bulk AI Grade ({hw.submitted - hw.graded})
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push(`/teacher/assessments/${hw.id}/submissions`)}>View Submissions</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
