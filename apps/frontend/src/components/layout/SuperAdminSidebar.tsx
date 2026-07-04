'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Settings,
  X,
  Users,
  Activity,
  Zap,
  BookOpen,
  Building2,
  History,
  BarChart3
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useSystemStore } from '@/store/system.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { ROUTES } from '@/config/routes';

const NAV_ITEMS = [
  { href: ROUTES.SUPER_ADMIN.DASHBOARD, label: 'Super Admin Overview', icon: LayoutGrid, exact: true },
  { href: ROUTES.SUPER_ADMIN.SYSTEM_HEALTH, label: 'System Health', icon: Activity },
  { href: ROUTES.SUPER_ADMIN.PROVIDERS, label: 'AI Providers', icon: Zap },
  { href: ROUTES.SUPER_ADMIN.KNOWLEDGE_BASE, label: 'Knowledge Base', icon: BookOpen },
  { href: ROUTES.SUPER_ADMIN.USERS, label: 'Global Users', icon: Users },
  { href: ROUTES.SUPER_ADMIN.ORGANIZATIONS, label: "Manage Org's", icon: Building2 },
  { href: ROUTES.SUPER_ADMIN.ANALYTICS, label: 'Analytics', icon: BarChart3 },
  { href: ROUTES.SUPER_ADMIN.AUDIT, label: 'Audit Logs', icon: History },
  { href: ROUTES.SUPER_ADMIN.SETTINGS, label: 'Settings', icon: Settings },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { user } = useAuthStore();
  const { settings } = useSystemStore();
  const { availableOrganizations, activeOrganizationId } = useAdminAuthStore();

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
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
          ) : (
            <div className="sidebar-logo-icon" aria-hidden="true" style={{ background: settings?.brandColor || 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">S</text>
              </svg>
            </div>
          )}
          <span className="sidebar-logo-text" style={{ fontWeight: 800 }}>{settings?.platformName || 'Vidya AI Admin'}</span>
          <button className="sidebar-close-btn" onClick={close} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <nav className="sidebar-nav" aria-label="Pages">
          <div className="sidebar-nav-section-label">Management</div>
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={label} href={href} className={`sidebar-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={close}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {availableOrganizations && (
          <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Active Organization</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {availableOrganizations.find(org => org.id === activeOrganizationId)?.name || user?.organizationName || 'Not Selected'}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
