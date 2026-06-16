'use client';

import { Users, Plus, Search, BookOpen, MoreVertical, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface Group {
  id: string;
  name: string;
  subject?: string;
  students: number;
  assignments: number;
  color: string;
  iconColor: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiClient.get<{ success: boolean; data: Group[] }>('/groups')
      .then((res) => { if (!cancelled) setGroups(res.data.data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load groups'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = groups.filter((g) =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()) || (g.subject && g.subject.toLowerCase().includes(search.toLowerCase()))
  );

  const totalStudents = groups.reduce((sum, g) => sum + g.students, 0);
  const totalAssignments = groups.reduce((sum, g) => sum + g.assignments, 0);
  const avgSize = groups.length > 0 ? Math.round(totalStudents / groups.length) : 0;

  const handleCreateGroup = async () => {
    try {
      const name = prompt('Enter group name:');
      if (!name) return;
      const res = await apiClient.post<{ success: boolean; data: Group }>('/groups', { name });
      setGroups(prev => [...prev, res.data.data]);
      toast.success('Group created successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  return (
    <div className="dashboard-view">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="status-dot" aria-hidden="true" />
              <h1 className="page-title">My Groups</h1>
            </div>
            <p className="page-subtitle">Manage your classes and student groups.</p>
          </div>
          <button className="btn btn-dark" onClick={handleCreateGroup}>
            <Plus size={15} />
            Create Group
          </button>
        </div>
      </div>

      <div className="search-wrap" style={{ marginBottom: 24, maxWidth: 400 }}>
        <Search size={15} className="search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search groups..."
          className="input search-input"
          aria-label="Search groups"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Groups', value: groups.length, color: '#6366F1' },
          { label: 'Total Students', value: totalStudents, color: '#10B981' },
          { label: 'Active Assignments', value: totalAssignments, color: '#F59E0B' },
          { label: 'Avg. Class Size', value: avgSize, color: '#E8531D' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
          <Loader2 size={18} className="animate-spin" /> Loading groups...
        </div>
      ) : error ? (
        <div style={{ padding: 20, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} /> {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          {search ? 'No groups match your search.' : 'No groups yet. Create your first group!'}
        </div>
      ) : (
        <div className="assignment-grid">
          {filtered.map((group, i) => (
            <motion.div
              key={group.id}
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ cursor: 'pointer' }}
              onClick={() => toast.success(`${group.name} details coming soon`)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: group.color, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Users size={20} color={group.iconColor} />
                  </div>
                  <div>
                    <div className="card-title">{group.name}</div>
                    {group.subject && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{group.subject}</div>}
                  </div>
                </div>
                <button className="menu-btn" aria-label="Group options" onClick={(e) => { e.stopPropagation(); toast.success('Group options coming soon'); }}>
                  <MoreVertical size={15} />
                </button>
              </div>

              <div style={{
                display: 'flex', gap: 16,
                paddingTop: 12, borderTop: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                  <Users size={13} />
                  <span>{group.students} students</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                  <BookOpen size={13} />
                  <span>{group.assignments} assignments</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
