'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const TESTIMONIALS = [
  { text: '"This platform transformed how I create assessments — what used to take hours now takes minutes."', author: '— Dr. Ananya Sharma, Professor' },
  { text: '"The AI-generated question papers are remarkably thoughtful and curriculum-aligned."', author: '— Rajesh Kumar, Principal' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted]);

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
      router.replace(isOnboarded ? '/dashboard' : '/onboarding');
    } else {
      toast.error(result.error || 'Authentication failed.');
    }
  };

  return (
    <div className="login-root">
      {/* Background layers */}
      <div className="login-bg">
        <div className="bg-gradient" />
        <div className="bg-grid" />
        <div className="bg-accent-blob" />
      </div>

      {/* Main layout */}
      <div className="login-container">
        {/* Left brand panel */}
        <motion.div
          className="login-brand-panel"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="brand-content">
            <div className="brand-middle">
              <div className="brand-pill">v2.0 — Next Gen</div>
              <h1 className="brand-headline">
                Intelligent<br />
                <span className="brand-accent">Assessment</span><br />
                Platform
              </h1>
              <p className="brand-desc">
                AI-powered tools for educators — generate question papers,<br />
                grade assignments, and track student progress.
              </p>

            </div>

            <div className="brand-testimonial">
              <motion.p
                key={testimonialIndex}
                className="testimonial-text"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                {TESTIMONIALS[testimonialIndex].text}
              </motion.p>
              <p className="testimonial-author">
                {TESTIMONIALS[testimonialIndex].author}
              </p>
              <div className="testimonial-dots">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    className={`dot ${i === testimonialIndex ? 'active' : ''}`}
                    onClick={() => setTestimonialIndex(i)}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right form panel */}
        <motion.div
          className="login-form-panel"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        >
          <div className="form-content">
            <div className="form-header">
              <h2 className="form-title">Welcome back</h2>
              <p className="form-subtitle">Login to continue to your workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="field-group">
                <label className="field-label">Email address</label>
                <div className="input-wrap">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting || isLoading}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <button type="button" className="forgot-link">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                    <Loader2 className="animate-spin text-white" size={20} />
                  ) : (
                    <>
                      Login <ArrowRight size={16} />
                    </>
                  )}
              </button>
            </form>

            <div className="form-footer">
              <div className="footer-divider">
                <span>Protected by enterprise-grade security</span>
              </div>
              <div className="trust-badges">
                <span className="trust-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  SOC 2
                </span>
                <span className="trust-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  AES-256
                </span>
                <span className="trust-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  GDPR
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        /* ── Root ── */
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F5F5F0;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 32px;
        }

        /* ── Background ── */
        .login-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .bg-gradient {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 55% at 15% 25%, rgba(234, 88, 12, 0.07) 0%, transparent 55%),
            radial-gradient(ellipse 50% 45% at 85% 75%, rgba(99, 102, 241, 0.05) 0%, transparent 50%);
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px);
          background-size: 72px 72px;
        }

        .bg-accent-blob {
          position: absolute;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234, 88, 12, 0.05) 0%, transparent 65%);
          top: 50%;
          left: 35%;
          transform: translate(-50%, -50%);
          filter: blur(100px);
          animation: blobPulse 7s infinite alternate ease-in-out;
        }

        @keyframes blobPulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-45%, -55%) scale(1.25); opacity: 1; }
        }

        /* ── Container ── */
        .login-container {
          display: flex;
          width: 100%;
          max-width: 1160px;
          min-height: 680px;
          position: relative;
          z-index: 1;
        }

        /* ── Left panel ── */
        .login-brand-panel {
          flex: 1.15;
          background: white;
          border: 1px solid #E8E6E0;
          border-right: none;
          border-radius: 28px 0 0 28px;
          padding: 52px 48px;
          display: flex;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        }

        .login-brand-panel::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle at bottom right, rgba(234, 88, 12, 0.04), transparent 70%);
          pointer-events: none;
        }

        .brand-content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .brand-middle {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 0 32px;
        }

        .brand-pill {
          display: inline-flex;
          width: fit-content;
          padding: 5px 14px;
          border: 1px solid #FDE68A;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          color: #B45309;
          background: #FFFBEB;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .brand-headline {
          font-size: clamp(32px, 3.8vw, 44px);
          font-weight: 800;
          color: #111827;
          line-height: 1.15;
          letter-spacing: -1px;
        }

        .brand-accent {
          background: linear-gradient(135deg, #F97316, #EA580C);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-desc {
          color: #6B7280;
          font-size: 15px;
          line-height: 1.7;
          margin-top: 18px;
        }

        .brand-testimonial {
          background: #FAF9F6;
          border: 1px solid #E8E6E0;
          border-radius: 16px;
          padding: 22px 24px;
          min-height: 100px;
        }

        .testimonial-text {
          color: #4B5563;
          font-size: 14px;
          line-height: 1.6;
          font-style: italic;
        }

        .testimonial-author {
          color: #9CA3AF;
          font-size: 12px;
          margin-top: 8px;
          font-weight: 600;
        }

        .testimonial-dots {
          display: flex;
          gap: 6px;
          margin-top: 12px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          border: none;
          background: #D1D5DB;
          cursor: pointer;
          padding: 0;
          transition: all 0.2s;
        }

        .dot.active {
          background: #EA580C;
          width: 24px;
          border-radius: 3px;
        }

        /* ── Right panel ── */
        .login-form-panel {
          flex: 0.85;
          background: white;
          border: 1px solid #E8E6E0;
          border-left: none;
          border-radius: 0 28px 28px 0;
          padding: 52px 48px;
          display: flex;
          align-items: center;
          position: relative;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        }

        .form-content {
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .form-header {
          margin-bottom: 36px;
        }

        .form-title {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          color: #9CA3AF;
          font-size: 15px;
          margin-top: 6px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field-label {
          font-size: 12px;
          font-weight: 700;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: #9CA3AF;
          pointer-events: none;
          transition: color 0.2s;
        }

        .form-input {
          width: 100%;
          background: #FAF9F6;
          border: 1.5px solid #E8E6E0;
          border-radius: 14px;
          padding: 16px 18px 16px 46px;
          color: #111827;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: #EA580C;
          background: white;
          box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1);
        }

        .form-input:focus ~ .input-icon {
          color: #EA580C;
        }

        .form-input::placeholder {
          color: #D1D5DB;
        }

        .form-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #9CA3AF;
          cursor: pointer;
          padding: 4px;
          display: flex;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #4B5563;
        }

        .form-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 6px;
          margin-bottom: 24px;
        }

        .forgot-link {
          background: none;
          border: none;
          color: #9CA3AF;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 0;
          font-family: 'Inter', sans-serif;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #EA580C;
        }

        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #F97316, #EA580C);
          color: white;
          padding: 16px;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 16px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(234, 88, 12, 0.3);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(234, 88, 12, 0.35);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-footer {
          margin-top: 32px;
        }

        .footer-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .footer-divider span {
          font-size: 11px;
          color: #D1D5DB;
          font-weight: 600;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }

        .footer-divider::before,
        .footer-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E8E6E0;
        }

        .trust-badges {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 14px;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #9CA3AF;
          font-weight: 600;
        }

        /* ── Responsive ── */
        @media (max-width: 920px) {
          .login-root {
            padding: 16px;
          }

          .login-container {
            flex-direction: column;
            max-width: 480px;
            min-height: auto;
          }

          .login-brand-panel {
            border-radius: 24px 24px 0 0;
            border-right: 1px solid #E8E6E0;
            border-bottom: none;
            padding: 36px 32px;
          }

          .login-form-panel {
            border-radius: 0 0 24px 24px;
            border-left: 1px solid #E8E6E0;
            padding: 36px 32px;
          }

          .brand-middle {
            padding: 28px 0 24px;
          }

          .brand-headline {
            font-size: 26px;
          }

          .brand-testimonial {
            display: none;
          }

          .form-content {
            max-width: 100%;
          }
        }

        @media (max-width: 480px) {
          .login-root {
            padding: 8px;
          }

          .login-brand-panel {
            padding: 24px 20px;
          }

          .login-form-panel {
            padding: 28px 20px;
          }

          .form-title {
            font-size: 24px;
          }

          .trust-badges {
            flex-wrap: wrap;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
