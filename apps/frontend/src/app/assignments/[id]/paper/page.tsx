'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Download, RefreshCw, Loader2, Edit, Save, Eye, ArrowUp, ArrowDown, Sparkles, X, Check, BookOpen 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchPaper } from '@/services/paper.service';
import { apiClient } from '@/services/api.client';
import { getSocket, subscribeToAssignment, unsubscribeFromAssignment } from '@/sockets/socket.client';
import { resolveAssetUrl } from '@/utils/url';
import type { GenerationPdfReadyPayload } from '@/types/socket.types';
import type { GeneratedPaper, Question, Section } from '@/types/paper.types';
import type { DifficultyLevel } from '@/types/assignment.types';

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Moderate',
  hard: 'Challenging',
};

export default function PaperViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Regeneration panel states
  const [regenTarget, setRegenTarget] = useState<{ sIdx: number; qIdx: number } | null>(null);
  const [regenDiff, setRegenDiff] = useState<string>('medium');
  const [regenBloom, setRegenBloom] = useState<string>('APPLY');
  const [regenContext, setRegenContext] = useState<string>('');
  const [regeneratingQ, setRegeneratingQ] = useState(false);

  // Header metadata states (local edits before save)
  const [schoolName, setSchoolName] = useState('');
  const [paperTitle, setPaperTitle] = useState('');
  const [duration, setDuration] = useState(45);
  const [totalMarks, setTotalMarks] = useState(100);

  const loadPaper = async () => {
    try {
      const p = await fetchPaper(id);
      setPaper(p);
      if (p.canonicalMetadata) {
        setSchoolName(p.canonicalMetadata.schoolName || 'Delhi Public School');
        setPaperTitle(p.title || p.canonicalMetadata.subject || 'Assessment');
        setDuration(p.canonicalMetadata.durationMinutes || p.duration || 45);
        setTotalMarks(p.canonicalMetadata.generatedMarks || p.totalMarks || 100);
      } else {
        setSchoolName('Delhi Public School');
        setPaperTitle(p.title || 'Assessment');
        setDuration(p.duration || 45);
        setTotalMarks(p.totalMarks || 100);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load paper');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaper();
  }, [id]);

  useEffect(() => {
    subscribeToAssignment(id);
    return () => unsubscribeFromAssignment(id);
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    const onPdfReady = (payload: GenerationPdfReadyPayload) => {
      if (payload.assignmentId !== id) return;
      setPaper((prev) => (prev ? { ...prev, pdfUrl: payload.pdfUrl } : prev));
    };
    socket.on('generation:pdf_ready', onPdfReady);
    return () => {
      socket.off('generation:pdf_ready', onPdfReady);
    };
  }, [id]);

  // Handle reordering questions locally
  const moveQuestion = (sectionIdx: number, questionIdx: number, direction: 'up' | 'down') => {
    if (!paper) return;
    const updatedSections = JSON.parse(JSON.stringify(paper.sections)) as Section[];
    const section = updatedSections[sectionIdx];
    if (!section) return;

    const targetIdx = direction === 'up' ? questionIdx - 1 : questionIdx + 1;
    if (targetIdx < 0 || targetIdx >= section.questions.length) return;

    // Swap questions
    const temp = section.questions[questionIdx];
    section.questions[questionIdx] = section.questions[targetIdx];
    section.questions[targetIdx] = temp;

    setPaper({ ...paper, sections: updatedSections });
  };

  // Handle local text edit of a question text
  const editQuestionText = (sectionIdx: number, questionIdx: number, text: string) => {
    if (!paper) return;
    const updatedSections = JSON.parse(JSON.stringify(paper.sections)) as Section[];
    if (updatedSections[sectionIdx]?.questions[questionIdx]) {
      updatedSections[sectionIdx].questions[questionIdx].question = text;
      setPaper({ ...paper, sections: updatedSections });
    }
  };

  // Handle local text edit of a question marks
  const editQuestionMarks = (sectionIdx: number, questionIdx: number, marksVal: number) => {
    if (!paper) return;
    const updatedSections = JSON.parse(JSON.stringify(paper.sections)) as Section[];
    if (updatedSections[sectionIdx]?.questions[questionIdx]) {
      updatedSections[sectionIdx].questions[questionIdx].marks = marksVal;
      setPaper({ ...paper, sections: updatedSections });
    }
  };

  // Save all modified details (metadata + questions/order) to backend
  const handleSavePaper = async () => {
    if (!paper) return;
    setSaving(true);
    try {
      const updatedMeta = {
        ...paper.canonicalMetadata,
        schoolName,
        subject: paperTitle,
        durationMinutes: duration,
        generatedMarks: totalMarks,
      };

      await apiClient.put(`/papers/${paper.id}`, {
        title: paperTitle,
        totalMarks: totalMarks,
        sections: paper.sections,
        canonicalMetadata: updatedMeta,
      });

      toast.success('Paper saved successfully! Regerating PDF...');
      setIsEditMode(false);
      await loadPaper();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save paper');
    } finally {
      setSaving(false);
    }
  };

  // Call AI regeneration for a single target question
  const handleRegenerateQuestion = async () => {
    if (!paper || !regenTarget) return;
    setRegeneratingQ(true);
    try {
      const { sIdx, qIdx } = regenTarget;
      const res = await apiClient.post<{ 
        success: boolean; 
        data: { paper: GeneratedPaper; newQuestion: Question } 
      }>(`/papers/${paper.id}/regenerate-question`, {
        sectionIndex: sIdx,
        questionIndex: qIdx,
        difficulty: regenDiff,
        bloomLevel: regenBloom,
        context: regenContext,
      });

      toast.success('Question replaced successfully!');
      
      // Update local paper state with new sections/questions
      setPaper(res.data.data.paper);
      setRegenTarget(null);
      setRegenContext('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate question');
    } finally {
      setRegeneratingQ(false);
    }
  };

  const handleDownload = async () => {
    if (!paper?.pdfUrl) { window.print(); return; }
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = resolveAssetUrl(paper.pdfUrl);
      link.download = `${paper.title.replace(/\s+/g, '_')}.pdf`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally { setDownloading(false); }
  };

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <div className="skeleton" style={{ height: 24, width: 180, borderRadius: 6, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 500, borderRadius: 16 }} />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="empty-state">
        <h2 className="empty-title">Failed to load question paper</h2>
        <p className="empty-desc">The question paper could not be retrieved.</p>
        <div className="empty-state-actions">
          <Link href={`/assignments/${id}`} className="btn btn-dark btn-pill">Back to Assignment</Link>
          <button onClick={() => window.location.reload()} className="btn btn-secondary btn-pill">Reload Page</button>
        </div>
      </div>
    );
  }

  // Calculate question numbers
  let globalQuestionNumber = 1;

  return (
    <div style={{ width: '100%', padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto' }}>
      {/* Banner / Actions */}
      <div className="dark-banner-card print-hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            {isEditMode ? 'Regeneration Studio (Editing)' : 'Question Paper Preview'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isEditMode ? (
            <>
              <button
                onClick={() => { setIsEditMode(false); loadPaper(); }}
                className="btn btn-secondary btn-pill"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePaper}
                disabled={saving}
                className="btn btn-pill"
                style={{ background: '#10B981', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditMode(true)}
                className="btn btn-pill"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Edit size={15} />
                Edit Paper
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn btn-pill"
                style={{ background: '#FFFFFF', color: '#111827', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Panel & Preview split-layout or single layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isEditMode ? '1fr 340px' : '1fr', gap: 20 }}>
        {/* Main Paper Layout */}
        <div className="paper-card" style={{ fontFamily: '"Times New Roman", Times, serif', color: '#111827', background: '#fff', borderRadius: 8, padding: 32, border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
          {/* Header info */}
          {isEditMode ? (
            <div style={{ display: 'grid', gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: '2px solid #111827' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>School/Institution Name</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%', fontFamily: '"Times New Roman", Times, serif', fontSize: 18, fontWeight: 700, textAlign: 'center' }}
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Subject/Title</label>
                  <input
                    type="text"
                    className="input"
                    style={{ width: '100%', fontFamily: '"Times New Roman", Times, serif', fontWeight: 700 }}
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Duration (Mins)</label>
                    <input
                      type="number"
                      className="input"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Max Marks</label>
                    <input
                      type="number"
                      className="input"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{schoolName}</h1>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '6px 0 0 0' }}>{paperTitle}</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, borderBottom: '2px solid #111827', paddingBottom: 12, marginTop: 16 }}>
                <span>Time Allowed: {duration} minutes</span>
                <span>Maximum Marks: {totalMarks}</span>
              </div>
            </div>
          )}

          {/* Sections list */}
          {paper.sections.map((section, sIdx) => {
            const sectionNumberStart = globalQuestionNumber;
            globalQuestionNumber += section.questions.length;

            return (
              <div key={sIdx} style={{ marginBottom: 36 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 14 }}>
                  {section.title}
                </h3>
                {section.instruction && (
                  <p style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic', marginBottom: 12 }}>
                    {section.instruction}
                  </p>
                )}

                {/* Questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {section.questions.map((q, qIdx) => {
                    const qNum = sectionNumberStart + qIdx;
                    return (
                      <div 
                        key={q.id || qIdx} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: 12, 
                          padding: isEditMode ? 10 : 0, 
                          borderRadius: 6,
                          background: isEditMode ? '#f9fafb' : 'transparent',
                          border: isEditMode ? '1px dashed #e5e7eb' : 'none',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 16, minWidth: 20 }}>{qNum}.</span>
                        <div style={{ flex: 1 }}>
                          {isEditMode ? (
                            <textarea
                              className="input"
                              style={{ width: '100%', minHeight: 60, fontFamily: '"Times New Roman", Times, serif', fontSize: 15, padding: 8 }}
                              value={q.question}
                              onChange={(e) => editQuestionText(sIdx, qIdx, e.target.value)}
                            />
                          ) : (
                            <div style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{q.question}</div>
                          )}

                          {q.type === 'mcq' && q.options && q.options.length > 0 && (
                            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                              {q.options.map((opt) => (
                                <div key={opt.key} style={{ fontSize: 14 }}>
                                  <strong>{opt.key}.</strong> {opt.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Marks & Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 100 }}>
                          {isEditMode ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="number"
                                className="input"
                                style={{ width: 50, padding: '2px 4px', height: 26, fontSize: 12, textAlign: 'center' }}
                                value={q.marks}
                                onChange={(e) => editQuestionMarks(sIdx, qIdx, Number(e.target.value))}
                              />
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>M</span>
                            </div>
                          ) : (
                            <span style={{ fontWeight: 700, fontSize: 14 }}>[{q.marks} Marks]</span>
                          )}

                          {isEditMode && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: 4 }}
                                disabled={qIdx === 0}
                                onClick={() => moveQuestion(sIdx, qIdx, 'up')}
                                title="Move Up"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: 4 }}
                                disabled={qIdx === section.questions.length - 1}
                                onClick={() => moveQuestion(sIdx, qIdx, 'down')}
                                title="Move Down"
                              >
                                <ArrowDown size={12} />
                              </button>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', gap: 4, display: 'flex', alignItems: 'center', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4F46E5' }}
                                onClick={() => setRegenTarget({ sIdx, qIdx })}
                                title="AI Regenerate"
                              >
                                <Sparkles size={12} /> Swap
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit mode side panel (Regeneration Options) */}
        {isEditMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 16, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="var(--brand)" /> AI Studio Panel
              </h3>
              {regenTarget ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 12, background: 'var(--brand-light)', color: 'var(--brand)', padding: 8, borderRadius: 6 }}>
                    Regenerating Section {regenTarget.sIdx + 1}, Question {regenTarget.qIdx + 1}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Select Difficulty</label>
                    <select className="input" style={{ width: '100%' }} value={regenDiff} onChange={(e) => setRegenDiff(e.target.value)}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Bloom Taxonomy level</label>
                    <select className="input" style={{ width: '100%' }} value={regenBloom} onChange={(e) => setRegenBloom(e.target.value)}>
                      <option value="REMEMBER">Remember</option>
                      <option value="UNDERSTAND">Understand</option>
                      <option value="APPLY">Apply</option>
                      <option value="ANALYZE">Analyze</option>
                      <option value="EVALUATE">Evaluate</option>
                      <option value="CREATE">Create</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>AI Prompt Context (Optional)</label>
                    <textarea
                      placeholder="e.g. Focus on Newtonian physics, add a real-life example..."
                      className="input"
                      style={{ width: '100%', minHeight: 60, fontSize: 12 }}
                      value={regenContext}
                      onChange={(e) => setRegenContext(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ flex: 1 }}
                      onClick={() => setRegenTarget(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-dark btn-sm" 
                      style={{ flex: 1, gap: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={handleRegenerateQuestion}
                      disabled={regeneratingQ}
                    >
                      {regeneratingQ ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      Swap now
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 10px' }}>
                  Click "Swap" on any question to load options and regenerate it using AI.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
