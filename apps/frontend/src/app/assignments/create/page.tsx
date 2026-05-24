'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Calendar,
  Mic,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
} from 'lucide-react';
import { createAssignment } from '@/services/assignment.service';
import { useAssignmentStore } from '@/store/assignment.store';
import { useGenerationStore } from '@/store/generation.store';
import type { QuestionType } from '@/types/assignment.types';

// ─── Types ─────────────────────────────────────────────────
type QuestionTypeOption =
  | 'Multiple Choice Questions'
  | 'Short Questions'
  | 'Long Questions'
  | 'Diagram/Graph-Based Questions'
  | 'Numerical Problems'
  | 'True / False'
  | 'Fill in the Blank';

const QUESTION_TYPE_OPTIONS: QuestionTypeOption[] = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'True / False',
  'Fill in the Blank',
];

interface QuestionRow {
  id: string;
  type: QuestionTypeOption;
  count: number;
  marks: number;
}

interface FormData {
  title: string;
  subject: string;
  dueDate: string;
  additionalInfo: string;
}

function parseDurationFromText(input: string): number | null {
  const text = input.toLowerCase();
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs)\b/);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    if (Number.isFinite(hours) && hours > 0) {
      return Math.min(600, Math.max(1, Math.round(hours * 60)));
    }
  }

  const minuteMatch = text.match(/(\d+)\s*(minute|minutes|min|mins)\b/);
  if (minuteMatch) {
    const mins = Number(minuteMatch[1]);
    if (Number.isFinite(mins) && mins > 0) {
      return Math.min(600, Math.max(1, Math.round(mins)));
    }
  }
  return null;
}

function extractGradeHint(input: string): string | null {
  const text = input.toLowerCase();
  const gradeMatch =
    text.match(/\b(?:class|grade|std|standard)\s*(\d{1,2})(?:st|nd|rd|th)?\b/) ||
    text.match(/\b(\d{1,2})(?:st|nd|rd|th)\s*(?:class|grade|standard)\b/);
  if (!gradeMatch) return null;
  const gradeNum = Number(gradeMatch[1]);
  if (!Number.isFinite(gradeNum) || gradeNum < 1 || gradeNum > 12) return null;
  return `Grade ${gradeNum}`;
}

