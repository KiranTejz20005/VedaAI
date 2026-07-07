'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Users, Plus, Search, Settings, Trash2 } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '40px 32px 80px', width: '100%', maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader 
          title="Group Management" 
          subtitle="Manage your student groups, assign work, and track overall progress."
        />
        
        <button 
          onClick={() => router.push('/teacher/groups/create')}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 24 }}>
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
                onClick={() => router.push('/teacher/groups/create')}
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
            <Card key={group.id} padding="24px" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 14, 
                  background: group.color || '#F3F4F6', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <Users size={22} color={group.iconColor || '#6B7280'} />
                </div>
                
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {group.subject || 'GENERAL'}
                  </span>
                  <button 
                    onClick={() => handleDelete(group.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--error)', display: 'flex', alignItems: 'center' }}
                    title="Delete Group"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ marginTop: 16, flex: 1 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{group.name}</h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 62 }}>
                  {group.description || 'No description added yet.'}
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span>{group.students} Members</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => router.push(`/teacher/groups/${group.id}/edit`)}
                    style={{ height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s' }}
                  >
                    <Settings size={14} /> Manage
                  </button>
                  <button
                    onClick={() => router.push(`/teacher/groups/${group.id}/discussion`)}
                    style={{ height: 36, borderRadius: 10, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '0 18px', transition: 'all .15s' }}
                  >
                    Open Chat
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
