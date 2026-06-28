'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { useSystemStore } from '@/store/system.store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/dashboard/admin/users', label: 'Faculty and Students', icon: Users },
  { href: '/dashboard/admin/classes', label: 'Classes', icon: BookOpen },
  { href: '/dashboard/admin/approvals', label: 'Approvals', icon: ClipboardCheck },
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
];

export function OrgAdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { user } = useAuthStore();
  const { availableOrganizations, activeOrganizationId } = useAdminAuthStore();
  const { settings } = useSystemStore();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={close} aria-hidden="true" />
      )}
      <aside role="navigation" aria-label="Main navigation" style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "260px", height: "100vh", background: "#FFFFFF", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", zIndex: 40, overflow: "hidden" }}>
        <div className="sidebar-logo">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
          ) : (
            <div
              className="sidebar-logo-icon"
              aria-hidden="true"
              style={{ background: settings?.brandColor || 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">A</text>
              </svg>
            </div>
          )}
          <span className="sidebar-logo-text" style={{ fontWeight: 800 }}>{settings?.platformName || 'Admin'}</span>
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


      </aside>
    </>
  );
}
