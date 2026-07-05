'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Users, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Group {
  id: string;
  name: string;
  description: string;
  subject: string;
  className: string;
  students: number;
  color: string;
  iconColor: string;
}

export default function GroupsListingPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Group[] }>('/groups');
      setGroups(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await api.delete(`/groups/${id}`);
      toast.success('Group deleted successfully');
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete group');
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    (g.className && g.className.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader 
          title="Group Management" 
          subtitle="Manage your student groups, assign work, and track overall progress."
        />
        
        <button 
          onClick={() => router.push('/dashboard/teacher/groups/create')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            background: 'var(--brand)', color: 'white', 
            border: 'none', padding: '10px 20px', borderRadius: '12px',
            fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.2)'
          }}
        >
          <Plus size={18} /> Create Group
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'var(--surface)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
        <Search size={18} color="var(--text-tertiary)" />
        <input 
          type="text" 
          placeholder="Search groups by name or class..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, color: 'var(--text-primary)' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>Loading groups...</div>
        ) : filteredGroups.length === 0 ? (
          <Card padding="48px" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.2, color: 'var(--text-primary)' }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>No Groups Found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              {search ? 'Try adjusting your search criteria.' : 'Create your first group to start managing students.'}
            </p>
            {!search && (
              <button 
                onClick={() => router.push('/dashboard/teacher/groups/create')}
                style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 8, 
                  background: 'var(--brand)', color: 'white', 
                  border: 'none', padding: '10px 24px', borderRadius: '12px',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                <Plus size={18} /> Create First Group
              </button>
            )}
          </Card>
        ) : (
          filteredGroups.map((group) => (
            <Card key={group.id} padding="24px" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 12, 
                  background: group.color || '#F3F4F6', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <Users size={24} color={group.iconColor || '#6B7280'} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => router.push(`/dashboard/teacher/groups/${group.id}/edit`)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)' }}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(group.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--error)' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                {group.name}
              </h3>
              {group.className && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
                  {group.className}
                </p>
              )}
              {group.description && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {group.description}
                </p>
              )}
              
              <div style={{ display: 'flex', gap: 16, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Students</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{group.students}</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
