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
            <Link href="/admin" style={{ color: '#6B7280' }} className="hover:text-blue-600 transition-colors">
              Admin
            </Link>
            {breadcrumbs.slice(1).map((b) => (
              <div key={b.href} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ChevronRight size={12} color="#9CA3AF" />
                {b.isLast ? (
                  <span style={{ color: '#111827', fontWeight: 600 }}>{b.label}</span>
                ) : (
                  <Link href={b.href} style={{ color: '#6B7280' }} className="hover:text-blue-600 transition-colors">
                    {b.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
              {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>{user?.email}</div>
          </div>

          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <UserCircle size={22} />
          </div>
        </div>
      </div>
    </header>
  );
}
