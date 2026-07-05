'use client';

import { useState, useEffect } from 'react';
import { Menu, ShieldAlert, ArrowLeft, UserCircle, ChevronRight, LogOut } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export function AdminTopbar() {
  const { toggle } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const { isImpersonating, exitImpersonation, availableOrganizations, activeOrganizationId, fetchAvailableOrganizations } = useAdminAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchOrg = async (orgId: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    const success = await useAdminAuthStore.getState().switchOrganization(orgId);
    setIsSwitching(false);
    setIsOrgSwitcherOpen(false);
    if (success) {
      const state = useAuthStore.getState();
      if (state.user?.role === 'SUPER_ADMIN') {
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = '/dashboard/super-admin';
      } else {
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = '/dashboard';
      }
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

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

  // Create human-readable breadcrumbs from the pathname
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = paths.map((path, index) => {
    const href = '/' + paths.slice(0, index + 1).join('/');
    const label = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
    const isLast = index === paths.length - 1;
    return { href, label, isLast };
  });

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      height: '60px',
      background: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      flexShrink: 0,
    }}>
      {/* Impersonation Banner Alert */}
      {isImpersonating && (
        <div className="w-full bg-amber-500 text-white px-4 py-2 text-xs md:text-sm font-semibold flex items-center justify-between gap-2 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>
              Impersonation Active: Viewing workspace as <strong>{user?.email}</strong> ({user?.role})
            </span>
          </div>
          <button
            onClick={() => exitImpersonation()}
            className="bg-white text-amber-700 hover:bg-amber-100 px-3 py-1 rounded-md font-bold transition-all text-xs flex items-center gap-1 shadow-sm"
          >
            <ArrowLeft size={12} />
            Exit Impersonation
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '60px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={toggle}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
            <Link href="/dashboard" style={{ color: '#6B7280' }} className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            {breadcrumbs.filter(b => b.href !== '/dashboard' && b.href !== '/admin' && b.href !== '/dashboard/admin').map((b) => (
              <div key={b.href} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ChevronRight size={12} color="#9CA3AF" />
                {b.isLast ? (
                  <span style={{ color: '#111827', fontWeight: 600 }}>{b.label}</span>
                ) : (
                  <span style={{ color: '#6B7280' }}>{b.label}</span>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <path d="M9 22v-4h6v4"></path>
                    <path d="M8 6h.01"></path>
                    <path d="M16 6h.01"></path>
                    <path d="M12 6h.01"></path>
                    <path d="M12 10h.01"></path>
                    <path d="M12 14h.01"></path>
                    <path d="M16 10h.01"></path>
                    <path d="M16 14h.01"></path>
                    <path d="M8 10h.01"></path>
                    <path d="M8 14h.01"></path>
                  </svg>
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
                <ChevronRight size={14} color="#9CA3AF" style={{ 
                  transition: 'transform 0.2s', 
                  transform: isOrgSwitcherOpen ? 'rotate(90deg)' : 'rotate(0)' 
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
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
              {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>{user?.email}</div>
          </div>

          <div 
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', cursor: 'pointer' }}
          >
            <UserCircle size={22} />
          </div>

          {isDropdownOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '8px',
                width: '160px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                padding: '4px',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <button
                onClick={async () => {
                  setIsDropdownOpen(false);
                  await logout();
                  router.push('/login');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#EF4444',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
