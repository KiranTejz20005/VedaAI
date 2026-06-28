'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Building2,
  ScrollText,
  Settings,
  X,
  LogOut,
  Users,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useSystemStore } from '@/store/system.store';

const NAV_ITEMS = [
  { href: '/dashboard',                   label: 'Dashboard',         icon: LayoutGrid, exact: true },
  { href: '/super-admin/organizations',   label: 'Organizations',     icon: Building2 },
  { href: '/super-admin/users',           label: 'User Directory',    icon: Users },
  { href: '/super-admin/audit',           label: 'Audit Logs',        icon: ScrollText },
  { href: '/super-admin/settings',        label: 'Settings',          icon: Settings },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const { settings } = useSystemStore();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {isOpen && (
        <div
          onClick={close}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 39 }}
        />
      )}

      <aside
        role="navigation"
        aria-label="Super Admin navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '260px',
          height: '100vh',
          background: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 16px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: settings?.brandColor || 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="system-ui,sans-serif">S</text>
              </svg>
            </div>
          )}
          <span style={{ fontWeight: 800, fontSize: 14, color: '#111827', flex: 1 }}>{settings?.platformName || 'Super Admin'}</span>
          <button
            onClick={close}
            aria-label="Close navigation"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Platform pages"
          style={{ flex: 1, padding: '8px', overflowY: 'auto' }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', padding: '12px 8px 4px' }}>
            Platform
          </div>

          {NAV_ITEMS.map(({ href, label, icon: Icon, exact = false }) => {
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
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#7C3AED' : '#374151',
                  background: active ? '#F5F3FF' : 'transparent',
                  textDecoration: 'none',
                  marginBottom: 2,
                  transition: 'all 0.15s',
                }}
                className="super-admin-nav-item"
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Sign out + profile */}
        <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 8px', flexShrink: 0 }}>
          <button
            onClick={() => logout()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: '#DC2626',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              marginBottom: 8,
              transition: 'background 0.15s',
            }}
            className="super-admin-signout-btn"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>


        </div>
      </aside>

      <style>{`
        .super-admin-nav-item:hover {
          background: #F5F3FF !important;
          color: #7C3AED !important;
        }
        .super-admin-signout-btn:hover {
          background: #FEF2F2 !important;
        }
      `}</style>
    </>
  );
}
