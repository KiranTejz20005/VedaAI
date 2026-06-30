'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Settings, Users, BookOpen, Calculator, CheckSquare, Megaphone, MessageSquare, Cpu, Building, Network, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const handleAction = (path: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(path);
  };

  const actions = user?.role === 'ADMIN' ? [
    { title: 'SaaS Control Plane', path: '/dashboard/superadmin', icon: <Building size={16} /> },
    { title: 'White-Label Branding', path: '/dashboard/admin/branding', icon: <Settings size={16} /> },
    { title: 'AI Control Center (MCP)', path: '/dashboard/admin/ai/control-center', icon: <Network size={16} /> },
    { title: 'Multi-Agent Workflow Designer', path: '/dashboard/admin/ai/workflow-designer', icon: <Network size={16} /> },
    { title: 'AI Swarm Observability', path: '/dashboard/admin/ai/agent-monitor', icon: <Activity size={16} /> },
    { title: 'Integration Center', path: '/dashboard/admin/integrations', icon: <Settings size={16} /> },
    { title: 'Digital Library & Research', path: '/research', icon: <BookOpen size={16} /> },
    { title: 'Institutional Research Analytics', path: '/dashboard/admin/research', icon: <Building size={16} /> },
    { title: 'AI Orchestrator Analytics', path: '/dashboard/admin/ai', icon: <Cpu size={16} /> },
    { title: 'Institution OBE Dashboard', path: '/dashboard/admin/obe', icon: <Building size={16} /> },
  ] : user?.role === 'TEACHER' ? [
    { title: 'Digital Library & Research', path: '/research', icon: <BookOpen size={16} /> },
    { title: 'Research Supervisor Dashboard', path: '/dashboard/supervisor', icon: <Users size={16} /> },
    { title: 'Outcome-Based Education (OBE)', path: '/dashboard/teacher/obe', icon: <Calculator size={16} /> },
    { title: 'Create Quiz', path: '/dashboard/teacher/generate-quiz', icon: <FileText size={16} /> },
    { title: 'Homework Management Hub', path: '/dashboard/teacher/assessments', icon: <Calculator size={16} /> },
    { title: 'Class Insights', path: '/dashboard/teacher/insights', icon: <Users size={16} /> },
    { title: 'Record Attendance', path: '/dashboard/teacher/attendance', icon: <CheckSquare size={16} /> },
    { title: 'Publish Announcement', path: '/dashboard/teacher/announcements', icon: <Megaphone size={16} /> },
  ] : [
    { title: 'Digital Library & Research', path: '/research', icon: <BookOpen size={16} /> },
    { title: 'My Assessments', path: '/student/assessments', icon: <FileText size={16} /> },
    { title: 'Course Discussions', path: '/student/discussions', icon: <MessageSquare size={16} /> },
    { title: 'Ask AI Tutor', path: '/student/tutor', icon: <BookOpen size={16} /> },
  ];

  const filteredActions = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ background: 'var(--surface)', width: '100%', maxWidth: 600, borderRadius: 12, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={20} color="var(--text-muted)" style={{ marginRight: 12 }} />
          <input
            autoFocus
            placeholder="What do you need to do?..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', fontSize: 16, outline: 'none', color: 'var(--text-primary)' }}
          />
        </div>
        <div style={{ padding: 8, maxHeight: 300, overflowY: 'auto' }}>
          {filteredActions.length > 0 ? filteredActions.map((action, i) => (
            <div
              key={i}
              onClick={() => handleAction(action.path)}
              style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderRadius: 8, color: 'var(--text-primary)' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ color: 'var(--text-secondary)' }}>{action.icon}</div>
              <span style={{ fontWeight: 500 }}>{action.title}</span>
            </div>
          )) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No matching actions found</div>
          )}
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: -1 }} onClick={() => setIsOpen(false)} />
    </div>
  );
}
