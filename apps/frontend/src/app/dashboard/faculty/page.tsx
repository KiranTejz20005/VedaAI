'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Users, GraduationCap, Building2, BarChart2, CheckCircle, Clock } from 'lucide-react';

export default function FacultyDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Faculty Dashboard"
        subtitle="Department Monitoring & Overview."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<Users size={18} />} label="Total Teachers" value={24} />
        <MetricCard icon={<GraduationCap size={18} />} label="Total Students" value={850} />
        <MetricCard icon={<Building2 size={18} />} label="Active Classes" value={36} />
        <MetricCard icon={<BarChart2 size={18} />} label="Average Attendance" value="88%" />
        <MetricCard icon={<CheckCircle size={18} />} label="Department Performance" value="Very Good" />
        <MetricCard icon={<Clock size={18} />} label="Ongoing Exams" value={3} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Teacher Performance</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for teacher performance metrics...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Class Reports</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for class performance charts...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Exam Overview</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for ongoing and upcoming exams...</p>
        </Card>
      </div>
    </div>
  );
}
