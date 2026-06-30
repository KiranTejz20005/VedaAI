'use client';

import { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Check, X, Calendar as CalendarIcon, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  rollNo: string;
  status: 'PRESENT' | 'ABSENT' | 'NONE';
}

const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Alice Smith', rollNo: 'CS-001', status: 'NONE' },
  { id: '2', name: 'Bob Johnson', rollNo: 'CS-002', status: 'NONE' },
  { id: '3', name: 'Charlie Williams', rollNo: 'CS-003', status: 'NONE' },
  { id: '4', name: 'Diana Brown', rollNo: 'CS-004', status: 'NONE' },
  { id: '5', name: 'Ethan Davis', rollNo: 'CS-005', status: 'NONE' },
];

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('Computer Science 101');

  const handleStatusChange = (id: string, status: 'PRESENT' | 'ABSENT') => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = () => {
    const unrecorded = students.filter(s => s.status === 'NONE').length;
    if (unrecorded > 0) {
      toast.error(`Please record attendance for all students (${unrecorded} remaining).`);
      return;
    }
    
    // In a real implementation, this would call the API
    toast.success('Attendance recorded successfully!');
  };

  const presentCount = students.filter(s => s.status === 'PRESENT').length;
  const totalCount = students.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Class Attendance"
        subtitle="Record and manage daily or subject-specific attendance."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding="20px">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 16 }}>Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Date</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                  <CalendarIcon size={16} color="var(--text-muted)" />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Class / Subject</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                  <Users size={16} color="var(--text-muted)" />
                  <select value={subject} onChange={e => setSubject(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)' }}>
                    <option value="Computer Science 101">Computer Science 101</option>
                    <option value="Advanced Mathematics">Advanced Mathematics</option>
                    <option value="Physics II">Physics II</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
          
          <Card padding="20px">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 16 }}>Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Students:</span>
                <span style={{ fontWeight: 600 }}>{totalCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Present:</span>
                <span style={{ fontWeight: 600, color: '#10B981' }}>{presentCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Absent:</span>
                <span style={{ fontWeight: 600, color: '#EF4444' }}>{totalCount - presentCount - students.filter(s => s.status === 'NONE').length}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Attendance Rate:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%</span>
              </div>
            </div>
          </Card>
        </div>

        <Card padding="24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Student List</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('PRESENT')}>Mark All Present</Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('ABSENT')}>Mark All Absent</Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {students.map((student) => (
              <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-muted)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-light)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{student.rollNo}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleStatusChange(student.id, 'PRESENT')}
                    style={{ 
                      padding: '8px 16px', borderRadius: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      background: student.status === 'PRESENT' ? '#10B981' : 'white',
                      color: student.status === 'PRESENT' ? 'white' : 'var(--text-secondary)',
                      boxShadow: student.status === 'PRESENT' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Check size={16} /> Present
                  </button>
                  <button
                    onClick={() => handleStatusChange(student.id, 'ABSENT')}
                    style={{ 
                      padding: '8px 16px', borderRadius: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      background: student.status === 'ABSENT' ? '#EF4444' : 'white',
                      color: student.status === 'ABSENT' ? 'white' : 'var(--text-secondary)',
                      boxShadow: student.status === 'ABSENT' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    <X size={16} /> Absent
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="primary" onClick={handleSave} style={{ padding: '0 32px' }}>Save Attendance</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
