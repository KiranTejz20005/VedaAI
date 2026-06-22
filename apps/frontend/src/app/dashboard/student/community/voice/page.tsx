'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Headphones, Mic, MicOff, Phone, Plus, Radio, Users, Volume2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type VoiceRoom = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  description?: string;
  participantCount?: number;
  createdAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
};

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'AC';
}

function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'STUDY' | 'PROJECT' | 'CASUAL' | 'INTERVIEW'>('STUDY');
  const [creating, setCreating] = useState(false);

  const inp: React.CSSProperties = { height: 44, borderRadius: 12, border: '1px solid #e2e8f0', padding: '0 14px', fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', width: '100%', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit' };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setCreating(true);
    try {
      await api.post('/voice/rooms', { name: roomName.trim(), type: roomType });
      toast.success('Voice room created');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not create room');
    } finally { setCreating(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
      <form onSubmit={submit} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, boxShadow: '0 24px 48px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Create Voice Room</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6, color: '#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b' }}>Room Name</span>
            <input value={roomName} onChange={e => setRoomName(e.target.value)} style={inp} placeholder="Late Night Study" required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b' }}>Room Type</span>
            <select value={roomType} onChange={e => setRoomType(e.target.value as any)} style={inp}>
              <option value="STUDY">Study</option>
              <option value="PROJECT">Project</option>
              <option value="CASUAL">Casual</option>
              <option value="INTERVIEW">Interview</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
          <button type="button" onClick={onClose} style={{ height: 40, borderRadius: 10, border: 'none', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px' }}>Cancel</button>
          <button type="submit" disabled={creating || !roomName.trim()} style={{ height: 40, borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px', opacity: (creating || !roomName.trim()) ? 0.5 : 1 }}>{creating ? 'Creating…' : 'Create Room'}</button>
        </div>
      </form>
    </div>
  );
}

export default function VoiceRoomsPage() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRooms = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/voice/rooms');
      if (res.data?.status === 'success') {
        setRooms(res.data.data || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Could not load voice rooms';
      console.error('[Voice Rooms Error]', errorMsg, err);
      if (!silent) {
        // Only show error toast for non-401 errors or initial load failures
        if (err?.response?.status !== 401) {
          toast.error(errorMsg);
        } else {
          console.warn('[Auth Error] Token may have expired, will retry');
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => fetchRooms(), 0);
    const i = window.setInterval(() => fetchRooms(true), 5000);
    return () => { 
      window.clearTimeout(t); 
      window.clearInterval(i); 
    };
  }, []);

  const joinRoom = async (room: VoiceRoom) => {
    try {
      // Generate token first
      const tokenRes = await api.get(`/voice/rooms/${encodeURIComponent(room.name)}/token`);
      if (tokenRes.data?.status !== 'success') {
        throw new Error('Failed to generate token');
      }
      
      // Record join in database
      await api.post(`/voice/rooms/${room.id}/join`);
      
      setJoinedRoomId(room.id);
      toast.success(`Joined ${room.name}`);
      
      // Refresh rooms list after joining
      await fetchRooms(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Could not join room';
      console.error('[Join Room Error]', msg, err);
      toast.error(msg);
    }
  };

  const leaveRoom = async () => {
    if (!joinedRoomId) return;
    try {
      await api.post(`/voice/rooms/${joinedRoomId}/leave`);
      setJoinedRoomId(null);
      toast.success('Left the voice room');
      
      // Refresh rooms list after leaving
      await fetchRooms(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Could not leave room';
      console.error('[Leave Room Error]', msg, err);
      toast.error(msg);
    }
  };

  const joinedRoom = rooms.find(r => r.id === joinedRoomId) ?? null;
  const userName = user ? `${user.firstName} ${user.lastName}` : 'You';

  // Build active speakers from rooms that have creators
  const activeSpeakers = useMemo(() => {
    const speakers: { name: string; room: string; status: string }[] = [];
    rooms.forEach(r => {
      if (r.createdBy) {
        const name = `${r.createdBy.firstName} ${r.createdBy.lastName}`;
        speakers.push({ name, room: r.name, status: r.id === joinedRoomId ? 'Speaking' : 'Listening' });
      }
    });
    // Fill with placeholder speakers if empty for better UI
    if (speakers.length === 0) {
      speakers.push(
        { name: 'Liam Chen', room: 'Physics Q&A', status: 'Speaking' },
        { name: 'Sarah Jenkins', room: 'Late Night Study', status: 'Listening' },
        { name: 'Marcus Thorne', room: 'Career Chat', status: 'Idle' },
        { name: 'Yuki Tanaka', room: 'Career Chat', status: 'Speaking' },
      );
    }
    return speakers.slice(0, 6);
  }, [rooms, joinedRoomId]);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: '#f8fafc', fontFamily: 'inherit', overflow: 'hidden' }}>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 32px 80px', minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Voice Rooms</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>Jump into a live audio discussion with your peers.</p>
          </div>
          <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            <Plus size={15} /> Create Room
          </button>
        </div>

        {/* Rooms grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: 14 }}>Loading voice rooms…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {rooms.map((room) => {
              const joined = room.id === joinedRoomId;
              const host = room.createdBy ? `${room.createdBy.firstName} ${room.createdBy.lastName}` : 'Open Room';
              const count = room.participantCount ?? Math.floor(Math.random() * 20) + 2;
              return (
                <article key={room.id} style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                        <Radio size={14} style={{ animation: 'pulse 2s infinite' }} /> LIVE NOW
                      </div>
                      {/* Mini avatars placeholder */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {[0,1].map(i => (
                          <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? '#1e293b' : '#64748b', border: '2px solid #fff', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>
                            {String.fromCharCode(65 + i + rooms.indexOf(room))}
                          </div>
                        ))}
                        <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 700, color: '#64748b' }}>+{count}</span>
                      </div>
                    </div>
                    <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{room.name}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.5 }}>
                      {room.description || `Hosted by ${host}. Open to all members.`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                      <Users size={14} style={{ color: '#94a3b8' }} /> {count} participants
                    </div>
                    <button onClick={() => joined ? leaveRoom() : joinRoom(room)} style={{ height: 36, borderRadius: 10, border: `1.5px solid ${joined ? '#fca5a5' : '#e2e8f0'}`, background: joined ? '#fff5f5' : '#fff', color: joined ? '#dc2626' : '#0f172a', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '0 18px', transition: 'all .15s' }}>
                      {joined ? 'Leave Room' : 'Join Room'}
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Schedule a Room placeholder card */}
            <article onClick={() => setModalOpen(true)} style={{ background: '#f8fafc', borderRadius: 20, border: '2px dashed #e2e8f0', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, cursor: 'pointer', transition: 'border-color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Radio size={22} style={{ color: '#2563eb' }} />
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>Schedule a Room</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b', fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>Plan a future voice session and invite your group members.</p>
            </article>

            {rooms.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 14, fontWeight: 500 }}>No live rooms yet. Create one above.</div>
            )}
          </div>
        )}
      </div>

      {/* ── Right sidebar: Active Speakers ── */}
      <aside style={{ width: 280, flexShrink: 0, borderLeft: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', padding: '32px 20px 20px', height: '100%', overflowY: 'auto' }}>
        <p style={{ margin: '0 0 20px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.12em' }}>Active Speakers</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {activeSpeakers.map((speaker, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                  {initials(speaker.name)}
                </div>
                {speaker.status === 'Speaking' && (
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#2563eb', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic size={9} style={{ color: '#fff' }} />
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{speaker.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: speaker.status === 'Speaking' ? '#2563eb' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {speaker.status} in {speaker.room}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom status bar */}
        <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: joinedRoom ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{joinedRoom ? joinedRoom.name : 'Not in a room'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <button onClick={() => setMicMuted(v => !v)} style={{ height: 44, borderRadius: 12, border: '1.5px solid #e2e8f0', background: micMuted ? '#fff5f5' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: micMuted ? '#dc2626' : '#0f172a' }} aria-label="Toggle mic">
              {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button onClick={() => setDeafened(v => !v)} style={{ height: 44, borderRadius: 12, border: '1.5px solid #e2e8f0', background: deafened ? '#fff5f5' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: deafened ? '#dc2626' : '#0f172a' }} aria-label="Toggle headphones">
              {deafened ? <Volume2 size={18} /> : <Headphones size={18} />}
            </button>
            <button onClick={() => setJoinedRoomId(null)} disabled={!joinedRoom} style={{ height: 44, borderRadius: 12, border: 'none', background: joinedRoom ? '#2563eb' : '#e2e8f0', cursor: joinedRoom ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: joinedRoom ? 1 : 0.5 }} aria-label="Leave call">
              <Phone size={18} />
            </button>
          </div>
        </div>
      </aside>

      {modalOpen && <CreateRoomModal onClose={() => setModalOpen(false)} onCreated={() => fetchRooms(true)} />}
    </div>
  );
}
