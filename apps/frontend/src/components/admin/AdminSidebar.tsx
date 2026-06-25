'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  School,
  Users,
  PieChart,
  Settings,
  X,
  LogOut,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';

type NavItem = {
  href: string;
  label: string;
  icon: React.FC<{ size?: number; strokeWidth?: number }>;
  exact?: boolean;
};

type NavSection = {
  section: string;
  items: NavItem[];
};

const ADMIN_NAV: NavSection[] = [
  {
    section: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutGrid, exact: true },
    ],
  },
  {
    section: 'Tenant Management',
    items: [
      { href: '/admin/institutions', label: 'Organizations', icon: School },
      { href: '/admin/users', label: 'Faculty and Students', icon: Users },
    ],
  },
  {
    section: 'Reports',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: PieChart },
      { href: '/admin/audit', label: 'Audit Logs', icon: Activity },
    ],
  },
  {
    section: 'System',
    items: [
      { href: '/admin/settings', label: 'Portal Settings', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { user, logout } = useAuthStore();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <>
      {isOpen && (
        <div
          onClick={close}
          aria-hidden="true"
          style={{ display: 'block', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 39 }}
        />
      )}

      <aside
        role="navigation"
        aria-label="Admin navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '240px',
          background: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 16px 16px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div
            aria-hidden="true"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '14px', color: '#111827', flex: 1 }}>VidyaAI Admin</span>
          <button
            onClick={close}
            aria-label="Close navigation"
            className="lg:hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Admin Operations"
          style={{ flex: 1, padding: '8px', overflowY: 'auto' }}
        >
          {ADMIN_NAV.map(({ section, items }) => (
            <div key={section} style={{ marginBottom: '4px' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#9CA3AF',
                padding: '12px 8px 4px',
              }}>
                {section}
              </div>
              {items.map(({ href, label, icon: Icon, exact = false }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: active ? 600 : 500,
                      color: active ? '#1D4ED8' : '#374151',
                      background: active ? '#EFF6FF' : 'transparent',
                      textDecoration: 'none',
                      marginBottom: '2px',
                      transition: 'all 0.15s',
                    }}
                    className="admin-nav-item"
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: Sign out + profile */}
        <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 8px', flexShrink: 0 }}>
          <button
            onClick={() => logout()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#DC2626',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              marginBottom: '8px',
              transition: 'background 0.15s',
            }}
            className="admin-signout-btn"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px' }}>
            <div
              aria-hidden="true"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
                color: 'white',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
              </div>
              <div style={{
                fontSize: '10px',
                background: '#EFF6FF',
                color: '#1D4ED8',
                borderRadius: '4px',
                padding: '1px 6px',
                display: 'inline-block',
                fontWeight: 600,
                marginTop: '2px',
              }}>
                {user?.role || 'SUPER_ADMIN'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        .admin-nav-item:hover {
          background: #F9FAFB !important;
          color: #1D4ED8 !important;
        }
        .admin-signout-btn:hover {
          background: #FEF2F2 !important;
        }
      `}</style>
    </>
  );
}
