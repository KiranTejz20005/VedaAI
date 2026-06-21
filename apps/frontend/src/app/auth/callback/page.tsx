'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const provider = searchParams.get('provider') || 'google';

      let email = '';
      let firstName = '';
      let lastName = '';
      let token = '';

      try {
        if (provider === 'google') {
          const hash = window.location.hash;
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          
          if (accessToken) {
            token = accessToken;
            const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
            const data = await res.json();
            if (data && data.email) {
              email = data.email;
              firstName = data.given_name || 'SSO';
              lastName = data.family_name || 'User';
            }
          }
        } else if (provider === 'x') {
          const code = searchParams.get('code');
          if (code) {
            token = code;
            email = 'x-user@vedaai.com';
            firstName = 'X';
            lastName = 'User';
          }
        }
      } catch (err) {
        console.error('Error in SSO callback processing:', err);
      }

      if (email) {
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'SSO_SUCCESS',
              email,
              firstName,
              lastName,
              provider,
              token,
            },
            window.location.origin
          );
          window.close();
        } else {
          // Direct redirect in the main window
          try {
            const { ssoLogin } = useAuthStore.getState();
            const result = await ssoLogin({
              email,
              firstName,
              lastName,
              provider,
              token,
            });
            if (result.success) {
              const user = useAuthStore.getState().user;
              const isOnboarded = user?.hasCompletedOnboarding === true || (user?.organizationId && user?.departmentId);
              window.location.href = isOnboarded ? '/dashboard' : '/onboarding';
            } else {
              window.location.href = '/login?error=sso_failed';
            }
          } catch (loginErr) {
            console.error('SSO login error:', loginErr);
            window.location.href = '/login?error=sso_failed';
          }
        }
      } else {
        // Fallback if email not retrieved
        if (!window.opener) {
          window.location.href = '/login?error=no_email';
        } else {
          window.close();
        }
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px 40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#111827' }}>Completing Sign In</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>Please wait while we authorize your account...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px 40px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#111827' }}>Loading Authorization...</h2>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
