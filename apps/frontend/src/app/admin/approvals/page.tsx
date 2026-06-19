'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ClipboardCheck,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  ChevronRight,
  Calendar,
  FileQuestion,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Assessment {
  id: string;
  title: string;
  faculty?: { firstName: string; lastName: string } | null;
  facultyId?: string;
  class?: { grade: string; section: string } | null;
  subject?: string;
  questionCount: number;
  difficulty: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  questions?: Array<{ id: string; text: string; type: string }>;
  generationHistory?: Array<{ action: string; timestamp: string; user: string }>;
}

export default function ApprovalsCenter() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/admin/assignments${params}`);
      if (res.data?.success) setAssessments(res.data.data);
    } catch { toast.error('Failed to load assessments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this assessment? It will be published to students.')) return;
    setActionLoading(id);
    try {
      const res = await api.put(`/admin/assignments/${id}/reopen`);
      if (res.data?.success) { toast.success('Assessment approved!'); loadData(); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Approval failed'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    setActionLoading(id);
    try {
      const res = await api.put(`/admin/assignments/${id}/close`, { reason: reason || undefined });
      if (res.data?.success) { toast.success('Assessment rejected.'); loadData(); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Rejection failed'); }
    finally { setActionLoading(null); }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredList = assessments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.faculty && `${a.faculty.firstName} ${a.faculty.lastName}`.toLowerCase().includes(search.toLowerCase()))
  );

  const statusColors: Record<string, string> = {
    PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Approvals Center</h2>
          <p className="text-gray-500 text-xs md:text-sm">Review, approve, or reject assessment submissions from faculty.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input type="text" placeholder="Search by assessment title or faculty name..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 min-w-[160px]">
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All Statuses</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            {statusFilter === 'PENDING_APPROVAL'
              ? 'No pending assessments to review. Great work!'
              : 'No assessments found for this status.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((a) => (
              <div key={a.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleExpand(a.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <ClipboardCheck size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-800 text-sm">{a.title}</div>
                      <div className="text-[10px] text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                        {a.faculty && <span>{a.faculty.firstName} {a.faculty.lastName}</span>}
                        {a.class && <span>{a.class.grade} - {a.class.section}</span>}
                        {a.subject && <span>{a.subject}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${statusColors[a.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {a.status?.replace('_', ' ') || 'UNKNOWN'}
                    </span>
                    <span className="text-gray-400">{expandedId === a.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                  </div>
                </div>

                {expandedId === a.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/30 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <span className="text-gray-400 font-semibold uppercase text-[9px]">Question Count</span>
                        <p className="font-bold text-gray-800 mt-0.5 flex items-center gap-1"><FileQuestion size={13} /> {a.questionCount}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <span className="text-gray-400 font-semibold uppercase text-[9px]">Difficulty</span>
                        <p className="font-bold text-gray-800 mt-0.5">{a.difficulty || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <span className="text-gray-400 font-semibold uppercase text-[9px]">Created</span>
                        <p className="font-bold text-gray-800 mt-0.5 flex items-center gap-1"><Calendar size={13} /> {new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <span className="text-gray-400 font-semibold uppercase text-[9px]">Subject</span>
                        <p className="font-bold text-gray-800 mt-0.5 flex items-center gap-1"><BookOpen size={13} /> {a.subject || 'N/A'}</p>
                      </div>
                    </div>

                    {a.questions && a.questions.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Question Preview</h4>
                        <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                          {a.questions.slice(0, 5).map((q, i) => (
                            <div key={q.id} className="bg-white rounded-lg p-2 border border-gray-100 text-xs text-gray-700">
                              <span className="font-bold text-gray-400 mr-1">{i + 1}.</span> {q.text}
                            </div>
                          ))}
                          {a.questions.length > 5 && <p className="text-[10px] text-gray-400">...and {a.questions.length - 5} more questions</p>}
                        </div>
                      </div>
                    )}

                    {a.generationHistory && a.generationHistory.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Generation History</h4>
                        <div className="space-y-1">
                          {a.generationHistory.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-gray-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              <span className="font-medium">{h.action}</span>
                              <span className="text-gray-400">by {h.user}</span>
                              <span className="text-gray-400">{new Date(h.timestamp).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {a.status === 'PENDING_APPROVAL' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <button onClick={(e) => { e.stopPropagation(); handleApprove(a.id); }}
                          disabled={actionLoading === a.id}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-xs transition-all disabled:opacity-50">
                          <CheckCircle size={14} /> {actionLoading === a.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleReject(a.id); }}
                          disabled={actionLoading === a.id}
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-all disabled:opacity-50">
                          <XCircle size={14} /> Reject
                        </button>
                        <button onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all">
                          <Eye size={14} /> View Full Details
                        </button>
                      </div>
                    )}

                    {(a.status === 'APPROVED' || a.status === 'REJECTED') && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 pt-2 border-t border-gray-200">
                        <AlertTriangle size={12} />
                        <span>This assessment has been {a.status.toLowerCase()}.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
