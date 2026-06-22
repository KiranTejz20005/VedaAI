'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Users, UserCheck, UserX, FileText, UploadCloud, Percent, ClipboardList } from 'lucide-react';

export default function TeacherDashboard() {
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
        <MetricCard icon={<Users size={18} />} label="Total Students" value={150} />
        <MetricCard icon={<UserCheck size={18} />} label="Present Today" value={142} />
        <MetricCard icon={<UserX size={18} />} label="Absent" value={8} />
        <MetricCard icon={<FileText size={18} />} label="Tests Conducted" value={12} />
        <MetricCard icon={<UploadCloud size={18} />} label="Assignments Created" value={20} />
        <MetricCard icon={<Percent size={18} />} label="Average Class Score" value="76%" />
        <MetricCard icon={<ClipboardList size={18} />} label="Pending Evaluations" value={45} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Recent Test Statistics</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for test performance metrics...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Student Performance Table</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for student leaderboard/details...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Create Test | Create Assignment | Upload Material</p>
        </Card>
      </div>
    </div>
  );
}
