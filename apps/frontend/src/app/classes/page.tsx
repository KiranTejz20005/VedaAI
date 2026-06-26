'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { Card } from '@/design-system/Card';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rollNo?: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/teacher/students');
        if (res.data?.success) {
          setStudents(res.data.data || []);
        } else {
          setStudents([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load students');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState lines={4} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Students Roster"
        subtitle="Manage and view the students enrolled in your organization."
      />

      {error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />
      ) : students.length === 0 ? (
        <div style={{
          padding: 24,
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#9CA3AF'
        }}>
          <p>No students found.</p>
        </div>
      ) : (
        <Card padding="0">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Roll No</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>
                          {student.firstName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{student.firstName} {student.lastName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{student.email}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{student.rollNo || 'N/A'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: 12, background: '#D1FAE5', color: '#059669', fontSize: 12, fontWeight: 600 }}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
