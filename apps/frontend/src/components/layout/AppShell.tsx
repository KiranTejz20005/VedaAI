'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { AdminSidebar } from './AdminSidebar';
import { OrgAdminSidebar } from './OrgAdminSidebar';
import { FacultySidebar } from './FacultySidebar';
import { StudentSidebar } from './StudentSidebar';
import { TeacherSidebar } from './TeacherSidebar';
import { Topbar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { canAccessRoute } from '@/config/route-permissions';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();
  const { initializeFromStorage } = useAdminAuthStore();

  useEffect(() => {
    initialize();
    initializeFromStorage();
  }, [initialize, initializeFromStorage]);

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
        if (isAuthPage) {
          router.push(`/dashboard/${rolePath}`);
        } else {
          const hasAccess = canAccessRoute(userRole, pathname);

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

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  if (isLoading && !isPublicPage) {
    return (
      <div suppressHydrationWarning style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F7F4',
        color: '#111827',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div suppressHydrationWarning style={{
          position: 'relative',
          width: 50,
          height: 50,
          marginBottom: 16
        }}>
          <div suppressHydrationWarning style={{
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
    pathname.startsWith('/admin');

  if (isChromeExcluded) {
    return (
      <>
        {children}
        <ClientOnly>
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
        </ClientOnly>
      </>
    );
  }

  const role = user?.role?.toUpperCase() || '';

  let SidebarComponent = <FacultySidebar />;
  if (role === 'SUPER_ADMIN') {
    SidebarComponent = <AdminSidebar />;
  } else if (role === 'ADMIN' || role === 'ORG_ADMIN') {
    SidebarComponent = <OrgAdminSidebar />;
  } else if (role === 'TEACHER') {
    SidebarComponent = <TeacherSidebar />;
  } else if (role === 'FACULTY') {
    SidebarComponent = <FacultySidebar />;
  } else if (role === 'STUDENT') {
    SidebarComponent = <StudentSidebar />;
  }

  return (
    <div suppressHydrationWarning style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#F8F7F4' }}>
      {SidebarComponent}
      <div suppressHydrationWarning style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', width: 'calc(100% - 260px)' }}>
        <Topbar />
        <main suppressHydrationWarning style={{ flex: 1, padding: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%', overflowX: 'hidden' }}>
          <ClientOnly fallback={<div className="page-content-placeholder" aria-hidden="true" />}>
            {children}
          </ClientOnly>
        </main>
      </div>
      <MobileBottomNav />
      <ClientOnly>
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
      </ClientOnly>
    </div>
  );
}
