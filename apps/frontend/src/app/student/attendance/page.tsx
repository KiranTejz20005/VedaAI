'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  CheckCircle2, Users, CalendarDays, 
  ChevronLeft, ChevronRight, X, Info
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  subject?: string;
}

interface SubjectStat {
  subject: string;
  percentage: number;
}

interface AttendanceStats {
  totalClasses: number;
  presentClasses: number;
  percentage: number;
  diffFromLastMonth?: number;
  subjectAttendance: SubjectStat[];
}

interface LeaveApplication {
  id: string;
  title: string;
  subject: string;
  status: string;
  createdAt: string;
  body?: string;
}

export default function AttendanceDashboardPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ 
    totalClasses: 0, presentClasses: 0, percentage: 0, subjectAttendance: [] 
  });
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    title: '', subject: '', body: '', duration: ''
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Calendar State (Default to current date)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchAttendance = useCallback(async () => {
    try {
      const month = currentMonth.getMonth();
      const year = currentMonth.getFullYear();
      const res = await api.get<{ success: boolean; data: { records: AttendanceRecord[], stats: AttendanceStats } }>(`/attendance/student?month=${month}&year=${year}`);
      setRecords(res.data.data.records);
      setStats(res.data.data.stats);

      const leaveRes = await api.get<{ success: boolean; data: LeaveApplication[] }>('/attendance/student/leave');
      setLeaves(leaveRes.data.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance, currentMonth]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isModalOpen]);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLeave(true);
    try {
      await api.post('/attendance/student/leave', leaveForm);
      toast.success('Leave application submitted successfully');
      setIsModalOpen(false);
      setLeaveForm({ title: '', subject: '', body: '', duration: '' });
      fetchAttendance(); // Refresh recent notes
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit leave');
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Calendar Helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  // Adjust so Monday is 0
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();

  const getDayStatus = (day: number) => {
    // Generate dates based on the currently viewed month
    // Use local time to avoid timezone offset issues making it the previous day
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    
    // Check if it's Today
    const today = new Date();
    if (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    ) {
      return 'TODAY';
    }
    
    // Check if it's a weekend (Sat/Sun)
    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) return 'WEEKEND';

    // Default real record check
    const record = records.find(r => {
      const rDate = new Date(r.date);
      return rDate.getDate() === dateObj.getDate() &&
             rDate.getMonth() === dateObj.getMonth() &&
             rDate.getFullYear() === dateObj.getFullYear();
    });
    
    if (record) return record.status;

    return 'NONE';
  };

  const renderCalendarCell = (day: number, isCurrentMonth: boolean) => {
    const status = isCurrentMonth ? getDayStatus(day) : 'NONE';
    
    let bgColor = 'transparent';
    let textColor = '#94A3B8';
    let dotColor = 'transparent';

    if (isCurrentMonth) {
      textColor = '#1E293B';
      if (status === 'PRESENT') {
        bgColor = '#F0FDF4'; // Light green
        dotColor = '#22C55E';
      } else if (status === 'ABSENT') {
        bgColor = '#FEF2F2'; // Light red
        dotColor = '#EF4444';
      } else if (status === 'LATE') {
        bgColor = '#FEF3C7'; // Light amber/yellow
        dotColor = '#F59E0B';
      } else if (status === 'EXCUSED') {
        bgColor = '#EFF6FF'; // Light blue
        dotColor = '#3B82F6';
      } else if (status === 'WEEKEND') {
        bgColor = '#F1F5F9'; // Light grey
        textColor = '#64748B';
      } else if (status === 'TODAY') {
        bgColor = '#0F172A'; // Black
        textColor = '#FFFFFF';
        dotColor = '#F59E0B'; // Orange dot on top right
      }
    }

    return (
      <div 
        key={`${isCurrentMonth ? 'curr' : 'prev'}-${day}`}
        style={{
          aspectRatio: '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: bgColor,
          borderRadius: 12,
          color: textColor,
          fontWeight: status === 'TODAY' ? 700 : 600,
          fontSize: 14,
          position: 'relative',
          border: status === 'NONE' && isCurrentMonth ? '1px solid #E2E8F0' : 'none',
          boxShadow: status === 'TODAY' ? '0 10px 15px -3px rgba(15, 23, 42, 0.3)' : 'none',
        }}
      >
        {day}
        {status === 'TODAY' && (
          <div style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: dotColor }} />
        )}
        {(status === 'PRESENT' || status === 'ABSENT') && (
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: dotColor, marginTop: 4 }} />
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 'var(--page-pad)', background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Top Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 16 }}>
        
        {/* Monthly Attendance */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 20, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={28} color="#22C55E" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Monthly Attendance
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1E293B', marginTop: 2, marginBottom: 8 }}>
              {stats.percentage ?? 0}%
            </div>
            <div style={{ width: '100%', height: 4, background: '#F1F5F9', borderRadius: 2 }}>
              <div style={{ width: `${stats.percentage ?? 0}%`, height: '100%', background: '#22C55E', borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* Total Classes */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 20, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 20, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={28} color="#3B82F6" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Classes
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1E293B', marginTop: 2, marginBottom: 4 }}>
              {stats.totalClasses ?? 0}
            </div>
            {stats.diffFromLastMonth !== undefined && (
              <div style={{ fontSize: 12, fontWeight: 600, color: stats.diffFromLastMonth >= 0 ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                {stats.diffFromLastMonth >= 0 ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>
                )}
                {stats.diffFromLastMonth > 0 ? '+' : ''}{stats.diffFromLastMonth} from last month
              </div>
            )}
          </div>
        </div>

        {/* Days Present */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 20, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 20, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={28} color="#F97316" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Days Present
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1E293B', marginTop: 2, marginBottom: 4 }}>
              {stats.presentClasses ?? 0}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
              {(stats.totalClasses ?? 0) - (stats.presentClasses ?? 0)} Absences recorded
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        
        {/* Main Calendar Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Attendance Overview</h2>
              <div style={{ fontSize: 14, color: '#64748B', fontWeight: 500, marginTop: 4 }}>
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                style={{ width: 36, height: 36, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#475569' }}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                style={{ width: 36, height: 36, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#475569' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(48px, 64px))', gap: 12, marginBottom: 8, justifyContent: 'center' }}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
              <div key={day} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#475569', paddingBottom: 8 }}>
                {day}
              </div>
            ))}

            {/* Previous Month Empty Slots */}
            {Array.from({ length: startOffset }).map((_, i) => 
              renderCalendarCell(prevMonthDays - startOffset + i + 1, false)
            )}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => 
              renderCalendarCell(i + 1, true)
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 40, borderTop: '1px solid #F1F5F9', paddingTop: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#64748B' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E' }} /> Present
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#EF4444' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} /> Absent
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} /> Late
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#3B82F6' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3B82F6' }} /> Excused
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#64748B' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E2E8F0' }} /> Weekend / Holiday
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#64748B' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0F172A' }} /> Today
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Subject Attendance Card */}
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 20 }}>Subject Attendance</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {stats.subjectAttendance.length > 0 ? stats.subjectAttendance.map((sub, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{sub.subject}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{sub.percentage}%</div>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${sub.percentage}%`, height: '100%', background: '#0F172A', borderRadius: 3 }} />
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>
                  No classes attended this month.
                </div>
              )}
            </div>
          </div>

          {/* Recent Notes Card */}
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 16 }}>Recent Notes</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {leaves.length > 0 ? leaves.map((leave, i) => (
                <div key={i} style={{ background: '#F8FAFC', borderRadius: 16, padding: 16, display: 'flex', gap: 12 }}>
                  <Info size={20} color="#3B82F6" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{leave.title}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2, marginBottom: 8 }}>
                      Subject: {leave.subject}<br/>{leave.body}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Status: {leave.status}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>
                  No recent notes or leave applications.
                </div>
              )}

              <button 
                onClick={() => setIsModalOpen(true)}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '14px',
                  borderRadius: 16,
                  border: '2px dashed #CBD5E1',
                  background: 'transparent',
                  color: '#475569',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.color = '#1E293B'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#475569'; }}
              >
                Submit Leave Application
              </button>

            </div>
          </div>

        </div>
      </div>

      {/* Leave Application Modal with Background Blocking */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setIsModalOpen(false)} // Optional: close on backdrop click, but we can disable if strict
            >
              {/* Modal Content */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                style={{
                  background: '#ffffff',
                  width: '100%',
                  maxWidth: 500,
                  borderRadius: 24,
                  padding: 32,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  position: 'relative',
                  pointerEvents: 'auto'
                }}
              >
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    position: 'absolute', top: 24, right: 24,
                    width: 32, height: 32, borderRadius: 16,
                    background: '#F1F5F9', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#475569'
                  }}
                >
                  <X size={16} />
                </button>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                  Submit Leave Application
                </h2>
                <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
                  Fill in the details below to request a leave of absence.
                </p>

                <form onSubmit={handleSubmitLeave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
                      Application Title
                    </label>
                    <input 
                      type="text"
                      required
                      value={leaveForm.title}
                      onChange={e => setLeaveForm({...leaveForm, title: e.target.value})}
                      placeholder="e.g., Medical Leave"
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        border: '1px solid #E2E8F0', fontSize: 14, outline: 'none'
                      }}
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
                        Subject / Category
                      </label>
                      <input 
                        type="text"
                        required
                        value={leaveForm.subject}
                        onChange={e => setLeaveForm({...leaveForm, subject: e.target.value})}
                        placeholder="e.g., General Absence"
                        style={{
                          width: '100%', padding: '12px 16px', borderRadius: 12,
                          border: '1px solid #E2E8F0', fontSize: 14, outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
                        Duration
                      </label>
                      <input 
                        type="text"
                        required
                        value={leaveForm.duration}
                        onChange={e => setLeaveForm({...leaveForm, duration: e.target.value})}
                        placeholder="e.g., 2 Days (Oct 14-15)"
                        style={{
                          width: '100%', padding: '12px 16px', borderRadius: 12,
                          border: '1px solid #E2E8F0', fontSize: 14, outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
                      Reason for Leave
                    </label>
                    <textarea 
                      required
                      value={leaveForm.body}
                      onChange={e => setLeaveForm({...leaveForm, body: e.target.value})}
                      placeholder="Please explain the reason for your leave application in detail..."
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        border: '1px solid #E2E8F0', fontSize: 14, outline: 'none',
                        minHeight: 100, resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0',
                        background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submittingLeave}
                      style={{
                        flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                        background: '#0F172A', color: '#ffffff', fontWeight: 600, cursor: 'pointer',
                        opacity: submittingLeave ? 0.7 : 1
                      }}
                    >
                      {submittingLeave ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>

              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
