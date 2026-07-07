'use client';

import { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Check, X, Calendar as CalendarIcon, Users, Clock, HelpCircle, Lock } from 'lucide-react';
import { useAttendance, AttendanceStatus } from '@/hooks/useAttendance';

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('Computer Science 101');
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    students,
    loading,
    isLocked,
    setStatus,
    setAllStatus,
    saveAttendance
  } = useAttendance(date);

  const handleSaveClick = () => {
    if (isLocked) return;
    
    // Check if any students are left unmarked
    const unrecorded = students.filter(s => s.status === 'NONE').length;
    if (unrecorded > 0) {
      saveAttendance(subject); // This will trigger the toast error inside the hook
      return;
    }
    
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    await saveAttendance(subject);
  };

  const presentCount = students.filter(s => s.status === 'PRESENT').length;
  const absentCount = students.filter(s => s.status === 'ABSENT').length;
  const lateCount = students.filter(s => s.status === 'LATE').length;
  const excusedCount = students.filter(s => s.status === 'EXCUSED').length;
  const unrecordedCount = students.filter(s => s.status === 'NONE').length;
  const totalCount = students.length;

  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount + excusedCount) / totalCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
      <PageHeader
        title="Class Attendance"
        subtitle="Record and manage daily or subject-specific attendance."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding="20px">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 16 }}>Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Date</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                  <CalendarIcon size={16} color="var(--text-muted)" />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Class / Subject</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                  <Users size={16} color="var(--text-muted)" />
                  <select value={subject} onChange={e => setSubject(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)' }}>
                    <option value="Computer Science 101">Computer Science 101</option>
                    <option value="Advanced Mathematics">Advanced Mathematics</option>
                    <option value="Physics II">Physics II</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
          
          <Card padding="20px">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 16 }}>Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Students:</span>
                <span style={{ fontWeight: 600 }}>{totalCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Present:</span>
                <span style={{ fontWeight: 600, color: '#10B981' }}>{presentCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Absent:</span>
                <span style={{ fontWeight: 600, color: '#EF4444' }}>{absentCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Late:</span>
                <span style={{ fontWeight: 600, color: '#F59E0B' }}>{lateCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Excused:</span>
                <span style={{ fontWeight: 600, color: '#3B82F6' }}>{excusedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Unrecorded:</span>
                <span style={{ fontWeight: 600, color: '#6B7280' }}>{unrecordedCount}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Attendance Rate:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{attendanceRate}%</span>
              </div>
            </div>
          </Card>

          {isLocked && (
            <Card padding="20px" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#B91C1C' }}>
                <Lock size={20} />
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, lineHeight: 1.4 }}>
                  Attendance for this date has been finalized and can no longer be modified.
                </div>
              </div>
            </Card>
          )}
        </div>

        <Card padding="24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Student List</h3>
            <div style={{ display: 'flex', gap: 12, opacity: isLocked ? 0.5 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
              <Button variant="outline" size="sm" onClick={() => setAllStatus('PRESENT')}>Mark All Present</Button>
              <Button variant="outline" size="sm" onClick={() => setAllStatus('ABSENT')}>Mark All Absent</Button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               {[1,2,3,4,5].map(i => (
                 <div key={i} style={{ height: 64, background: 'var(--bg-muted)', borderRadius: 8, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
               ))}
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
               No students assigned to this class.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {students.map((student) => (
                <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-muted)', borderRadius: 8, opacity: isLocked ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-light)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{student.name}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{student.rollNo}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, opacity: isLocked ? 0.8 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
                    <StatusButton 
                      status="PRESENT" 
                      currentStatus={student.status} 
                      onClick={() => setStatus(student.id, 'PRESENT')}
                      icon={<Check size={16} />}
                      label="Present"
                      activeColor="#10B981"
                    />
                    <StatusButton 
                      status="ABSENT" 
                      currentStatus={student.status} 
                      onClick={() => setStatus(student.id, 'ABSENT')}
                      icon={<X size={16} />}
                      label="Absent"
                      activeColor="#EF4444"
                    />
                    <StatusButton 
                      status="LATE" 
                      currentStatus={student.status} 
                      onClick={() => setStatus(student.id, 'LATE')}
                      icon={<Clock size={16} />}
                      label="Late"
                      activeColor="#F59E0B"
                    />
                    <StatusButton 
                      status="EXCUSED" 
                      currentStatus={student.status} 
                      onClick={() => setStatus(student.id, 'EXCUSED')}
                      icon={<HelpCircle size={16} />}
                      label="Excused"
                      activeColor="#3B82F6"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="primary" onClick={handleSaveClick} disabled={loading || isLocked} style={{ padding: '0 32px' }}>
              Save Attendance
            </Button>
          </div>
        </Card>
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 16, maxWidth: 400, width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Confirm Attendance</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Are you sure you want to submit attendance for {date}? You will be able to edit this until the end of the day.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="primary" onClick={confirmSave}>Submit Attendance</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusButton({ 
  status, 
  currentStatus, 
  onClick, 
  icon, 
  label, 
  activeColor 
}: { 
  status: AttendanceStatus, 
  currentStatus: AttendanceStatus, 
  onClick: () => void,
  icon: React.ReactNode,
  label: string,
  activeColor: string
}) {
  const isActive = currentStatus === status;
  return (
    <button
      onClick={onClick}
      style={{ 
        padding: '8px 12px', borderRadius: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
        background: isActive ? activeColor : 'white',
        color: isActive ? 'white' : 'var(--text-secondary)',
        boxShadow: isActive ? `0 4px 12px ${activeColor}33` : '0 2px 4px rgba(0,0,0,0.05)',
        fontSize: 'var(--text-xs)'
      }}
    >
      {icon} {label}
    </button>
  );
}
