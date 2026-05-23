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
        <div className="sidebar-logo" style={{ borderBottom: 'none', paddingBottom: '8px' }}>
          <div className="sidebar-logo-icon" style={{ background: '#111827', borderRadius: '8px', width: '32px', height: '32px' }} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <span className="sidebar-logo-text" style={{ fontSize: '19px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>VedaAI</span>
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
        <Link 
          href="/assignments/create" 
          className="sidebar-create-btn" 
          onClick={close}
          style={{
            background: '#2E3035',
            color: '#FFFFFF',
            border: '2px solid #E8531D',
            borderRadius: '100px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '600',
            margin: '12px 16px 16px',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={14} fill="currentColor" />
          Create Assignment
        </Link>

        {/* Nav items */}
        <nav className="sidebar-nav" aria-label="Pages" style={{ padding: '0px 16px' }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            // Highlight Assignments in the list or Home as active for home page
            const activeClass = active ? 'active' : '';
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-nav-item ${activeClass}`}
                aria-current={active ? 'page' : undefined}
                onClick={close}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: active ? '600' : '500',
                  color: active ? '#111827' : '#555A64',
                  background: active ? '#E5E7EB' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '2px',
                  transition: 'background 0.15s ease'
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ color: active ? '#111827' : '#7D8390' }} aria-hidden="true" />
                <span>{label}</span>
                {label === 'Assignments' && (
                  <span 
                    className="sidebar-nav-badge" 
                    aria-label="32 assignments"
                    style={{
                      marginLeft: 'auto',
                      background: '#EF4444',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '100px',
                      minWidth: '22px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    32
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom" style={{ borderTop: 'none', padding: '16px' }}>
          <Link 
            href="/settings" 
            className="sidebar-settings" 
            onClick={close}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#555A64',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}
          >
            <Settings size={18} aria-hidden="true" style={{ color: '#7D8390' }} />
            <span>Settings</span>
          </Link>

          {/* School/Profile */}
          <div 
            className="sidebar-profile" 
            role="button" 
            tabIndex={0} 
            aria-label="Account settings"
            style={{
              background: '#F3F4F6',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              border: '1px solid #E5E7EB'
            }}
          >
            <div 
              className="sidebar-profile-avatar"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#DCFCE7',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="sidebar-profile-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-profile-name" style={{ fontSize: '13px', fontWeight: '700', color: '#111827', lineHeight: '1.2' }}>Delhi Public School</div>
              <div className="sidebar-profile-sub" style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', lineHeight: '1.2' }}>Bokaro Steel City</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
