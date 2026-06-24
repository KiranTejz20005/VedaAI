'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { ChevronUp, ChevronDown, MessageCircle, Share2, Bookmark, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

type Post = {
  id: string;
  title?: string;
  content: string;
  type: string;
  visibility: string;
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  imageUrl?: string | null;
  tags?: string[];
  author?: { id: string; firstName: string; lastName: string; role?: string };
};

const TOPIC_PILLS = ['All Topics', 'Computer Science', 'Help Wanted', 'Design Systems', 'Mathematics', 'Student Life'];

const BADGE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PROJECT:      { bg: '#eff6ff', color: '#1d4ed8', label: 'HELP WANTED' },
  ANNOUNCEMENT: { bg: '#f0fdf4', color: '#15803d', label: 'SHOWCASE' },
  DISCUSSION:   { bg: '#f5f3ff', color: '#6d28d9', label: 'DISCUSSION' },
};

function timeAgo(dateStr: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return '1d ago'; }
}

function avatarSrc(firstName?: string) {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${firstName || 'Anon'}&backgroundColor=b6e3f4`;
}

const actionBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#64748b', fontSize: 12, fontWeight: 700, padding: '4px 8px',
  borderRadius: 8, transition: 'background .15s',
};

function PostCard({ post }: { post: Post }) {
  const [votes, setVotes] = useState(post.likesCount ?? 0);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [saved, setSaved] = useState(false);
  const authorName = post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Anonymous Student';
  const badge = BADGE_STYLES[post.type] ?? BADGE_STYLES.DISCUSSION;
  const tags = post.tags?.length ? post.tags : ['General'];

  const castVote = (dir: 'up' | 'down') => {
    if (voted === dir) { setVoted(null); setVotes(v => v + (dir === 'up' ? -1 : 1)); return; }
    const delta = dir === 'up' ? 1 : -1;
    const undo = voted ? (voted === 'up' ? -1 : 1) : 0;
    setVotes(v => v + delta + undo);
    setVoted(dir);
  };

  return (
    <article style={{ display: 'flex', background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 2, padding: '20px 12px 20px 16px', borderRight: '1px solid #e2e8f0', background: '#f8fafc', minWidth: 56 }}>
        <button onClick={() => castVote('up')} style={{ background: voted === 'up' ? '#2563eb' : 'transparent', border: `1px solid ${voted === 'up' ? '#2563eb' : '#e2e8f0'}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: voted === 'up' ? '#fff' : '#64748b', transition: 'all .15s' }}>
          <ChevronUp size={16} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', lineHeight: 1, padding: '4px 0' }}>{votes}</span>
        <button onClick={() => castVote('down')} style={{ background: voted === 'down' ? '#64748b' : 'transparent', border: `1px solid ${voted === 'down' ? '#64748b' : '#e2e8f0'}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: voted === 'down' ? '#fff' : '#64748b', transition: 'all .15s' }}>
          <ChevronDown size={16} />
        </button>
      </div>
      <div style={{ flex: 1, padding: '20px 20px 16px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <img src={avatarSrc(post.author?.firstName)} alt={authorName} style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: '#e2e8f0' }} />
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
            Posted by <strong style={{ color: '#0f172a', fontWeight: 700 }}>{authorName}</strong>&nbsp;·&nbsp;{timeAgo(post.createdAt)}
          </span>
          <span style={{ marginLeft: 4, background: badge.bg, color: badge.color, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' as const }}>{badge.label}</span>
        </div>
        {post.title && <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{post.title}</h2>}
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', fontWeight: 500, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{post.content}</p>
        {post.imageUrl && (
          <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <img src={post.imageUrl} alt="post" style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={actionBtn}><MessageCircle size={14} /><span>{post.commentsCount ?? 0} replies</span></button>
            <button style={actionBtn} onClick={() => toast.success('Link copied!')}><Share2 size={14} /><span>Share</span></button>
            <button onClick={() => setSaved(s => !s)} style={{ ...actionBtn, color: saved ? '#2563eb' : '#64748b' }}><Bookmark size={14} fill={saved ? '#2563eb' : 'none'} /><span>Save</span></button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            {tags.map(tag => <span key={tag} style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{tag}</span>)}
          </div>
        </div>
      </div>
    </article>
  );
}

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const labelText: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b' };
const inputStyle: React.CSSProperties = { height: 44, borderRadius: 12, border: '1px solid #e2e8f0', padding: '0 14px', fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' };
const btnBase: React.CSSProperties = { height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', padding: '0 20px', fontSize: 13, fontWeight: 700, transition: 'all .15s' };

function CreateDiscussionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('DISCUSSION');
  const [tags, setTags] = useState('');
  const [vis, setVis] = useState('PUBLIC');
  const [submitting, setSub] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSub(true);
    try {
      await api.post('/community/posts', { title: title.trim() || undefined, content: body.trim(), type, visibility: vis, tags: tags.split(',').map(t => t.trim()).filter(Boolean) });
      toast.success('Discussion posted!');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not post discussion');
    } finally { setSub(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
      <form onSubmit={submit} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 560, boxShadow: '0 24px 48px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Start a Discussion</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6, color: '#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={labelStyle}><span style={labelText}>Title</span><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="What's on your mind?" /></label>
          <label style={labelStyle}><span style={labelText}>Body</span><textarea value={body} onChange={e => setBody(e.target.value)} required rows={4} style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' as const }} placeholder="Share your question, idea, or insight…" /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}><span style={labelText}>Type</span><select value={type} onChange={e => setType(e.target.value)} style={inputStyle}><option value="DISCUSSION">Discussion</option><option value="PROJECT">Help Wanted</option><option value="ANNOUNCEMENT">Showcase</option></select></label>
            <label style={labelStyle}><span style={labelText}>Visibility</span><select value={vis} onChange={e => setVis(e.target.value)} style={inputStyle}><option value="PUBLIC">Public</option><option value="ORG_ONLY">Org Only</option></select></label>
          </div>
          <label style={labelStyle}><span style={labelText}>Tags (comma-separated)</span><input value={tags} onChange={e => setTags(e.target.value)} style={inputStyle} placeholder="Computer Science, React" /></label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
          <button type="button" onClick={onClose} style={{ ...btnBase, background: 'transparent', color: '#64748b' }}>Cancel</button>
          <button type="submit" disabled={submitting || !body.trim()} style={{ ...btnBase, background: '#2563eb', color: '#fff', opacity: (submitting || !body.trim()) ? 0.5 : 1 }}>{submitting ? 'Posting…' : 'Post Discussion'}</button>
        </div>
      </form>
    </div>
  );
}

export default function DiscussionsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState('All Topics');
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const fetchFeed = async () => {
    try {
      const res = await api.get('/community/posts/feed');
      if (res.data?.status === 'success') setPosts(res.data.data || []);
    } catch { toast.error('Failed to load discussions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFeed(); }, []);

  const filtered = posts.filter(p => {
    if (activeTopic === 'All Topics') return true;
    if (activeTopic === 'Help Wanted') return p.type === 'PROJECT';
    return true;
  });
  const displayed = filtered.slice(0, page * 10);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'inherit', width: '100%', overflowY: 'auto' }}>
      <div style={{ width: '100%', padding: '40px 32px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Discussions</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>Exchange knowledge, ask for help, and collaborate with your peers.</p>
          </div>
          <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '0 20px', height: 42, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', whiteSpace: 'nowrap' as const }}>
            <Plus size={16} /> Start a Discussion
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 28 }}>
          {TOPIC_PILLS.map(topic => (
            <button key={topic} onClick={() => setActiveTopic(topic)} style={{ borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: activeTopic === topic ? 'none' : '1.5px solid #e2e8f0', background: activeTopic === topic ? '#2563eb' : 'transparent', color: activeTopic === topic ? '#fff' : '#64748b', transition: 'all .15s' }}>{topic}</button>
          ))}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: 14, fontWeight: 500 }}>Loading discussions…</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: 14, fontWeight: 500 }}>No discussions yet. Be the first to start one!</div>
        ) : (
          <>
            {displayed.map(post => <PostCard key={post.id} post={post} />)}
            {displayed.length < filtered.length && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button onClick={() => setPage(p => p + 1)} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 28px', fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>Load Older Discussions</button>
              </div>
            )}
          </>
        )}
      </div>
      {modalOpen && <CreateDiscussionModal onClose={() => setModalOpen(false)} onCreated={fetchFeed} />}
    </div>
  );
}
