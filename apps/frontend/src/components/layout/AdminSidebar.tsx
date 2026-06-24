'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  PieChart,
  Settings,
  X,
  GraduationCap,
  Users,
  ClipboardCheck,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';

function MyGroupsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      <circle cx="12" cy="11" r="2" />
      <path d="M8 16c0-1.5 1.5-2.5 4-2.5s4 1 4 2.5" />
    </svg>
  );
}

const ADMIN_NAV_ITEMS = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/students', label: 'Students', icon: GraduationCap },
  { href: '/dashboard/admin/faculty', label: 'Faculty', icon: Building2 },
  { href: '/dashboard/admin/classes', label: 'Classes', icon: ClipboardCheck },
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: PieChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const SUPER_ADMIN_NAV_ITEMS = [
  { href: '/dashboard/super-admin', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/super-admin/organizations', label: 'Organizations', icon: Building2 },
  { href: '/super-admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/students', label: 'Students', icon: GraduationCap },
  { href: '/dashboard/admin/classes', label: 'Classes', icon: ClipboardCheck },
  { href: '/super-admin/analytics', label: 'Analytics', icon: PieChart },
  { href: '/super-admin/audit', label: 'Security & Logs', icon: ShieldCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { user } = useAuthStore();
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
          <div className="sidebar-logo-icon" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">S</text>
            </svg>
          </div>
          <span className="sidebar-logo-text" style={{ fontWeight: 800 }}>Shiksha Admin</span>
          <button className="sidebar-close-btn" onClick={close} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <nav className="sidebar-nav" aria-label="Pages">
          <div className="sidebar-nav-section-label">Management</div>
          {(user?.role === 'SUPER_ADMIN' ? SUPER_ADMIN_NAV_ITEMS : ADMIN_NAV_ITEMS).map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={label} href={href} className={`sidebar-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={close}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile" role="button" tabIndex={0} aria-label="Account settings">
            <div className="sidebar-profile-avatar" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #059669, #10B981)', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Admin User'}
              </div>
              <div className="sidebar-profile-sub">
                {availableOrganizations.find(org => org.id === activeOrganizationId)?.name || user?.organizationName || 'System Admin'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
