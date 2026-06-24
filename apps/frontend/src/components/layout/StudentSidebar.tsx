'use client';

import { useState } from 'react';
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
  Users,
  MessageSquare,
  Volume2,
  Video,
  MessageCircle,
  Compass,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';

const NAV_ITEMS = [
  { href: '/dashboard/student', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/student/assessments', label: 'Tests', icon: ClipboardCheck },
  { href: '/assignments', label: 'Assignments', icon: BookOpen },
  { href: '/dashboard/student', label: 'Attendance', icon: User },
  { href: '/student/results', label: 'Results', icon: TrendingUp },
  { href: '/dashboard/student/community', label: 'Community', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const COMMUNITY_SUB_ITEMS = [
  { href: '/dashboard/student/community/discussions', label: 'Discussions', icon: MessageSquare },
  { href: '/dashboard/student/community/groups', label: 'Groups', icon: Users },
  { href: '/dashboard/student/community/voice', label: 'Voice Rooms', icon: Volume2 },
  { href: '/dashboard/student/community/meetings', label: 'Meetings', icon: Video },
  { href: '/dashboard/student/community/messages', label: 'Direct Messages', icon: MessageCircle },
  { href: '/dashboard/student/community/discover', label: 'Discover', icon: Compass },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { user } = useAuthStore();
  const { availableOrganizations, activeOrganizationId } = useAdminAuthStore();

  const [communityExpanded, setCommunityExpanded] = useState(() => pathname.startsWith('/dashboard/student/community'));
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (pathname.startsWith('/dashboard/student/community')) {
      setCommunityExpanded(true);
    }
  }

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

        <nav className="sidebar-nav" aria-label="Pages" style={{ marginTop: 24, flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
          <div style={{ padding: '0 16px', marginBottom: 8, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Main Menu
          </div>
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isCommunityItem = label === 'Community';

            if (isCommunityItem) {
              const active = isActive(href);
              return (
                <div key={href} className="flex flex-col">
                  <div 
                    onClick={() => setCommunityExpanded(!communityExpanded)}
                    className={`sidebar-nav-item${active ? ' active' : ''} flex items-center justify-between cursor-pointer`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                      <span>{label}</span>
                    </div>
                    {communityExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  
                  {communityExpanded && (
                    <div className="flex flex-col pl-4 ml-6 border-l border-gray-100 gap-0.5 mt-1 select-none">
                      {COMMUNITY_SUB_ITEMS.map((sub) => {
                        const subActive = isActive(sub.href);
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`sidebar-nav-item${subActive ? ' active' : ''}`}
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: '13px', 
                              height: 'auto',
                              marginLeft: 0,
                              marginRight: '12px',
                              borderRadius: '8px'
                            }}
                            onClick={close}
                          >
                            <SubIcon size={15} strokeWidth={subActive ? 2.5 : 2} />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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
