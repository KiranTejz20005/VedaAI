'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  X,
  Users,
  Activity,
  Zap,
  BookOpen,
  Building2,
  History,
  BarChart3,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useSystemStore } from '@/store/system.store';
import { ROUTES } from '@/config/routes';

interface NavItemConfig {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  exact?: boolean;
  badge?: {
    text: string;
    variant: 'neutral' | 'amber';
  };
}

interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close, isCollapsed, toggleCollapsed } = useSidebarStore();
  const { user } = useAuthStore();
  const { settings } = useSystemStore();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  const handleOpenSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
  };

  const navSections: NavSectionConfig[] = [
    {
      title: 'OVERVIEW',
      items: [
        { href: ROUTES.SUPER_ADMIN.DASHBOARD, label: 'Super Admin Overview', icon: LayoutGrid, exact: true },
        { href: ROUTES.SUPER_ADMIN.SYSTEM_HEALTH, label: 'System Health', icon: Activity },
        { href: ROUTES.SUPER_ADMIN.ANALYTICS, label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { href: ROUTES.SUPER_ADMIN.ORGANIZATIONS, label: 'Organizations', icon: Building2 },
        { href: ROUTES.SUPER_ADMIN.USERS, label: 'Global Users', icon: Users },
        {
          href: ROUTES.SUPER_ADMIN.PROVIDERS,
          label: 'AI Providers',
          icon: Zap,
          badge: { text: 'AI', variant: 'neutral' },
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { href: ROUTES.SUPER_ADMIN.KNOWLEDGE_BASE, label: 'Knowledge Base', icon: BookOpen },
        { href: ROUTES.SUPER_ADMIN.AUDIT, label: 'Audit Logs', icon: History },
      ],
    },
  ];

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Super Admin';
  const displayEmail = user?.email || 'superadmin@vidyaai.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-39 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        role="navigation"
        aria-label="Super Admin Navigation"
        className={`fixed top-0 left-0 bottom-0 h-screen bg-white text-neutral-900 border-r border-neutral-200/90 flex flex-col z-40 transition-all duration-300 shadow-xs lg:translate-x-0 ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className={`flex items-center pt-4 pb-2 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <Link href={ROUTES.SUPER_ADMIN.DASHBOARD} className="flex items-center gap-2.5 group min-w-0" title="VidyaAI Super Admin">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-xl object-contain shadow-xs shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 3L3 9L12 15L21 9L12 3Z"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 14.5L12 20.5L21 14.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[15px] tracking-tight text-neutral-900 truncate">
                    {settings?.platformName || 'VidyaAI'}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                    Super
                  </span>
                </div>
              </div>
            )}
          </Link>

          {/* Desktop Collapse / Expand Button & Mobile Close */}
          <div className="flex items-center">
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 hidden lg:flex transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <button
              onClick={close}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`py-2 ${isCollapsed ? 'px-2 flex justify-center' : 'px-3'}`}>
          {isCollapsed ? (
            <button
              onClick={handleOpenSearch}
              className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200/90 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              title="Search (Ctrl+D)"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          ) : (
            <div
              onClick={handleOpenSearch}
              className="relative flex items-center w-full bg-neutral-50 border border-neutral-200/90 rounded-xl px-3 py-1.5 cursor-pointer hover:border-neutral-300 hover:bg-neutral-100/60 transition-all group"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 transition-colors shrink-0 mr-2" />
              <span className="text-xs text-neutral-400 flex-1 truncate">
                Search
              </span>
              <kbd className="text-[10px] font-mono text-neutral-400 bg-white px-1.5 py-0.5 rounded border border-neutral-200 shadow-2xs shrink-0">
                Ctrl+D
              </kbd>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className={`flex-1 overflow-y-auto space-y-4 scrollbar-thin ${isCollapsed ? 'px-2 py-1.5' : 'px-2.5 py-1.5'}`}>
          {navSections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              {!isCollapsed ? (
                <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                  {section.title}
                </div>
              ) : (
                <div className="my-1.5 border-t border-neutral-100" />
              )}
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon, exact, badge }) => {
                  const active = isActive(href, exact);
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={close}
                      title={isCollapsed ? label : undefined}
                      className={`flex items-center rounded-xl text-xs font-medium transition-all group ${
                        isCollapsed
                          ? 'w-10 h-10 mx-auto justify-center'
                          : 'justify-between px-2.5 py-2'
                      } ${
                        active
                          ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active
                              ? 'text-neutral-900'
                              : 'text-neutral-400 group-hover:text-neutral-700'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{label}</span>}
                      </div>
                      {!isCollapsed && badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-tight ${
                            badge.variant === 'amber'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200/60'
                              : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                          }`}
                        >
                          {badge.text}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Card */}
        <div className={`p-3 border-t border-neutral-100 ${isCollapsed ? 'px-2 flex justify-center' : ''}`}>
          <div
            className={`flex items-center rounded-xl bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-100/90 transition-all ${
              isCollapsed ? 'p-1.5 justify-center' : 'p-2'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {initials || 'SA'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-neutral-900 truncate">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-neutral-400 truncate">
                    {displayEmail}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
