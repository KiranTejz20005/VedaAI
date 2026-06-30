'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Users, UserCheck, UserX, FileText, UploadCloud, Percent, ClipboardList, Loader2 } from 'lucide-react';

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
  const [showUploadModal, setShowUploadModal] = useState(false);

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
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Teacher Command Center</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <button
              onClick={() => router.push('/dashboard/teacher/generate-quiz')}
              style={{ padding: '12px 16px', background: 'var(--brand)', color: 'white', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              <FileText size={18} /> Quick Generate Quiz
            </button>
            <button
              onClick={() => router.push('/dashboard/teacher/grade')}
              style={{ padding: '12px 16px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <ClipboardList size={18} /> Grade Pending Assignments
            </button>
            <button
              onClick={() => router.push('/dashboard/teacher/insights?filter=at-risk')}
              style={{ padding: '12px 16px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <UserX size={18} color="#ef4444" /> Review At-Risk Students
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{ padding: '12px 16px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <UploadCloud size={18} /> Upload Class Material
            </button>
          </div>
        </Card>
      </div>

      {/* Material Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 16, width: '90%', maxWidth: 500 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Upload Material</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>Upload Word (.docx) or PDF files for your class.</p>
            
            <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', marginBottom: 24 }}>
              <UploadCloud size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop files here</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>or click to browse</p>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx" 
                style={{ display: 'none' }} 
                id="material-upload" 
                onChange={async (e) => {
                  if (e.target.files?.length) {
                    const file = e.target.files[0];
                    toast.success(`Selected ${file.name}, uploading...`);
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      await api.post('/teacher/upload-material', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      toast.success('Material uploaded successfully!');
                    } catch (err: any) {
                      toast.error('Failed to upload material');
                    } finally {
                      setTimeout(() => setShowUploadModal(false), 500);
                    }
                  }
                }}
              />
              <label htmlFor="material-upload" style={{ display: 'inline-block', padding: '8px 16px', background: 'var(--bg-muted)', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Browse Files
              </label>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setShowUploadModal(false)}
                style={{ padding: '8px 16px', background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
