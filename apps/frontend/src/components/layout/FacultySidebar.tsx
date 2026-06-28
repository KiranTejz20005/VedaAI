'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  BookOpen,
  Settings,
  X,
  GraduationCap,
  FileText,
  Sparkles,
  BrainCircuit,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';

function QuestionBankIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      <circle cx="12" cy="11" r="2" />
      <path d="M8 16c0-1.5 1.5-2.5 4-2.5s4 1 4 2.5" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: '/dashboard/faculty', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/dashboard/teacher', label: 'Teachers', icon: Users },
  { href: '/classes', label: 'Students', icon: GraduationCap },
  { href: '/analytics', label: 'Reports', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BrainCircuit },
  { href: '/my-classes', label: 'My Classes', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function FacultySidebar() {
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
            style={{ background: 'linear-gradient(135deg, #F97316 0%, #E8531D 50%, #C2410C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">V</text>
            </svg>
          </div>
          <span className="sidebar-logo-text" style={{ fontWeight: 800 }}>Faculty</span>
          <button className="sidebar-close-btn" onClick={close} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <Link href="/generate" className="sidebar-create-btn" onClick={close}>
          <Sparkles size={14} fill="white" stroke="white" />
          Generate
        </Link>

        <nav className="sidebar-nav" aria-label="Pages">
          <div className="sidebar-nav-section-label">Academics</div>
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
