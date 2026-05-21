'use client';

import { Sparkles, Wand2, FileText, MessageSquare, Image, Brain, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const TOOLS = [
  {
    id: 'question-gen',
    icon: Sparkles,
    title: 'Question Generator',
    description: 'Generate custom questions from any topic or uploaded material instantly.',
    tag: 'Popular',
    tagColor: '#E8531D',
    tagBg: '#FFF0E8',
    iconBg: '#FFF0E8',
    iconColor: '#E8531D',
  },
  {
    id: 'rubric-builder',
    icon: FileText,
    title: 'Rubric Builder',
    description: 'Create detailed marking rubrics with AI assistance for fair, consistent grading.',
    tag: 'New',
    tagColor: '#059669',
    tagBg: '#D1FAE5',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
  },
  {
    id: 'lesson-planner',
    icon: Brain,
    title: 'Lesson Planner',
    description: 'Generate structured lesson plans aligned to your curriculum and learning objectives.',
    tag: null,
    tagColor: '',
    tagBg: '',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
  },
  {
    id: 'feedback-writer',
    icon: MessageSquare,
    title: 'Feedback Writer',
    description: 'Generate personalised, constructive student feedback in seconds.',
    tag: null,
    tagColor: '',
    tagBg: '',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
  },
  {
    id: 'diagram-gen',
    icon: Image,
    title: 'Diagram Generator',
    description: 'Auto-generate labelled diagrams and figures for science and maths questions.',
    tag: 'Beta',
    tagColor: '#D97706',
    tagBg: '#FEF3C7',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    id: 'instant-quiz',
    icon: Zap,
    title: 'Instant Quiz',
    description: 'Create quick 5-10 question quizzes for formative assessment in one click.',
    tag: null,
    tagColor: '',
    tagBg: '',
    iconBg: '#FCE7F3',
    iconColor: '#DB2777',
  },
];

export default function ToolkitPage() {
  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="status-dot" aria-hidden="true" />
          <h1 className="page-title">AI Teacher's Toolkit</h1>
        </div>
        <p className="page-subtitle">Powerful AI tools to supercharge your teaching workflow.</p>
      </div>

      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #E8531D 0%, #F97316 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          marginBottom: 28,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85, marginBottom: 6 }}>
            AI Powered
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>6 tools, zero extra work</h2>
          <p style={{ fontSize: 14, opacity: 0.9, maxWidth: 400, lineHeight: 1.5 }}>
            Everything you need to create, grade, and review assessments — all in one place.
          </p>
        </div>
        <Wand2 size={80} style={{ opacity: 0.15, position: 'absolute', right: 24, bottom: -10 }} aria-hidden="true" />
      </motion.div>

      {/* Tools grid */}
      <div className="assignment-grid">
        {TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: tool.iconBg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={22} color={tool.iconColor} />
                </div>
                {tool.tag && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 10px',
                    borderRadius: 100, background: tool.tagBg, color: tool.tagColor,
                  }}>
                    {tool.tag}
                  </span>
                )}
              </div>

              <div>
                <h3 className="card-title" style={{ marginBottom: 4 }}>{tool.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>{tool.description}</p>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
              >
                Launch Tool
                <ChevronRight size={14} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
