'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Settings,
  User,
  X,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';

const NAV_ITEMS = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/student/lessons', label: 'My Lessons', icon: BookOpen },
  { href: '/student/assessments', label: 'Assessments', icon: ClipboardCheck },
  { href: '/student/results', label: 'Results', icon: TrendingUp },
  { href: '/profile', label: 'Profile', icon: User },
];

export function StudentSidebar() {
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
      <aside role="navigation" aria-label="Main navigation" style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "260px", height: "100vh", background: "#FFFFFF", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", zIndex: 40, overflow: "hidden" }}>
        <div className="sidebar-logo">
          <div
            className="sidebar-logo-icon"
            aria-hidden="true"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">V</text>
            </svg>
          </div>
          <span className="sidebar-logo-text" style={{ fontWeight: 800 }}>Student</span>
          <button className="sidebar-close-btn" onClick={close} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <nav className="sidebar-nav" aria-label="Pages" style={{ marginTop: 24 }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={href} href={href} className={`sidebar-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={close}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link href="/settings" className="sidebar-settings" onClick={close}>
            <Settings size={18} aria-hidden="true" />
            <span>Settings</span>
          </Link>

          <div className="sidebar-profile" role="button" tabIndex={0} aria-label="Account settings">
            <div className="sidebar-profile-avatar" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Student'}
              </div>
              <div className="sidebar-profile-sub">
                {availableOrganizations.find(org => org.id === activeOrganizationId)?.name || user?.organizationName || 'Student'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
