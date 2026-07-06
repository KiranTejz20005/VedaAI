'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import {
  LayoutGrid,
  Settings,
  X,
  Users,
  FileText,
  Smartphone,
  History,
  Sparkles,
  GraduationCap,
  FileCheck,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';

const NAV_ITEMS = [
  { href: '/dashboard/teacher', label: 'Home', icon: LayoutGrid, exact: true },
  { href: '/dashboard/teacher/groups', label: 'My Groups', icon: Users },
  { href: '/dashboard/teacher/assessments', label: 'Assignments', icon: FileText },
  { href: '/dashboard/teacher/attendance', label: 'Attendance', icon: GraduationCap },
  { href: '/dashboard/teacher/leave', label: 'Leave Requests', icon: FileCheck },
  { href: '/dashboard/teacher/copilot', label: 'AI Copilot', icon: Sparkles },
  { href: '/dashboard/teacher/insights', label: 'Class Insights', icon: LayoutGrid },
  { href: '/ai-toolkit', label: 'AI Teacher\'s Toolkit', icon: Smartphone },
  { href: '/dashboard/teacher/library', label: 'My Library', icon: History },
  { href: '/grader', label: 'Evaluations', icon: FileCheck },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { user } = useAuthStore();
  const { availableOrganizations, activeOrganizationId } = useAdminAuthStore();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const [assignmentCount, setAssignmentCount] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      api.get('/assignments').then((res: any) => {
        if (res.data?.pagination?.total !== undefined) {
          setAssignmentCount(res.data.pagination.total);
        } else if (res.data?.data) {
          setAssignmentCount(res.data.data.length);
        }
      }).catch(console.error);
    }
  }, [user]);

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
            style={{ background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">V</text>
            </svg>
          </div>
          <span className="sidebar-logo-text" style={{ fontWeight: 800 }}>VedaAI</span>
          <button className="sidebar-close-btn" onClick={close} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <Link href="/ai-toolkit" className="sidebar-create-btn" onClick={close} style={{ background: '#1F2937', color: 'white', border: '1px solid #F97316' }}>
          <Sparkles size={14} fill="#F97316" color="#F97316" />
          AI Teacher's Toolkit
        </Link>

        <nav className="sidebar-nav" aria-label="Pages">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            const displayBadge = label === 'Assignments' ? assignmentCount : undefined;
            return (
              <Link key={label} href={href} className={`sidebar-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={close}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                  <span>{label}</span>
                </div>
                {displayBadge !== undefined && displayBadge !== null && (
                  <span style={{ background: '#F97316', color: 'white', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', marginLeft: 'auto' }}>
                    {displayBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link href="/settings" className="sidebar-settings" onClick={close}>
            <Settings size={18} aria-hidden="true" />
            <span>Settings</span>
          </Link>
          
          {user && (() => {
            const getInstituteDetails = (email?: string) => {
              if (!email) return { name: user?.organizationName || 'Educational Institute', location: 'Campus', initials: 'EI' };
              const domain = email.split('@')[1]?.split('.')[0]?.toLowerCase();
              
              switch(domain) {
                case 'spec':
                  return { name: "St. Peter's Engineering College", location: 'Hyderabad', initials: 'SPEC' };
                case 'scs':
                  return { name: "Sri Chaithanya Schools", location: 'Campus', initials: 'SCS' };
                default:
                  const fallbackName = user?.organizationName || (domain ? domain.toUpperCase() : 'Educational Institute');
                  const initials = fallbackName.substring(0, 3).toUpperCase();
                  return { name: fallbackName, location: 'Campus', initials };
              }
            };
            const institute = getInstituteDetails(user.email);

            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F3F4F6', borderRadius: '12px', margin: '16px' }}>
                <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={`https://ui-avatars.com/api/?name=${institute.initials}&background=10B981&color=fff&rounded=true&bold=true`} alt="Org Logo" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={institute.name}>{institute.name}</span>
                  <span style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{institute.location}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </aside>
    </>
  );
}
