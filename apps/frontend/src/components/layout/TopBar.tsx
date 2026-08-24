'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, Menu, LogOut, Settings, ArrowLeft, Building2 } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import Notification2 from '@/components/ui/Notification2';
import Link from 'next/link';

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const toggle = useSidebarStore((s) => s.toggle);
  const showBackButton = pathname !== '/' && pathname !== '/dashboard' && pathname !== '/student' && pathname !== '/teacher' && pathname !== '/faculty' && pathname !== '/admin' && pathname !== '/super-admin';
  const { availableOrganizations, activeOrganizationId, fetchAvailableOrganizations } = useAdminAuthStore();

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchAvailableOrganizations();
    }
  }, [user?.role, fetchAvailableOrganizations]);

  useEffect(() => {
    if (!isDropdownOpen && !isOrgSwitcherOpen && !isNotificationOpen) return;
    const handleClose = () => {
      setIsDropdownOpen(false);
      setIsOrgSwitcherOpen(false);
      setIsNotificationOpen(false);
    };
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isDropdownOpen, isOrgSwitcherOpen, isNotificationOpen]);

  const handleSwitchOrg = async (orgId: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    const success = await useAdminAuthStore.getState().switchOrganization(orgId);
    setIsSwitching(false);
    setIsOrgSwitcherOpen(false);
    if (success) {
      const state = useAuthStore.getState();
      if (state.user?.role === 'SUPER_ADMIN') {
        router.push('/super-admin');
      } else {
        router.push('/dashboard');
      }
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User Account';
  const userInitials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 w-full px-3 sm:px-6 py-2.5 sm:py-3 bg-transparent">
      {/* Floating Pill Topbar */}
      <div className="mx-auto flex h-14 w-full items-center justify-between gap-3 rounded-full border border-neutral-200/90 bg-white px-3.5 sm:px-5 shadow-xs">
        
        {/* Left Section: Mobile Menu & Back Button */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={toggle}
            className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Section: Actions & Profile Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Super Admin Org Switcher Pill */}
          {isSuperAdmin && availableOrganizations.length > 0 && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOrgSwitcherOpen(!isOrgSwitcherOpen);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors border border-neutral-200/60"
              >
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {availableOrganizations.find((o) => o.id === activeOrganizationId)?.name || 'Select Org'}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {isOrgSwitcherOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-neutral-200 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Switch Organization
                  </div>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {availableOrganizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => handleSwitchOrg(org.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                          org.id === activeOrganizationId
                            ? 'bg-neutral-900 text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span className="truncate">{org.name}</span>
                        {org.id === activeOrganizationId && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Bell Pill Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsNotificationOpen(!isNotificationOpen);
              }}
              className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200/80 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors relative"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            {isNotificationOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-80 sm:w-96 z-50"
              >
                <Notification2 />
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-neutral-50 border border-neutral-200/80 hover:bg-neutral-100/90 transition-all cursor-pointer group"
            >
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden">
                  {user?.avatar || (user as any)?.avatarUrl ? (
                    <img
                      src={user?.avatar || (user as any)?.avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    userInitials || 'U'
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-neutral-800 max-w-[100px] truncate">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-neutral-200/90 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                  <p className="text-xs font-bold text-neutral-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {user?.email || 'user@vidyaai.com'}
                  </p>
                  {user?.role && (
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                      {user.role}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-neutral-400" />
                    Account Settings
                  </Link>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

