'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Users, BookOpen, Clock, Settings, GraduationCap, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Institution Management Overview."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<Users size={18} />} label="Total Users" value={1050} />
        <MetricCard icon={<GraduationCap size={18} />} label="Total Students" value={950} />
        <MetricCard icon={<BookOpen size={18} />} label="Total Teachers" value={80} />
        <MetricCard icon={<Settings size={18} />} label="Total Faculty" value={20} />
        <MetricCard icon={<Clock size={18} />} label="Today's Attendance" value="91%" />
        <MetricCard icon={<Activity size={18} />} label="Active Exams" value={5} />
        <MetricCard icon={<DollarSign size={18} />} label="Total Revenue" value="$45k" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>User Growth</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for user growth chart...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Management Modules</h3>
          <p style={{ color: 'var(--text-secondary)' }}>User Management | Role Management | Department Management</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Platform Usage</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for platform usage statistics...</p>
        </Card>
      </div>
    </div>
  );
}
