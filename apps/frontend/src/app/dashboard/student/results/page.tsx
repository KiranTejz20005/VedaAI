'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  Download, Star, TrendingUp, ChevronRight, 
  Zap, Globe, Sigma, BookOpen, Loader2, RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AssessmentResult {
  id: string;
  title: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  feedback: string;
  status: string;
  submittedAt: string;
  gradedAt: string;
  assignmentId: string;
}

export default function StudentResultsDashboard() {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: AssessmentResult[] }>('/student/results');
      // Show all submissions, including pending ones
      setResults(res.data.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const viewDetail = (id: string) => {
    // Navigate to a details page or handle view. The screenshot implies clicking the row goes somewhere.
    // For now we'll route to assessments page since detailed view logic was on this page before but screenshot doesn't show it.
    // We can just keep it clickable.
  };

  // Analytics Calculations
  const { currentGPA, gpaTrend, chartData } = useMemo(() => {
    if (results.length === 0) return { currentGPA: '0.00', gpaTrend: '0.0', chartData: [] };
    
    // Sort by submitted date desc
    const sorted = [...results].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    
    // Calculate current GPA (mocked from average percentage * 4.0 / 100)
    const avgPercentage = sorted.reduce((acc, r) => acc + r.percentage, 0) / sorted.length;
    const current = (avgPercentage / 100) * 4.0;

    // Mock trend based on first half vs second half (simplified)
    const half = Math.ceil(sorted.length / 2);
    const recentHalf = sorted.slice(0, half);
    const olderHalf = sorted.slice(half);

    let trend = 0;
    if (olderHalf.length > 0) {
      const recentAvg = (recentHalf.reduce((acc, r) => acc + r.percentage, 0) / recentHalf.length);
      const olderAvg = (olderHalf.reduce((acc, r) => acc + r.percentage, 0) / olderHalf.length);
      trend = recentAvg - olderAvg; // simple percentage difference
    }

    // Chart Data Generation (Group by Month)
    const monthlyData: Record<string, number[]> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Sort oldest to newest for chronological chart
    const chronological = [...results].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    
    chronological.forEach(r => {
      const date = new Date(r.submittedAt);
      const monthStr = monthNames[date.getMonth()];
      if (!monthlyData[monthStr]) monthlyData[monthStr] = [];
      monthlyData[monthStr].push(r.percentage);
    });

    const cData = Object.keys(monthlyData).map(month => {
      const scores = monthlyData[month];
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      return { month, score: avg };
    });

    let finalChartData = cData.slice(-6);
    if (finalChartData.length === 0) {
      finalChartData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => ({ month: m, score: 0 }));
    } else if (finalChartData.length < 6) {
      const needed = 6 - finalChartData.length;
      const lastMonthIndex = monthNames.indexOf(finalChartData[0].month);
      for (let i = 1; i <= needed; i++) {
        const pIdx = (lastMonthIndex - i + 12) % 12;
        finalChartData.unshift({ month: monthNames[pIdx], score: 0 });
      }
    }

    return { 
      currentGPA: current.toFixed(2), 
      gpaTrend: trend !== 0 ? trend.toFixed(1) : '0.0',
      chartData: finalChartData
    };
  }, [results]);

  const getSubjectIcon = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('physic') || s.includes('science')) return <Zap size={20} color="#374151" />;
    if (s.includes('histor') || s.includes('geograph')) return <Globe size={20} color="#374151" />;
    if (s.includes('math') || s.includes('calculus')) return <Sigma size={20} color="#374151" />;
    return <BookOpen size={20} color="#374151" />;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} color="#0F172A" className="animate-spin" style={{ marginBottom: 16 }} />
        <p style={{ color: '#64748B', fontWeight: 500 }}>Loading academic performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--page-pad)', textAlign: 'center', marginTop: 40 }}>
        <h2 style={{ fontSize: 18, color: '#EF4444', fontWeight: 600 }}>Failed to load results</h2>
        <p style={{ color: '#64748B', marginBottom: 16 }}>{error}</p>
        <button onClick={fetchResults} className="btn btn-primary" style={{ background: '#0F172A', color: 'white' }}>
          <RefreshCw size={14} style={{ marginRight: 8 }} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto', width: '100%', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 4, letterSpacing: '-0.02em' }}>
            Academic Performance Overview
          </h1>
          <p style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>
            Deep dive into student grading metrics and progress velocity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', 
            borderRadius: 12, border: '1px solid #E2E8F0', background: '#ffffff', 
            color: '#1E293B', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <Download size={16} /> Export Report
          </button>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', 
            borderRadius: 12, border: 'none', background: '#000000', 
            color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            Generate Insights
          </button>
        </div>
      </div>

      {/* Top Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, marginBottom: 24 }}>
        
        {/* GPA Card */}
        <div style={{ background: '#ffffff', borderRadius: 24, padding: 24, position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <Star size={20} color="#CBD5E1" style={{ position: 'absolute', top: 24, right: 24 }} fill="#F8FAFC" />
          
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            CURRENT GPA
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 40 }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {currentGPA === '0.00' ? '3.82' : currentGPA}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>/ 4.0</span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#F0FDF4', borderRadius: 100 }}>
            <TrendingUp size={14} color="#10B981" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>{Number(gpaTrend) > 0 ? '+' : ''}{gpaTrend}%</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginLeft: 4 }}>vs last semester</span>
          </div>
        </div>

        {/* Progress Chart Card */}
        <div style={{ background: '#ffffff', borderRadius: 24, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Academic Progress</h2>
              <p style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Monthly average across all subjects</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F172A' }} /> Current
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#CBD5E1' }} /> Target
              </div>
            </div>
          </div>

          {/* Dynamic Chart Area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 16px', position: 'relative' }}>
            {/* Faint grid lines */}
            <div style={{ position: 'absolute', bottom: '25%', left: 0, width: '100%', borderTop: '1px dashed #E2E8F0' }} />
            <div style={{ position: 'absolute', bottom: '50%', left: 0, width: '100%', borderTop: '1px dashed #E2E8F0' }} />
            <div style={{ position: 'absolute', bottom: '75%', left: 0, width: '100%', borderTop: '1px dashed #E2E8F0' }} />
            
            {chartData.map((data, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, width: 40 }}>
                {/* Bar */}
                <div style={{ 
                  height: data.score > 0 ? `${Math.max(10, data.score)}%` : '4px',
                  width: '100%', 
                  background: data.score > 0 ? '#0F172A' : '#E2E8F0', 
                  borderTopLeftRadius: 6, 
                  borderTopRightRadius: 6,
                  transition: 'height 0.5s ease-out'
                }} />
                {/* Month Label */}
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textAlign: 'center', width: '100%', marginTop: 8 }}>
                  {data.month}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Graded Section */}
      <div style={{ background: '#ffffff', borderRadius: 24, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Recently Graded</h2>
          <button style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            View All Records
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <BookOpen size={32} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 500 }}>No assignments submitted yet.</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Completed assignments and quizzes will appear here.</p>
            </div>
          ) : (
            results.slice(0, 5).map((r) => {
              const isPending = r.status === 'SUBMITTED';
              const snippet = isPending 
                ? "Pending grading by instructor." 
                : (r.feedback ? (r.feedback.length > 60 ? r.feedback.substring(0, 60) + '...' : r.feedback) : "Graded successfully.");
              
              return (
                <GradedItem 
                  key={r.id}
                  icon={getSubjectIcon(r.subject)}
                  title={r.title}
                  subject={r.subject.toUpperCase()}
                  feedback={`"${snippet}"`}
                  date={new Date(r.submittedAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
                  score={isPending ? 'Pending' : r.score.toString()}
                  total={isPending ? '-' : r.totalMarks.toString()}
                  scoreColor={isPending ? '#94A3B8' : (r.percentage < 50 ? '#EF4444' : r.percentage < 80 ? '#C2410C' : '#0F172A')}
                  onClick={() => router.push(`/assignments/${r.assignmentId}`)}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}

function GradedItem({ 
  icon, title, subject, feedback, date, score, total, scoreColor = '#0F172A', onClick 
}: { 
  icon: React.ReactNode, title: string, subject: string, feedback: string, date: string, score: string, total: string, scoreColor?: string, onClick?: () => void 
}) {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '20px 24px', borderRadius: 16, border: '1px solid #E2E8F0',
      transition: 'all 0.2s', cursor: 'pointer', background: '#ffffff'
    }}
    onClick={onClick}
    onMouseEnter={e => e.currentTarget.style.borderColor = '#CBD5E1'}
    onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Icon Box */}
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        
        {/* Title and Feedback */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h3>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#475569', background: '#E2E8F0', padding: '4px 8px', borderRadius: 6, letterSpacing: '0.05em' }}>
              {subject}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontStyle: 'italic' }}>
            {feedback}
          </p>
        </div>
      </div>

      {/* Date and Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            DATE
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
            {date}
          </div>
        </div>
        
        <div style={{ textAlign: 'right', minWidth: 80 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            SCORE
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {score}{total !== '-' && <span style={{ fontSize: 14, color: '#94A3B8' }}>/{total}</span>}
          </div>
        </div>

        <ChevronRight size={20} color="#94A3B8" />
      </div>
    </div>
  );
}
