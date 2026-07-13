'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();
  const { login, ssoLogin } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

  const handleGoogleSuccess = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      const { googleLogin } = useAuthStore.getState();
      const result = await googleLogin({
        token: tokenResponse.access_token,
        role: selectedRole,
        isSignUp: false
      });
      setIsSubmitting(false);

      if (result.success) {
        toast.success('Successfully logged in with Google!');
        const user = useAuthStore.getState().user;
        const isOnboarded = user?.hasCompletedOnboarding === true || !!(user?.organizationId && user?.departmentId);
        let dashboardPath = '/dashboard/student';
        if (user?.role === 'TEACHER' || user?.role === 'FACULTY') dashboardPath = '/dashboard/faculty';
        if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') dashboardPath = '/dashboard/admin';
        router.replace(isOnboarded ? dashboardPath : '/onboarding');
      } else {
        if (result.error?.includes('Account not found')) {
          toast.error('Account not found. Redirecting to sign up...');
          setTimeout(() => router.push('/register'), 1500);
        } else {
          toast.error(result.error || 'Google login failed.');
        }
      }
    },
    onError: () => {
      toast.error('Google login failed or was cancelled.');
    }
  });

  useEffect(() => {
    setMounted(true);

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'SSO_SUCCESS') {
        setIsSubmitting(true);
        const result = await ssoLogin({
          email: event.data.email || 'student@vidyaai.com',
          firstName: event.data.firstName || 'Student',
          lastName: event.data.lastName || 'Member',
          provider: event.data.provider || 'SSO',
          token: event.data.token,
          role: selectedRole,
          isSignUp: false
        });
        setIsSubmitting(false);

        if (result.success) {
          toast.success(`Successfully logged in with ${event.data.provider || 'SSO'}!`);
          const user = useAuthStore.getState().user;
          const isOnboarded = user?.hasCompletedOnboarding === true || (user?.organizationId && user?.departmentId);
          let dashboardPath = '/dashboard/student';
          switch(user?.role) {
            case 'SUPER_ADMIN':
              dashboardPath = '/super-admin';
              break;
            case 'ADMIN':
            case 'ORG_ADMIN':
              dashboardPath = '/dashboard/admin';
              break;
            case 'TEACHER':
            case 'FACULTY':
              dashboardPath = '/dashboard/faculty';
              break;
            case 'STUDENT':
              dashboardPath = '/dashboard/student';
              break;
          }
          
          router.replace(isOnboarded ? dashboardPath : '/onboarding');
        } else {
          if (result.error?.includes('Account not found')) {
            toast.error('Account not found. Redirecting to sign up...');
            setTimeout(() => {
              router.push('/register');
            }, 1500);
          } else {
            toast.error(result.error || 'SSO authentication failed.');
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [ssoLogin, router]);

  const handleSSO = (provider: 'google' | 'x') => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const xClientId = process.env.NEXT_PUBLIC_X_CLIENT_ID;
    
    let isMock = false;
    if (provider === 'google') {
      isMock = !googleClientId || 
               googleClientId.includes('placeholder') || 
               !googleClientId.trim().endsWith('.apps.googleusercontent.com');
    } else {
      isMock = !xClientId || 
               xClientId.includes('placeholder');
    }

    if (!isMock) {
      if (provider === 'google') {
        handleGoogleSuccess();
      } else {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const state = 'state_123';
        const codeChallenge = 'challenge';
        const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${xClientId?.trim()}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=users.read%20tweet.read&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;
        window.location.href = authUrl;
      }
      return;
    }

    if (provider === 'google' && googleClientId && !googleClientId.trim().endsWith('.apps.googleusercontent.com')) {
      toast('Using simulated SSO login. The NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env appears to be an API Key or invalid (must end with .apps.googleusercontent.com).', {
        icon: 'ℹ️',
        duration: 6000
      });
    } else {
      toast(`Using simulated SSO login. Set NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID in .env for real accounts.`, {
        icon: 'ℹ️',
        duration: 5000
      });
    }

    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      '',
      `sso_login_${provider}`,
      `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
    );

    if (!popup) {
      toast.error('Popup blocked! Please allow popups for this site.');
      return;
    }

    const providerName = provider === 'google' ? 'Google' : 'X';
    const providerColor = provider === 'google' ? '#4285F4' : '#000000';
    const providerLogo = provider === 'google' 
      ? `<svg viewBox="0 0 24 24" width="24" height="24" style="margin-right:8px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`
      : `<svg viewBox="0 0 24 24" width="24" height="24" fill="white" style="margin-right:8px;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

    popup.document.write(`
      <html>
        <head>
          <title>Sign in with ${providerName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f3f4f6;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              overflow: hidden;
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
              width: 380px;
              text-align: center;
            }
            .logo-container {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 24px;
            }
            h1 {
              font-size: 20px;
              font-weight: 600;
              color: #111827;
              margin: 0 0 8px 0;
            }
            p {
              font-size: 14px;
              color: #4b5563;
              margin: 0 0 24px 0;
              line-height: 1.5;
            }
            .profile-card {
              display: flex;
              align-items: center;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 12px 16px;
              margin-bottom: 12px;
              text-align: left;
              cursor: pointer;
              transition: background-color 0.2s, border-color 0.2s;
            }
            .profile-card:hover {
              background: #f3f4f6;
              border-color: #d1d5db;
            }
            .avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              margin-right: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              font-weight: bold;
            }
            .profile-info {
              flex: 1;
            }
            .name {
              font-size: 14px;
              font-weight: 600;
              color: #111827;
            }
            .email {
              font-size: 12px;
              color: #6b7280;
            }
            .btn {
              width: 100%;
              padding: 12px;
              border-radius: 8px;
              border: none;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .btn-primary {
              background: ${providerColor};
              color: white;
              margin-bottom: 12px;
            }
            .btn-primary:hover {
              opacity: 0.9;
            }
            .btn-secondary {
              background: transparent;
              color: #4b5563;
              border: 1px solid #d1d5db;
            }
            .btn-secondary:hover {
              background: #f9fafb;
            }
            .loader {
              border: 3px solid #f3f3f3;
              border-top: 3px solid ${providerColor};
              border-radius: 50%;
              width: 24px;
              height: 24px;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px auto;
              display: none;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="card" id="card">
            <div class="logo-container">
              ${providerLogo}
              Vidya AI
            </div>
            <h1 id="title">Sign in with ${providerName}</h1>
            <p id="desc">Choose an account to continue to <strong>Vidya AI</strong></p>
            
            <div id="loader" class="loader"></div>
            
            <div id="content">
              <!-- Account List -->
              <div id="account-list">
                <div class="profile-card" onclick="selectAccount('faculty@vidyaai.com', 'Faculty Member')">
                  <div class="avatar" style="background:#E0F2FE;color:#0369A1;">F</div>
                  <div class="profile-info">
                    <div class="name">Faculty Member</div>
                    <div class="email">faculty@vidyaai.com</div>
                  </div>
                </div>

                <div class="profile-card" onclick="selectAccount('student@vidyaai.com', 'Student Member')">
                  <div class="avatar" style="background:#DCFCE7;color:#15803D;">S</div>
                  <div class="profile-info">
                    <div class="name">Student Member</div>
                    <div class="email">student@vidyaai.com</div>
                  </div>
                </div>

                <div class="profile-card" onclick="selectAccount('admin@vidyaai.com', 'Org Administrator')">
                  <div class="avatar" style="background:#FEE2E2;color:#B91C1C;">A</div>
                  <div class="profile-info">
                    <div class="name">Org Administrator</div>
                    <div class="email">admin@vidyaai.com</div>
                  </div>
                </div>
                
                <button class="btn btn-secondary" style="margin-bottom:12px;" onclick="showCustomInput()">Use another account</button>
              </div>

              <!-- Custom Input Form (Hidden initially) -->
              <div id="custom-input-form" style="display:none; text-align:left;">
                <label style="font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:6px;">Email address</label>
                <input type="email" id="custom-email" placeholder="name@example.com" style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; margin-bottom:16px; box-sizing:border-box; outline:none;" />
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                  <button class="btn btn-primary" onclick="submitCustomAccount()">Continue</button>
                  <button class="btn btn-secondary" onclick="showAccountList()">Back</button>
                </div>
              </div>

              <div style="margin-top:16px;">
                <button class="btn btn-secondary" onclick="window.close()">Cancel</button>
              </div>
            </div>
          </div>

          <script>
            let selectedEmail = '';
            let selectedName = '';

            function selectAccount(email, name) {
              selectedEmail = email;
              selectedName = name;
              proceed();
            }

            function showCustomInput() {
              document.getElementById('account-list').style.display = 'none';
              document.getElementById('custom-input-form').style.display = 'block';
              document.getElementById('title').innerText = 'Use another account';
              document.getElementById('desc').innerText = 'Enter your email to sign in using ${providerName}';
            }

            function showAccountList() {
              document.getElementById('account-list').style.display = 'block';
              document.getElementById('custom-input-form').style.display = 'none';
              document.getElementById('title').innerText = 'Sign in with ${providerName}';
              document.getElementById('desc').innerText = 'Choose an account to continue to Vidya AI';
            }

            function submitCustomAccount() {
              const emailVal = document.getElementById('custom-email').value.trim();
              if (!emailVal || !emailVal.includes('@')) {
                alert('Please enter a valid email address.');
                return;
              }
              selectedEmail = emailVal;
              selectedName = emailVal.split('@')[0];
              proceed();
            }

            function proceed() {
              document.getElementById('content').style.display = 'none';
              document.getElementById('title').innerText = 'Authorizing...';
              document.getElementById('desc').innerText = 'Connecting securely to Vidya AI.';
              document.getElementById('loader').style.display = 'block';
              
              setTimeout(() => {
                const targetOrigin = window.location.origin;
                window.opener.postMessage({ 
                  type: 'SSO_SUCCESS', 
                  email: selectedEmail, 
                  firstName: selectedName, 
                  lastName: 'User', 
                  provider: '${providerName}' 
                }, targetOrigin);
                window.close();
              }, 1500);
            }
          </script>
        </body>
      </html>
    `);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Successfully logged in!');
      const user = useAuthStore.getState().user;
      const isOnboarded = user?.hasCompletedOnboarding === true || (user?.organizationId && user?.departmentId);
      let dashboardPath = '/dashboard/student';
      switch(user?.role) {
        case 'SUPER_ADMIN':
          dashboardPath = '/super-admin';
          break;
        case 'ADMIN':
        case 'ORG_ADMIN':
          dashboardPath = '/dashboard/admin';
          break;
        case 'TEACHER':
        case 'FACULTY':
          dashboardPath = '/dashboard/faculty';
          break;
        case 'STUDENT':
          dashboardPath = '/dashboard/student';
          break;
      }
      
      router.replace(isOnboarded ? dashboardPath : '/onboarding');
    } else {
      toast.error(result.error || 'Authentication failed.');
    }
  };

  // Falling petals generation helper
  const renderPetals = () => {
    if (!mounted) return null;
    return Array.from({ length: 20 }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = 6 + Math.random() * 6;
      const size = 6 + Math.random() * 8;
      
      return (
        <span 
          key={i} 
          className="petal"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            width: `${size}px`,
            height: `${size * 0.7}px`
          }}
        />
      );
    });
  };

  const cherryBlossomPanel = (
    <div className="art-panel">
      {renderPetals()}
    </div>
  );

  return (
    <div className="saas-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .saas-root {
          min-height: 100vh;
          width: 100vw;
          background: #FFFFFF;
          display: flex;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }
        .outer-frame {
          display: flex;
          width: 100%;
          min-height: 100vh;
          background: #FFFFFF;
          overflow: hidden;
        }
        @media (max-width: 860px) {
          .outer-frame {
            flex-direction: column;
          }
          .art-panel {
            display: none;
          }
        }
        
        /* Left Column */
        .form-panel {
          flex: 1;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .logo-text {
          font-size: 15px;
          font-weight: 700;
          color: #111111;
          letter-spacing: -0.5px;
          text-decoration: none;
        }
        .top-action-btn {
          font-size: 13px;
          font-weight: 600;
          color: #4B5563;
          text-decoration: none;
        }
        .top-action-btn:hover {
          color: #111111;
        }
        
        .main-form-wrap {
          max-width: 360px;
          width: 100%;
          margin: 0 auto;
        }
        .form-header-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #111111;
          margin-bottom: 24px;
        }
        .sso-btn-pill {
          width: 100%;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 100px;
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #111111;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          margin-bottom: 12px;
          transition: background-color 0.2s;
        }
        .sso-btn-pill:hover {
          background: #FAFAFA;
        }
        
        .or-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0;
        }
        .or-divider::before, .or-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #F3F4F6;
        }
        .or-text {
          font-size: 11px;
          color: #9CA3AF;
          text-transform: uppercase;
          padding: 0 10px;
          font-weight: 600;
        }
        
        .input-box {
          width: 100%;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          color: #111111;
          outline: none;
          background: #FFFFFF;
          margin-bottom: 12px;
          transition: border-color 0.2s;
        }
        .input-box:focus {
          border-color: #111111;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #4B5563;
          margin-bottom: 20px;
        }
        .checkbox-lbl {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .forgot-pass-link {
          color: #4B5563;
          text-decoration: none;
        }
        .forgot-pass-link:hover {
          color: #111111;
          text-decoration: underline;
        }
        
        .btn-submit-arrow {
          width: 100%;
          background: #111111;
          color: #FFFFFF;
          border: none;
          border-radius: 100px;
          padding: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background-color 0.2s;
          margin-top: 8px;
        }
        .btn-submit-arrow:hover {
          background: #222222;
        }
        
        .footer-row-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #9CA3AF;
          margin-top: 32px;
        }
        .footer-row-meta a {
          color: #9CA3AF;
          text-decoration: none;
          margin-left: 12px;
        }
        .footer-row-meta a:hover {
          color: #111111;
        }

        /* Right Column Cherry Blossom */
        .art-panel {
          flex: 1.2;
          background-image: url('/sakura_tree.png');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          height: 100vh;
        }
        
        /* Petals Falling Animation */
        .petal {
          position: absolute;
          background: #FBCFE8;
          border-radius: 150% 0 150% 150%;
          z-index: 2;
          opacity: 0.85;
          top: -20px;
          transform: rotate(-45deg);
          animation: fall linear infinite;
        }
        
        @keyframes fall {
          0% {
            top: -20px;
            transform: translate(0, 0) rotate(-45deg) scale(0.8);
            opacity: 0.85;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            top: 105%;
            transform: translate(-180px, 400px) rotate(240deg) scale(1.1);
            opacity: 0;
          }
        }
      ` }} />

      <div className="outer-frame">
        {/* Left Form Column */}
        <div className="form-panel">
          <div className="header-row">
            <Link href="/" className="logo-text">Vidya AI</Link>
            <Link href="/register" className="top-action-btn">Sign up</Link>
          </div>

          <div className="main-form-wrap">
            <h1 className="form-header-title">Welcome back</h1>
            
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '100px', padding: '4px', marginBottom: '24px' }}>
              {['STUDENT', 'TEACHER'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r as any)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '100px',
                    border: 'none',
                    background: selectedRole === r ? '#FFFFFF' : 'transparent',
                    color: selectedRole === r ? '#111111' : '#6B7280',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: selectedRole === r ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {r === 'TEACHER' ? 'Faculty' : r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <button className="sso-btn-pill" type="button" onClick={() => handleSSO('google')}>
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <div className="or-divider">
              <span className="or-text">or</span>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                className="input-box"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />

              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-box"
                  placeholder="Password"
                  style={{ marginBottom: 0, paddingRight: '40px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="meta-row">
                <label className="checkbox-lbl">
                  <input type="checkbox" style={{ accentColor: '#111' }} />
                  Remember me
                </label>
                <Link href="/forgot-password" className="forgot-pass-link">Forgot password?</Link>
              </div>

              <button type="submit" className="btn-submit-arrow" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Sign in →'}
              </button>
            </form>
            
            <div className="signup-link-container" style={{ marginTop: '20px', fontSize: '13px', textAlign: 'center' }}>
              New to Vidya AI? <Link href="/register" style={{ fontWeight: '700', textDecoration: 'underline' }}>Create an account</Link>
            </div>
          </div>

          <div className="footer-row-meta">
            <span>© 2026 Vidya AI</span>
            <div>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>

        {/* Right Cherry Blossom Column */}
        {cherryBlossomPanel}
      </div>
    </div>
  );
}