// ─── Counter component ──────────────────────────────────────
function Counter({
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="counter">
      <button
        type="button"
        className="counter-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease"
        disabled={value <= min}
      >
        <Minus size={14} />
      </button>
      <span className="counter-val">{value}</span>
      <button
        type="button"
        className="counter-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase"
        disabled={value >= max}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ─── File upload zone ───────────────────────────────────────
function FileUploadZone({
  files,
  onAdd,
  onRemove,
  onRename,
}: {
  files: File[];
  onAdd: (f: File[]) => void;
  onRemove: (i: number) => void;
  onRename: (i: number, newName: string) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) =>
          f.type === 'application/pdf' ||
          f.type === 'text/plain' ||
          f.type.startsWith('image/')
      );
      onAdd(dropped);
    },
    [onAdd]
  );

  const uploadArea = (
    <div style={{ flex: files.length > 0 ? '1' : 'none' }}>
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="region"
        aria-label="File upload area"
      >
        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
          {/* Cloud upload icon */}
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            style={{ margin: '0 auto 12px' }}
            aria-hidden="true"
          >
            <circle cx="22" cy="22" r="22" fill="#F3F4F6" />
            <path
              d="M22 26V18M22 18L19 21M22 18L25 21"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 30h14"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="upload-zone-title">Choose a file or drag &amp; drop it here</p>
          <p className="upload-zone-sub" style={{ marginBottom: 12 }}>
            JPEG, PNG, upto 10MB
          </p>
          <span
            style={{
              display: 'inline-block',
              padding: '7px 20px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            Browse Files
          </span>
          <input
            id="file-upload"
            type="file"
            accept="image/jpeg,image/png,application/pdf,text/plain"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files) onAdd(Array.from(e.target.files)); }}
            aria-label="Upload material files"
          />
        </label>
      </div>

      {files.length === 0 && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Upload images of your preferred document/image
        </p>
      )}
    </div>
  );

  return (
    <div style={{ marginBottom: 20 }}>
      {files.length > 0 ? (
        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
          {/* Left: Upload Area */}
          {uploadArea}
          
          {/* Right: Uploaded Files */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Uploaded Documents</h3>
            {files.map((file, i) => {
              let Icon = FileIcon;
              let iconColor = '#6B7280';
              if (file.type.startsWith('image/')) {
                Icon = ImageIcon;
                iconColor = '#3B82F6';
              } else if (file.name.endsWith('.pdf')) {
                Icon = FileText;
                iconColor = '#EF4444';
              } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.txt')) {
                Icon = FileText;
                iconColor = '#3B82F6';
              }

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    value={file.name}
                    onChange={(e) => onRename(i, e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: '1px solid transparent',
                      background: 'transparent',
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 4px',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '1px solid var(--border-focus)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid transparent';
                      e.target.style.background = 'transparent';
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {Math.max(1, Math.round(file.size / 1024))} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        uploadArea
      )}
    </div>
  );
}

function CustomDatePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleSelect = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  let displayValue = '';
  if (value) {
    const [y, m, d] = value.split('-');
    if (y && m && d) displayValue = `${d}-${m}-${y}`;
  }

  return (
    <div style={{ position: 'relative' }} ref={popupRef}>
      <div 
        className="input date-input"
        style={{ 
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'white', border: '1px solid var(--border)', padding: '9px 14px', borderRadius: 'var(--radius-md)'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: displayValue ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {displayValue || 'DD-MM-YYYY'}
        </span>
        <Calendar size={18} color="var(--text-muted)" />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50,
          background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)', padding: 16, width: 280
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button 
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              style={{ background: 'var(--bg-input)', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button 
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              style={{ background: 'var(--bg-input)', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {days.map((d, i) => {
              if (d === null) return <div key={i} />;
              
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(d)}
                  style={{
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? '#E8531D' : 'transparent',
                    color: isSelected ? '#000000' : 'var(--text-primary)',
                    borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: isSelected || isToday ? 700 : 400,
                    margin: 'auto'
                  }}
                  onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  {d}
                </button>
              )
            })}
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <button 
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              style={{ background: '#FFF0E8', border: 'none', color: '#E8531D', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 14px', borderRadius: 100 }}
            >
              Clear
            </button>
            <button 
              type="button"
              onClick={() => {
                const today = new Date();
                onChange(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                setIsOpen(false);
              }}
              style={{ background: '#FFF0E8', border: 'none', color: '#E8531D', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 14px', borderRadius: 100 }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Question type row ──────────────────────────────────────
function QuestionTypeRow({
  row,
  onChange,
  onRemove,
  isOnly,
}: {
  row: QuestionRow;
  onChange: (row: QuestionRow) => void;
  onRemove: () => void;
  isOnly: boolean;
}) {
  return (
    <div className="question-row-container">
      {/* Desktop view */}
      <div className="desktop-question-row">
        <div className="question-select-wrap">
          <select
            value={row.type}
            onChange={(e) => onChange({ ...row, type: e.target.value as QuestionTypeOption })}
            className="input question-select"
            aria-label="Question type"
          >
            {QUESTION_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <ChevronDown size={16} className="question-select-chevron" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={isOnly}
          className="question-remove-btn"
          aria-label="Remove question type"
        >
          <X size={14} />
        </button>

        <Counter
          value={row.count}
          onChange={(v) => onChange({ ...row, count: v })}
          min={1}
          max={50}
        />

        <Counter
          value={row.marks}
          onChange={(v) => onChange({ ...row, marks: v })}
          min={1}
          max={20}
        />
      </div>

      {/* Mobile view */}
      <div className="mobile-question-row">
        <div className="mobile-row-top">
          <div className="question-select-wrap">
            <select
              value={row.type}
              onChange={(e) => onChange({ ...row, type: e.target.value as QuestionTypeOption })}
              className="input question-select"
              aria-label="Question type"
            >
              {QUESTION_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown size={16} className="question-select-chevron" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={isOnly}
            className="question-remove-btn"
            aria-label="Remove question type"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mobile-counters-container">
          <div className="mobile-counter-item">
            <span className="counter-label">No. of Questions</span>
            <Counter
              value={row.count}
              onChange={(v) => onChange({ ...row, count: v })}
              min={1}
              max={50}
            />
          </div>

          <div className="mobile-counter-item">
            <span className="counter-label">Marks</span>
            <Counter
              value={row.marks}
              onChange={(v) => onChange({ ...row, marks: v })}
              min={1}
              max={20}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────
const TOTAL_STEPS = 2;

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addAssignment } = useAssignmentStore();
  const { setQueued } = useGenerationStore();

  // Basic form data
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subject: '',
    dueDate: '',
    additionalInfo: '',
  });

  // Question rows
  const [questionRows, setQuestionRows] = useState<QuestionRow[]>([
    { id: '1', type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { id: '2', type: 'Short Questions', count: 3, marks: 2 },
    { id: '3', type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
    { id: '4', type: 'Numerical Problems', count: 5, marks: 5 },
  ]);

  const totalQuestions = questionRows.reduce((s, r) => s + r.count, 0);
  const totalMarks = questionRows.reduce((s, r) => s + r.count * r.marks, 0);

  const addRow = () => {
    setQuestionRows((prev) => [
      ...prev,
      { id: String(Date.now()), type: 'Multiple Choice Questions', count: 4, marks: 1 },
    ]);
  };

  const updateRow = (id: string, updated: QuestionRow) => {
    setQuestionRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const removeRow = (id: string) => {
    setQuestionRows((prev) => prev.filter((r) => r.id !== id));
  };

  const progressPct = (step / TOTAL_STEPS) * 100;

  const typeMapping: Record<string, string> = {
    'Multiple Choice Questions': 'mcq',
    'Short Questions': 'short-answer',
    'Long Questions': 'long-answer',
    'Diagram/Graph-Based Questions': 'long-answer',
    'Numerical Problems': 'short-answer',
    'True / False': 'true-false',
    'Fill in the Blank': 'fill-blank',
  };

  const handleSubmit = async () => {
    if (!formData.dueDate) {
      toast.error('Please set a due date');
      return;
    }

    setIsSubmitting(true);
    try {
      const uniqueTypes = [...new Set(questionRows.map((r) => typeMapping[r.type] || r.type))] as QuestionType[];
      const typeBreakdown = questionRows.map((r) => ({
        type: typeMapping[r.type] || r.type,
        displayType: r.type,
        count: r.count,
        marksPerQuestion: r.marks,
      }));
      const inferredDuration = parseDurationFromText(formData.additionalInfo);
      const gradeHint = extractGradeHint(formData.additionalInfo);
      const durationMinutes = inferredDuration ?? 60;
      const enrichedInstructions = [
        formData.additionalInfo?.trim(),
        gradeHint ? `Target learner level: ${gradeHint}.` : '',
        `Exam duration: ${durationMinutes} minutes.`,
      ]
        .filter(Boolean)
        .join('\n')
        .slice(0, 2000);

      const title = formData.title.trim() || 'Assignment';
      const subject = formData.subject.trim() || 'General';

      if (title.length < 1) {
        toast.error('Please enter a title');
        setIsSubmitting(false);
        return;
      }
      if (subject.length < 1) {
        toast.error('Please select a subject');
        setIsSubmitting(false);
        return;
      }
      if (totalQuestions < 1) {
        toast.error('Add at least one question');
        setIsSubmitting(false);
        return;
      }
      if (totalMarks < 1) {
        toast.error('Total marks must be at least 1');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title,
        subject,
        description: (formData.additionalInfo || '').slice(0, 2000),
        dueDate: formData.dueDate,
        duration: durationMinutes,
        totalMarks,
        questionConfig: {
          types: uniqueTypes,
          count: totalQuestions,
          difficulty: { easy: 34, medium: 33, hard: 33 },
        },
        additionalInstructions: enrichedInstructions,
        typeBreakdown: JSON.stringify(typeBreakdown),
      };

      console.log('[CreateAssignment] Submitting payload:', JSON.stringify(payload, null, 2));
      console.log('[CreateAssignment] Files:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));

      const created = await createAssignment(payload, files);
      const { assignment } = created;
      addAssignment(assignment);
      if (created.jobRecordId && typeof created.generationSeq === 'number') {
        setQueued(created.jobRecordId, created.generationSeq, 0, Date.now());
      }
      toast.success('Assignment created! Generation started…', { duration: 4000 });
      router.push(`/assignments/${assignment._id}`);
    } catch (e: unknown) {
      let errorMsg = 'Failed to create assignment';
      if (e instanceof Error) {
        errorMsg = e.message;
      }
      console.error('[CreateAssignment] Error:', e);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Page heading (responsive structures defined in globals.css) */}
      <div className="page-header-container">
        {/* Desktop-only Page Header */}
        <div className="desktop-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="status-dot" aria-hidden="true" />
            <h1 className="page-title">Create Assignment</h1>
          </div>
          <p className="page-subtitle">Set up a new assignment for your students.</p>
        </div>

        {/* Mobile-only Page Header */}
        <div className="mobile-page-header">
          <button 
            onClick={() => window.history.back()}
            className="mobile-header-back-btn"
            aria-label="Go back"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#374151',
              flexShrink: 0
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="mobile-header-title">Create Assignment</h1>
          <div style={{ width: '32px' }} /> {/* Spacer to center the title */}
        </div>
      </div>

      {/* Segmented Progress bar (placed under headers, above card container) */}
      <div className="step-progress" role="progressbar" aria-valuenow={step} aria-valuemax={TOTAL_STEPS}>
        <div className="step-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Form Card Layout */}
      <div className="create-form-layout">

        {/* ── Center: Form ── */}
        <div className="create-form-main">

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  Assignment Details
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Basic information about your assignment
                </p>

                {/* File upload */}
                <FileUploadZone
                  files={files}
                  onAdd={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
                  onRemove={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  onRename={(i, newName) => setFiles((prev) => {
                    const newFiles = [...prev];
                    const file = newFiles[i];
                    newFiles[i] = new File([file], newName, { type: file.type });
                    return newFiles;
                  })}
                />

                {/* Due Date */}
                <div className="input-group" style={{ marginBottom: 20 }}>
                  <label className="label" htmlFor="dueDate">Due Date</label>
                  <CustomDatePicker
                    value={formData.dueDate}
                    onChange={(val) => setFormData((d) => ({ ...d, dueDate: val }))}
                  />
                </div>

                {/* Question Type section */}
                <div style={{ marginBottom: 20 }}>
                  {/* Header row labels (desktop only) */}
                  <div className="question-headers">
                    <div className="header-type">Question Type</div>
                    <div style={{ width: 32 }} />
                    <div className="header-count">No. of Questions</div>
                    <div className="header-marks">Marks</div>
                  </div>

                  {questionRows.map((row) => (
                    <QuestionTypeRow
                      key={row.id}
                      row={row}
                      onChange={(updated) => updateRow(row.id, updated)}
                      onRemove={() => removeRow(row.id)}
                      isOnly={questionRows.length === 1}
                    />
                  ))}

                  {/* Add row */}
                  <button
                    type="button"
                    onClick={addRow}
                    className="add-question-type-btn"
                    aria-label="Add question type"
                  >
                    <Plus size={15} />
                    <span>Add Question</span>
                  </button>

                  {/* Totals */}
                  <div
                    style={{
                      marginTop: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 3,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>Total Questions : <strong>{totalQuestions}</strong></span>
                    <span>Total Marks : <strong>{totalMarks}</strong></span>
                  </div>
                </div>

                {/* Additional info */}
                <div className="input-group">
                  <label className="label" htmlFor="additionalInfo">
                    Additional Information <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(For better output)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      id="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData((d) => ({ ...d, additionalInfo: e.target.value }))}
                      rows={3}
                      placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                      className="input"
                      style={{ resize: 'none', paddingRight: 36 }}
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: 10,
                        bottom: 10,
                        width: 28,
                        height: 28,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Voice input"
                    >
                      <Mic size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Assignment Info
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Give your assignment a title and subject
                </p>

                <div className="input-group" style={{ marginBottom: 16 }}>
                  <label className="label" htmlFor="title">Assignment Title</label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((d) => ({ ...d, title: e.target.value }))}
                    placeholder="e.g. Mid-term Physics Exam"
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label className="label" htmlFor="subject">Subject</label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData((d) => ({ ...d, subject: e.target.value }))}
                    className="input"
                  >
                    <option value="">Select a subject…</option>
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Review summary inline (step 2 only) */}
                <div
                  style={{
                    marginTop: 24,
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Summary</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Questions</span><strong style={{ color: 'var(--text-primary)' }}>{totalQuestions}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Marks</span><strong style={{ color: 'var(--text-primary)' }}>{totalMarks}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Files Uploaded</span><strong style={{ color: 'var(--text-primary)' }}>{files.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Due Date</span><strong style={{ color: 'var(--text-primary)' }}>{formData.dueDate || '—'}</strong>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Action Footer (Outside the card, responsive aligned) */}
        <div className="create-form-footer">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn btn-secondary btn-pill"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ChevronLeft size={15} />
              Previous
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="btn btn-dark btn-pill"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Next
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="btn btn-primary btn-pill"
              style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120, justifyContent: 'center' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Generate
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </>
  );
}

