'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight, Bell, Menu, ChevronDown, Grid2x2 } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';

const BREADCRUMB_MAP: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Assignment',
  '/assignments/create': 'Assignment',
  '/toolkit': "AI Teacher's Toolkit",
  '/library': 'My Library',
};

function getBreadcrumb(pathname: string): { parent?: string; current: string } {
  if (pathname === '/') return { current: 'Home' };
  if (pathname.startsWith('/assignments/') && pathname.endsWith('/paper'))
    return { parent: 'Assignment', current: 'Paper View' };
  if (pathname.startsWith('/assignments/') && pathname !== '/assignments/create')
    return { parent: 'Assignment', current: 'Details' };
  return { current: BREADCRUMB_MAP[pathname] ?? 'Assignment' };
}

export function TopBar() {
  const pathname = usePathname();
  const { parent, current } = getBreadcrumb(pathname);
  const toggle = useSidebarStore((s) => s.toggle);
  const showBackButton = pathname === '/dashboard' || pathname.startsWith('/assignments/');
  const [hiddenOnScroll, setHiddenOnScroll] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      if (currentY <= 8) {
        setHiddenOnScroll(false);
      } else if (delta > 8) {
        setHiddenOnScroll(true);
      } else if (delta < -8) {
        setHiddenOnScroll(false);
      }
      lastY = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`topbar ${hiddenOnScroll ? 'topbar-hidden' : ''}`} role="banner">
      {/* Desktop content */}
      <div className="desktop-topbar-content">
        <button className="topbar-hamburger" onClick={toggle} aria-label="Toggle navigation menu">
          <Menu size={20} aria-hidden="true" />
        </button>

        <div className="topbar-breadcrumb">
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="topbar-icon-btn topbar-back-btn"
              aria-label="Go back"
              style={{ width: 32, height: 32 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {parent && (
              <>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{parent}</span>
                <ChevronRight size={14} aria-hidden="true" style={{ color: '#9CA3AF', flexShrink: 0 }} />
              </>
            )}
            {current === 'Create New' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9CA3AF', fontSize: 'var(--text-base)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 18, fontWeight: 400, lineHeight: 1 }}>+</span>
                <span>Create New</span>
              </div>
            ) : (
              <span className="topbar-breadcrumb-current" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {current === 'Assignment' && <Grid2x2 size={14} color="#9CA3AF" />}
                {current}
              </span>
            )}
          </div>
        </div>

        <div className="topbar-actions">
          <button className="topbar-icon-btn" aria-label="Notifications">
            <Bell size={18} aria-hidden="true" />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: '#EF4444', borderRadius: '50%', border: '1.5px solid white' }} aria-hidden="true" />
          </button>

          <div className="topbar-user" role="button" tabIndex={0} aria-label="Account menu">
            <div className="topbar-user-avatar" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="white" /><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="white" /></svg>
            </div>
            <span className="topbar-user-name">John Doe</span>
            <ChevronDown size={13} color="#6B7280" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Mobile content */}
      <div className="mobile-topbar-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-logo-icon" style={{
            width: 30,
            height: 30,
            background: 'linear-gradient(135deg, #F97316 0%, #E8531D 50%, #C2410C 100%)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H8.5L12 15L15.5 4H20L14.5 20H9.5L4 4Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>VedaAI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button aria-label="Notifications" className="topbar-icon-btn" style={{ width: 32, height: 32 }}>
            <Bell size={16} />
            <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, background: '#EF4444', borderRadius: '50%', border: '1.5px solid white' }} />
          </button>

          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#EA580C" /><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="#EA580C" /></svg>
          </div>

          <button onClick={toggle} aria-label="Toggle navigation menu" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
