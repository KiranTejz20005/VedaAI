'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Clock, FileText, User } from 'lucide-react';
import Image from 'next/image';

interface LeaveApplication {
  id: string;
  title: string;
  subject: string;
  body: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  duration: string;
  createdAt: string;
  student: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export default function TeacherLeaveRequestsPage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const res = await api.get<{ success: boolean; data: LeaveApplication[] }>('/attendance/teacher/leave');
      setLeaves(res.data.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/attendance/teacher/leave/${id}/status`, { status: newStatus });
      toast.success(`Leave request ${newStatus.toLowerCase()}`);
      fetchLeaves();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update leave request');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
        <p style={{ color: '#64748B', fontWeight: 500 }}>Loading requests...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Leave Requests</h1>
          <p style={{ color: '#64748B' }}>Review and manage student leave applications.</p>
        </div>

        {leaves.length === 0 ? (
          <div style={{ background: '#FFFFFF', padding: 48, borderRadius: 24, textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <FileText size={48} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>No pending requests</h3>
            <p style={{ color: '#64748B' }}>You're all caught up! There are no leave applications to review right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {leaves.map((leave, index) => (
              <motion.div 
                key={leave.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 24,
                  padding: 24,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {leave.student.avatarUrl ? (
                        <Image src={leave.student.avatarUrl} alt={leave.student.name} width={48} height={48} style={{ objectFit: 'cover' }} />
                      ) : (
                        <User size={24} color="#94A3B8" />
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{leave.student.name}</h3>
                      <p style={{ fontSize: 13, color: '#64748B' }}>{leave.student.email}</p>
                    </div>
                  </div>
                  <div>
                    {leave.status === 'PENDING' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#FEF3C7', color: '#D97706', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                        <Clock size={14} /> Pending
                      </span>
                    )}
                    {leave.status === 'APPROVED' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#DCFCE7', color: '#16A34A', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                        <CheckCircle2 size={14} /> Approved
                      </span>
                    )}
                    {leave.status === 'REJECTED' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#FEE2E2', color: '#DC2626', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                        <XCircle size={14} /> Rejected
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding: '16px 0', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                    <div>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Title</span>
                      <span style={{ fontSize: 14, color: '#1E293B', fontWeight: 600 }}>{leave.title}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Category</span>
                      <span style={{ fontSize: 14, color: '#1E293B', fontWeight: 600 }}>{leave.subject}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Duration</span>
                      <span style={{ fontSize: 14, color: '#1E293B', fontWeight: 600 }}>{leave.duration}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Reason</span>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{leave.body}</p>
                  </div>
                </div>

                {leave.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleUpdateStatus(leave.id, 'REJECTED')}
                      style={{
                        padding: '10px 20px', borderRadius: 12, background: '#ffffff', color: '#DC2626',
                        border: '1px solid #FEE2E2', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(leave.id, 'APPROVED')}
                      style={{
                        padding: '10px 20px', borderRadius: 12, background: '#16A34A', color: '#ffffff',
                        border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
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
