'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchPaper } from '@/services/paper.service';
import type { GeneratedPaper, Question, Section } from '@/types/paper.types';
import type { DifficultyLevel } from '@/types/assignment.types';

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Moderate',
  hard: 'Challenging',
};

function formatMarks(marks: number) {
  return `${marks} ${marks === 1 ? 'Mark' : 'Marks'}`;
}

function DifficultyTag({ difficulty }: { difficulty: DifficultyLevel }) {
  return (
    <span style={{ fontSize: 'clamp(11px, 0.9vw, 12px)', fontWeight: 600, color: '#888', marginRight: 6, background: '#f3f4f6', padding: '1px 7px', borderRadius: 3, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}

function QuestionItem({ question, number }: { question: Question; number: number }) {
  return (
    <div className="question-item" style={{ marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
      <span className="question-num">{number}.</span>
      <div className="question-text-block">
        <DifficultyTag difficulty={question.difficulty} />
        {question.question}
      </div>
      <span className="question-marks">[{formatMarks(question.marks)}]</span>
    </div>
  );
}

function SectionBlock({ section, startNumber }: { section: Section; startNumber: number }) {
  return (
    <div style={{ marginBottom: 'clamp(36px, 5vw, 48px)' }}>
      <h3 style={{ fontSize: 'clamp(16px, 1.5vw, 19px)', fontWeight: 700, color: '#111', textAlign: 'center', marginBottom: 'clamp(14px, 1.5vw, 18px)' }}>
        {section.title}
      </h3>
      {section.instruction && (
        <p style={{ fontSize: 'clamp(13px, 1.1vw, 15px)', color: '#6b7280', fontStyle: 'italic', textAlign: 'left', marginBottom: 'clamp(12px, 1.5vw, 16px)' }}>
          {section.instruction}
        </p>
      )}
      {section.questions.map((q, qi) => (
        <QuestionItem key={`${section.title}-${startNumber + qi}-${qi}`} question={q} number={startNumber + qi} />
      ))}
    </div>
  );
}

function AnswerKey({ sections }: { sections: Section[] }) {
  const answers = sections
    .flatMap((s) => s.questions)
    .filter((q) => q.answer)
    .map((q, i) => ({ number: i + 1, answer: typeof q.answer === 'string' ? q.answer : q.answer?.text }))
    .filter((item) => item.answer);

  if (answers.length === 0) return null;

  return (
    <div style={{ marginTop: 'clamp(28px, 4vw, 36px)', paddingTop: 'clamp(16px, 2.5vw, 24px)', borderTop: '2px solid #111827' }}>
      <h4 style={{ fontSize: 'clamp(16px, 1.5vw, 19px)', fontWeight: 700, color: '#111', marginBottom: 'clamp(14px, 1.8vw, 18px)' }}>Answer Key</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.5vw, 16px)' }}>
        {answers.map(({ number, answer }) => (
          <div key={number} className="question-item">
            <span className="question-num">{number}.</span>
            <div className="question-text-block" style={{ color: '#4B5563', whiteSpace: 'pre-line' }}>{answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PaperViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => { if (error) toast.error(error, { id: 'paper-error', position: 'bottom-center' }); }, [error]);

  useEffect(() => {
    fetchPaper(id).then(setPaper).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load paper')).finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!paper?.pdfUrl) { window.print(); return; }
    setDownloading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
      const link = document.createElement('a');
      link.href = `${apiUrl}${paper.pdfUrl}`;
      link.download = `${paper.title.replace(/\s+/g, '_')}.pdf`;
      link.click();
    } finally { setDownloading(false); }
  };

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      const { generateAssignment } = await import('@/services/assignment.service');
      await generateAssignment(id);
      toast.success('Regeneration started!', { id: 'regen-toast' });
      router.push(`/assignments/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate', { id: 'regen-err' });
    } finally {
      setRegenerating(false);
    }
  }, [id, router]);

  if (loading) {
    return (
      <>
        <div className="skeleton" style={{ height: 24, width: 'clamp(120px, 25vw, 180px)', borderRadius: 6, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 'clamp(400px, 60vh, 600px)', borderRadius: 16 }} />
      </>
    );
  }

  if (error || !paper) {
    return (
      <div className="empty-state">
        <div className="empty-illustration" aria-hidden="true">
          <img src="/empty-state.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h2 className="empty-title">Failed to load question paper</h2>
        <p className="empty-desc">The question paper could not be retrieved.</p>
        <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 12px)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href={`/assignments/${id}`} className="btn btn-dark btn-pill">Back to Assignment</Link>
          <button onClick={() => window.location.reload()} className="btn btn-secondary btn-pill" style={{ cursor: 'pointer' }}>Reload Page</button>
        </div>
      </div>
    );
  }

  const meta = paper.canonicalMetadata;
  const schoolName = meta?.schoolName || 'School';
  const subject = meta?.subject || paper.title;
  const className = meta?.className || '';
  const duration = meta?.durationMinutes || paper.duration || 45;
  const totalMarks = meta?.generatedMarks || paper.totalMarks;

  const sectionStarts = paper.sections.reduce<Array<{ title: string; start: number }>>((acc, section) => {
    const start = acc.length === 0 ? 1 : acc[acc.length - 1]!.start + paper.sections[acc.length - 1]!.questions.length;
    acc.push({ title: section.title, start });
    return acc;
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <div className="outer-paper-container">
        <div className="dark-banner-card print-hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', margin: 0, lineHeight: 1.7, fontWeight: 500, flex: '1 1 auto' }}>
            Here is your customized <u><strong>Question Paper</strong></u>:
          </p>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => void handleRegenerate()}
              disabled={regenerating}
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 'var(--radius-pill)', color: '#FFFFFF', padding: 'clamp(8px, 1vw, 10px) clamp(16px, 2vw, 20px)', fontSize: 'var(--text-sm)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            >
              {regenerating ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Regenerate
            </button>
            <button
              onClick={() => void handleDownload()}
              disabled={downloading}
              style={{ background: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-pill)', color: '#111827', padding: 'clamp(8px, 1vw, 10px) clamp(16px, 2vw, 20px)', fontSize: 'var(--text-sm)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Download as PDF
            </button>
          </div>
        </div>

        <div className="paper-card" style={{ fontFamily: '"Times New Roman", Times, serif', color: '#111827' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 3vw, 28px)' }}>
            <h1 style={{ fontSize: 'clamp(22px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '0.5px', margin: 0 }}>
              {schoolName}
            </h1>
            {subject && (
              <h2 style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', fontWeight: 700, margin: '6px 0 0 0' }}>
                Subject: {subject}
              </h2>
            )}
            {className && (
              <h3 style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', fontWeight: 700, margin: '4px 0 0 0' }}>
                Class: {className}
              </h3>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700, borderBottom: '2px solid #111827', paddingBottom: 'clamp(10px, 1.2vw, 14px)', marginBottom: 'clamp(16px, 2vw, 20px)', gap: 12, flexWrap: 'wrap' }}>
            <span>Time Allowed: {duration} minutes</span>
            <span>Maximum Marks: {totalMarks}</span>
          </div>

          <p style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700, margin: '0 0 clamp(20px, 2.5vw, 24px) 0' }}>
            All questions are compulsory unless stated otherwise.
          </p>

          <div className="student-fields-grid" style={{ marginBottom: 'clamp(28px, 3.5vw, 36px)', fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700 }}>
            <div>Name: <span style={{ borderBottom: '2px solid #111827', display: 'inline-block', minWidth: 'clamp(120px, 18vw, 160px)' }}>&nbsp;</span></div>
            <div>Roll Number: <span style={{ borderBottom: '2px solid #111827', display: 'inline-block', minWidth: 'clamp(120px, 18vw, 160px)' }}>&nbsp;</span></div>
            <div>Section: <span style={{ borderBottom: '2px solid #111827', display: 'inline-block', minWidth: 'clamp(80px, 12vw, 100px)' }}>&nbsp;</span></div>
          </div>

          {paper.sections.map((section, index) => (
            <SectionBlock key={section.title} section={section} startNumber={sectionStarts[index]?.start ?? 1} />
          ))}

          <p style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', fontWeight: 700, textAlign: 'center', margin: '0 0 clamp(28px, 4vw, 36px) 0', borderBottom: '2px solid #111827', paddingBottom: 'clamp(20px, 2.5vw, 24px)' }}>
            End of Question Paper
          </p>

          <AnswerKey sections={paper.sections} />
        </div>
      </div>
    </div>
  );
}
