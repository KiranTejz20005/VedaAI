'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { usePathname, useRouter } from 'next/navigation';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { useAuthStore } from '@/store/auth.store';
import { AdminSidebar } from './AdminSidebar';
import { TeacherSidebar } from './TeacherSidebar';
import { StudentSidebar } from './StudentSidebar';
import { Topbar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { canAccessRoute } from '@/config/route-permissions';

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;

    if (pathname === '/') return; // Never redirect from landing page

    const isPublicPath = pathname === '/login' || pathname === '/register';
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
      
      const rolePath = userRole ? userRole.toLowerCase().replace('_', '-') : 'student';

      if (isOnboarded) {
        if (isAuthPage || isOnboardingPage) {
          router.push(`/dashboard/${rolePath}`);
        } else {
          // /admin/* has its own layout with its own auth guard — skip check here
          const isAdminPath = pathname.startsWith('/admin');
          const role = user?.role || '';
          const hasAccess = isAdminPath || canAccessRoute(role, pathname);
          
          if (!hasAccess) {
            router.push(`/dashboard/${rolePath}`);
          }
        }
      } else {
        if (!isOnboardingPage) {
          router.push('/onboarding');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  // Premium loading screen for authentication checks (except public pages)
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  if (isLoading && !isPublicPage) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#030712',
        color: 'white',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          position: 'relative',
          width: 50,
          height: 50,
          marginBottom: 16
        }}>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '3px solid rgba(234, 88, 12, 0.1)',
            borderTopColor: '#EA580C',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>
          Securing workspace...
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  // Define paths where AppChrome structure (sidebar, topbar) should be hidden
  // /admin/* has its own dedicated layout with its own sidebar — exclude it here
  const isChromeExcluded =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/admin');

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

  const userRole = user?.role?.toUpperCase() || '';
  
  let DynamicSidebar = null;
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'ORG_ADMIN') {
    DynamicSidebar = <AdminSidebar />;
  } else if (userRole === 'STUDENT') {
    DynamicSidebar = <StudentSidebar />;
  } else if (userRole === 'FACULTY' || userRole === 'TEACHER') {
    DynamicSidebar = <TeacherSidebar />;
  }

  return (
    <div className="app-shell">
      {DynamicSidebar}
      <div className="main-wrapper">
        <Topbar />
        <main className="page-container">
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
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
