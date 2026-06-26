'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Brain, Code2, Compass, Filter, Leaf, Loader2, Plus, Sparkles, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

type CommunityGroup = {
  id: string;
  name: string;
  description?: string | null;
  type: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY' | string;
  memberCount: number;
  isMember: boolean;
  owner?: { firstName: string; lastName: string };
};

const ICONS = [Code2, Brain, Sparkles, Compass, Leaf, Users];
const CATS  = ['TECHNOLOGY', 'ACADEMIC', 'ARTS', 'SOCIAL', 'SCIENCE', 'SPORTS'];
function groupIcon(i: number) { return ICONS[i % ICONS.length]; }
function groupCat(i: number)  { return CATS[i % CATS.length]; }
function memberLabel(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k Members`;
  return `${n} ${n === 1 ? 'Member' : 'Members'}`;
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDesc] = useState('');
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'>('PUBLIC');
  const [creating, setCreating] = useState(false);

  const inp: React.CSSProperties = { height: 44, borderRadius: 12, border: '1px solid #e2e8f0', padding: '0 14px', fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', width: '100%', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit' };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/community/groups', { name: name.trim(), description: description.trim(), type });
      toast.success('Group created');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not create group');
    } finally { setCreating(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
      <form onSubmit={submit} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 540, boxShadow: '0 24px 48px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Create Group</h2>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#94a3b8' }}>Stored for your organization</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6, color: '#64748b' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b' }}>Name</span>
            <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="Web Dev Club" required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b' }}>Description</span>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3} style={{ ...inp, height: 'auto', padding: '10px 14px', resize: 'vertical' as const }} placeholder="What will members do together?" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b' }}>Visibility</span>
            <select value={type} onChange={e => setType(e.target.value as any)} style={inp}><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option><option value="INVITE_ONLY">Invite Only</option></select>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
          <button type="button" onClick={onClose} style={{ height: 40, borderRadius: 10, border: 'none', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px' }}>Cancel</button>
          <button type="submit" disabled={creating || !name.trim()} style={{ height: 40, borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px', opacity: (creating || !name.trim()) ? 0.5 : 1 }}>{creating ? 'Creating…' : 'Create Group'}</button>
        </div>
      </form>
    </div>
  );
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchGroups = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/community/groups');
      if (res.data?.status === 'success') setGroups(res.data.data || []);
    } catch { if (!silent) toast.error('Could not load groups'); }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    const t = window.setTimeout(() => fetchGroups(), 0);
    const i = window.setInterval(() => fetchGroups(true), 5000);
    return () => { window.clearTimeout(t); window.clearInterval(i); };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g => `${g.name} ${g.description ?? ''} ${g.type}`.toLowerCase().includes(q));
  }, [groups, query]);

  const joinGroup = async (id: string) => {
    setJoiningId(id);
    try {
      await api.post(`/community/groups/${id}/join`);
      toast.success('Joined group');
      fetchGroups(true);
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not join group');
    } finally { setJoiningId(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'inherit', overflowY: 'auto', width: '100%' }}>
      <div style={{ width: '100%', padding: '40px 32px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap' as const, gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Groups Directory</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>Find your community and learn together.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 16px' }}>
              <Filter size={14} style={{ color: '#64748b' }} /> Filter
            </button>
            <button onClick={() => setModalOpen(true)} className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px' }}>
              <Plus size={15} /> Create Group
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Loader2 size={32} style={{ color: '#0f172a' }} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ border: '2px dashed #e2e8f0', borderRadius: 20, padding: 64, textAlign: 'center', background: '#fff' }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>No groups found</p>
            <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0 0' }}>Create the first group for your community.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map((group, idx) => {
              const Icon = groupIcon(idx);
              const cat  = groupCat(idx);
              return (
                <article key={group.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={22} style={{ color: '#0f172a' }} />
                    </div>
                    <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>{cat}</span>
                  </div>
                  <div style={{ marginTop: 16, flex: 1 }}>
                    <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{group.name}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', minHeight: 62 }}>
                      {group.description || 'No description added yet.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                      <Users size={14} style={{ color: '#94a3b8' }} /><span>{memberLabel(group.memberCount)}</span>
                    </div>
                    <button onClick={() => !group.isMember && joinGroup(group.id)} disabled={group.isMember || joiningId === group.id} style={{ height: 36, borderRadius: 10, border: 'none', background: group.isMember ? '#f1f5f9' : '#0f172a', color: group.isMember ? '#94a3b8' : '#fff', fontSize: 12, fontWeight: 700, cursor: group.isMember ? 'default' : 'pointer', padding: '0 18px', transition: 'all .15s', opacity: joiningId === group.id ? 0.6 : 1 }}>
                      {group.isMember ? 'Joined' : joiningId === group.id ? 'Joining…' : 'Join'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 48, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', borderRadius: 24, padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -40, left: -40, width: 120, height: 120, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -50, right: -30, width: 160, height: 160, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>Can't find what you're looking for?</h2>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500, maxWidth: 480 }}>Starting a new group is easy. Gather classmates, set your mission, and grow your community.</p>
          </div>
          <button onClick={() => setModalOpen(true)} style={{ position: 'relative', zIndex: 1, height: 44, borderRadius: 12, border: 'none', background: '#fff', color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 24px', whiteSpace: 'nowrap' as const }}>Launch a New Group</button>
        </div>
      </div>

      {modalOpen && <CreateGroupModal onClose={() => setModalOpen(false)} onCreated={() => fetchGroups(true)} />}
    </div>
  );
}
