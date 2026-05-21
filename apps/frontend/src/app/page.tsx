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
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'Multi-Model AI',
    description: 'OpenAI, Anthropic, Gemini & NVIDIA working in fallback chains for uninterrupted generation.',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
  },
  {
    icon: Zap,
    title: 'Realtime Progress',
    description: 'WebSocket-powered live updates show every generation stage as it happens.',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    icon: Shield,
    title: 'Validated Output',
    description: 'Every AI response is parsed and schema-validated. Raw LLM text never reaches your screen.',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
  },
  {
    icon: FileText,
    title: 'PDF Export',
    description: 'Export beautifully formatted A4 exam papers with headers, footers, and page numbers.',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
  },
  {
    icon: BarChart3,
    title: 'Difficulty Control',
    description: 'Fine-tune easy / medium / hard ratios and get perfectly balanced assessments.',
    iconBg: '#FCE7F3',
    iconColor: '#DB2777',
  },
  {
    icon: Clock,
    title: 'Queue-Based Processing',
    description: 'BullMQ-backed job queue ensures every assignment gets generated reliably.',
    iconBg: '#FEF9C3',
    iconColor: '#CA8A04',
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      {/* ── Hero ── */}
      <section
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'clamp(40px, 8vw, 80px) clamp(16px, 5vw, 32px) clamp(32px, 6vw, 60px)',
          textAlign: 'center',
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--brand-light)',
              color: 'var(--brand)',
              border: '1px solid var(--brand-border)',
              borderRadius: 100,
              padding: '4px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 28,
            }}
          >
            <Sparkles size={13} />
            AI-Powered Assessment Creator
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            marginBottom: 20,
          }}
        >
          Generate Exam Papers{' '}
          <span style={{ color: 'var(--brand)' }}>in Seconds</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            maxWidth: 560,
            margin: '0 auto 36px',
            lineHeight: 1.7,
          }}
        >
          VedaAI helps educators create structured, high-quality assessments effortlessly.
          Upload your material, configure question types, and let AI do the rest.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <Link href="/dashboard" className="btn btn-dark" style={{ padding: '12px 28px', fontSize: 15 }}>
            Go to Dashboard
            <ArrowRight size={17} />
          </Link>
          <Link
            href="/assignments/create"
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: 15 }}
          >
            <Sparkles size={16} />
            Create Assignment
          </Link>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px, 5vw, 32px) 60px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="landing-stats-grid"
        >
          {[
            { value: '30s', label: 'Average generation time' },
            { value: '100%', label: 'Schema-validated output' },
            { value: '7+', label: 'Question types supported' },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="card"
              style={{ textAlign: 'center', padding: '24px 16px' }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: 'var(--brand)',
                  letterSpacing: '-1px',
                  marginBottom: 6,
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Everything you need
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
            Built for teachers who want to spend less time creating exams and more time teaching.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="landing-features-grid"
        >
          {FEATURES.map(({ icon: Icon, title, description, iconBg, iconColor }) => (
            <motion.div key={title} variants={itemVariants} className="card">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Icon size={22} color={iconColor} />
              </div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                {title}
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section
        style={{
          background: 'white',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '64px 32px',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.4px',
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            How it works
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 48 }}>
            Three simple steps to a professional exam paper.
          </p>

          <div className="landing-how-grid">
            {[
              {
                step: '01',
                icon: BookOpen,
                title: 'Upload Material',
                desc: 'Upload your textbook pages, notes, or PDFs. VedaAI reads and understands the content.',
                iconBg: 'var(--brand-light)',
                iconColor: 'var(--brand)',
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'Configure Questions',
                desc: 'Choose question types, difficulty distribution, marks, and any special instructions.',
                iconBg: '#EDE9FE',
                iconColor: '#7C3AED',
              },
              {
                step: '03',
                icon: FileText,
                title: 'Download Paper',
                desc: 'Get a print-ready A4 exam paper with answer key, ready to distribute to students.',
                iconBg: '#D1FAE5',
                iconColor: '#059669',
              },
            ].map(({ step, icon: Icon, title, desc, iconBg, iconColor }) => (
              <div key={step} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Icon size={26} color={iconColor} />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Step {step}
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '80px 32px',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div
            style={{
              display: 'flex',
              gap: 6,
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            {[CheckCircle2, CheckCircle2, CheckCircle2].map((Icon, i) => (
              <Icon key={i} size={20} color="var(--brand)" />
            ))}
          </div>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: '-0.6px',
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            Ready to save hours every week?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
            Join educators who use VedaAI to create professional exam papers faster than ever before.
          </p>
          <Link
            href="/assignments/create"
            className="btn btn-primary"
            style={{ padding: '14px 36px', fontSize: 16, borderRadius: 100 }}
          >
            <Sparkles size={18} />
            Create Your First Assignment
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '24px 32px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          © 2025 VedaAI — Built for educators, powered by AI
        </p>
      </footer>
    </div>
  );
}
