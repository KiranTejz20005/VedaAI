'use client';

import { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Megaphone, Users, Clock, Paperclip, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: string;
  date: string;
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: 'Mid-term Exam Schedule', message: 'The mid-term exams will begin next Monday. Please review the syllabus.', audience: 'Computer Science 101', date: new Date().toISOString() },
  { id: '2', title: 'Assignment 3 Deadline Extended', message: 'Due to the server outage, the deadline for Assignment 3 has been extended by 48 hours.', audience: 'All Enrolled Students', date: new Date(Date.now() - 86400000).toISOString() },
];

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('All Enrolled Students');
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in both title and message.');
      return;
    }

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title,
      message,
      audience,
      date: new Date().toISOString()
    };

    setAnnouncements(prev => [newAnnouncement, ...prev]);
    setTitle('');
    setMessage('');
    toast.success('Announcement published successfully!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Class Announcements"
        subtitle="Communicate important updates to your students."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Create Announcement */}
        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={20} color="var(--brand)" /> New Announcement
          </h3>
          <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Audience</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-muted)' }}>
                <Users size={18} color="var(--text-muted)" />
                <select value={audience} onChange={e => setAudience(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                  <option value="All Enrolled Students">All Enrolled Students</option>
                  <option value="Computer Science 101">Computer Science 101</option>
                  <option value="Advanced Mathematics">Advanced Mathematics</option>
                  <option value="Physics II">Physics II</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Title</label>
              <input 
                type="text" 
                placeholder="e.g. Important update regarding tomorrow's class" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 'var(--text-base)', outline: 'none', transition: 'border-color 0.2s', background: 'var(--surface)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Message</label>
              <textarea 
                placeholder="Write your announcement here..." 
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 'var(--text-base)', outline: 'none', transition: 'border-color 0.2s', resize: 'vertical', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Button type="button" variant="outline" size="sm" style={{ color: 'var(--text-secondary)' }}>
                <Paperclip size={16} style={{ marginRight: 6 }} /> Attach File
              </Button>
              <Button type="submit" variant="primary">
                <Send size={16} style={{ marginRight: 8 }} /> Publish Now
              </Button>
            </div>
          </form>
        </Card>

        {/* Recent Announcements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '8px 0 0 0' }}>Recent Announcements</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {announcements.map((item) => (
              <Card key={item.id} padding="20px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{item.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    <Clock size={12} /> {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>
                  {item.message}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-muted)', borderRadius: 16, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <Users size={12} /> {item.audience}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
