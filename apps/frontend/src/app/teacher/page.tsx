'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Users, UserCheck, UserX, FileText, UploadCloud, Percent, ClipboardList, Loader2, Sparkles } from 'lucide-react';

interface TeacherStats {
  totalStudents: number;
  presentToday: number;
  absent: number;
  testsConducted: number;
  assignmentsCreated: number;
  averageClassScore: number;
  pendingEvaluations: number;
  recentTests?: any[];
  topStudents?: any[];
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/teacher/dashboard/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        } else {
          setError('Failed to load statistics');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
          <Loader2 size={20} className="animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, color: '#991b1b' }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Error Loading Dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  const data = stats || { totalStudents: 0, presentToday: 0, absent: 0, testsConducted: 0, assignmentsCreated: 0, averageClassScore: 0, pendingEvaluations: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Teacher Dashboard"
        subtitle="Class Monitoring & Assessment Overview."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<Users size={18} />} label="Total Students" value={data.totalStudents} />
        <MetricCard icon={<UserCheck size={18} />} label="Present Today" value={data.presentToday} />
        <MetricCard icon={<UserX size={18} />} label="Absent" value={data.absent} />
        <MetricCard icon={<FileText size={18} />} label="Tests Conducted" value={data.testsConducted} />
        <MetricCard icon={<UploadCloud size={18} />} label="Assignments Created" value={data.assignmentsCreated} />
        <MetricCard icon={<Percent size={18} />} label="Average Class Score" value={`${data.averageClassScore}%`} />
        <MetricCard icon={<ClipboardList size={18} />} label="Pending Evaluations" value={data.pendingEvaluations} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Recent Test Statistics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.recentTests && data.recentTests.length > 0 ? (
              data.recentTests.map((test: any) => (
                <div key={test.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--bg-muted)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{test.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{test.date}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--brand)' }}>{test.score}% Avg</div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No recent tests found.</p>
            )}
          </div>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Student Performance Table</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.topStudents && data.topStudents.length > 0 ? (
              data.topStudents.map((student: any) => (
                <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{student.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Roll: {student.rollNo}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{student.average}%</div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No student data available.</p>
            )}
          </div>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <button
              onClick={() => router.push('/teacher/assessments')}
              style={{ padding: '12px 16px', background: 'var(--brand)', color: 'white', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              <FileText size={18} /> Create Assignment
            </button>
            <button
              onClick={() => router.push('/teacher/attendance')}
              style={{ padding: '12px 16px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <UserCheck size={18} /> Take Attendance
            </button>
            <button
              onClick={() => router.push('/teacher/copilot')}
              style={{ padding: '12px 16px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <Sparkles size={18} color="var(--brand)" /> Create Lesson Plan
            </button>
            <button
              onClick={() => router.push('/teacher/groups/create')}
              style={{ padding: '12px 16px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <Users size={18} /> Create Group
            </button>
            <button
              onClick={() => router.push('/teacher/library')}
              style={{ padding: '12px 16px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <UploadCloud size={18} /> Upload Resource
            </button>
            <button
              onClick={() => router.push('/teacher/insights')}
              style={{ padding: '12px 16px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <Users size={18} /> View Classes
            </button>
            <button
              onClick={() => router.push('/grader')}
              style={{ padding: '12px 16px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <ClipboardList size={18} /> Grade Assignments
            </button>
            <button
              onClick={() => router.push('/ai-toolkit')}
              style={{ padding: '12px 16px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <Sparkles size={18} /> AI Teacher Toolkit
            </button>
          </div>
        </Card>
      </div>

    </div>
  );
}
