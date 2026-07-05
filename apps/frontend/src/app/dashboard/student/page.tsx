'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/design-system/Card';
import { PlayCircle, Calendar, Trophy, Zap, Calculator, BookOpen, Users, TrendingUp, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  user: { firstName: string };
  weeklyGoalProgress: number;
  nextTest: { title: string; daysLeft: number } | null;
  monthlyAttendance: number;
  attendanceTrend: string;
  globalRank: { current: number; total: number };
  activeAssignments: any[];
  upcomingTests: any[];
  aiInsight: any;
  currentStreak: number;
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const dashRes = await api.get('/student/dashboard');
        
        if (dashRes.data?.success) setData(dashRes.data.data);
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
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
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

  const dash = data || {
    user: { firstName: 'Student' },
    weeklyGoalProgress: 0,
    nextTest: null,
    monthlyAttendance: 0,
    attendanceTrend: '',
    globalRank: { current: 0, total: 0 },
    activeAssignments: [],
    upcomingTests: [],
    aiInsight: null,
    currentStreak: 0
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px', background: '#F8F9FA', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Good morning, {dash.user.firstName}!
          </h1>
          <p style={{ color: '#4B5563', margin: 0, fontSize: '15px' }}>
            You've completed {dash.weeklyGoalProgress}% of your weekly goals. 
            {dash.nextTest && <span> Your next test, <strong style={{ color: '#111827' }}>{dash.nextTest.title}</strong>, is in {dash.nextTest.daysLeft} days.</span>}
          </p>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Row: Attendance and Rank */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <Card padding="24px" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>
                <Calendar size={16} /> Monthly Attendance
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '42px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{dash.monthlyAttendance}%</span>
                <span style={{ color: '#D97706', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <TrendingUp size={14} /> {dash.attendanceTrend}
                </span>
              </div>
            </Card>

            <Card padding="24px" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>
                <Trophy size={16} /> Global Rank
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '42px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>#{dash.globalRank.current}</span>
                <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: 500 }}>Out of {dash.globalRank.total}</span>
              </div>
            </Card>
          </div>

          {/* Active Assignments */}
          <Card padding="24px" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#111827' }}>Active Assignments</h2>
              <Link href="/dashboard/student/assessments" style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>View All</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {dash.activeAssignments.length > 0 ? dash.activeAssignments.slice(0, 2).map((assignment, idx) => (
                <div key={assignment.id} style={{ border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px', position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', top: '20px', right: '20px', 
                    background: assignment.dueDateStatus === 'DUE TODAY' ? '#FEE2E2' : '#F3F4F6', 
                    color: assignment.dueDateStatus === 'DUE TODAY' ? '#EF4444' : '#6B7280',
                    padding: '4px 10px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em'
                  }}>
                    {assignment.dueDateStatus}
                  </div>
                  <div style={{ 
                    width: '40px', height: '40px', background: '#F3F4F6', borderRadius: '12px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
                  }}>
                    {idx === 0 ? <Zap size={20} color="#374151" /> : <Calculator size={20} color="#374151" />}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0', color: '#111827' }}>{assignment.title}</h3>
                  <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 24px 0', fontWeight: 500 }}>
                    {assignment.subject} • {assignment.chapter} • {assignment.teacher}
                  </p>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                      <span>Progress</span>
                      <span>{assignment.progress}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${assignment.progress}%`, height: '100%', background: '#111827', borderRadius: '9999px' }} />
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '32px', color: '#6B7280', fontSize: '14px' }}>No active assignments found.</div>
              )}
            </div>
          </Card>

          {/* Quick Access */}
          <Card padding="24px" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0', color: '#111827' }}>Quick Access</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <Link href="/dashboard/student/practice" style={{ textDecoration: 'none' }}>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'background 0.2s', cursor: 'pointer' }}>
                  <div style={{ background: '#F3F4F6', padding: '12px', borderRadius: '12px' }}>
                    <BookOpen size={20} color="#374151" />
                  </div>
                  <span style={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}>Practice Quiz</span>
                </div>
              </Link>
              <Link href="/dashboard/student/community" style={{ textDecoration: 'none' }}>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'background 0.2s', cursor: 'pointer' }}>
                  <div style={{ background: '#F3F4F6', padding: '12px', borderRadius: '12px' }}>
                    <Users size={20} color="#374151" />
                  </div>
                  <span style={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}>Community</span>
                </div>
              </Link>
              <Link href="/dashboard/student/results" style={{ textDecoration: 'none' }}>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'background 0.2s', cursor: 'pointer' }}>
                  <div style={{ background: '#F3F4F6', padding: '12px', borderRadius: '12px' }}>
                    <TrendingUp size={20} color="#374151" />
                  </div>
                  <span style={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}>Results</span>
                </div>
              </Link>
            </div>
          </Card>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Upcoming Tests */}
          <Card padding="24px" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 24px 0', color: '#111827' }}>Upcoming Tests</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
              {dash.upcomingTests.length > 0 ? dash.upcomingTests.map((test) => (
                <div key={test.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', border: '1px solid #E5E7EB', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{test.dateStr.split('\n')[0]}</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{test.dateStr.split('\n')[1]}</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0', color: '#111827' }}>{test.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
                      {test.location} • {test.time}
                    </p>
                  </div>
                </div>
              )) : (
                <div style={{ color: '#6B7280', fontSize: '14px' }}>No upcoming tests scheduled.</div>
              )}
            </div>
            <button style={{ 
              width: '100%', padding: '12px', background: 'transparent', border: '1px solid #E5E7EB', 
              borderRadius: '9999px', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s'
            }}>
              View Schedule
            </button>
          </Card>

          {/* AI Insight */}
          <Card padding="24px" style={{ 
            borderRadius: '16px', border: 'none', background: '#0A0A0A', color: '#fff', position: 'relative', overflow: 'hidden' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '16px' }}>
              <Sparkles size={14} fill="#F59E0B" /> AI INSIGHT
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px 0', fontWeight: 400, color: '#F3F4F6' }}>
              Based on your recent {dash.aiInsight?.performanceArea || 'course'} performance, I suggest reviewing <strong style={{ color: '#fff', borderBottom: '2px solid #D97706', fontWeight: 600 }}>{dash.aiInsight?.recommendedTopic || 'the core materials'}</strong> before {dash.aiInsight?.testDay || 'your next'}'s test.
            </p>
            <button style={{ 
              background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', 
              padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              display: 'inline-block', transition: 'background 0.2s'
            }}>
              Start Recommended Lesson
            </button>
            <button style={{
              position: 'absolute', bottom: '24px', right: '24px',
              width: '40px', height: '40px', borderRadius: '50%', background: '#B45309', color: '#fff',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(180, 83, 9, 0.4)'
            }}>
              <Plus size={20} />
            </button>
          </Card>

        </div>
      </div>
    </div>
  );
}
