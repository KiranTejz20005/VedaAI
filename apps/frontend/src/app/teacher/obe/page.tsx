'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/design-system/Button';
import { api } from '@/lib/api';
import {
  BookOpen,
  Target,
  FileText,
  BarChart3,
  Plus,
  Check,
  X,
  History,
  Layers,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { COPOMatrix, COPOMatrixData } from '@/components/obe/COPOMatrix';
import { motion } from 'framer-motion';
import { NativeSelect } from '@/components/ui/native-select';

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

interface Course {
  id: string;
  name: string;
  code: string;
  _count?: { outcomes: number; blueprints: number };
}
interface BlueprintItem {
  id: string;
  coId: string;
  title: string;
  marks: number;
  bloomLevel: BloomLevel;
}
interface Blueprint {
  id: string;
  title: string;
  totalMarks: number;
  status: BlueprintStatus;
  items: BlueprintItem[];
  _count?: { items: number };
  createdAt: string;
}
interface AttainmentResult {
  coId: string;
  coCode: string;
  attainment: number;
  threshold: number;
  metThreshold: boolean;
  bloomLevel: BloomLevel;
}
interface ValidationIssue {
  message: string;
  severity: 'error' | 'warning';
}
interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

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
    } catch {
      /* empty */
    }
  }, []);

  const fetchAttainment = useCallback(async (courseId: string, signal?: AbortSignal) => {
    try {
      const res = await api.get(`/obe/courses/${courseId}/attainment/co`, { signal });
      setAttainment(res.data.data?.outcomes || []);
    } catch {
      /* empty */
    }
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
  }, [selectedCourseId, activeTab, fetchGraph, fetchBlueprints, fetchAttainment]);

  const handleAddCO = async () => {
    if (!newCO.code || !newCO.description) {
      toast.error('Code and Description are required');
      return;
    }
    try {
      await api.post(`/obe/courses/${selectedCourseId}/outcomes`, newCO);
      toast.success('Course Outcome created');
      setNewCO({ code: '', description: '', bloomLevel: 'UNDERSTAND' });
      setShowAddCO(false);
      fetchGraph(selectedCourseId);
    } catch {
      toast.error('Failed to create CO');
    }
  };

  const handleAddPO = async () => {
    if (!newPO.code || !newPO.description) {
      toast.error('Code and Description are required');
      return;
    }
    try {
      const progRes = await api.get('/obe/programs');
      const prog = progRes.data.data?.[0];
      if (!prog) {
        toast.error('No program found. Create a program first.');
        return;
      }
      await api.post(`/obe/programs/${prog.id}/outcomes`, newPO);
      toast.success('Program Outcome created');
      setNewPO({ code: '', description: '' });
      setShowAddPO(false);
      fetchGraph(selectedCourseId);
    } catch {
      toast.error('Failed to create PO');
    }
  };

  const handleCreateBlueprint = async () => {
    if (!newBlueprint.title) {
      toast.error('Title required');
      return;
    }
    try {
      await api.post(`/obe/courses/${selectedCourseId}/blueprints`, { ...newBlueprint, courseId: selectedCourseId });
      toast.success('Blueprint created');
      setNewBlueprint({ title: '', totalMarks: 100 });
      setShowAddBlueprint(false);
      fetchBlueprints(selectedCourseId);
    } catch {
      toast.error('Failed to create blueprint');
    }
  };

  const handleValidate = async (id: string) => {
    try {
      const res = await api.post(`/obe/blueprints/${id}/validate`);
      setValidationResult(res.data.data);
      if (res.data.data.valid) toast.success('Blueprint is valid');
      else toast.error('Blueprint has issues');
    } catch {
      toast.error('Validation failed');
    }
  };

  const handleSubmitForReview = async (id: string) => {
    try {
      await api.post(`/obe/blueprints/${id}/submit`);
      toast.success('Submitted for review');
      fetchBlueprints(selectedCourseId);
    } catch {
      toast.error('Failed to submit');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/obe/blueprints/${id}/approve`, { comments: 'Approved via OBE dashboard' });
      toast.success('Blueprint approved');
      fetchBlueprints(selectedCourseId);
    } catch {
      toast.error('Failed to approve');
    }
  };

  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('Reason required');
      return;
    }
    try {
      await api.post(`/obe/blueprints/${rejectTarget}/reject`, { reason: rejectReason });
      toast.success('Blueprint rejected');
      setRejectTarget(null);
      setRejectReason('');
      fetchBlueprints(selectedCourseId);
    } catch {
      toast.error('Failed to reject');
    }
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
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Outcome-Based Education (OBE)
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Map course outcomes (CO) to program outcomes (PO), evaluate attainment, and generate blueprints
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-neutral-200/90 shadow-2xs">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Course:</span>
            <NativeSelect
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer"
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-white border border-neutral-200/90 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {!selectedCourseId ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex flex-col items-center">
          <Target className="w-12 h-12 text-neutral-300 mb-3" />
          <h3 className="text-base font-bold text-neutral-800">Select a Course</h3>
          <p className="text-xs text-neutral-400 mt-1">Choose a curriculum course above to manage its OBE mapping</p>
        </div>
      ) : loading ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/90 shadow-xs">
          <p className="text-xs text-neutral-400 font-medium">Loading OBE curriculum matrix...</p>
        </div>
      ) : activeTab === 'graph' ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900">CO / PO Alignment Matrix</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddCO(!showAddCO)}
                className="px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add CO
              </button>
              <button
                onClick={() => setShowAddPO(!showAddPO)}
                className="px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add PO
              </button>
            </div>
          </div>

          {showAddCO && (
            <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">New Course Outcome (CO)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  value={newCO.code}
                  onChange={(e) => setNewCO({ ...newCO, code: e.target.value })}
                  placeholder="Code (e.g. CO1)"
                  className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                />
                <input
                  value={newCO.description}
                  onChange={(e) => setNewCO({ ...newCO, description: e.target.value })}
                  placeholder="Outcome description..."
                  className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:col-span-2"
                />
                <div className="flex items-center gap-2">
                  <NativeSelect
                    value={newCO.bloomLevel}
                    onChange={(e) => setNewCO({ ...newCO, bloomLevel: e.target.value as BloomLevel })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                  >
                    {BLOOM_LEVELS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </NativeSelect>
                  <button
                    onClick={handleAddCO}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowAddCO(false)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {matrixData ? (
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs overflow-hidden">
              <COPOMatrix
                data={matrixData}
                onSaveMatrix={handleSaveMatrix}
                onRefresh={() => fetchGraph(selectedCourseId)}
              />
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/90 shadow-xs">
              <Target className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-400">No matrix mappings recorded for this course.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'blueprints' ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900">Assessment Blueprints</h3>
            <button
              onClick={() => setShowAddBlueprint(true)}
              className="px-4 py-2 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Blueprint</span>
            </button>
          </div>

          {blueprints.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/90 shadow-xs">
              <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-400 font-medium">No assessment blueprints created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {blueprints.map((bp) => (
                <div
                  key={bp.id}
                  className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">{bp.title}</h4>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {bp._count?.items ?? bp.items?.length ?? 0} items • {bp.totalMarks} Marks
                      </p>
                    </div>
                    <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                      {bp.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
                    {bp.status === 'DRAFT' && (
                      <>
                        <button
                          onClick={() => handleValidate(bp.id)}
                          className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700"
                        >
                          Validate
                        </button>
                        <button
                          onClick={() => handleSubmitForReview(bp.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
                        >
                          Submit
                        </button>
                      </>
                    )}
                    {bp.status === 'PENDING_REVIEW' && (
                      <>
                        <button
                          onClick={() => handleApprove(bp.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectTarget(bp.id);
                            setRejectReason('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'attainment' ? (
        <div className="flex flex-col gap-6">
          <h3 className="text-base font-bold text-neutral-900">Course Outcome Attainment Results</h3>
          {attainment.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/90 shadow-xs">
              <BarChart3 className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-400 font-medium">
                No attainment data available. Complete assessments to calculate CO/PO attainment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {attainment.map((a) => (
                <div
                  key={a.coId}
                  className={`p-5 rounded-2xl border bg-white shadow-xs flex flex-col justify-between ${
                    a.metThreshold ? 'border-emerald-200' : 'border-rose-200'
                  }`}
                >
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{a.coCode}</span>
                  <div
                    className={`text-2xl font-extrabold mt-2 ${
                      a.metThreshold ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {Math.round(a.attainment * 100)}%
                  </div>
                  <span className="text-[11px] font-medium text-neutral-500 mt-1">
                    Target: {Math.round(a.threshold * 100)}% • {a.metThreshold ? 'Achieved' : 'Below Target'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-12 text-center shadow-xs">
          <History className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-xs text-neutral-400 font-medium">
            Curriculum mapping change history and version logs will populate as outcomes are updated.
          </p>
        </div>
      )}

      {/* Rejection Dialog */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-neutral-900">Blueprint Rejection Reason</h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="State the reason why this blueprint needs changes..."
              rows={3}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
