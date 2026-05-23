'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  BookOpen,
  Sparkles,
  Library,
  Settings,
  X,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/groups', label: 'My Groups', icon: Users },
  { href: '/dashboard', label: 'Assignments', icon: BookOpen },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Sparkles },
  { href: '/library', label: 'My Library', icon: Library },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

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
          <div className="sidebar-logo-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <span className="sidebar-logo-text">VedaAI</span>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Assignment
        </Link>

        <nav className="sidebar-nav" aria-label="Pages">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
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

          <div className="sidebar-profile" role="button" tabIndex={0} aria-label="Account settings">
            <div className="sidebar-profile-avatar" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
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
