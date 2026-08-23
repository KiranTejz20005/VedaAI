'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  School,
  Users,
  PieChart,
  Settings,
  X,
  Activity,
  Search,
  Bell,
  MessageSquare,
  HelpCircle,
  Maximize2,
  ChevronRight,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';

interface NavItemConfig {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  exact?: boolean;
  badge?: {
    text: string;
    variant: 'purple' | 'amber';
  };
}

interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

const ADMIN_NAV: NavSectionConfig[] = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutGrid, exact: true },
    ],
  },
  {
    title: 'TENANT MANAGEMENT',
    items: [
      { href: '/admin/institutions', label: 'Organizations', icon: School },
      { href: '/admin/users', label: 'Faculty and Students', icon: Users },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: PieChart },
      { href: '/admin/audit', label: 'Audit Logs', icon: Activity },
    ],
  },
  {
    title: 'PREFERENCES',
    items: [
      { href: '/admin/settings', label: 'Portal Settings', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { user } = useAuthStore();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  const handleOpenSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Admin User';
  const displayEmail = user?.email || 'admin@vidyaai.com';
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
        aria-label="Admin Navigation"
        className={`fixed top-0 left-0 bottom-0 w-[260px] h-screen bg-white text-neutral-900 border-r border-neutral-200/90 flex flex-col z-40 transition-transform duration-300 shadow-xs lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-purple-500/20 group-hover:scale-105 transition-transform">
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
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] tracking-tight text-neutral-900">
                  VidyaAI
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  Admin
                </span>
              </div>
            </div>
          </Link>

          {/* Mobile Close Button only (No duplicate top settings icon) */}
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2">
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
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-2.5 py-1.5 overflow-y-auto space-y-4 scrollbar-thin">
          {ADMIN_NAV.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon, exact, badge }) => {
                  const active = isActive(href, exact);
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={close}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group ${
                        active
                          ? 'bg-purple-50 text-purple-700 font-semibold shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active
                              ? 'text-purple-600'
                              : 'text-neutral-400 group-hover:text-neutral-700'
                          }`}
                        />
                        <span className="truncate">{label}</span>
                      </div>
                      {badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-tight ${
                            badge.variant === 'purple'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-amber-100 text-amber-800'
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

        {/* Bottom Utility Actions Bar */}
        <div className="px-3 pt-2 pb-1 border-t border-neutral-100 flex items-center justify-around text-neutral-400">
          <button
            onClick={() => {}}
            className="p-1.5 rounded-lg hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {}}
            className="p-1.5 rounded-lg hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Messages"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenSearch}
            className="p-1.5 rounded-lg hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Quick Command"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <Link
            href="/contact"
            className="p-1.5 rounded-lg hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Help & Support"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* User Profile Card */}
        <div className="p-3 pt-1">
          <Link
            href="/admin/settings"
            className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-100/90 transition-all group"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {initials || 'AD'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-neutral-900 truncate group-hover:text-purple-600 transition-colors">
                {displayName}
              </span>
              <span className="text-[11px] text-neutral-400 truncate">
                {displayEmail}
              </span>
            </div>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-neutral-400 group-hover:text-neutral-700 group-hover:bg-neutral-200/60 transition-colors shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
