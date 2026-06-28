'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Bell, Info, MessageSquarePlus, Paperclip,
  Phone, Search, Send, Smile, UserRound, Video, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type Conversation = {
  id: string;
  name: string;
  isDM: boolean;
  recipientId?: string;
  role?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
};

type OrgUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender?: { id: string; firstName: string; lastName: string; role: string };
};

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'AC';
}

function formatTime(value?: string) {
  if (!value) return 'Now';
  const diff = Date.now() - new Date(value).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function msgTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildDmId(a: string, b: string) {
  return `dm_${[a, b].sort().join('_')}`;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [composeQuery, setComposeQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const uid = user?.id || '';

  const fetchConvos = async (silent = false) => {
    try {
      if (!silent) setLoadingConvos(true);
      const res = await api.get('/chat/conversations');
      if (res.data?.status === 'success') setConversations(res.data.data || []);
    } catch { if (!silent) toast.error('Could not load conversations'); }
    finally { if (!silent) setLoadingConvos(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/chat/users');
      if (res.data?.status === 'success') setOrgUsers(res.data.data || []);
    } catch { toast.error('Could not load people'); }
  };

  const fetchMsgs = async (id: string, silent = false) => {
    try {
      if (!silent) setLoadingMsgs(true);
      const res = await api.get(`/chat/messages/${id}`);
      if (res.data?.status === 'success') setMessages(res.data.data || []);
    } catch { if (!silent) toast.error('Could not load messages'); }
    finally { if (!silent) setLoadingMsgs(false); }
  };

  useEffect(() => {
    if (!user) return;
    fetchConvos();
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (!activeId) return;
    fetchMsgs(activeId);
  }, [activeId]);

  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => {
      fetchConvos(true);
      if (activeId) fetchMsgs(activeId, true);
    }, 3000);
    return () => clearInterval(t);
  }, [user, activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const activeConvo = useMemo(() => {
    if (!activeId) return null;
    const existing = conversations.find((c) => c.id === activeId);
    if (existing) return existing;
    const rid = activeId.replace('dm_', '').split('_').find((x) => x !== uid);
    const r = orgUsers.find((u) => u.id === rid);
    if (!r) return null;
    return { id: activeId, name: `${r.firstName} ${r.lastName}`, isDM: true, recipientId: r.id, role: r.role, lastMessage: '' };
  }, [activeId, conversations, uid, orgUsers]);

  const filteredConvos = conversations.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  const filteredUsers = orgUsers.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(composeQuery.toLowerCase()));

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    const msg = draft.trim();
    setDraft('');
    try {
      const res = await api.post('/chat/messages', { conversationId: activeId, message: msg });
      if (res.data?.status === 'success') {
        setMessages((prev) => [...prev, res.data.data]);
        fetchConvos(true);
      }
    } catch { setDraft(msg); toast.error('Message was not sent'); }
  };

  const startConvo = (r: OrgUser) => {
    const existing = conversations.find((c) => c.isDM && c.recipientId === r.id);
    setActiveId(existing?.id || buildDmId(uid, r.id));
    setComposeOpen(false);
    setComposeQuery('');
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: '#f8f9fb', color: '#0b1020', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Conversations sidebar ── */}
      <aside style={{
        flexDirection: 'column',
        width: 340, minWidth: 340, height: '100%', borderRight: '1px solid #e8eaf0',
        background: '#fff',
      }}
        className={`${activeId ? 'hidden md:flex' : 'flex'}`}
        aria-label="Conversations list"
      >
        {/* Search bar */}
        <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
          <label style={{ position: 'relative', display: 'block' }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations..."
              style={{ width: '100%', height: 42, borderRadius: 21, border: 'none', background: '#f1f3f9', paddingLeft: 40, paddingRight: 16, fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
            />
          </label>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>Messages</h1>
          <button
            onClick={() => setComposeOpen(true)}
            style={{ width: 44, height: 44, borderRadius: '50%', background: '#2563eb', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}
            aria-label="New message"
          >
            <MessageSquarePlus style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 12px' }}>
          {loadingConvos ? (
            <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Loading…</div>
          ) : filteredConvos.length === 0 ? (
            <div style={{ margin: '16px 8px', borderRadius: 16, border: '1.5px dashed #dde3f5', background: 'rgba(255,255,255,0.7)', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>No conversations yet</p>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Start a message with someone in your org.</p>
            </div>
          ) : filteredConvos.map((c) => {
            const active = c.id === activeId;
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '10px 12px', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: active ? '#f1f5ff' : 'transparent', textAlign: 'left',
                marginBottom: 2, transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f8f9fb'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0, borderRadius: '50%', background: active ? '#2563eb' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
                  {initials(c.name)}
                  <span style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? '#2563eb' : '#94a3b8', whiteSpace: 'nowrap' }}>{formatTime(c.lastMessageTime)}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage || 'No messages yet'}</p>
                </div>
              </button>
            );
          })}
        </div>


      </aside>

      {/* ── Chat panel ── */}
      <main style={{ flex: 1, flexDirection: 'column', minWidth: 0, background: '#f8f9fb' }}
        className={`${activeId ? 'flex' : 'hidden md:flex'}`}
        aria-label="Chat window"
      >
        {!activeId ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <UserRound style={{ width: 32, height: 32, color: '#2563eb' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Select a conversation</h2>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 320, lineHeight: 1.6, margin: 0 }}>Choose from the list or start a new direct message.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <header style={{ height: 72, flexShrink: 0, borderBottom: '1px solid #e8eaf0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <button onClick={() => setActiveId(null)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }} aria-label="Back" className="md:hidden">
                  <ArrowLeft style={{ width: 20, height: 20 }} />
                </button>
                <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {initials(activeConvo?.name || 'AC')}
                  <span style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{activeConvo?.name || 'Conversation'}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    Online
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[{ icon: Video, label: 'Video call' }, { icon: Phone, label: 'Voice call' }, { icon: Info, label: 'Info' }, { icon: Bell, label: 'Notifications' }].map(({ icon: Icon, label }) => (
                  <button key={label} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    aria-label={label}
                  >
                    <Icon style={{ width: 19, height: 19 }} />
                  </button>
                ))}
              </div>
            </header>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                <span style={{ background: '#eef2ff', borderRadius: 20, padding: '5px 18px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569' }}>Today</span>
              </div>
              {loadingMsgs ? (
                <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Loading messages…</div>
              ) : messages.length === 0 ? (
                <div style={{ maxWidth: 360, margin: '0 auto', borderRadius: 20, border: '1.5px dashed #dde3f5', background: 'rgba(255,255,255,0.8)', padding: '40px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', margin: 0 }}>No messages yet</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Send the first message to start the conversation.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map((msg) => {
                    const mine = msg.senderId === uid;
                    const name = msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : activeConvo?.name || 'Member';
                    return (
                      <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-end', gap: 10, maxWidth: '72%', alignSelf: mine ? 'flex-end' : 'flex-start' }}>
                        {!mine && (
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, marginBottom: 18 }}>
                            {initials(name)}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            padding: '11px 16px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: mine ? '#2563eb' : '#f1f3f9',
                            color: mine ? '#fff' : '#0f172a',
                            fontSize: 14, fontWeight: 500, lineHeight: 1.55,
                            boxShadow: mine ? '0 2px 8px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                          }}>
                            {msg.message}
                          </div>
                          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>
                            {msgTime(msg.createdAt)}{mine ? '  ✓✓' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <form onSubmit={sendMessage} style={{ flexShrink: 0, borderTop: '1px solid #e8eaf0', background: '#fff', padding: '14px 20px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }} aria-label="Attach file">
                  <Paperclip style={{ width: 19, height: 19 }} />
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', borderRadius: 24, border: '1.5px solid #e2e8f0', background: '#f8fafc', padding: '0 6px 0 16px', minWidth: 0 }}>
                  <input
                    value={draft} onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type your message..."
                    style={{ flex: 1, height: 48, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 500, color: '#0f172a', outline: 'none' }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any); } }}
                  />
                  <button type="button" style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }} aria-label="Emoji">
                    <Smile style={{ width: 18, height: 18 }} />
                  </button>
                </div>
                <button type="submit" disabled={!draft.trim()} style={{
                  width: 48, height: 48, borderRadius: 16, border: 'none', cursor: draft.trim() ? 'pointer' : 'not-allowed',
                  background: draft.trim() ? '#2563eb' : '#e2e8f0', color: draft.trim() ? '#fff' : '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.15s, color 0.15s', boxShadow: draft.trim() ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
                }} aria-label="Send">
                  <Send style={{ width: 20, height: 20 }} />
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 8 }}>Press Enter to send. Shift + Enter for new line</p>
            </form>
          </>
        )}
      </main>

      {/* ── Compose modal ── */}
      {composeOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setComposeOpen(false); }}>
          <div style={{ width: '100%', maxWidth: 480, maxHeight: '82vh', background: '#fff', borderRadius: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8eaf0', padding: '18px 20px' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>New Message</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>People in your organization</p>
              </div>
              <button onClick={() => setComposeOpen(false)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }} aria-label="Close">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaf0' }}>
              <label style={{ position: 'relative', display: 'block' }}>
                <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none' }} />
                <input value={composeQuery} onChange={(e) => setComposeQuery(e.target.value)} placeholder="Search students or staff..." style={{ width: '100%', height: 42, borderRadius: 21, border: 'none', background: '#f1f3f9', paddingLeft: 40, paddingRight: 16, fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box' }} />
              </label>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
              {filteredUsers.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>No people found</div>
              ) : filteredUsers.map((p) => (
                <button key={p.id} onClick={() => startConvo(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 14, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5ff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {initials(`${p.firstName} ${p.lastName}`)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{p.firstName} {p.lastName}</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{p.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
