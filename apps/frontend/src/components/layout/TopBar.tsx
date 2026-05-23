'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Bell, ChevronDown, Menu } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';

const BREADCRUMB_MAP: Record<string, string> = {
  '/': 'Create New',
  '/dashboard': 'Assignment',
  '/assignments/create': 'Assignment',
  '/toolkit': "AI Teacher's Toolkit",
  '/library': 'My Library',
};

function getBreadcrumb(pathname: string): { parent?: string; current: string } {
  if (pathname === '/') {
    return { current: 'Create New' };
  }
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

  const showBackButton = pathname === '/' || pathname.startsWith('/assignments/');

  return (
    <header className="topbar" role="banner">
      {/* Desktop-only TopBar Content */}
      <div className="desktop-topbar-content">
        {/* Hamburger — mobile only (used in desktop style if needed, but hidden on desktop width) */}
        <button
          className="topbar-hamburger"
          onClick={toggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        {/* Breadcrumb / Back Navigation */}
        <div className="topbar-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showBackButton && (
            <button 
              onClick={() => window.history.back()}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#374151',
                transition: 'all 0.15s ease'
              }}
              aria-label="Go back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {parent && (
              <>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{parent}</span>
                <ChevronRight size={14} aria-hidden="true" style={{ color: '#9CA3AF' }} />
              </>
            )}
            {current === 'Create New' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9CA3AF', fontSize: '14px', fontWeight: '500' }}>
                <span style={{ fontSize: '18px', fontWeight: '400', lineHeight: 1 }}>+</span>
                <span>Create New</span>
              </div>
            ) : (
              <span className="topbar-breadcrumb-current" style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{current}</span>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Notification bell */}
          <button className="topbar-icon-btn" aria-label="Notifications" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Bell size={18} style={{ color: '#374151' }} aria-hidden="true" />
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '7px',
                height: '7px',
                background: '#EF4444',
                borderRadius: '50%',
                border: '1.5px solid white',
              }}
              aria-hidden="true"
            />
          </button>

          {/* User pill */}
          <div 
            className="topbar-user" 
            role="button" 
            tabIndex={0} 
            aria-label="Account menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px 4px 4px',
              borderRadius: '100px',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              cursor: 'pointer',
              height: '36px'
            }}
          >
            <div 
              className="topbar-user-avatar" 
              aria-hidden="true"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#FFEDD5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#EA580C" />
                <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="#EA580C" />
              </svg>
            </div>
            <span className="topbar-user-name" style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>John Doe</span>
            <ChevronDown size={13} color="#6B7280" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Mobile-only TopBar Content */}
      <div className="mobile-topbar-content">
        {/* Left logo section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{ 
              background: '#111827', 
              borderRadius: '8px', 
              width: '30px', 
              height: '30px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>VedaAI</span>
        </div>

        {/* Right actions section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Notification bell */}
          <button 
            aria-label="Notifications" 
            style={{ 
              background: '#FFFFFF', 
              border: '1px solid #E5E7EB', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <Bell size={16} style={{ color: '#374151' }} />
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '6px',
                height: '6px',
                background: '#EF4444',
                borderRadius: '50%',
                border: '1.5px solid white',
              }}
            />
          </button>

          {/* User profile picture */}
          <div 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#FFEDD5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid #E5E7EB'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#EA580C" />
              <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="#EA580C" />
            </svg>
          </div>

          {/* Hamburger button (two lines) */}
          <button
            onClick={toggle}
            aria-label="Toggle navigation menu"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
            }}
          >
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
