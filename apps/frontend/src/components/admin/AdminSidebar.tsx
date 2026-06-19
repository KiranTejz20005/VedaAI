'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  School,
  Building2,
  Users,
  KeyRound,
  GraduationCap,
  UsersRound,
  FileText,
  Database,
  ClipboardList,
  PieChart,
  Activity,
  CreditCard,
  Brain,
  ListChecks,
  Settings,
  X,
  LogOut
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/admin/institutions', label: 'Institutions', icon: School },
  { href: '/admin/departments', label: 'Departments', icon: Building2 },
  { href: '/admin/users', label: 'User Directory', icon: Users },
  { href: '/admin/roles', label: 'Roles & RBAC', icon: KeyRound },
  { href: '/admin/classes', label: 'Classes', icon: GraduationCap },
  { href: '/admin/groups', label: 'Study Groups', icon: UsersRound },
  { href: '/admin/papers', label: 'Paper Library', icon: FileText },
  { href: '/admin/question-bank', label: 'Question Bank', icon: Database },
  { href: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/admin/analytics', label: 'Extended Stats', icon: PieChart },
  { href: '/admin/audit', label: 'Audit Trail Logs', icon: Activity },
  { href: '/admin/billing', label: 'Billing & Plans', icon: CreditCard },
  { href: '/admin/ai-providers', label: 'AI Health & Config', icon: Brain },
  { href: '/admin/queues', label: 'BullMQ Job Queue', icon: ListChecks },
  { href: '/admin/settings', label: 'Portal Settings', icon: Settings },
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
        <div className="sidebar-overlay" onClick={close} aria-hidden="true" />
      )}

      <aside className={`sidebar${isOpen ? ' open' : ''}`} role="navigation" aria-label="Admin navigation">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">A</text>
            </svg>
          </div>
          <span className="sidebar-logo-text" style={{ fontWeight: 800 }}>VedaAI Admin</span>
          <button className="sidebar-close-btn" onClick={close} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400">
          Command Center
        </div>

        <nav className="sidebar-nav overflow-y-auto max-h-[calc(100vh-180px)]" aria-label="Admin Operations">
          {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-nav-item${active ? ' active' : ''}`}
                style={{
                  color: active ? '#1E3A8A' : undefined,
                  backgroundColor: active ? '#EFF6FF' : undefined
                }}
                aria-current={active ? 'page' : undefined}
                onClick={close}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" style={{ color: active ? '#2563EB' : undefined }} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            onClick={() => logout()}
            className="sidebar-settings w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>

          <div className="sidebar-profile" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="sidebar-profile-avatar" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
              </div>
              <div className="sidebar-profile-sub text-[10px] bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 inline-block font-semibold mt-0.5">
                {user?.role || 'SUPER_ADMIN'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
