'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/design-system/Button';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { BookOpen, Target, FileText, BarChart3, Plus, Check, X, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { COPOMatrix, COPOMatrixData } from '@/components/obe/COPOMatrix';

const BLOOM_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;
type BloomLevel = typeof BLOOM_LEVELS[number];
const BLOOM_HEX_COLORS: Record<BloomLevel, string> = {
  REMEMBER: '#6366f1',
  UNDERSTAND: '#8b5cf6',
  APPLY: '#a855f7',
  ANALYZE: '#d946ef',
  EVALUATE: '#ec4899',
  CREATE: '#f43f5e',
};

type BlueprintStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

interface Course { id: string; name: string; code: string; _count?: { outcomes: number; blueprints: number } }
interface BlueprintItem { id: string; coId: string; title: string; marks: number; bloomLevel: BloomLevel }
interface Blueprint { id: string; title: string; totalMarks: number; status: BlueprintStatus; items: BlueprintItem[]; _count?: { items: number }; createdAt: string }
interface AttainmentResult { coId: string; coCode: string; attainment: number; threshold: number; metThreshold: boolean; bloomLevel: BloomLevel }
interface ValidationIssue { message: string; severity: 'error' | 'warning' }
interface ValidationResult { valid: boolean; issues: ValidationIssue[] }

export default function TeacherOBEPage() {
  const [activeTab, setActiveTab] = useState<'graph' | 'blueprints' | 'attainment' | 'audit'>('graph');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [matrixData, setMatrixData] = useState<COPOMatrixData | null>(null);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [attainment, setAttainment] = useState<AttainmentResult[]>([]);
  const [showAddCO, setShowAddCO] = useState(false);
  const [showAddPO, setShowAddPO] = useState(false);
  const [newCO, setNewCO] = useState({ code: '', description: '', bloomLevel: 'UNDERSTAND' as BloomLevel });
  const [newPO, setNewPO] = useState({ code: '', description: '' });
  const [newBlueprint, setNewBlueprint] = useState({ title: '', totalMarks: 100 });
  const [showAddBlueprint, setShowAddBlueprint] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchCourses = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/obe/courses', { signal });
      const data: Course[] = res.data.data || [];
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourseId((prev) => prev || data[0].id);
      }
    } catch {
      toast.error('Failed to load courses');
    }
  }, []);

  const fetchGraph = useCallback(async (courseId: string, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.get(`/obe/courses/${courseId}/co-po-matrix`, { signal });
      setMatrixData(res.data.data);
    } catch {
      toast.error('Failed to load curriculum graph');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBlueprints = useCallback(async (courseId: string, signal?: AbortSignal) => {
    try {
      const res = await api.get(`/obe/courses/${courseId}/blueprints`, { signal });
      setBlueprints(res.data.data || []);
    } catch { /* empty */ }
  }, []);

  const fetchAttainment = useCallback(async (courseId: string, signal?: AbortSignal) => {
    try {
      const res = await api.get(`/obe/courses/${courseId}/attainment/co`, { signal });
      setAttainment(res.data.data?.outcomes || []);
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchCourses(controller.signal);
    return () => controller.abort();
  }, [fetchCourses]);

  useEffect(() => {
    if (!selectedCourseId) return;
    const controller = new AbortController();
    fetchGraph(selectedCourseId, controller.signal);
    if (activeTab === 'blueprints') fetchBlueprints(selectedCourseId, controller.signal);
    if (activeTab === 'attainment') fetchAttainment(selectedCourseId, controller.signal);
    return () => controller.abort();
  }, [selectedCourseId, activeTab, fetchGraph, fetchBlueprints, fetchAttainment]);

  const handleAddCO = async () => {
    if (!newCO.code || !newCO.description) { toast.error('Code and description required'); return; }
    try {
      await api.post(`/obe/courses/${selectedCourseId}/outcomes`, newCO);
      toast.success('Course Outcome created');
      setNewCO({ code: '', description: '', bloomLevel: 'UNDERSTAND' });
      setShowAddCO(false);
      fetchGraph(selectedCourseId);
    } catch { toast.error('Failed to create CO'); }
  };

  const handleAddPO = async () => {
    if (!newPO.code || !newPO.description) { toast.error('Code and description required'); return; }
    try {
      const programs = await api.get('/obe/programs');
      const prog = programs.data.data?.[0];
      if (!prog) { toast.error('No program found. Create a program first.'); return; }
      await api.post(`/obe/programs/${prog.id}/outcomes`, newPO);
      toast.success('Program Outcome created');
      setNewPO({ code: '', description: '' });
      setShowAddPO(false);
      fetchGraph(selectedCourseId);
    } catch { toast.error('Failed to create PO'); }
  };

  const handleMappingChange = async (coId: string, poId: string, weightage: number) => {
    try {
      await api.post('/obe/mappings', { coId, poId, weightage, reason: `Weightage updated to ${weightage}` });
      fetchGraph(selectedCourseId);
    } catch { toast.error('Failed to update mapping'); }
  };

  const handleCreateBlueprint = async () => {
    if (!newBlueprint.title) { toast.error('Title required'); return; }
    try {
      await api.post(`/obe/courses/${selectedCourseId}/blueprints`, { ...newBlueprint, courseId: selectedCourseId });
      toast.success('Blueprint created');
      setNewBlueprint({ title: '', totalMarks: 100 });
      setShowAddBlueprint(false);
      fetchBlueprints(selectedCourseId);
    } catch { toast.error('Failed to create blueprint'); }
  };

  const handleValidate = async (id: string) => {
    try {
      const res = await api.post(`/obe/blueprints/${id}/validate`);
      setValidationResult(res.data.data);
      if (res.data.data.valid) toast.success('Blueprint is valid');
      else toast.error('Blueprint has issues');
    } catch { toast.error('Validation failed'); }
  };

  const handleSubmitForReview = async (id: string) => {
    try {
      await api.post(`/obe/blueprints/${id}/submit`);
      toast.success('Submitted for review');
      fetchBlueprints(selectedCourseId);
    } catch { toast.error('Failed to submit'); }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/obe/blueprints/${id}/approve`, { comments: 'Approved via OBE dashboard' });
      toast.success('Blueprint approved');
      fetchBlueprints(selectedCourseId);
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id: string) => {
    setRejectTarget(id);
    setRejectReason('');
  };

  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) { toast.error('Reason required'); return; }
    try {
      await api.post(`/obe/blueprints/${rejectTarget}/reject`, { reason: rejectReason });
      toast.success('Blueprint rejected');
      setRejectTarget(null);
      setRejectReason('');
      fetchBlueprints(selectedCourseId);
    } catch { toast.error('Failed to reject'); }
  };

  const statusColor = (s: BlueprintStatus): string => {
    if (s === 'APPROVED') return '#22c55e';
    if (s === 'REJECTED') return '#ef4444';
    if (s === 'PENDING_REVIEW') return '#f59e0b';
    return '#94a3b8';
  };

  const tabs = [
    { id: 'graph' as const, label: 'Curriculum Graph', icon: BookOpen },
    { id: 'blueprints' as const, label: 'Blueprints', icon: FileText },
    { id: 'attainment' as const, label: 'Attainment', icon: BarChart3 },
    { id: 'audit' as const, label: 'Audit', icon: History },
  ];

  const handleSaveMatrix = async (payload: {
    mappings: Array<{ coId: string; poId: string; weightage: number }>;
    bloomOverrides: Array<{ coId: string; bloomLevel: BloomLevel }>;
  }) => {
    if (!selectedCourseId) return;
    const res = await api.post(`/obe/courses/${selectedCourseId}/co-po-matrix`, payload);
    setMatrixData(res.data.data);
  };

  return (
    <div style={{ padding: '0 0 48px' }}>
      <PageHeader
        title="OBE Management"
        subtitle="Outcome-Based Education workflow for your department"
      />

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, minWidth: 200 }}
        >
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: activeTab === t.id ? '#fff' : 'transparent',
                color: activeTab === t.id ? '#1e293b' : '#64748b',
                boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!selectedCourseId && (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <Target size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Select a Course</h3>
          <p style={{ color: '#94a3b8' }}>Choose a course above to manage its OBE workflow</p>
        </Card>
      )}

      {selectedCourseId && loading && (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ color: '#94a3b8' }}>Loading...</p>
        </Card>
      )}

      {selectedCourseId && !loading && activeTab === 'graph' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>CO / PO Curriculum Management</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => setShowAddCO(!showAddCO)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={14} /> Add CO
              </Button>
              <Button onClick={() => setShowAddPO(!showAddPO)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={14} /> Add PO
              </Button>
            </div>
          </div>

          {showAddCO && (
            <Card style={{ padding: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>New Course Outcome</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b' }}>Code</label>
                  <input value={newCO.code} onChange={(e) => setNewCO({ ...newCO, code: e.target.value })} placeholder="CO1" style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b' }}>Description</label>
                  <input value={newCO.description} onChange={(e) => setNewCO({ ...newCO, description: e.target.value })} placeholder="Apply concepts to..." style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b' }}>Bloom Level</label>
                  <select value={newCO.bloomLevel} onChange={(e) => setNewCO({ ...newCO, bloomLevel: e.target.value as BloomLevel })} style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}>
                    {BLOOM_LEVELS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button onClick={handleAddCO} style={{ background: '#22c55e', color: '#fff', padding: '6px 12px' }}><Check size={14} /></Button>
                  <Button onClick={() => setShowAddCO(false)} style={{ background: '#ef4444', color: '#fff', padding: '6px 12px' }}><X size={14} /></Button>
                </div>
              </div>
            </Card>
          )}

          {showAddPO && (
            <Card style={{ padding: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>New Program Outcome</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b' }}>Code</label>
                  <input value={newPO.code} onChange={(e) => setNewPO({ ...newPO, code: e.target.value })} placeholder="PO1" style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b' }}>Description</label>
                  <input value={newPO.description} onChange={(e) => setNewPO({ ...newPO, description: e.target.value })} placeholder="Engineering knowledge..." style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button onClick={handleAddPO} style={{ background: '#22c55e', color: '#fff', padding: '6px 12px' }}><Check size={14} /></Button>
                  <Button onClick={() => setShowAddPO(false)} style={{ background: '#ef4444', color: '#fff', padding: '6px 12px' }}><X size={14} /></Button>
                </div>
              </div>
            </Card>
          )}

          {matrixData ? (
            <COPOMatrix
              data={matrixData}
              onSaveMatrix={handleSaveMatrix}
              onRefresh={() => fetchGraph(selectedCourseId)}
            />
          ) : (
            <Card style={{ padding: 48, textAlign: 'center' }}>
              <Target size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <p style={{ color: '#94a3b8' }}>No matrix data found for this course.</p>
            </Card>
          )}
        </div>
      )}

      {selectedCourseId && !loading && activeTab === 'blueprints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Assessment Blueprints</h3>
            <Button onClick={() => setShowAddBlueprint(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> New Blueprint
            </Button>
          </div>

          {showAddBlueprint && (
            <Card style={{ padding: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>New Blueprint</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b' }}>Title</label>
                  <input value={newBlueprint.title} onChange={(e) => setNewBlueprint({ ...newBlueprint, title: e.target.value })} placeholder="Mid-Term Assessment" style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b' }}>Total Marks</label>
                  <input type="number" value={newBlueprint.totalMarks} onChange={(e) => setNewBlueprint({ ...newBlueprint, totalMarks: Number(e.target.value) })} style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button onClick={handleCreateBlueprint} style={{ background: '#22c55e', color: '#fff', padding: '6px 12px' }}>Create</Button>
                  <Button onClick={() => setShowAddBlueprint(false)} style={{ background: '#ef4444', color: '#fff', padding: '6px 12px' }}>Cancel</Button>
                </div>
              </div>
            </Card>
          )}

          {blueprints.length === 0 ? (
            <Card style={{ padding: 48, textAlign: 'center' }}>
              <FileText size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <p style={{ color: '#94a3b8' }}>No blueprints yet. Create one to plan your assessment structure.</p>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {blueprints.map((bp) => (
                <Card key={bp.id} style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{bp.title}</h4>
                      <p style={{ fontSize: 12, color: '#94a3b8' }}>{bp._count?.items ?? bp.items?.length ?? 0} items — {bp.totalMarks} marks</p>
                    </div>
                    <span style={{ background: statusColor(bp.status), color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      {bp.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {bp.status === 'DRAFT' && (
                      <>
                        <Button onClick={() => handleValidate(bp.id)} style={{ fontSize: 11, padding: '4px 8px' }}>Validate</Button>
                        <Button onClick={() => handleSubmitForReview(bp.id)} style={{ fontSize: 11, padding: '4px 8px', background: '#f59e0b', color: '#fff' }}>Submit</Button>
                      </>
                    )}
                    {bp.status === 'PENDING_REVIEW' && (
                      <>
                        <Button onClick={() => handleApprove(bp.id)} style={{ fontSize: 11, padding: '4px 8px', background: '#22c55e', color: '#fff' }}>Approve</Button>
                        <Button onClick={() => handleReject(bp.id)} style={{ fontSize: 11, padding: '4px 8px', background: '#ef4444', color: '#fff' }}>Reject</Button>
                      </>
                    )}
                  </div>
                  {validationResult && (
                    <div style={{ marginTop: 12, padding: 8, borderRadius: 6, background: validationResult.valid ? '#f0fdf4' : '#fef2f2', fontSize: 12 }}>
                      {validationResult.valid ? (
                        <span style={{ color: '#22c55e' }}>✓ Blueprint is valid</span>
                      ) : (
                        <div>
                          {validationResult.issues.map((issue: ValidationIssue, idx: number) => (
                            <p key={idx} style={{ color: issue.severity === 'error' ? '#ef4444' : '#f59e0b', margin: '2px 0' }}>{issue.message}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedCourseId && !loading && activeTab === 'attainment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>CO Attainment</h3>

          {attainment.length === 0 ? (
            <Card style={{ padding: 48, textAlign: 'center' }}>
              <BarChart3 size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <p style={{ color: '#94a3b8' }}>No attainment data. Complete assessments to see results.</p>
            </Card>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {attainment.map((a) => (
                  <Card key={a.coId} style={{ padding: 16, borderLeft: `4px solid ${a.metThreshold ? '#22c55e' : '#ef4444'}` }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{a.coCode}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: a.metThreshold ? '#22c55e' : '#ef4444' }}>
                      {Math.round(a.attainment * 100)}%
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      Target: {Math.round(a.threshold * 100)}% — {a.metThreshold ? 'Met' : 'Below'}
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(a.attainment * 100, 100)}%`, background: a.metThreshold ? '#22c55e' : '#ef4444', borderRadius: 3 }} />
                    </div>
                  </Card>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {BLOOM_LEVELS.map((bloom) => {
                  const bloomCos = attainment.filter((a) => a.bloomLevel === bloom);
                  const avg = bloomCos.length > 0 ? bloomCos.reduce((s, a) => s + a.attainment, 0) / bloomCos.length : 0;
                  return (
                    <div key={bloom} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: BLOOM_HEX_COLORS[bloom] }} />
                      <div style={{ fontSize: 12, color: '#64748b', minWidth: 80 }}>{bloom}</div>
                      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${avg * 100}%`, background: BLOOM_HEX_COLORS[bloom], borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, minWidth: 40 }}>{Math.round(avg * 100)}%</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {selectedCourseId && !loading && activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Mapping Change History</h3>
          <Card style={{ padding: 48, textAlign: 'center' }}>
            <History size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ color: '#94a3b8' }}>Change history will appear here as mappings are updated.</p>
          </Card>
        </div>
      )}

      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setRejectTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 400 }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Rejection Reason</h4>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Why is this blueprint being rejected?"
              style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, minHeight: 80, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <Button onClick={() => setRejectTarget(null)} style={{ background: '#f1f5f9', color: '#475569' }}>Cancel</Button>
              <Button onClick={submitReject} style={{ background: '#ef4444', color: '#fff' }}>Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
