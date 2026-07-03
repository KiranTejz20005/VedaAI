'use client';

import { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { FileText, Clock, CheckCircle2, Users, BookOpen, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface Homework {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  totalStudents: number;
  submitted: number;
  graded: number;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED';
}

const MOCK_HOMEWORK: Homework[] = [
  { id: '1', title: 'Chapter 4: Neural Networks', course: 'Computer Science 101', dueDate: 'Tomorrow', totalStudents: 30, submitted: 25, graded: 20, status: 'ACTIVE' },
  { id: '2', title: 'Midterm Essay Draft', course: 'History 202', dueDate: 'In 3 days', totalStudents: 25, submitted: 5, graded: 0, status: 'ACTIVE' },
  { id: '3', title: 'Calculus Worksheet 2', course: 'Advanced Mathematics', dueDate: 'Last Week', totalStudents: 20, submitted: 20, graded: 20, status: 'COMPLETED' },
];

export default function HomeworkHubPage() {
  const [homeworks] = useState<Homework[]>(MOCK_HOMEWORK);

  const handleBulkGrade = (id: string) => {
    toast.success('Initiating Bulk AI Grading...');
    setTimeout(() => toast.success('5 assignments graded successfully!'), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Homework Management Hub"
          subtitle="Track submissions, late policies, and bulk grading."
        />
        <Button variant="primary">Create Assignment</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {homeworks.map((hw) => (
          <Card key={hw.id} padding="24px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={20} color="var(--brand)" /> {hw.title}
                </h3>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{hw.course} &middot; Due: <span style={{ color: hw.status === 'COMPLETED' ? 'inherit' : '#EF4444', fontWeight: 600 }}>{hw.dueDate}</span></span>
              </div>
              <div style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: 16, fontSize: 'var(--text-xs)', fontWeight: 600, background: hw.status === 'ACTIVE' ? '#DBEAFE' : '#F3F4F6', color: hw.status === 'ACTIVE' ? '#1D4ED8' : '#4B5563' }}>
                {hw.status}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24, padding: '16px', background: 'var(--bg-muted)', borderRadius: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14}/> Total</span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{hw.totalStudents}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={14}/> Submitted</span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{hw.submitted}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14}/> Pending</span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: hw.status === 'ACTIVE' ? '#F59E0B' : 'inherit' }}>{hw.totalStudents - hw.submitted}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14}/> Graded</span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: '#10B981' }}>{hw.graded}/{hw.submitted}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              {hw.submitted > hw.graded && (
                <Button variant="outline" onClick={() => handleBulkGrade(hw.id)}>
                  <Sparkles size={16} style={{ marginRight: 8, color: 'var(--brand)' }} />
                  Bulk AI Grade ({hw.submitted - hw.graded})
                </Button>
              )}
              <Button variant="outline">View Submissions</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
