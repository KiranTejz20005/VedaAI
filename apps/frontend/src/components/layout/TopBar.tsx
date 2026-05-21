'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Bell, ChevronDown, Menu } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';

const BREADCRUMB_MAP: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Assignment',
  '/assignments/create': 'Create Assignment',
  '/toolkit': "AI Teacher's Toolkit",
  '/library': 'My Library',
};

function getBreadcrumb(pathname: string): { parent?: string; current: string } {
  if (pathname.startsWith('/assignments/') && pathname.endsWith('/paper')) {
    return { parent: 'Assignment', current: 'Paper View' };
  }
  if (pathname.startsWith('/assignments/') && pathname !== '/assignments/create') {
    return { parent: 'Assignment', current: 'Details' };
  }
  return { current: BREADCRUMB_MAP[pathname] ?? 'Assignment' };
}

export function TopBar() {
  const pathname = usePathname();
  const { parent, current } = getBreadcrumb(pathname);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <header className="topbar" role="banner">
      {/* Hamburger — mobile only */}
      <button
        className="topbar-hamburger"
        onClick={toggle}
        aria-label="Toggle navigation menu"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Breadcrumb */}
      <div className="topbar-breadcrumb">
        {parent && (
          <>
            <span>{parent}</span>
            <ChevronRight size={14} aria-hidden="true" />
          </>
        )}
        <span className="topbar-breadcrumb-current">{current}</span>
      </div>

      {/* Right actions */}
      <div className="topbar-actions">
        {/* Notification bell */}
        <button className="topbar-icon-btn" aria-label="Notifications">
          <Bell size={16} aria-hidden="true" />
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 7,
              height: 7,
              background: '#E8531D',
              borderRadius: '50%',
              border: '1.5px solid white',
            }}
            aria-hidden="true"
          />
        </button>

        {/* User pill */}
        <div className="topbar-user" role="button" tabIndex={0} aria-label="Account menu">
          <div className="topbar-user-avatar" aria-hidden="true">JD</div>
          <span className="topbar-user-name">John Doe</span>
          <ChevronDown size={13} color="var(--text-muted)" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
