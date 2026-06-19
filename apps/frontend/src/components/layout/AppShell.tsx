'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { useAuthStore } from '@/store/auth.store';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { OrgAdminSidebar } from './OrgAdminSidebar';
import { FacultySidebar } from './FacultySidebar';
import { StudentSidebar } from './StudentSidebar';
import { Topbar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { canAccessRoute } from '@/config/route-permissions';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;

    const isPublicPath = pathname === '/' || pathname === '/login' || pathname === '/register';
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isOnboardingPage = pathname === '/onboarding';

    if (!isAuthenticated) {
      if (!isPublicPath && !isOnboardingPage) {
        router.push('/login');
      }
    } else {
      const userRole = user?.role?.toUpperCase() || '';
      const isSuperAdminOrAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
      const isOnboarded = isSuperAdminOrAdmin || user?.hasCompletedOnboarding === true || (user?.organizationId && user?.departmentId);
      if (isOnboarded) {
        if (isAuthPage) {
          router.push('/dashboard');
        } else {
          const isExcludedPath = pathname.startsWith('/admin') || pathname.startsWith('/super-admin');
          const role = user?.role || '';
          const hasAccess = isExcludedPath || canAccessRoute(role, pathname);

          if (!hasAccess) {
            router.push('/dashboard');
          }
        }
      } else {
        if (!isOnboardingPage) {
          router.push('/onboarding');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading && pathname !== '/') {
    return (
      <div suppressHydrationWarning style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#030712',
        color: 'white',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div suppressHydrationWarning style={{
          position: 'relative',
          width: 50,
          height: 50,
          marginBottom: 16
        }}>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '3px solid rgba(232, 83, 29, 0.1)',
            borderTopColor: '#E8531D',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        <div suppressHydrationWarning style={{ fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>
          Securing workspace...
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  const isChromeExcluded =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/super-admin');

  if (isChromeExcluded) {
    return (
      <>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1F2937',
              color: '#F9FAFB',
              border: '1px solid #374151',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'ui-sans-serif, system-ui',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </>
    );
  }

  const role = user?.role?.toUpperCase() || '';

  let SidebarComponent = <FacultySidebar />;
  if (role === 'SUPER_ADMIN') {
    SidebarComponent = <SuperAdminSidebar />;
  } else if (role === 'ADMIN') {
    SidebarComponent = <OrgAdminSidebar />;
  } else if (role === 'TEACHER' || role === 'FACULTY') {
    SidebarComponent = <FacultySidebar />;
  } else if (role === 'STUDENT') {
    SidebarComponent = <StudentSidebar />;
  }

  return (
    <div className="app-shell" suppressHydrationWarning>
      {SidebarComponent}
      <div className="app-main" suppressHydrationWarning>
        <Topbar />
        <main className="page-container" suppressHydrationWarning>
          <ClientOnly fallback={<div className="page-content-placeholder" aria-hidden="true" />}>
            {children}
          </ClientOnly>
        </main>
      </div>
      <MobileBottomNav />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
