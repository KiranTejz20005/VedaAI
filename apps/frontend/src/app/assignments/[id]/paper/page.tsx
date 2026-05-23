'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, AlertCircle, Loader2 } from 'lucide-react';
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
            [{DIFFICULTY_LABELS[question.difficulty]}]
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
        [{formatMarks(question.marks)}]
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
          textAlign: 'center',
          marginBottom: 16,
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
        <QuestionItem
          key={`${section.title}-${startNumber + qi}-${qi}`}
          question={q}
          number={startNumber + qi}
        />
      ))}
    </div>
  );
}

// ─── Answer key ────────────────────────────────────────────
function AnswerKey({ sections }: { sections: Section[] }) {
  const answers = sections
    .flatMap((s) => s.questions)
    .filter((q) => q.answer)
    .map((q, i) => ({
      number: i + 1,
      answer: typeof q.answer === 'string' ? q.answer : q.answer?.text,
    }))
    .filter((item) => item.answer);

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

  const meta = paper.canonicalMetadata;
  const schoolName = meta?.schoolName ?? 'School';
  const subject = meta?.subject ?? paper.title;
  const className = meta?.className ?? 'Not Specified';
  const duration = meta?.durationMinutes ?? paper.duration ?? 45;
  const totalMarks = meta?.generatedMarks ?? paper.totalMarks;
  const sectionStarts = paper.sections.reduce<Array<{ title: string; start: number }>>((acc, section) => {
    const start =
      acc.length === 0
        ? 1
        : acc[acc.length - 1]!.start + paper.sections[acc.length - 1]!.questions.length;
    acc.push({ title: section.title, start });
    return acc;
  }, []);

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

      <div style={{ maxWidth: 820 }}>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }} className="print:hidden">
          <button
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Download as PDF
          </button>
        </div>

        {/* Actual paper */}
        <div className="paper-page" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          {/* School header */}
          <div className="paper-school">{schoolName}</div>
          <div className="paper-meta">
            <div>{subject}</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>
              Class: {className} &nbsp;&nbsp;|&nbsp;&nbsp;
              Time Allowed: {duration} minutes &nbsp;&nbsp;|&nbsp;&nbsp;
              Maximum Marks: {totalMarks}
            </div>
          </div>

          <p style={{ fontSize: 13, fontStyle: 'italic', marginBottom: 16, color: '#444' }}>
            All questions are compulsory unless stated otherwise.
          </p>

          {/* Student fields */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
            {['Name', 'Roll Number', 'Section'].map((f) => (
              <div key={f} style={{ fontSize: 13, color: '#333' }}>
                {f}: <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 120 }}>&nbsp;</span>
              </div>
            ))}
          </div>

          {/* Sections + questions */}
          {paper.sections.map((section, index) => (
            <SectionBlock
              key={section.title}
              section={section}
              startNumber={sectionStarts[index]?.start ?? 1}
            />
          ))}

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
