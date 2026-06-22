'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalFaculty: number;
  attendance: number;
  activeExams: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/admin/dashboard/stats');
        if (response.data?.data) {
          setStats(response.data.data);
        } else {
          setError('Failed to load dashboard statistics');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard');
        console.error('Dashboard stats error:', err);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Authorization Management Overview</p>
      </div>

      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}>
          <div style={{ 
            background: '#fff', 
            padding: 20, 
            borderRadius: 12, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>TOTAL USERS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{stats.totalUsers}</div>
          </div>

          <div style={{ 
            background: '#fff', 
            padding: 20, 
            borderRadius: 12, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>TOTAL STUDENTS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{stats.totalStudents}</div>
          </div>

          <div style={{ 
            background: '#fff', 
            padding: 20, 
            borderRadius: 12, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>TOTAL TEACHERS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{stats.totalTeachers}</div>
          </div>

          <div style={{ 
            background: '#fff', 
            padding: 20, 
            borderRadius: 12, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>TOTAL FACULTY</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{stats.totalFaculty}</div>
          </div>

          <div style={{ 
            background: '#fff', 
            padding: 20, 
            borderRadius: 12, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>TODAY\'S ATTENDANCE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{stats.attendance}%</div>
          </div>

          <div style={{ 
            background: '#fff', 
            padding: 20, 
            borderRadius: 12, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>ACTIVE EXAMS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{stats.activeExams}</div>
          </div>
        </div>
      )}
    </div>
  );
}
