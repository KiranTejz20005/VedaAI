'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FileText, Search, Clock, Calendar, ChevronRight, PlayCircle, Loader2, Sparkles, BookOpen
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Assignment } from '@/types/assignment.types';

export default function StudentAssignmentsPage() {
  const router = useRouter();
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
  }, [search]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const filtered = assignments.filter(a => {
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
              Your Learning Journey
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', margin: 0, opacity: 0.9 }}>
            Browse and take assignments created by your teachers.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
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
            onFocus={(e) => e.target.style.borderColor = 'var(--brand)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
          <Loader2 size={32} color="var(--brand)" className="animate-spin" style={{ marginBottom: 16 }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading your assignments...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px', background: '#FEF2F2', borderColor: '#FECACA' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>Failed to load</h2>
          <p style={{ color: '#DC2626' }}>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <BookOpen size={24} color="#9CA3AF" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No Assignments Found</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400 }}>
            {search ? "Try adjusting your search criteria." : "You're all caught up! There are no active assignments available for you right now."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filtered.map((assignment, idx) => (
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'var(--brand)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--border)';
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
                      {(() => {
                        const s = (assignment.status || 'DRAFT').toUpperCase();
                        let label = s.replace('_', ' ');
                        let color = '#6B7280';
                        let bg = '#F3F4F6';
                        let pulse = false;

                        if (s === 'PENDING_APPROVAL') { label = 'Under Review'; color = '#F59E0B'; bg = '#FEF3C7'; }
                        else if (s === 'APPROVED') { label = 'Approved'; color = '#10B981'; bg = '#D1FAE5'; }
                        else if (s === 'PUBLISHED' || s === 'ACTIVE') { label = 'Active'; color = '#10B981'; bg = '#D1FAE5'; }
                        else if (s === 'GENERATING') { label = 'Generating'; color = '#6366F1'; bg = '#E0E7FF'; pulse = true; }
                        else if (s === 'FAILED') { label = 'Failed'; color = '#EF4444'; bg = '#FEE2E2'; }
                        else if (s === 'COMPLETED' || s === 'GENERATED' || s === 'DRAFT') { label = 'Draft'; color = '#6B7280'; bg = '#F3F4F6'; }

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color, fontSize: 13, fontWeight: 700, background: bg, padding: '4px 8px', borderRadius: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: 3, background: color, animation: pulse ? 'pulse 2s infinite' : 'none' }} />
                            {label}
                          </div>
                        );
                      })()}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                        <Calendar size={16} color="#EC4899" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Due: {new Date(assignment.dueDate || assignment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--brand)',
                    fontWeight: 700,
                    fontSize: 14
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PlayCircle size={18} /> Take Assignment
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
