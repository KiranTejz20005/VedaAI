'use client';

import { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Printer,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { fetchPaper } from '@/services/paper.service';
import type { GeneratedPaper, Question, Section } from '@/types/paper.types';
import type { QuestionType, DifficultyLevel } from '@/types/assignment.types';

const TYPE_LABELS: Record<QuestionType, string> = {
  'short-answer': 'Short Answer',
  'long-answer': 'Long Answer',
  mcq: 'MCQ',
  'true-false': 'True / False',
  'fill-blank': 'Fill in Blank',
};

const DIFF_COLORS: Record<DifficultyLevel, string> = {
  easy: 'badge-completed',
  medium: 'badge-queued',
  hard: 'badge-failed',
};

// ─── Single question ───────────────────────────────────────
function QuestionItem({ question, number }: { question: Question; number: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: '#555', minWidth: 20 }}>{number}.</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13.5, color: '#222', lineHeight: 1.6, margin: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              marginRight: 6,
              background: '#f3f4f6',
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            [{question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}]
          </span>
          {question.question}
        </p>

        {/* MCQ options */}
        {question.type === 'mcq' && question.options && (
          <div style={{ marginTop: 6, paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {question.options.map((opt) => (
              <div key={opt.key} style={{ fontSize: 13, color: '#444', display: 'flex', gap: 6 }}>
                <span style={{ fontWeight: 600, minWidth: 20 }}>{opt.key}.</span>
                <span>{opt.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* True/False */}
        {question.type === 'true-false' && (
          <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
            {['True', 'False'].map((o) => (
              <span
                key={o}
                style={{
                  fontSize: 12,
                  padding: '2px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 100,
                  color: '#6b7280',
                }}
              >
                {o}
              </span>
            ))}
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#6b7280',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        [{question.marks} Marks]
      </span>
    </div>
  );
}

// ─── Section block ─────────────────────────────────────────
function SectionBlock({ section, startNumber }: { section: Section; startNumber: number }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#111',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: 6,
          marginBottom: 14,
        }}
      >
        {section.title}
      </h3>
      {section.instruction && (
        <p
          style={{
            fontSize: 12.5,
            color: '#6b7280',
            fontStyle: 'italic',
            marginBottom: 10,
          }}
        >
          {section.instruction}
        </p>
      )}
      {section.questions.map((q, qi) => (
        <QuestionItem key={q.id} question={q} number={startNumber + qi} />
      ))}
    </div>
  );
}

// ─── Answer key ────────────────────────────────────────────
function AnswerKey({ sections }: { sections: Section[] }) {
  const answers = sections
    .flatMap((s) => s.questions)
    .filter((q) => q.answer)
    .map((q, i) => ({ number: i + 1, answer: q.answer! }));

  if (answers.length === 0) return null;

  return (
    <div style={{ marginTop: 36, paddingTop: 24, borderTop: '2px solid #e5e7eb' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 14 }}>
        Answer Key
      </h3>
      <ol style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 0, listStyle: 'none' }}>
        {answers.map(({ number, answer }) => (
          <li key={number} style={{ fontSize: 13, color: '#444', display: 'flex', gap: 8 }}>
            <span style={{ fontWeight: 700, minWidth: 24, color: '#111' }}>{number}.</span>
            <span>{answer}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────
export default function PaperViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchPaper(id)
      .then(setPaper)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load paper'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!paper?.pdfUrl) {
      window.print();
      return;
    }
    setDownloading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
      const link = document.createElement('a');
      link.href = `${apiUrl}${paper.pdfUrl}`;
      link.download = `${paper.title.replace(/\s+/g, '_')}.pdf`;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="skeleton" style={{ height: 24, width: 180, borderRadius: 6 }} />
        </div>
        <div className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 600, borderRadius: 16 }} />
      </>
    );
  }

  if (error || !paper) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 32px',
          textAlign: 'center',
        }}
      >
        <AlertCircle size={40} style={{ color: '#EF4444', marginBottom: 12 }} />
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{error ?? 'Paper not found'}</p>
        <Link href={`/assignments/${id}`} className="btn btn-secondary btn-sm">
          Back to Assignment
        </Link>
      </div>
    );
  }

  let questionNumber = 1;

  const allQuestions = paper.sections.flatMap((s) => s.questions);
  const totalQs = allQuestions.length;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href={`/assignments/${id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={15} />
            Back
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 760 }}>
        {/* AI banner (blue) */}
        <div className="paper-banner" role="status">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            Certainly, here are customized Question Paper for your CBSE Grade 8 Science classes.
          </p>
          <button
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="btn btn-secondary btn-sm"
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Download as PDF
          </button>
        </div>

        {/* Actual paper */}
        <div className="paper-page" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          {/* School header */}
          <div className="paper-school">Delhi Public School, Sector-4, Bokaro</div>
          <div className="paper-meta">
            <div>Subject: {paper.title}</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>
              Time Allowed: {paper.duration ?? 45} minutes &nbsp;&nbsp;|&nbsp;&nbsp;
              Maximum Marks: {paper.totalMarks}
            </div>
          </div>

          <div
            style={{
              borderTop: '2px solid #111',
              borderBottom: '1px solid #111',
              padding: '6px 0',
              marginBottom: 20,
              fontSize: 13,
              color: '#333',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Time Allowed: {paper.duration ?? 45} minutes</span>
            <span>Maximum Marks: {paper.totalMarks}</span>
          </div>

          <p style={{ fontSize: 13, fontStyle: 'italic', marginBottom: 16, color: '#444' }}>
            All questions are compulsory unless stated otherwise.
          </p>

          {/* Student fields */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
            {['Name', 'Roll Number', 'Class: _th Section'].map((f) => (
              <div key={f} style={{ fontSize: 13, color: '#333' }}>
                {f}: <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 120 }}>&nbsp;</span>
              </div>
            ))}
          </div>

          {/* Sections + questions */}
          {paper.sections.map((section) => {
            const startNum = questionNumber;
            questionNumber += section.questions.length;
            return (
              <SectionBlock key={section.title} section={section} startNumber={startNum} />
            );
          })}

          {/* End note */}
          <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginTop: 24, color: '#111' }}>
            End of Question Paper
          </p>

          {/* Answer key */}
          <AnswerKey sections={paper.sections} />
        </div>

        {/* Print button (bottom) */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }} className="print:hidden">
          <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>
    </>
  );
}
