'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, Menu, LogOut, User, Settings, ChevronRight, Building2, Grid2x2 } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';

const BREADCRUMB_MAP: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/papers': 'Paper Mgmt',
  '/generate': 'Quick Generate',
  '/settings': 'Settings',
  '/assignments/create': 'Create Assessment',
  '/grader': 'Grader',
  '/student/lessons': 'My Lessons',
  '/profile': 'Profile',
  '/super-admin/dashboard': 'Dashboard',
  '/super-admin/organizations': 'Organizations',
  '/super-admin/audit': 'Audit Logs',
  '/super-admin/settings': 'Settings',
  '/admin': 'Dashboard',
  '/admin/classes': 'Classes',
  '/admin/subjects': 'Subjects',
  '/admin/approvals': 'Approvals',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
};

function getBreadcrumb(pathname: string): { parent?: string; current: string } {
  if (BREADCRUMB_MAP[pathname]) {
    return { current: BREADCRUMB_MAP[pathname] };
  }

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length > 0) {
    if (parts[0] === 'assignments' && parts.length > 2) {
      if (parts[2] === 'paper') return { parent: 'Paper', current: 'View Exam Paper' };
      return { parent: 'Assignments', current: 'Details' };
    }

    const currentSegment = parts[parts.length - 1];
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentSegment);
    const currentLabel = isUuid ? 'Details' : currentSegment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    if (parts.length > 1) {
      const parentSegment = parts[parts.length - 2];
      const isParentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parentSegment);
      const parentLabel = isParentUuid ? 'Assignment' : parentSegment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      return { parent: parentLabel, current: currentLabel };
    }
    return { current: currentLabel };
  }

  return { current: 'Dashboard' };
}

