'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7F4' }}>
        <div style={{ width: 32, height: 32, border: '4px solid #E8531D', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7F4', padding: 16 }}>
        <div style={{ maxWidth: 400, width: '100%', background: '#FFFFFF', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', padding: 32, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#FEF2F2', color: '#DC2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Access Denied</h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            You need Super Administrator privileges to access this area.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ width: '100%', background: '#7C3AED', color: 'white', fontWeight: 600, padding: '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14 }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
