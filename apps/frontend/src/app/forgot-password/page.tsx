'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call for password reset
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Password reset link sent!');
    }, 1500);
  };

  return (
    <div className="login-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #030712;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        .glow-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234, 88, 12, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
          top: -10%;
          left: -10%;
          filter: blur(80px);
          animation: floatGlow1 20s infinite alternate ease-in-out;
        }

        .glow-2 {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(0, 0, 0, 0) 70%);
          bottom: -10%;
          right: -10%;
          filter: blur(100px);
          animation: floatGlow2 25s infinite alternate ease-in-out;
        }

        @keyframes floatGlow1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(80px, 50px) scale(1.2); }
        }

        @keyframes floatGlow2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-60px, -90px) scale(1.1); }
        }

        .grid-mask {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(circle at 50% 50%, black, transparent 85%);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, black, transparent 85%);
          pointer-events: none;
        }

        .glass-login-card {
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 48px 40px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 10;
        }

        .input-group {
          position: relative;
          margin-bottom: 24px;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
          transition: color 0.2s;
        }

        .login-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 16px 14px 44px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-input:focus {
          border-color: #EA580C;
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.25);
        }

        .login-input:focus + .input-icon {
          color: #EA580C;
        }

        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);
        }

        .btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(234, 88, 12, 0.45);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .link-text {
          color: #9CA3AF;
          font-size: 14px;
          text-align: center;
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .link-highlight {
          color: #EA580C;
          text-decoration: none;
          font-weight: 600;
        }

        .link-highlight:hover {
          text-decoration: underline;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` }} />

      <div className="glow-1" />
      <div className="glow-2" />
      <div className="grid-mask" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-login-card"
      >
        {!isSubmitted ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
                <Mail size={24} color="#EA580C" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: 8 }}>Forgot password?</h2>
              <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: 1.5 }}>
                No worries, we'll send you reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input 
                  type="email" 
                  className="login-input" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <Mail className="input-icon" size={18} />
              </div>

              <button 
                type="submit" 
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="spinner" style={{
                    width: 18,
                    height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                ) : (
                  <>
                    Send reset instructions
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <Mail size={24} color="#10B981" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: 8 }}>Check your email</h2>
            <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: 1.5, marginBottom: 24 }}>
              We sent a password reset link to <br/>
              <span style={{ color: 'white', fontWeight: 600 }}>{email}</span>
            </p>
            <button 
              type="button" 
              className="btn-submit"
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: 'none' }}
            >
              Try another email address
            </button>
          </div>
        )}

        <div className="link-text">
          <ArrowLeft size={14} />
          <Link href="/login" className="link-highlight">
            Back to log in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
