'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Users, BookOpen, Plus, MoreVertical } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Group {
  id: string;
  name: string;
  subject: string;
  students: number;
  assignments: number;
  color: string;
  iconColor: string;
}

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get<{ success: boolean; data: Group[] }>('/groups');
        setGroups(res.data.data || []);
      } catch (err: any) {
        toast.error('Failed to load groups');
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader 
          title="My Groups" 
          subtitle="Manage your student groups, assign work, and track overall progress."
        />
        
        <button style={{ 
          display: 'flex', alignItems: 'center', gap: 8, 
          background: 'var(--brand)', color: 'white', 
          border: 'none', padding: '10px 20px', borderRadius: '12px',
          fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.2)'
        }}>
          <Plus size={18} /> Create Group
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>Loading groups...</div>
        ) : groups.length === 0 ? (
          <Card padding="48px" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.2, color: 'var(--text-primary)' }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>No Groups Yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Create your first group to start assigning work and managing students.</p>
            <button style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 8, 
              background: 'var(--brand)', color: 'white', 
              border: 'none', padding: '10px 24px', borderRadius: '12px',
              fontWeight: 600, cursor: 'pointer'
            }}>
              <Plus size={18} /> Create First Group
            </button>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.id} padding="24px" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 12, 
                  background: group.color || '#F3F4F6', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <Users size={24} color={group.iconColor || '#6B7280'} />
                </div>
                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)' }}>
                  <MoreVertical size={20} />
                </button>
              </div>
              
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                {group.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={14} /> {group.subject}
              </p>
              
              <div style={{ display: 'flex', gap: 16, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Students</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{group.students}</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assignments</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{group.assignments || 0}</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
