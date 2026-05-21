'use client';

import { Users, Plus, Search, BookOpen, Clock, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_GROUPS = [
  { id: '1', name: 'Class 10-A', subject: 'Physics', students: 34, assignments: 8, color: '#EDE9FE', iconColor: '#7C3AED' },
  { id: '2', name: 'Class 10-B', subject: 'Chemistry', students: 31, assignments: 5, color: '#D1FAE5', iconColor: '#059669' },
  { id: '3', name: 'Class 11-A', subject: 'Mathematics', students: 28, assignments: 12, color: '#DBEAFE', iconColor: '#2563EB' },
  { id: '4', name: 'Class 11-B', subject: 'Biology', students: 30, assignments: 3, color: '#FEF3C7', iconColor: '#D97706' },
  { id: '5', name: 'Class 12-A', subject: 'Computer Science', students: 22, assignments: 7, color: '#FCE7F3', iconColor: '#DB2777' },
  { id: '6', name: 'Class 12-B', subject: 'English', students: 35, assignments: 4, color: '#FEF9C3', iconColor: '#CA8A04' },
];

export default function GroupsPage() {
  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="status-dot" aria-hidden="true" />
              <h1 className="page-title">My Groups</h1>
            </div>
            <p className="page-subtitle">Manage your classes and student groups.</p>
          </div>
          <button className="btn btn-dark">
            <Plus size={15} />
            Create Group
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-wrap" style={{ marginBottom: 24, maxWidth: 400 }}>
        <Search size={15} className="search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search groups…"
          className="input search-input"
          aria-label="Search groups"
        />
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Groups', value: 6, color: '#6366F1' },
          { label: 'Total Students', value: 180, color: '#10B981' },
          { label: 'Active Assignments', value: 39, color: '#F59E0B' },
          { label: 'Avg. Class Size', value: 30, color: '#E8531D' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Groups grid */}
      <div className="assignment-grid">
        {MOCK_GROUPS.map((group, i) => (
          <motion.div
            key={group.id}
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ cursor: 'pointer' }}
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
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{group.subject}</div>
                </div>
              </div>
              <button className="menu-btn" aria-label="Group options">
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
    </>
  );
}
