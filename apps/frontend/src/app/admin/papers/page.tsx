'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  FileText, 
  Search, 
  Archive, 
  Trash2, 
  RefreshCcw, 
  ArrowLeftRight, 
  TrendingUp, 
  DownloadCloud,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GeneratedPaper {
  id: string;
  assignmentId: string;
  title: string;
  totalMarks: number;
  duration: number;
  pdfPath: string | null;
  pdfUrl: string | null;
  generatedAt: string;
  canonicalMetadata: any;
  assignment: {
    title: string;
    subject: string;
  };
}

interface GroupSummary {
  id: string;
  name: string;
}

export default function PapersAdmin() {
  const [list, setList] = useState<GeneratedPaper[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [analytics, setAnalytics] = useState({ totalGenerated: 0, totalDownloads: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Reassign modal state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<GeneratedPaper | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [papersRes, groupsRes, statsRes] = await Promise.all([
        api.get('/admin/papers'),
        api.get('/admin/groups'),
        api.get('/admin/papers/analytics/stats'),
      ]);

      if (papersRes.data?.success) setList(papersRes.data.data);
      if (groupsRes.data?.success) setGroups(groupsRes.data.data.map((g: any) => ({ id: g.id, name: g.name })));
      if (statsRes.data?.success) setAnalytics(statsRes.data.data);
    } catch (err) {
      toast.error('Failed to load papers library');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this paper? It will hide from active lists.')) return;
    try {
      const res = await api.put(`/admin/papers/${id}/archive`);
      if (res.data?.success) {
        toast.success('Paper archived successfully.');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Archive failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this generated paper? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/admin/papers/${id}`);
      if (res.data?.success) {
        toast.success('Paper permanently deleted.');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm('Re-run AI generation queue for this paper? The original layout will be replaced.')) return;
    try {
      const res = await api.post(`/admin/papers/${id}/regenerate`);
      if (res.data?.success) {
        toast.success('Regeneration task successfully submitted to BullMQ queue!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to trigger regeneration');
    }
  };

  const handleOpenReassign = (paper: GeneratedPaper) => {
    setSelectedPaper(paper);
    setSelectedGroupId('');
    setShowReassignModal(true);
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaper || !selectedGroupId) return;

    try {
      const res = await api.post(`/admin/papers/${selectedPaper.id}/reassign`, {
        targetGroupId: selectedGroupId
      });

      if (res.data?.success) {
        toast.success('Assessment paper assigned to target group successfully.');
        setShowReassignModal(false);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Reassign failed');
    }
  };

  const filteredPapers = list.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.assignment.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header telemetry info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Exam Paper Library</h2>
          <p className="text-gray-500 text-xs md:text-sm">Audit all AI-synthesized exams, export PDFs, and trigger job retries.</p>
        </div>

        {/* Small stats badge */}
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 border border-gray-100 rounded-xl shadow-sm flex items-center gap-2.5">
            <TrendingUp size={16} className="text-emerald-500" />
            <div className="text-[10px] font-semibold text-gray-500">
              Generations: <strong className="text-gray-900 text-xs block">{analytics.totalGenerated} total</strong>
            </div>
          </div>
          <div className="bg-white px-4 py-2 border border-gray-100 rounded-xl shadow-sm flex items-center gap-2.5">
            <DownloadCloud size={16} className="text-blue-500" />
            <div className="text-[10px] font-semibold text-gray-500">
              Downloads: <strong className="text-gray-900 text-xs block">{analytics.totalDownloads} times</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Listing */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search papers by exam title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No exam papers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Paper Title</th>
                  <th className="py-2.5">Subject & Marks</th>
                  <th className="py-2.5">Created At</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPapers.map((p) => {
                  const isArchived = p.canonicalMetadata?.isArchived === true;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-gray-800 flex items-center gap-1.5">
                          <FileText size={15} className="text-orange-500" />
                          {p.title}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">Assigned to: {p.assignment.title}</div>
                      </td>
                      <td className="py-3 text-gray-500 font-semibold">
                        <div className="text-gray-700">{p.assignment.subject}</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">{p.totalMarks} Marks | {p.duration} mins</div>
                      </td>
                      <td className="py-3 text-gray-400 font-semibold">
                        {new Date(p.generatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                          isArchived 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {isArchived ? 'ARCHIVED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.pdfUrl && (
                            <a
                              href={p.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-[9px] flex items-center gap-1.5"
                            >
                              PDF Link
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenReassign(p)}
                            className="p-1.5 hover:bg-gray-100 rounded text-blue-600"
                            title="Reassign"
                          >
                            <ArrowLeftRight size={14} />
                          </button>
                          <button
                            onClick={() => handleRegenerate(p.id)}
                            className="p-1.5 hover:bg-gray-100 rounded text-purple-600"
                            title="Regenerate"
                          >
                            <RefreshCcw size={14} />
                          </button>
                          <button
                            onClick={() => handleArchive(p.id)}
                            className="p-1.5 hover:bg-gray-100 rounded text-amber-600"
                            title="Archive"
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-400"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reassign Paper Modal */}
      {showReassignModal && selectedPaper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowReassignModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Reassign Exam Paper</h3>
            <p className="text-[10px] text-gray-500 mb-4 font-semibold">Transfer assignment of <strong>{selectedPaper.title}</strong>.</p>
            
            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Target Study Group</label>
                <select
                  required
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Group...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                Execute Reassignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
