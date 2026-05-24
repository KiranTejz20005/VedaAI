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
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAssignmentStore } from '@/store/assignment.store';

// Custom high-precision folder-user SVG to match "My Groups" reference icon
function MyGroupsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      <circle cx="12" cy="11" r="2" />
      <path d="M8 16c0-1.5 1.5-2.5 4-2.5s4 1 4 2.5" />
    </svg>
  );
}

// Custom high-precision tablet screen SVG to match "AI Teacher's Toolkit" reference icon
function ToolkitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={(props.strokeWidth as number || 2) * 1.5} />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: LayoutGrid, exact: true },
  { href: '/groups', label: 'My Groups', icon: MyGroupsIcon },
  { href: '/dashboard', label: 'Assignments', icon: FileText },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: ToolkitIcon },
  { href: '/library', label: 'My Library', icon: PieChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const totalCount = useAssignmentStore((s) => s.totalCount);

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar${isOpen ? ' open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="sidebar-logo">
          <div
            className="sidebar-logo-icon"
            aria-hidden="true"
            style={{
              background: 'linear-gradient(135deg, #F97316 0%, #E8531D 50%, #C2410C 100%)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H8.5L12 15L15.5 4H20L14.5 20H9.5L4 4Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="sidebar-logo-text" style={{ fontWeight: 800 }}>VedaAI</span>
          <button
            className="sidebar-close-btn"
            onClick={close}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <Link
          href="/assignments/create"
          className="sidebar-create-btn"
          onClick={close}
        >
          <Sparkles size={14} fill="white" stroke="white" />
          Create Assignment
        </Link>

        <nav className="sidebar-nav" aria-label="Pages">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            const isAssignments = label === 'Assignments';
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-nav-item${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={close}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{label}</span>
                {isAssignments && totalCount > 0 && (
                  <span className="sidebar-nav-badge">{totalCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link
            href="/settings"
            className="sidebar-settings"
            onClick={close}
          >
            <Settings size={18} aria-hidden="true" />
            <span>Settings</span>
          </Link>

          <div className="sidebar-profile" role="button" tabIndex={0} aria-label="Account settings" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } }}>
            <div className="sidebar-profile-avatar" aria-hidden="true">
              <Image src="/monkey-avatar.png" alt="" fill sizes="48px" style={{ objectFit: 'cover' }} />
            </div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">Delhi Public School</div>
              <div className="sidebar-profile-sub">Bokaro Steel City</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
