'use client';

import { Library, Search, Filter, Download, Eye, FileText, Clock, BookOpen, MoreVertical, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { fetchAssignments } from '@/services/assignment.service';
import type { Assignment } from '@/types/assignment.types';

const SUBJECT_COLORS: Record<string, { bg: string; color: string }> = {
  Physics:          { bg: '#EDE9FE', color: '#7C3AED' },
  Chemistry:        { bg: '#D1FAE5', color: '#059669' },
  Mathematics:      { bg: '#DBEAFE', color: '#2563EB' },
  Biology:          { bg: '#FEF3C7', color: '#D97706' },
  'Computer Science': { bg: '#FCE7F3', color: '#DB2777' },
  English:          { bg: '#FEF9C3', color: '#CA8A04' },
};

export default function LibraryPage() {
  const [papers, setPapers] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetchAssignments(1, 50)
      .then((res) => { if (!cancelled) setPapers(res.data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load papers'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = papers.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.subject.toLowerCase().includes(search.toLowerCase())
  );

  const totalQuestions = papers.reduce((sum, p) => sum + ((p.questionConfig as any)?.count || 0), 0);
  const subjectsCovered = new Set(papers.map((p) => p.subject)).size;
  const thisMonth = papers.filter((p) => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleView = (id: string, status: string) => {
    if (status === 'completed' || status === 'partially_generated') {
      router.push(`/assignments/${id}/paper`);
    } else {
      router.push(`/assignments/${id}`);
    }
  };

  const handleDownload = async (id: string) => {
    setDownloadId(id);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/papers/${id}/pdf`);
      if (!res.ok) throw new Error('PDF not available');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paper-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF not yet available. Generate the paper first.');
    } finally {
      setDownloadId(null);
    }
  };

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="status-dot" aria-hidden="true" />
          <h1 className="page-title">My Library</h1>
        </div>
        <p className="page-subtitle">All your generated question papers, saved and ready to reuse.</p>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">Library</h1>
        <div style={{ width: 32 }} />
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Papers', value: papers.length, color: '#6366F1' },
          { label: 'Total Questions', value: totalQuestions, color: '#10B981' },
          { label: 'Subjects Covered', value: subjectsCovered, color: '#F59E0B' },
          { label: 'This Month', value: thisMonth, color: '#E8531D' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="search-filter-row search-filter-row-v3">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input type="text" placeholder="Search papers..." className="input search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 16, width: '50%', borderRadius: 6, marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle size={40} color="#EF4444" />
          <h2 className="empty-title">Failed to load</h2>
          <p className="empty-desc">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Library size={36} color="#9CA3AF" />
          </div>
          <h2 className="empty-title">{search ? 'No matching papers' : 'Your library is empty'}</h2>
          <p className="empty-desc">{search ? 'Try a different search term.' : 'Create an assignment to see papers here.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((paper, i) => {
            const subjectStyle = SUBJECT_COLORS[paper.subject] ?? { bg: '#F3F4F6', color: '#374151' };
            return (
              <motion.div
                key={paper.id}
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ padding: '14px 18px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: subjectStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={18} color={subjectStyle.color} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="card-title" style={{ fontSize: 14, cursor: 'pointer' }} onClick={() => handleView(paper.id, paper.status)}>{paper.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: subjectStyle.bg, color: subjectStyle.color, flexShrink: 0 }}>
                        {paper.subject}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 5, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                        <BookOpen size={12} /> {(paper.questionConfig as any)?.count || 0} questions &middot; {paper.totalMarks} marks
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                        <Clock size={12} /> {new Date(paper.createdAt).toLocaleDateString()}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: paper.status === 'completed' ? '#D1FAE5' : paper.status === 'failed' ? '#FEE2E2' : '#FEF3C7', color: paper.status === 'completed' ? '#059669' : paper.status === 'failed' ? '#EF4444' : '#D97706' }}>
                        {paper.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-secondary btn-sm" style={{ gap: 5 }} onClick={() => handleView(paper.id, paper.status)}>
                      <Eye size={13} /> View
                    </button>
                    <button className="btn btn-secondary btn-sm" style={{ gap: 5 }} onClick={() => handleDownload(paper.id)} disabled={downloadId === paper.id}>
                      {downloadId === paper.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}