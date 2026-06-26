'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { BookOpen, GraduationCap, Clock, CheckCircle, Percent, Loader2, ArrowRight, Bell, FileText } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  enrolledClasses: any[];
  availableAssessments: number;
  pendingSubmissions: number;
  completedItems: number;
  recentResults: any[];
}

interface UpcomingTest {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  totalMarks: number;
}

interface RecentResult {
  id: string;
  assignmentId: string;
  title: string;
  subject: string;
  totalMarks: number;
  score: number;
  percentage: number;
  status: string;
  submittedAt: string;
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingTest[]>([]);
  const [results, setResults] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const [dashRes, upcomingRes, resultsRes] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/student/assessments/upcoming'),
          api.get('/student/results')
        ]);
        
        if (dashRes.data?.success) setData(dashRes.data.data);
        if (upcomingRes.data?.success) setUpcoming(upcomingRes.data.data);
        if (resultsRes.data?.success) setResults(resultsRes.data.data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
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

  const dash = data || { availableAssessments: 0, pendingSubmissions: 0, completedItems: 0, recentResults: [] };
  
  // Calculate average score from results
  const gradedResults = results.filter(r => r.status === 'GRADED' || r.status === 'RESULT_PUBLISHED');
  const avgScore = gradedResults.length > 0 
    ? Math.round(gradedResults.reduce((acc, curr) => acc + curr.percentage, 0) / gradedResults.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Student Dashboard"
        subtitle="Your learning performance overview."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<BookOpen size={18} />} label="Available Assessments" value={dash.availableAssessments} />
        <MetricCard icon={<Clock size={18} />} label="Pending Submissions" value={dash.pendingSubmissions} />
        <MetricCard icon={<GraduationCap size={18} />} label="Completed Tests" value={dash.completedItems} />
        <MetricCard icon={<Percent size={18} />} label="Average Score" value={`${avgScore}%`} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Upcoming Tests <span style={{ background: '#FEE2E2', color: '#EF4444', padding: '2px 8px', borderRadius: 12, fontSize: 12, marginLeft: 8 }}>{upcoming.length}</span></h3>
            <Link href="/student/assessments" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcoming.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No upcoming tests scheduled.</p>
            ) : (
              upcoming.slice(0, 4).map(test => (
                <div key={test.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ background: '#EFF6FF', color: '#3B82F6', padding: 8, borderRadius: 8 }}>
                    <Bell size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{test.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{test.subject} • {test.totalMarks} Marks</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#EF4444', textAlign: 'right' }}>
                    Due<br/>
                    {new Date(test.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card padding="clamp(16px, 2vw, 20px)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Recent Results</h3>
            <Link href="/student/results" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {gradedResults.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No recent test results.</p>
            ) : (
              gradedResults.slice(0, 4).map(res => (
                <div key={res.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ background: '#ECFDF5', color: '#10B981', padding: 8, borderRadius: 8 }}>
                    <CheckCircle size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{res.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{res.subject}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(res.percentage)}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{res.score}/{res.totalMarks}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Assignments Overview</h3>
            <Link href="/assignments" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
             {/* Show pending or recent submissions */}
             {results.length === 0 ? (
               <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No assignments found.</p>
             ) : (
               results.slice(0, 4).map(res => (
                 <div key={res.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-hover)', borderRadius: 8 }}>
                   <div style={{ background: '#F3F4F6', color: '#4B5563', padding: 8, borderRadius: 8 }}>
                     <FileText size={18} />
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{res.title}</div>
                     <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                       Submitted on {new Date(res.submittedAt).toLocaleDateString()}
                     </div>
                   </div>
                   <div>
                     <span style={{ 
                       fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 12,
                       background: res.status === 'SUBMITTED' ? '#FEF3C7' : (res.status === 'UNDER_REVIEW' ? '#DBEAFE' : '#D1FAE5'),
                       color: res.status === 'SUBMITTED' ? '#D97706' : (res.status === 'UNDER_REVIEW' ? '#2563EB' : '#059669')
                     }}>
                       {res.status.replace('_', ' ')}
                     </span>
                   </div>
                 </div>
               ))
             )}
          </div>
        </Card>
      </div>
    </div>
  );
}
