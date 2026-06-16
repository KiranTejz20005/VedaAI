'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import {
  Brain,
  Zap,
  Shield,
  FileText,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  BarChart3,
  CheckCircle2,
  PenTool,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'Multi-Model AI Orchestration',
    description: 'Anthropic Claude, OpenAI GPT, and Gemini working in intelligent fallback chains for uninterrupted, premium generation.',
    glow: 'rgba(232, 83, 29, 0.06)',
  },
  {
    icon: Cpu,
    title: 'NVIDIA GPU Acceleration',
    description: 'Powered by local LLM engines accelerated with NVIDIA CUDA for rapid question synthesis and syllabus parsing.',
    glow: 'rgba(124, 58, 237, 0.06)',
  },
  {
    icon: Shield,
    title: 'Strict Schema Validation',
    description: 'Every generated question paper is rigorously checked against structural schemas. Zero raw, broken LLM output.',
    glow: 'rgba(16, 185, 129, 0.06)',
  },
  {
    icon: FileText,
    title: 'A4 PDF Export & Styling',
    description: 'Export beautifully formatted exam papers with school logos, instructions, custom margins, and answer keys.',
    glow: 'rgba(59, 130, 246, 0.06)',
  },
  {
    icon: BarChart3,
    title: 'Taxonomy & Difficulty Control',
    description: 'Balance cognitive depth with Bloom\'s Taxonomy ratios and difficulty level targeting (Easy, Medium, Hard).',
    glow: 'rgba(236, 72, 153, 0.06)',
  },
  {
    icon: Clock,
    title: 'Reliable Queue Processing',
    description: 'BullMQ-powered asynchronous background workers process large files and syllabus inputs with retry mechanisms.',
    glow: 'rgba(245, 158, 11, 0.06)',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: BookOpen,
    title: 'Provide Reference Source',
    desc: 'Upload reference textbooks, chapter files, or input a custom syllabus outline.',
  },
  {
    step: '02',
    icon: PenTool,
    title: 'Configure Guidelines',
    desc: 'Select desired question types (MCQ, Short, Long), difficulty ratios, and cognitive levels.',
  },
  {
    step: '03',
    icon: Layers,
    title: 'Review & Print',
    desc: 'Fine-tune generated questions, download print-ready PDF exam papers, and export key sheets.',
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function LandingPage() {
  return (
    <div className="landing-wrapper">
      {/* Dynamic styling for white/light landing page */}
      <style dangerouslySetInnerHTML={{ __html: `
        .landing-wrapper {
          min-height: 100vh;
          background-color: #F8F7F4;
          color: #111827;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle glowing background mesh in light theme */
        .landing-glow-1 {
          position: absolute;
          top: -10%;
          left: 15%;
          width: clamp(300px, 50vw, 700px);
          height: clamp(300px, 50vw, 700px);
          background: radial-gradient(circle, rgba(232, 83, 29, 0.06) 0%, rgba(0,0,0,0) 70%);
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
        }

        .landing-glow-2 {
          position: absolute;
          top: 30%;
          right: 10%;
          width: clamp(350px, 60vw, 850px);
          height: clamp(350px, 60vw, 850px);
          background: radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, rgba(0,0,0,0) 70%);
          filter: blur(100px);
          z-index: 0;
          pointer-events: none;
          animation: floatGlow 12s infinite alternate ease-in-out;
        }

        @keyframes floatGlow {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-30px, 40px) scale(1.1); }
        }

        /* Light theme Grid overlay */
        .landing-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0, 0, 0, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.015) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 1;
          pointer-events: none;
          mask-image: radial-gradient(circle at 50% 30%, black, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at 50% 30%, black, transparent 80%);
        }

        /* Nav Glassmorphism - Light */
        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          background: rgba(248, 247, 244, 0.8);
        }

        .landing-nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .landing-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 1.25rem;
          color: #111827;
          text-decoration: none;
          letter-spacing: -0.5px;
        }

        .landing-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #e8531d;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 950;
          font-size: 18px;
          box-shadow: 0 4px 10px rgba(232, 83, 29, 0.2);
        }

        /* Buttons */
        .landing-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          font-size: 14px;
          padding: 10px 20px;
          border-radius: 9999px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          text-decoration: none;
        }

        .landing-btn-primary {
          background: #111827;
          color: #ffffff;
          border: none;
          box-shadow: 0 4px 12px rgba(17, 24, 39, 0.15);
        }

        .landing-btn-primary:hover {
          background: #e8531d;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(232, 83, 29, 0.25);
        }

        .landing-btn-outline {
          background: #ffffff;
          color: #4b5563;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }

        .landing-btn-outline:hover {
          background: #f3f4f6;
          border-color: rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        /* Premium White Cards */
        .glass-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-card:hover {
          transform: translateY(-4px);
          border-color: rgba(232, 83, 29, 0.2);
          box-shadow: 0 10px 30px rgba(232, 83, 29, 0.06);
        }

        /* Layout Grids */
        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 48px;
        }

        .landing-how-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 32px;
          margin-top: 48px;
        }

        /* Dashboard Preview Mockup - Light */
        .dashboard-mockup {
          position: relative;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          padding: 8px;
          margin-top: 56px;
        }

        .mockup-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .mockup-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .mockup-body {
          background: #fdfdfc;
          border-radius: 10px;
          padding: 16px;
          aspect-ratio: 16/9;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      ` }} />

      {/* Grid Background Patterns */}
      <div className="landing-glow-1" />
      <div className="landing-glow-2" />
      <div className="landing-grid-overlay" />

      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <Link href="/" className="landing-logo">
            <div className="landing-logo-icon">S</div>
            <span>Shiksha AI</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/dashboard" className="landing-btn landing-btn-outline">
              Sign In
            </Link>
            <Link href="/dashboard" className="landing-btn landing-btn-primary">
              Enter App <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px 40px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--brand-light)',
            color: 'var(--brand)',
            border: '1px solid var(--brand-border)',
            borderRadius: 100,
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.2px',
            marginBottom: 24,
          }}>
            <Sparkles size={13} style={{ fill: 'var(--brand)' }} />
            Next-Generation Exam Generation System
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            fontSize: 'clamp(38px, 6vw, 68px)',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.05,
            color: '#111827',
            maxWidth: 800,
            margin: '0 auto 24px',
          }}
        >
          Generate High-Fidelity Question Papers{' '}
          <span style={{ color: 'var(--brand)' }}>With Multi-Model AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{
            fontSize: 'clamp(15px, 1.2vw, 18px)',
            color: '#4b5563',
            maxWidth: 640,
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}
        >
          Shiksha AI enables schools and universities to instantly generate syllabus-aligned exam sheets. Customize cognitive distributions, configure marks, and export pixel-perfect print layouts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <Link href="/dashboard" className="landing-btn landing-btn-primary" style={{ padding: '14px 32px', fontSize: '15px' }}>
            Get Started Free
            <ArrowRight size={16} />
          </Link>
          <Link href="/generate" className="landing-btn landing-btn-outline" style={{ padding: '14px 32px', fontSize: '15px' }}>
            Generate Demo Paper
          </Link>
        </motion.div>

        {/* Floating Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="dashboard-mockup"
        >
          <div className="mockup-header">
            <div className="mockup-dot" style={{ backgroundColor: '#EF4444' }} />
            <div className="mockup-dot" style={{ backgroundColor: '#F59E0B' }} />
            <div className="mockup-dot" style={{ backgroundColor: '#10B981' }} />
            <div style={{ marginLeft: 12, fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>app.shikshaai.com/dashboard</div>
          </div>
          <div className="mockup-body">
            {/* Visual simulation of a light-themed dashboard */}
            <div style={{ display: 'flex', gap: 12, height: '100%' }}>
              {/* Fake Sidebar */}
              <div style={{ width: 140, borderRight: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 12 }}>
                <div style={{ height: 16, width: '80%', background: 'rgba(0,0,0,0.06)', borderRadius: 4 }} />
                <div style={{ height: 16, width: '90%', background: 'rgba(0,0,0,0.03)', borderRadius: 4 }} />
                <div style={{ height: 16, width: '70%', background: 'rgba(0,0,0,0.03)', borderRadius: 4 }} />
                <div style={{ height: 16, width: '85%', background: 'rgba(0,0,0,0.03)', borderRadius: 4 }} />
              </div>
              {/* Fake Content area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: 22, width: 150, background: 'rgba(0,0,0,0.08)', borderRadius: 6 }} />
                  <div style={{ height: 24, width: 80, background: 'var(--brand-light)', color: 'var(--brand)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>Overview</div>
                </div>
                {/* Stats grid row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 8, padding: 10 }}>
                    <div style={{ height: 10, width: '50%', background: 'rgba(0,0,0,0.05)', marginBottom: 8, borderRadius: 2 }} />
                    <div style={{ height: 18, width: '40%', background: 'rgba(0,0,0,0.1)' }} />
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 8, padding: 10 }}>
                    <div style={{ height: 10, width: '60%', background: 'rgba(0,0,0,0.05)', marginBottom: 8, borderRadius: 2 }} />
                    <div style={{ height: 18, width: '30%', background: 'rgba(0,0,0,0.1)' }} />
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 8, padding: 10 }}>
                    <div style={{ height: 10, width: '40%', background: 'rgba(0,0,0,0.05)', marginBottom: 8, borderRadius: 2 }} />
                    <div style={{ height: 18, width: '50%', background: 'rgba(0,0,0,0.1)' }} />
                  </div>
                </div>
                {/* Simulated Chart/Details */}
                <div style={{ flex: 1, background: '#ffffff', border: '1px solid rgba(0,0,0,0.03)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 12, width: 120, background: 'rgba(0,0,0,0.05)', borderRadius: 2 }} />
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flex: 1, paddingBottom: 6 }}>
                    <div style={{ height: '40%', width: 24, background: 'rgba(232, 83, 29, 0.3)', borderRadius: '4px 4px 0 0' }} />
                    <div style={{ height: '75%', width: 24, background: 'rgba(232, 83, 29, 0.6)', borderRadius: '4px 4px 0 0' }} />
                    <div style={{ height: '90%', width: 24, background: 'rgba(124, 58, 237, 0.5)', borderRadius: '4px 4px 0 0' }} />
                    <div style={{ height: '50%', width: 24, background: 'rgba(0,0,0,0.06)', borderRadius: '4px 4px 0 0' }} />
                    <div style={{ height: '30%', width: 24, background: 'rgba(0,0,0,0.06)', borderRadius: '4px 4px 0 0' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            Premium Infrastructure Features
          </h2>
          <p style={{ color: '#4b5563', fontSize: '15px', marginTop: 8 }}>
            Engineered with modern educational metrics, speed, and validation constraints.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="landing-features-grid"
        >
          {FEATURES.map(({ icon: Icon, title, description, glow }) => (
            <motion.div key={title} variants={itemVariants} className="glass-card" style={{ padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 80,
                height: 80,
                background: `radial-gradient(circle, ${glow} 0%, rgba(0,0,0,0) 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'var(--brand-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
                color: 'var(--brand)',
              }}>
                <Icon size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                {title}
              </h3>
              <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '80px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            How Shiksha AI Works
          </h2>
          <p style={{ color: '#4b5563', fontSize: '15px', marginTop: 8, marginBottom: 48 }}>
            Generate classroom-ready materials in three steps.
          </p>

          <div className="landing-how-grid">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '18px',
                  background: 'var(--brand-light)',
                  border: '1px solid var(--brand-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'var(--brand)',
                }}>
                  <Icon size={24} />
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--brand)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}>
                  Step {step}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                  {title}
                </h3>
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.5, maxWidth: 220, margin: '0 auto' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section style={{ maxWidth: 840, margin: '0 auto', padding: '96px 24px', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card"
          style={{
            padding: '56px 40px',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(232, 83, 29, 0.05) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }} />
          
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
            {[CheckCircle2, CheckCircle2, CheckCircle2].map((Icon, i) => (
              <Icon key={i} size={18} color="var(--brand)" />
            ))}
          </div>
          
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', letterSpacing: '-0.8px', marginBottom: 14 }}>
            Ready to design your next exam?
          </h2>
          <p style={{ fontSize: '15px', color: '#4b5563', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Gain full control over question paper distributions and save hours of manual typing and evaluation formatting.
          </p>
          <Link href="/dashboard" className="landing-btn landing-btn-primary" style={{ padding: '14px 36px', fontSize: '15px' }}>
            <Sparkles size={16} /> Enter Shiksha AI Workspace
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)', padding: '32px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          &copy; 2026 Shiksha AI. Rebuilt from scratch. Designed with visual excellence.
        </p>
      </footer>
    </div>
  );
}
