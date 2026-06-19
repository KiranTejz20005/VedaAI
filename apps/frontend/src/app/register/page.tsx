'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { signup, login } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      toast.error('All fields are required.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    // 1. Create account
    const signupResult = await signup({
      email,
      password,
      firstName,
      lastName,
      role: 'FACULTY',
    });

    if (signupResult.success) {
      // 2. Auto login
      const loginResult = await login(email, password);
      setIsSubmitting(false);

      if (loginResult.success) {
        toast.success('Account created! Welcome to Shiksha AI.');
        router.push('/onboarding');
      } else {
        toast.error('Account created, but automatic login failed. Please sign in manually.');
        router.push('/login');
      }
    } else {
      setIsSubmitting(false);
      toast.error(signupResult.error || 'Registration failed. Email might already be registered.');
    }
  };

  return (
    <div className="register-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .register-wrapper {
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

        /* Animated glowing gradients */
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

        /* Glassmorphic card design */
        .glass-register-card {
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 44px 36px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 10;
        }

        .glass-register-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          padding: 1px;
          background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .input-group {
          position: relative;
          margin-bottom: 20px;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
          transition: color 0.2s;
        }

        .register-input {
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

        .register-input:focus {
          border-color: #EA580C;
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.25);
        }

        .register-input:focus + .input-icon {
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

        .btn-submit:active {
          transform: translateY(1px);
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .brand-logo-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
        }

        .link-text {
          color: #9CA3AF;
          font-size: 14px;
          text-align: center;
          margin-top: 24px;
        }

        .link-highlight {
          color: #EA580C;
          text-decoration: none;
          font-weight: 600;
        }

        .link-highlight:hover {
          text-decoration: underline;
        }
      ` }} />

      <div className="glow-1" />
      <div className="glow-2" />
      <div className="grid-mask" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-register-card"
      >
        <div className="brand-header">
          <div className="brand-logo-icon">S</div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>Shiksha AI</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: 8 }}>Create Account</h2>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Register to customize your assessments & curriculum</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-row">
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="register-input" 
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <User className="input-icon" size={18} />
            </div>

            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="register-input" 
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <User className="input-icon" size={18} />
            </div>
          </div>

          <div className="input-group">
            <input 
              type="email" 
              className="register-input" 
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <Mail className="input-icon" size={18} />
          </div>

          <div className="input-group">
            <input 
              type="password" 
              className="register-input" 
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <Lock className="input-icon" size={18} />
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
                Register & Onboard
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="link-text">
          Already have an account?{' '}
          <Link href="/login" className="link-highlight">
            Sign in
          </Link>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
}
