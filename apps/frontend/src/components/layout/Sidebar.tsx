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
  Plus,
  Building2,
  ChevronDown,
  X,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/groups', label: 'My Groups', icon: Users },
  { href: '/dashboard', label: 'Assignments', icon: BookOpen, badge: null },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Sparkles },
  { href: '/library', label: 'My Library', icon: Library },
];

interface SidebarProps {
  assignmentCount?: number;
}

export function Sidebar({ assignmentCount }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Overlay — mobile only, shown when sidebar is open */}
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
        {/* Logo + mobile close */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7.5V18h14V7.5L10 2Z" fill="white" fillOpacity="0.9"/>
              <path d="M7 12h6M7 15h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="sidebar-logo-text">VedaAI</span>
          {/* Close btn — mobile only */}
          <button
            className="sidebar-close-btn"
            onClick={close}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Create button */}
        <Link href="/assignments/create" className="sidebar-create-btn" onClick={close}>
          <Plus size={15} />
          Create Assignment
        </Link>

        {/* Nav items */}
        <nav className="sidebar-nav" aria-label="Pages">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact, badge }) => {
            const active = isActive(href, exact);
            const count = label === 'Assignments' ? assignmentCount : undefined;
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={close}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                  <span className="sidebar-nav-badge" aria-label={`${count} assignments`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom">
          <Link href="/settings" className="sidebar-settings" onClick={close}>
            <Settings size={15} aria-hidden="true" />
            <span>Settings</span>
          </Link>

          {/* School/Profile */}
          <div className="sidebar-profile" role="button" tabIndex={0} aria-label="Account settings">
            <div className="sidebar-profile-avatar">
              <Building2 size={16} color="#E8531D" aria-hidden="true" />
            </div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">Delhi Public School</div>
              <div className="sidebar-profile-sub">Bokaro Steel City</div>
            </div>
            <ChevronDown size={13} color="var(--text-muted)" aria-hidden="true" />
          </div>
        </div>
      </aside>
    </>
  );
}
