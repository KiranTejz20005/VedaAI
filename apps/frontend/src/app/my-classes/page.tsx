'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Calendar, Clock, BookOpen, AlertCircle, Users, ArrowRight } from 'lucide-react';

interface ClassSchedule {
  id: string;
  subject: string;
  grade: string;
  section: string;
  startTime: string;
  endTime: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'SUBSTITUTED';
  substituteTeacher?: string;
  room: string;
  studentCount: number;
}

export default function MyClassesPage() {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking the timetable data for now
    const mockData: ClassSchedule[] = [
      { id: '1', subject: 'Mathematics', grade: '10', section: 'A', startTime: '09:00 AM', endTime: '09:45 AM', status: 'COMPLETED', room: 'Room 101', studentCount: 32 },
      { id: '2', subject: 'Physics', grade: '11', section: 'B', startTime: '10:00 AM', endTime: '10:45 AM', status: 'ONGOING', room: 'Lab 3', studentCount: 28 },
      { id: '3', subject: 'Chemistry', grade: '12', section: 'C', startTime: '11:15 AM', endTime: '12:00 PM', status: 'UPCOMING', room: 'Lab 1', studentCount: 30 },
      { id: '4', subject: 'English (Substitution)', grade: '9', section: 'D', startTime: '01:00 PM', endTime: '01:45 PM', status: 'SUBSTITUTED', substituteTeacher: 'Mr. John Doe', room: 'Room 205', studentCount: 25 },
    ];
    
    setTimeout(() => {
      setClasses(mockData);
      setLoading(false);
    }, 800);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONGOING': return 'var(--brand)';
      case 'COMPLETED': return '#10b981';
      case 'SUBSTITUTED': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <PageHeader 
        title="My Classes & Timetable" 
        subtitle="View your daily schedule, active classes, and substitutions."
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 8 }}>
        <Calendar size={18} />
        <span style={{ fontWeight: 600 }}>Today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading schedule...</div>
        ) : classes.length === 0 ? (
          <Card padding="32px">
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3>No classes scheduled for today</h3>
            </div>
          </Card>
        ) : (
          classes.map((cls) => (
            <Card key={cls.id} padding="24px" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, 
                backgroundColor: getStatusColor(cls.status) 
              }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {cls.subject}
                    </h3>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      backgroundColor: `${getStatusColor(cls.status)}20`,
                      color: getStatusColor(cls.status)
                    }}>
                      {cls.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-secondary)', fontSize: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={16} /> Grade {cls.grade} - Section {cls.section} ({cls.studentCount} Students)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={16} /> {cls.room}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    <Clock size={16} color="var(--brand)" />
                    {cls.startTime} - {cls.endTime}
                  </div>
                  
                  {cls.status === 'SUBSTITUTED' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f59e0b', justifyContent: 'flex-end' }}>
                      <AlertCircle size={14} /> Taken over by: {cls.substituteTeacher}
                    </div>
                  )}
                </div>
              </div>

              {cls.status === 'ONGOING' && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <button style={{ 
                    padding: '8px 16px', background: 'var(--brand)', color: 'white', borderRadius: 8, 
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' 
                  }}>
                    Enter Classroom <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
