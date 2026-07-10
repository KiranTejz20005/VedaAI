'use client';
import { NativeSelect } from '@/components/ui/native-select';


import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Megaphone, Users, Clock, Paperclip, Send, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: string;
  date: string;
}

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('All Enrolled Students');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const res = await api.get('/teacher/announcements');
        if (res.data?.success) {
          setAnnouncements(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in both title and message.');
      return;
    }

    try {
      if (editingId) {
        const res = await api.put(`/teacher/announcements/${editingId}`, { title, message, audience });
        if (res.data?.success) {
          setAnnouncements(prev => prev.map(a => a.id === editingId ? { ...a, title, message, audience } : a));
          setEditingId(null);
          setTitle('');
          setMessage('');
          toast.success('Announcement updated successfully!');
        }
      } else {
        const res = await api.post('/teacher/announcements', { title, message, audience });
        if (res.data?.success) {
          const newAnnouncement: Announcement = {
            id: res.data.data.id,
            title: res.data.data.title || '',
            message: res.data.data.content,
            audience,
            date: res.data.data.createdAt
          };
          setAnnouncements(prev => [newAnnouncement, ...prev]);
          setTitle('');
          setMessage('');
          toast.success('Announcement published successfully!');
        }
      }
    } catch (err) {
      toast.error(editingId ? 'Failed to update announcement' : 'Failed to publish announcement');
    }
  };

  const handleEdit = (item: Announcement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setMessage(item.message);
    setAudience(item.audience);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await api.delete(`/teacher/announcements/${id}`);
      if (res.data?.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        if (editingId === id) {
          setEditingId(null);
          setTitle('');
          setMessage('');
        }
        toast.success('Announcement deleted');
      }
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Class Announcements"
        subtitle="Communicate important updates to your students."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Create / Edit Announcement */}
        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={20} color="var(--brand)" /> {editingId ? 'Edit Announcement' : 'New Announcement'}
          </h3>
          <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Audience</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-muted)' }}>
                <Users size={18} color="var(--text-muted)" />
                <NativeSelect value={audience} onChange={e => setAudience(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                  <option value="All Enrolled Students">All Enrolled Students</option>
                  <option value="Computer Science 101">Computer Science 101</option>
                  <option value="Advanced Mathematics">Advanced Mathematics</option>
                  <option value="Physics II">Physics II</option>
                </NativeSelect>
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
              <div>
                {editingId && (
                  <Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(null); setTitle(''); setMessage(''); }} style={{ color: 'var(--text-secondary)', marginRight: 12 }}>
                    Cancel Edit
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" style={{ color: 'var(--text-secondary)' }}>
                  <Paperclip size={16} style={{ marginRight: 6 }} /> Attach File
                </Button>
              </div>
              <Button type="submit" variant="primary">
                <Send size={16} style={{ marginRight: 8 }} /> {editingId ? 'Save Changes' : 'Publish Now'}
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
                  <div>
                    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{item.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 4 }}>
                      <Clock size={12} /> {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => handleEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
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