export function Topbar() {
  const pathname = usePathname();
  const { parent, current } = getBreadcrumb(pathname);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const toggle = useSidebarStore((s) => s.toggle);
  const showBackButton = pathname !== '/' && pathname !== '/dashboard';
  const { availableOrganizations, activeOrganizationId, fetchAvailableOrganizations } = useAdminAuthStore();

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchAvailableOrganizations();
    }
  }, [user?.role, fetchAvailableOrganizations]);

  useEffect(() => {
    if (!isDropdownOpen && !isOrgSwitcherOpen) return;
    const handleClose = () => {
      setIsDropdownOpen(false);
      setIsOrgSwitcherOpen(false);
    };
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isDropdownOpen, isOrgSwitcherOpen]);

  const handleSwitchOrg = async (orgId: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    const success = await useAdminAuthStore.getState().switchOrganization(orgId);
    setIsSwitching(false);
    setIsOrgSwitcherOpen(false);
    if (success) {
      const state = useAuthStore.getState();
      if (state.user?.role === 'SUPER_ADMIN') {
        window.location.href = '/dashboard/super-admin';
      } else {
        window.location.href = '/dashboard';
      }
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <header 
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        height: '72px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        width: '100%'
      }}
    >
      <div className="desktop-topbar-content">
        <button className="topbar-hamburger" onClick={toggle} aria-label="Toggle navigation menu">
          <Menu size={20} aria-hidden="true" />
        </button>

        <div className="topbar-breadcrumb">
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="topbar-icon-btn topbar-back-btn"
              aria-label="Go back"
              style={{ width: 32, height: 32 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {parent && (
              <>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{parent}</span>
                <ChevronRight size={14} aria-hidden="true" style={{ color: '#9CA3AF', flexShrink: 0 }} />
              </>
            )}
            <span className="topbar-breadcrumb-current" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {current === 'Dashboard' && <Grid2x2 size={14} color="#9CA3AF" />}
              {current}
            </span>
          </div>
        </div>

        <div className="topbar-actions">
          {isSuperAdmin && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOrgSwitcherOpen(!isOrgSwitcherOpen); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  background: 'linear-gradient(145deg, #ffffff, #f9fafb)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.8)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#F3F4F6',
                  color: '#4B5563'
                }}>
                  <Building2 size={13} />
                </div>
                <span style={{ 
                  maxWidth: '120px', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em'
                }}>
                  {availableOrganizations.find(org => org.id === activeOrganizationId)?.code || user?.organizationCode || 'Select Org'}
                </span>
                <ChevronDown size={14} color="#9CA3AF" style={{ 
                  transition: 'transform 0.2s', 
                  transform: isOrgSwitcherOpen ? 'rotate(180deg)' : 'rotate(0)' 
                }} />
              </button>

              {isOrgSwitcherOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 8,
                    minWidth: 200,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: 6,
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '6px 10px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Switch Organization
                  </div>
                  {availableOrganizations.length === 0 ? (
                    <div style={{ padding: '8px 10px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                      No organizations found
                    </div>
                  ) : (
                    availableOrganizations.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        disabled={isSwitching || org.id === activeOrganizationId}
                        onClick={() => handleSwitchOrg(org.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 10px',
                          border: 'none',
                          background: org.id === activeOrganizationId ? 'var(--bg-hover)' : 'transparent',
                          borderRadius: 'var(--radius-sm)',
                          cursor: org.id === activeOrganizationId ? 'default' : 'pointer',
                          fontSize: 'var(--text-sm)',
                          fontWeight: org.id === activeOrganizationId ? 600 : 500,
                          color: 'var(--text-primary)',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                        onMouseEnter={(e) => { if (org.id !== activeOrganizationId) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { if (org.id !== activeOrganizationId) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Building2 size={14} color="var(--text-muted)" />
                        <span style={{ flex: 1 }}>{org.name}</span>
                        {org.id === activeOrganizationId && (
                          <span style={{ fontSize: 10, color: '#EA580C', fontWeight: 600 }}>Active</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <button className="topbar-icon-btn" aria-label="Notifications">
            <Bell size={18} aria-hidden="true" />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: '#EF4444', borderRadius: '50%', border: '1.5px solid white' }} aria-hidden="true" />
          </button>

          <div
            className="topbar-user"
            role="button"
            tabIndex={0}
            aria-label="Account menu"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            style={{ position: 'relative' }}
          >
            <div className="topbar-user-avatar" aria-hidden="true">
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="topbar-user-name">
              {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
            </span>
            <ChevronDown size={13} color="#6B7280" aria-hidden="true" />

            {isDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  width: 220,
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: 8,
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ padding: '8px 12px', textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {user?.email}
                  </div>
                  {user?.role && (
                    <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, background: 'rgba(234, 88, 12, 0.1)', color: '#EA580C', padding: '2px 6px', borderRadius: 4, marginTop: 6, textTransform: 'capitalize' }}>
                      {user.role.toLowerCase().replace('_', ' ')}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                <button
                  type="button"
                  onClick={() => { setIsDropdownOpen(false); router.push('/profile'); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={14} /> Profile
                </button>

                <button
                  type="button"
                  onClick={() => { setIsDropdownOpen(false); router.push('/settings'); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Settings size={14} /> Settings
                </button>

                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                <button
                  type="button"
                  onClick={async () => {
                    setIsDropdownOpen(false);
                    await logout();
                    router.push('/login');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    color: '#EF4444',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mobile-topbar-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-logo-icon" style={{
            width: 30,
            height: 30,
            background: 'linear-gradient(135deg, #F97316 0%, #E8531D 50%, #C2410C 100%)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H8.5L12 15L15.5 4H20L14.5 20H9.5L4 4Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>VidyaAI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button aria-label="Notifications" className="topbar-icon-btn" style={{ width: 32, height: 32 }}>
            <Bell size={16} />
            <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, background: '#EF4444', borderRadius: '50%', border: '1.5px solid white' }} />
          </button>

          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#EA580C" /><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="#EA580C" /></svg>
          </div>

          <button onClick={toggle} aria-label="Toggle navigation menu" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
