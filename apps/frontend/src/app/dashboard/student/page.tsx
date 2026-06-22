'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Target, CheckCircle, XCircle, Percent, Calendar, BookOpen, GraduationCap, Trophy } from 'lucide-react';

export default function StudentDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Student Dashboard"
        subtitle="Your learning performance overview."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<Target size={18} />} label="Questions Attempted" value={120} />
        <MetricCard icon={<CheckCircle size={18} />} label="Questions Correct" value={95} />
        <MetricCard icon={<XCircle size={18} />} label="Questions Incorrect" value={25} />
        <MetricCard icon={<Percent size={18} />} label="Average Score" value="79%" />
        <MetricCard icon={<Calendar size={18} />} label="Attendance" value="92%" />
        <MetricCard icon={<BookOpen size={18} />} label="Assignments Completed" value={14} />
        <MetricCard icon={<GraduationCap size={18} />} label="Tests Completed" value={8} />
        <MetricCard icon={<Trophy size={18} />} label="Current Rank" value="#5" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Recent Tests</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for recent test results...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Upcoming Tests</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for upcoming schedules...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Assignments Overview</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for pending/submitted...</p>
        </Card>
      </div>
    </div>
  );
}
