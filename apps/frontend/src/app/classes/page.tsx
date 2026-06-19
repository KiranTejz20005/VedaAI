'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';

interface Class {
  id: string;
  name: string;
  description?: string;
  students: number;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/classes');
        if (res.data?.success) {
          setClasses(res.data.data || []);
        } else {
          setClasses([]);
        }
      } catch (err) {
        // Silently fail - no classes endpoint might exist
        setClasses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState lines={4} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="My Classes"
        subtitle="Manage your classes and students."
      />

      {error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />
      ) : classes.length === 0 ? (
        <div style={{
          padding: 24,
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#9CA3AF'
        }}>
          <p>You don't have any classes yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {classes.map((cls) => (
            <div key={cls.id} style={{
              padding: 16,
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{cls.name}</h3>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>{cls.description}</p>
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>{cls.students} students</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
