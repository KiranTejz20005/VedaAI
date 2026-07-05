import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NONE';

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  status: AttendanceStatus;
}

export function useAttendance(date: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      
      // Determine if the selected date is in the past (locked)
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setIsLocked(selectedDate < today);

      const [studentsRes, attendanceRes] = await Promise.all([
        api.get('/teacher/students'),
        api.get(`/teacher/attendance?date=${date}`)
      ]);

      if (studentsRes.data?.success) {
        const studentList = studentsRes.data.data;
        const records = attendanceRes.data?.data || [];

        const merged = studentList.map((s: Omit<Student, 'status'>) => {
          const existingRecord = records.find((r: any) => r.studentId === s.id);
          return {
            ...s,
            status: existingRecord ? existingRecord.status : 'NONE'
          };
        });

        setStudents(merged);
      }
    } catch (err) {
      toast.error('Failed to load data for the selected date');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const setStatus = (id: string, status: AttendanceStatus) => {
    if (isLocked) {
      toast.error('Attendance for this date is locked and cannot be modified.');
      return;
    }
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    if (isLocked) {
      toast.error('Attendance for this date is locked and cannot be modified.');
      return;
    }
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const saveAttendance = async (subject: string) => {
    if (isLocked) {
      toast.error('Attendance for this date is locked and cannot be modified.');
      return false;
    }

    const unrecorded = students.filter(s => s.status === 'NONE').length;
    if (unrecorded > 0) {
      toast.error(`Please record attendance for all students (${unrecorded} remaining).`);
      return false;
    }
    
    try {
      await api.post('/teacher/attendance', {
        date,
        subject,
        records: students.map(s => ({
          studentId: s.id,
          status: s.status
        }))
      });
      toast.success('Attendance saved successfully');
      return true;
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Attendance for this date has been finalized and can no longer be modified.');
        setIsLocked(true);
      } else {
        toast.error('Failed to save attendance');
      }
      return false;
    }
  };

  return {
    students,
    loading,
    isLocked,
    setStatus,
    setAllStatus,
    saveAttendance,
    refresh: fetchAttendance
  };
}
