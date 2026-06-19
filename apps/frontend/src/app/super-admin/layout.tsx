'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { ShieldAlert } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'SUPER_ADMIN') {
      router.push('/admin');
      return;
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F7F4' }}>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F7F4', padding: '16px' }}>
        <div style={{ maxWidth: '400px', width: '100%', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: '#FEF2F2', color: '#DC2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
            You need Super Administrator privileges to access this area.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ width: '100%', background: '#2563EB', color: 'white', fontWeight: 600, padding: '8px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F7F4', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <AdminSidebar />
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
        <AdminTopbar />
        <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
