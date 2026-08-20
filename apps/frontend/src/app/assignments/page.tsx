'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FileText, Search, Clock, ChevronRight, PlayCircle, Loader2, Sparkles, BookOpen,
  Filter, MoreVertical, Zap, Microscope, Calculator, Code
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Assignment } from '@/types/assignment.types';

// Icons based on subject
const getSubjectIcon = (subject: string) => {
  const s = subject.toLowerCase();
  if (s.includes('physic') || s.includes('electric')) return <Zap size={20} color="#374151" />;
  if (s.includes('bio') || s.includes('chem')) return <Microscope size={20} color="#374151" />;
  if (s.includes('math') || s.includes('calc')) return <Calculator size={20} color="#374151" />;
  if (s.includes('code') || s.includes('comp')) return <Code size={20} color="#374151" />;
  return <BookOpen size={20} color="#374151" />;
};

function StudentView({ assignments, loading, error, fetchAssignments }: any) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'To Do' | 'In Progress' | 'Submitted'>('To Do');
  const router = useRouter();

  const filtered = assignments.filter((a: any) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                          a.subject.toLowerCase().includes(search.toLowerCase());
    
    const cat = a.dashboardCategory;
    let matchesTab = false;
    if (activeTab === 'To Do') {
      matchesTab = cat === 'UPCOMING' || cat === 'MISSED' || cat === undefined; // fallback
    } else if (activeTab === 'In Progress') {
      matchesTab = cat === 'LIVE NOW';
    } else if (activeTab === 'Submitted') {
      matchesTab = cat === 'COMPLETED';
    }

    // fallback for old api that doesnt return dashboardCategory
    if (!cat) {
       const status = a.status || a.attemptStatus || 'AVAILABLE';
       if (activeTab === 'To Do' && status === 'AVAILABLE') matchesTab = true;
       if (activeTab === 'In Progress' && (status === 'STARTED' || status === 'IN_PROGRESS')) matchesTab = true;
       if (activeTab === 'Submitted' && ['SUBMITTED', 'GRADED', 'RESULT_PUBLISHED', 'UNDER_REVIEW'].includes(status)) matchesTab = true;
    }

    return matchesSearch && matchesTab;
  });

  return (
    <div style={{ padding: '24px', background: '#F8F9FA', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: '#22C55E', borderRadius: '50%' }} />
          Assignments
        </h1>
        <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>
          Manage and track your educational progress through various modules.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ 
        background: '#fff', borderRadius: '9999px', padding: '8px', 
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', maxWidth: '600px'
      }}>
        <button style={{ 
          background: 'transparent', color: '#6B7280', padding: '8px 16px', borderRadius: '9999px', 
          display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer',
          fontWeight: 500, fontSize: '14px', borderRight: '1px solid #E5E7EB'
        }}>
          <Filter size={16} /> Filter By
        </button>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
          <Search size={18} color="#9CA3AF" />
          <input
            type="text"
            placeholder="Search Assignment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#111827' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['To Do', 'In Progress', 'Submitted'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              background: activeTab === tab ? '#000' : '#F3F4F6',
              color: activeTab === tab ? '#fff' : '#6B7280',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <Loader2 size={32} color="#000" className="animate-spin" />
        </div>
      ) : error ? (
        <div style={{ padding: 20, background: '#fee2e2', borderRadius: 12, color: '#991b1b' }}>{error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', color: '#6B7280' }}>
          No assignments found in this tab.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filtered.map((a: any, idx: number) => {
            const assignDateStr = new Date(a.createdAt || a.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
            const dueDateStr = new Date(a.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                key={a.id}
                onClick={() => router.push(`/assignments/${a.id}`)}
                style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#F3F4F6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getSubjectIcon(a.subject)}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* Handle menu */ }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 12px 0' }}>{a.title}</h3>
                
                <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: 1.5, margin: '0 0 24px 0', flex: 1 }}>
                  {a.description || a.subject || 'Detailed analysis and fundamental principles.'}
                </p>

                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Assigned on</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{assignDateStr}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Due</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626' }}>{dueDateStr}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeacherView({ assignments, loading, error, search, setSearch }: any) {
  const filtered = assignments.filter((a: any) => {
    return a.title.toLowerCase().includes(search.toLowerCase()) ||
           a.subject.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      {/* Premium Header */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #F97316 0%, #E8531D 50%, #C2410C 100%)',
        padding: '16px 24px',
        marginBottom: 20,
        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
        borderRadius: 16
      }}>
        {/* Abstract background blobs */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-5%', width: '40%', height: '150%',
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '10%', width: '30%', height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.95)', fontSize: 12, fontWeight: 700 }}>
              <Sparkles size={12} /> My Assignments
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
              Assignment Management
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', margin: 0, opacity: 0.9 }}>
            Create and track assignments for your classes.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: '#ffffff',
              fontSize: 15,
              fontWeight: 500,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
        <Link
          href="/assignments/create"
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} /> Create Assignment
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
          <Loader2 size={32} color="var(--brand)" className="animate-spin" style={{ marginBottom: 16 }} />
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px', background: '#FEF2F2', borderColor: '#FECACA' }}>
          <p style={{ color: '#DC2626' }}>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 16 }}>
          <BookOpen size={24} color="#9CA3AF" />
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '12px 0 16px' }}>No assignments found.</p>
          <Link href="/assignments/create" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} /> Create Assignment
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filtered.map((assignment: any, idx: number) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              key={assignment.id}
            >
              <Link href={`/assignments/${assignment.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div 
                  className="card"
                  style={{
                    padding: 24,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: '#EEF2FF',
                        color: '#4338CA',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {assignment.subject}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 13, fontWeight: 700, background: '#F3F4F6', padding: '4px 8px', borderRadius: 8 }}>
                        {assignment.status}
                      </div>
                    </div>
                    
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>
                      {assignment.title}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                        <Clock size={16} color="#6366F1" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{assignment.duration} mins</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                        <FileText size={16} color="#F59E0B" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{assignment.totalMarks} Marks</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--brand)', fontWeight: 700, fontSize: 14 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PlayCircle size={18} /> View Details
                    </span>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssignmentsPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isTeacher = user?.role === 'TEACHER' || user?.role === 'FACULTY' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
      const endpoint = isTeacher ? '/assignments' : '/student/assessments';
      const res = await api.get<{ success: boolean; data: any[] }>(endpoint);
      
      const mappedAssignments = res.data.data?.map(a => ({
        ...a,
        status: isTeacher ? a.status : (a.attemptStatus || 'AVAILABLE'),
      })) || [];
      
      setAssignments(mappedAssignments as unknown as Assignment[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'FACULTY' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (isTeacher) {
    return <TeacherView assignments={assignments} loading={loading} error={error} search={search} setSearch={setSearch} />;
  }

  return <StudentView assignments={assignments} loading={loading} error={error} fetchAssignments={fetchAssignments} />;
}
