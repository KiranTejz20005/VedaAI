'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, X, Save, Users, Calendar } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function TeacherAttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  // Using a hardcoded class ID for demonstration since class selection is out of scope
  const DUMMY_CLASS_ID = '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Fetch students directly from teacher endpoint to avoid 403 Forbidden errors
        const res = await api.get<{ success: boolean; data: Student[] }>('/teacher/students');
        const studentList = res.data.data || [];
        setStudents(studentList);
        
        // Initialize all to PRESENT
        const initialMap: Record<string, 'PRESENT' | 'ABSENT'> = {};
        studentList.forEach(s => {
          initialMap[s.id] = 'PRESENT';
        });
        setAttendance(initialMap);
      } catch (err: any) {
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const toggleStatus = (id: string) => {
    setAttendance(prev => ({
      ...prev,
      [id]: prev[id] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
        topics: ['React', 'Next.js'], // Placeholder topic
      }));

      await api.post('/attendance/mark', {
        classId: DUMMY_CLASS_ID,
        date,
        attendance: records,
      });

      toast.success('Attendance saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1E293B' }}>Mark Attendance</h1>
          <p style={{ color: '#64748B' }}>Select a date and mark students present or absent.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9', padding: '8px 16px', borderRadius: 12 }}>
            <Calendar size={18} color="#64748B" />
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, color: '#334155' }}
            />
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, 
              background: 'var(--brand)', color: '#fff', 
              padding: '10px 20px', borderRadius: 12, fontWeight: 600,
              opacity: saving || loading ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : <><Save size={18} /> Save Attendance</>}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>Loading students...</div>
        ) : students.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
            <Users size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            No students found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: 13 }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Student</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, width: 200 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: '#1E293B' }}>
                    {student.firstName} {student.lastName}
                  </td>
                  <td style={{ padding: '16px 24px', color: '#64748B' }}>
                    {student.email}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div 
                      onClick={() => toggleStatus(student.id)}
                      style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, userSelect: 'none',
                        background: attendance[student.id] === 'PRESENT' ? '#ECFDF5' : '#FEF2F2',
                        color: attendance[student.id] === 'PRESENT' ? '#059669' : '#DC2626'
                      }}
                    >
                      {attendance[student.id] === 'PRESENT' ? <Check size={14} /> : <X size={14} />}
                      {attendance[student.id] === 'PRESENT' ? 'PRESENT' : 'ABSENT'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
