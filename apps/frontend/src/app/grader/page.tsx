'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, Plus, CheckCircle, AlertCircle, Loader2,
  FileText, Upload, Settings, ChevronRight, User, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface Rubric {
  id: string;
  title: string;
  description: string;
  criteria: Array<{ name: string; maxMarks: number; description: string }>;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  totalMarks: number;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string;
  fileType: string;
  status: string;
  submittedAt: string;
  evaluations?: Array<{ score: number }>;
}

export default function GraderDashboard() {
  const [activeTab, setActiveTab] = useState<'assignments' | 'rubrics'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);

  // Grading config modal states
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [rubricId, setRubricId] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Submissions states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Rubric creation states
  const [showCreateRubric, setShowCreateRubric] = useState(false);
  const [rubricTitle, setRubricTitle] = useState('');
  const [rubricDesc, setRubricDesc] = useState('');
  const [criteria, setCriteria] = useState([{ name: 'Accuracy', maxMarks: 10, description: 'Correct answer structure' }]);
  const [creatingRubric, setCreatingRubric] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [assignRes, rubRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: any }>('/assignments'),
        apiClient.get<{ success: boolean; data: Rubric[] }>('/grader/rubrics'),
      ]);
      const fetchedAssignments = assignRes.data.data.assignments || assignRes.data.data || [];
      setAssignments(fetchedAssignments);
      setRubrics(rubRes.data.data);
    } catch {
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    try {
      setSubmissionsLoading(true);
      const res = await apiClient.get<{ success: boolean; data: Submission[] }>(`/grader/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data.data);
    } catch {
      toast.error('Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleOpenConfig = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    loadSubmissions(assignment.id);
    try {
      const res = await apiClient.get<{ success: boolean; data: any }>(`/grader/assignments/${assignment.id}/config`);
      if (res.data.data) {
        setRubricId(res.data.data.rubricId || '');
        setAnswerKey(res.data.data.answerKeyText || '');
      } else {
        setRubricId('');
        setAnswerKey('');
      }
    } catch {
      setRubricId('');
      setAnswerKey('');
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedAssignment) return;
    setSavingConfig(true);
    try {
      await apiClient.post(`/grader/assignments/${selectedAssignment.id}/config`, {
        rubricId: rubricId || null,
        answerKeyText: answerKey,
      });
      toast.success('Grading configuration saved successfully');
    } catch {
      toast.error('Failed to save grading configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddCriterion = () => {
    setCriteria([...criteria, { name: '', maxMarks: 10, description: '' }]);
  };

  const handleCreateRubric = async () => {
    if (!rubricTitle.trim()) {
      toast.error('Rubric title is required');
      return;
    }
    setCreatingRubric(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: Rubric }>('/grader/rubrics', {
        title: rubricTitle,
        description: rubricDesc,
        criteria,
      });
      setRubrics([res.data.data, ...rubrics]);
      toast.success('Rubric created successfully');
      setShowCreateRubric(false);
      setRubricTitle('');
      setRubricDesc('');
      setCriteria([{ name: 'Accuracy', maxMarks: 10, description: 'Correct answer structure' }]);
    } catch {
      toast.error('Failed to create rubric');
    } finally {
      setCreatingRubric(false);
    }
  };

  const handleUploadSubmission = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAssignment || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('files', file);

    setUploading(true);
    try {
      await apiClient.post(`/grader/assignments/${selectedAssignment.id}/submissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Submission uploaded successfully');
      loadSubmissions(selectedAssignment.id);
    } catch {
      toast.error('Failed to upload submission');
    } finally {
      setUploading(false);
    }
  };

  const handleEvaluateSubmission = async (submissionId: string) => {
    toast.loading('AI Evaluation in progress...', { id: submissionId });
    try {
      await apiClient.post(`/grader/submissions/${submissionId}/evaluate`);
      toast.success('AI Evaluation completed', { id: submissionId });
      if (selectedAssignment) {
        loadSubmissions(selectedAssignment.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'AI Evaluation failed', { id: submissionId });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={32} color="var(--brand)" />
      </div>
    );
  }

  return (
    <div className="dashboard-view" style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto' }}>
      <div className="desktop-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck size={24} color="var(--brand)" />
          <h1 className="page-title">AI Assignment Grader</h1>
        </div>
        <p className="page-subtitle">Configure assessment rubrics, evaluate student answers via AI, and review grades.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            background: 'none', border: 'none', padding: '12px 4px', fontWeight: 600,
            color: activeTab === 'assignments' ? 'var(--brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'assignments' ? '2px solid var(--brand)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('rubrics')}
          style={{
            background: 'none', border: 'none', padding: '12px 4px', fontWeight: 600,
            color: activeTab === 'rubrics' ? 'var(--brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'rubrics' ? '2px solid var(--brand)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Rubrics & Criteria
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'assignments' ? (
          <motion.div key="assignments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {selectedAssignment ? (
              // Active Grading Config and Submissions View
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }}>
                {/* Configuration Panel */}
                <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
                  <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={() => setSelectedAssignment(null)}>
                    Back to Assignments
                  </button>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Grading Configuration</h3>
                  <div className="input-group" style={{ marginBottom: 16 }}>
                    <label className="label">Evaluation Rubric</label>
                    <select className="input" value={rubricId} onChange={(e) => setRubricId(e.target.value)}>
                      <option value="">No Rubric (General correctness)</option>
                      {rubrics.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ marginBottom: 20 }}>
                    <label className="label">Reference Answer Key</label>
                    <textarea
                      className="input"
                      rows={8}
                      placeholder="Paste correct answers, criteria explanations, or grading notes here..."
                      value={answerKey}
                      onChange={(e) => setAnswerKey(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveConfig} disabled={savingConfig} style={{ width: '100%' }}>
                    {savingConfig ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>

                {/* Submissions Panel */}
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Student Submissions</h3>
                    <label className="btn btn-dark btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Submission'}
                      <input type="file" onChange={handleUploadSubmission} style={{ display: 'none' }} disabled={uploading} accept=".pdf,.txt" />
                    </label>
                  </div>

                  {submissionsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" /></div>
                  ) : submissions.length === 0 ? (
                    <div className="empty-state" style={{ padding: 40 }}>
                      <FileText size={32} color="var(--text-muted)" />
                      <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>No student submissions yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {submissions.map((sub) => (
                        <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <User size={18} color="var(--text-muted)" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>Student: {sub.studentId.substring(0, 8)}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Type: {sub.fileType} &middot; {new Date(sub.submittedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="badge" style={{
                              background: sub.status === 'GRADED' ? '#E0F2FE' : sub.status === 'REVIEWED' ? '#D1FAE5' : '#F3F4F6',
                              color: sub.status === 'GRADED' ? '#0369A1' : sub.status === 'REVIEWED' ? '#059669' : '#4B5563',
                              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100
                            }}>
                              {sub.status}
                            </span>
                            {sub.status === 'SUBMITTED' ? (
                              <button className="btn btn-secondary btn-sm" onClick={() => handleEvaluateSubmission(sub.id)}>
                                Grade with AI
                              </button>
                            ) : (
                              <a href={`/grader/${sub.id}`} className="btn btn-secondary btn-sm">
                                Review Grade
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // List of all assignments
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {assignments.map((assign) => (
                  <div key={assign.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 160, cursor: 'pointer' }} onClick={() => handleOpenConfig(assign)}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>{assign.subject}</span>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{assign.title}</h3>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Max Marks: {assign.totalMarks}</span>
                      <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Configure <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          // Rubrics Tab View
          <motion.div key="rubrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {showCreateRubric ? (
              <div className="card" style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Create Evaluation Rubric</h3>
                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label className="label">Rubric Title</label>
                  <input type="text" className="input" placeholder="e.g. Essay Writing Rubric" value={rubricTitle} onChange={(e) => setRubricTitle(e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: 20 }}>
                  <label className="label">Description</label>
                  <textarea className="input" rows={2} placeholder="Explain what kinds of assignments this rubric evaluates..." value={rubricDesc} onChange={(e) => setRubricDesc(e.target.value)} />
                </div>

                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Criteria</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {criteria.map((c, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 3fr', gap: 12, alignItems: 'start' }}>
                      <input type="text" className="input" placeholder="Criterion Name" value={c.name} onChange={(e) => {
                        const newCriteria = [...criteria];
                        newCriteria[i].name = e.target.value;
                        setCriteria(newCriteria);
                      }} />
                      <input type="number" className="input" placeholder="Max Marks" value={c.maxMarks} onChange={(e) => {
                        const newCriteria = [...criteria];
                        newCriteria[i].maxMarks = Number(e.target.value);
                        setCriteria(newCriteria);
                      }} />
                      <input type="text" className="input" placeholder="Description of expectations" value={c.description} onChange={(e) => {
                        const newCriteria = [...criteria];
                        newCriteria[i].description = e.target.value;
                        setCriteria(newCriteria);
                      }} />
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-sm" onClick={handleAddCriterion} style={{ alignSelf: 'start' }}>
                    + Add Criterion
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowCreateRubric(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleCreateRubric} disabled={creatingRubric}>
                    {creatingRubric ? 'Creating...' : 'Create Rubric'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <button className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowCreateRubric(true)}>
                    <Plus size={15} /> Create Rubric
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {rubrics.map((r) => (
                    <div key={r.id} className="card" style={{ padding: 20 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800 }}>{r.title}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{r.description || 'No description provided.'}</p>
                      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {r.criteria.map((c, i) => (
                          <span key={i} style={{ fontSize: 11, background: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: 8, fontWeight: 500 }}>
                            {c.name} ({c.maxMarks})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
