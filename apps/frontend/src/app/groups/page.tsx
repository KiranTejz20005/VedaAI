'use client';

import { 
  Users, 
  Plus, 
  Search, 
  BookOpen, 
  MoreVertical, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  GraduationCap, 
  Calendar, 
  Trash2, 
  Eye, 
  CheckCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
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

interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  joinedAt: string;
}

interface AssignedPaper {
  id: string;
  title: string;
  subject: string;
  assignedOn: string;
  dueDate: string;
  status: 'completed' | 'generating' | 'draft';
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Custom dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('Computer Science');
  const [creating, setCreating] = useState(false);

  // Card menu dropdown states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tab state in detail view
  const [activeTab, setActiveTab] = useState<'students' | 'assignments'>('students');

  // Close card menu when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

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

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    setCreating(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: Group }>('/groups', { 
        name: newGroupName,
        subject: newGroupSubject 
      });
      setGroups(prev => [...prev, res.data.data]);
      toast.success('Class group created successfully');
      setIsCreateOpen(false);
      setNewGroupName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setGroups(prev => prev.filter(g => g.id !== id));
    toast.success('Class group deleted');
    setActiveMenuId(null);
  };

  // Generate realistic roster list for selected class
  const getMockStudents = (count: number): Student[] => {
    const firstNames = ['Emily', 'Alexander', 'Sophia', 'Daniel', 'Olivia', 'Matthew', 'Ava', 'Ethan', 'Isabella', 'William', 'Charlotte', 'Joseph', 'Mia', 'David'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas'];
    
    return Array.from({ length: count || 15 }).map((_, idx) => {
      const first = firstNames[(idx * 7) % firstNames.length];
      const last = lastNames[(idx * 13) % lastNames.length];
      const rollNum = String(100 + idx + 1);
      return {
        id: `s-${idx}`,
        name: `${first} ${last}`,
        rollNo: `R-${rollNum}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@school.edu`,
        joinedAt: '15/09/2025',
      };
    });
  };

  // Generate realistic mock assignments list for selected class
  const getMockAssignedPapers = (count: number, subject: string): AssignedPaper[] => {
    const topics = ['Fundamentals', 'Midterm Examination', 'Practical Review', 'Final Term Assessment', 'Monthly Test'];
    return Array.from({ length: count || 4 }).map((_, idx) => {
      const topic = topics[idx % topics.length];
      return {
        id: `ap-${idx}`,
        title: `${subject || 'General'} - ${topic}`,
        subject: subject || 'General Science',
        assignedOn: '01/06/2026',
        dueDate: '20/06/2026',
        status: idx === 0 ? 'generating' : idx === 1 ? 'draft' : 'completed',
      };
    });
  };

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      <AnimatePresence mode="wait">
        {!selectedGroup ? (
          // List View
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="desktop-page-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={24} color="var(--brand)" />
                    <h1 className="page-title">My Groups</h1>
                  </div>
                  <p className="page-subtitle">Manage your classes and student groups.</p>
                </div>
                <button className="btn btn-dark btn-pill" onClick={() => setIsCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} />
                  Create Group
                </button>
              </div>
            </div>

            <div className="mobile-page-header">
              <h1 className="mobile-header-title">My Groups</h1>
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

            <div className="search-filter-row search-filter-row-v3" style={{ marginBottom: 24 }}>
              <div className="search-wrap">
                <Search size={15} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  className="input search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
              <div className="empty-state">
                <Users size={40} color="#9CA3AF" />
                <h2 className="empty-title">{search ? 'No groups match your search' : 'No groups yet'}</h2>
                <p className="empty-desc">Create your class groups to organize student rosters and manage homework/exam distributions.</p>
                <div className="empty-state-actions">
                  <button className="btn btn-dark btn-pill" onClick={() => setIsCreateOpen(true)}>Create First Group</button>
                </div>
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
                    style={{ cursor: 'pointer', position: 'relative' }}
                    onClick={() => {
                      setSelectedGroup(group);
                      setActiveTab('students');
                    }}
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
                          <h3 className="card-title" style={{ fontSize: 15 }}>{group.name}</h3>
                          {group.subject && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{group.subject}</div>}
                        </div>
                      </div>
                      
                      {/* Card menu dropdown */}
                      <div ref={activeMenuId === group.id ? menuRef : null} style={{ position: 'relative' }}>
                        <button 
                          className="menu-btn" 
                          aria-label="Group options" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveMenuId(activeMenuId === group.id ? null : group.id);
                          }}
                        >
                          <MoreVertical size={15} />
                        </button>
                        <AnimatePresence>
                          {activeMenuId === group.id && (
                            <motion.div
                              className="dropdown-menu"
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              style={{ right: 0, top: 24, zIndex: 10 }}
                            >
                              <button 
                                type="button" 
                                className="dropdown-item" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setSelectedGroup(group);
                                  setActiveMenuId(null);
                                }}
                              >
                                <Eye size={13} style={{ marginRight: 6 }} /> View Details
                              </button>
                              <div className="dropdown-divider" />
                              <button 
                                type="button" 
                                className="dropdown-item danger" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleDeleteGroup(group.id, group.name);
                                }}
                              >
                                <Trash2 size={13} style={{ marginRight: 6 }} /> Delete Group
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
          </motion.div>
        ) : (
          // Detail View / Drill Down
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* Detail Header */}
            <div>
              <button 
                onClick={() => setSelectedGroup(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: 16,
                  padding: 0
                }}
              >
                <ArrowLeft size={16} /> Back to Groups
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: selectedGroup.color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Users size={24} color={selectedGroup.iconColor} />
                </div>
                <div>
                  <h1 className="page-title" style={{ margin: 0, fontSize: 24 }}>{selectedGroup.name}</h1>
                  <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
                    {selectedGroup.subject || 'General Section'} &middot; {selectedGroup.students} Enrolled Students
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Tab Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 24, fontSize: 14 }}>
              <button
                onClick={() => setActiveTab('students')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '12px 4px',
                  fontWeight: 600,
                  color: activeTab === 'students' ? 'var(--brand)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'students' ? '2px solid var(--brand)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Students Enrolled
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '12px 4px',
                  fontWeight: 600,
                  color: activeTab === 'assignments' ? 'var(--brand)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'assignments' ? '2px solid var(--brand)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Assignments Assigned ({selectedGroup.assignments})
              </button>
            </div>

            {/* Tab content rendering */}
            <div>
              {activeTab === 'students' ? (
                // Students Roster Table
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                          <th style={{ padding: '14px 16px', fontWeight: 600 }}>Roll No.</th>
                          <th style={{ padding: '14px 16px', fontWeight: 600 }}>Student Name</th>
                          <th style={{ padding: '14px 16px', fontWeight: 600 }}>Email Address</th>
                          <th style={{ padding: '14px 16px', fontWeight: 600 }}>Enrollment Date</th>
                          <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getMockStudents(selectedGroup.students).map((student) => (
                          <tr key={student.id} style={{ borderBottom: '1px solid #F3F4F6', fontSize: 14 }}>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{student.rollNo}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</td>
                            <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{student.email}</td>
                            <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{student.joinedAt}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: '#D1FAE5', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={10} /> Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // Assignments List
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {getMockAssignedPapers(selectedGroup.assignments, selectedGroup.subject || '').map((paper) => (
                    <div key={paper.id} className="card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{paper.title}</h4>
                          <div style={{ display: 'flex', gap: 12, marginTop: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> Assigned: {paper.assignedOn}</span>
                            <span>Due: {paper.dueDate}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: paper.status === 'completed' ? '#D1FAE5' : paper.status === 'generating' ? '#E0E7FF' : '#F3F4F6',
                          color: paper.status === 'completed' ? '#059669' : paper.status === 'generating' ? '#4F46E5' : '#6B7280'
                        }}>
                          {paper.status}
                        </span>
                        
                        <button className="btn btn-secondary btn-sm" onClick={() => toast.success('Viewing assignment stats coming soon')}>
                          View Results
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Create Group Dialog Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            {/* Modal Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} 
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="card"
              style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 101, padding: 24, boxShadow: 'var(--shadow-lg)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={20} color="var(--brand)" />
                  Create Class Group
                </h3>
                <button 
                  onClick={() => setIsCreateOpen(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label htmlFor="groupName" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Class / Group Name
                  </label>
                  <input
                    id="groupName"
                    type="text"
                    required
                    placeholder="e.g. Class 10-C or Science Club"
                    className="input"
                    style={{ width: '100%' }}
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="groupSubject" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Primary Subject
                  </label>
                  <select
                    id="groupSubject"
                    className="input"
                    style={{ width: '100%', height: 40, cursor: 'pointer' }}
                    value={newGroupSubject}
                    onChange={(e) => setNewGroupSubject(e.target.value)}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="General">General Science</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-pill" 
                    onClick={() => setIsCreateOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-dark btn-pill"
                    disabled={creating}
                    style={{ minWidth: 100 }}
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
