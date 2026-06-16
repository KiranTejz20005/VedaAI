'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  FileText,
  Sparkles,
  PieChart,
  Settings,
  X,
  BookOpen,
  GraduationCap,
  Users,
  Library,
  ClipboardCheck,
  PenSquare,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAssignmentStore } from '@/store/assignment.store';
import { useMounted } from '@/hooks/useMounted';

function MyGroupsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      <circle cx="12" cy="11" r="2" />
      <path d="M8 16c0-1.5 1.5-2.5 4-2.5s4 1 4 2.5" />
    </svg>
  );
}

function ToolkitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={(props.strokeWidth as number || 2) * 1.5} />
    </svg>
  );
}

const PRIMARY_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/assignments/create', label: 'Create Question Paper', icon: PenSquare, exact: true },
  { href: '/question-bank', label: 'Question Bank', icon: MyGroupsIcon },
  { href: '/papers', label: 'Paper Mgmt', icon: FileText },
  { href: '/syllabus', label: 'Syllabus', icon: GraduationCap },
];

const SECONDARY_NAV = [
  { href: '/library', label: 'Library', icon: Library },
  { href: '/reviews', label: 'Reviews', icon: ClipboardCheck },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/toolkit', label: 'AI Toolkit', icon: ToolkitIcon },
];

const TERTIARY_NAV = [
  { href: '/generate', label: 'Quick Generate', icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const mounted = useMounted();
  const { isOpen, close } = useSidebarStore();
  const totalCount = useAssignmentStore((s) => s.totalCount);

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={close} aria-hidden="true" />
      )}

      <aside className={`sidebar${isOpen ? ' open' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #F97316 0%, #E8531D 50%, #C2410C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">S</text>
            </svg>
          </div>
          <span className="sidebar-logo-text" style={{ fontWeight: 800 }}>Shiksha AI</span>
          <button className="sidebar-close-btn" onClick={close} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <Link href="/assignments/create" className="sidebar-create-btn" onClick={close}>
          <Sparkles size={14} fill="white" stroke="white" />
          Create Assessment
        </Link>

        <nav className="sidebar-nav" aria-label="Pages">
          <div className="sidebar-nav-section-label">Main</div>
          {PRIMARY_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            const isAssignments = label === 'Paper Mgmt';
            return (
              <Link key={href} href={href} className={`sidebar-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={close}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{label}</span>
                {mounted && isAssignments && totalCount > 0 && (
                  <span className="sidebar-nav-badge">{totalCount}</span>
                )}
              </Link>
            );
          })}

          <div className="sidebar-nav-section-label">Management</div>
          {SECONDARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className={`sidebar-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={close}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}

          <div className="sidebar-nav-section-label">Tools</div>
          {TERTIARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className={`sidebar-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={close}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link href="/settings" className="sidebar-settings" onClick={close}>
            <Settings size={18} aria-hidden="true" />
            <span>Settings</span>
          </Link>

          <div className="sidebar-profile" role="button" tabIndex={0} aria-label="Account settings" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } }}>
            <div className="sidebar-profile-avatar" aria-hidden="true">
              <Image src="/monkey-avatar.png" alt="" fill sizes="48px" style={{ objectFit: 'cover' }} />
            </div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">Admin User</div>
              <div className="sidebar-profile-sub">Demo Institution</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}