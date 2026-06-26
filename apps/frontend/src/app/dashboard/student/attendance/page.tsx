'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Calendar, BookOpen, Loader2 } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  topics: string[];
  class: {
    grade: string;
    section: string;
  };
}

interface AttendanceStats {
  totalClasses: number;
  presentClasses: number;
  percentage: number;
}

export default function AttendanceTimelinePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ totalClasses: 0, presentClasses: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: { records: AttendanceRecord[], stats: AttendanceStats } }>('/attendance/student');
      setRecords(res.data.data.records);
      setStats(res.data.data.stats);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} color="var(--brand)" className="animate-spin" style={{ marginBottom: 16 }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      {/* Premium Header */}
      <div style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #F97316 0%, #E8531D 50%, #C2410C 100%)',
        padding: '32px',
        marginBottom: 32,
        boxShadow: '0 20px 40px -15px rgba(49, 46, 129, 0.4)'
      }}>
        {/* Abstract background blobs */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-5%', width: '40%', height: '150%',
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', marginBottom: 8, letterSpacing: '-0.02em' }}>
              My Attendance
            </h1>
            <p style={{ fontSize: 15, color: '#C7D2FE', maxWidth: 400, lineHeight: 1.5 }}>
              Track your daily class attendance and overall participation.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Overall
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>
                {stats.percentage}%
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Classes
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>
                {stats.presentClasses} / {stats.totalClasses}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Card Layout for Attendance Records */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} color="var(--brand)" /> Recent Classes
        </h2>
        
        {records.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '64px 24px', background: '#F8FAFC' }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <BookOpen size={24} color="#9CA3AF" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#475569', marginBottom: 8 }}>No Records Yet</h3>
            <p style={{ color: '#64748B' }}>Your teachers haven't recorded any attendance for you yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {records.map((record, index) => (
              <motion.div 
                key={record.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card"
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  position: 'relative',
                  overflow: 'hidden',
                  border: `1px solid ${record.status === 'PRESENT' ? '#D1FAE5' : '#FEE2E2'}`,
                  background: '#ffffff'
                }}
              >
                {/* Status Indicator Bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
                  background: record.status === 'PRESENT' ? '#10B981' : '#EF4444'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>
                      Class {record.class?.grade} - {record.class?.section}
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    background: record.status === 'PRESENT' ? '#ECFDF5' : '#FEF2F2',
                    color: record.status === 'PRESENT' ? '#059669' : '#DC2626'
                  }}>
                    {record.status === 'PRESENT' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {record.status === 'PRESENT' ? 'Present' : 'Absent'}
                  </div>
                </div>

                {record.topics && record.topics.length > 0 && (
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                      Topics Covered
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {record.topics.map((topic, i) => (
                        <span key={i} style={{ 
                          background: '#F8FAFC', 
                          padding: '4px 10px', 
                          borderRadius: 6, 
                          fontSize: 12, 
                          fontWeight: 500, 
                          color: '#475569',
                          border: '1px solid #E2E8F0'
                        }}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
