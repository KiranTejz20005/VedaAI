'use client';

import { Menu, ShieldAlert, ArrowLeft, UserCircle, ChevronRight } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export function AdminTopbar() {
  const { toggle } = useSidebarStore();
  const { user } = useAuthStore();
  const { isImpersonating, exitImpersonation } = useAdminAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Create human-readable breadcrumbs from the pathname
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = paths.map((path, index) => {
    const href = '/' + paths.slice(0, index + 1).join('/');
    const label = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
    const isLast = index === paths.length - 1;
    return { href, label, isLast };
  });

  return (
    <header className="topbar flex flex-col w-full bg-white border-b border-gray-200 z-30" style={{ height: 'auto', minHeight: 'var(--topbar-h)' }}>
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

      <div className="flex items-center justify-between px-4 w-full h-[60px]">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-1 text-xs text-gray-500 font-medium">
            <Link href="/admin" className="hover:text-blue-600 transition-colors">
              Admin
            </Link>
            {breadcrumbs.slice(1).map((b, i) => (
              <div key={b.href} className="flex items-center gap-1">
                <ChevronRight size={12} className="text-gray-400" />
                {b.isLast ? (
                  <span className="text-gray-800 font-semibold">{b.label}</span>
                ) : (
                  <Link href={b.href} className="hover:text-blue-600 transition-colors">
                    {b.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
          
          <h1 className="md:hidden text-sm font-bold text-gray-900">
            {breadcrumbs[breadcrumbs.length - 1]?.label || 'Admin Portal'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-gray-900">
              {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">{user?.email}</div>
          </div>

          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
            <UserCircle size={24} />
          </div>
        </div>
      </div>
    </header>
  );
}
