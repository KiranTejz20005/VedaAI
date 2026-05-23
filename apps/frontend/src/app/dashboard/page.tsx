'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Loader2,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  XCircle,
  Zap,
  RefreshCw,
  Clock,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useAssignments } from '@/hooks/useAssignments';
import {
  deleteAssignment as deleteAssignmentRequest,
  generateAssignment as generateAssignmentRequest,
} from '@/services/assignment.service';
import type { Assignment } from '@/types/assignment.types';

// ─── Status badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: Assignment['status'] }) {
  const config: Record<string, { cls: string; label: string }> = {
    draft:               { cls: 'badge-draft',      label: 'Draft' },
    queued:              { cls: 'badge-queued',     label: 'Queued' },
    generating:          { cls: 'badge-generating', label: 'Generating' },
    completed:           { cls: 'badge-completed',  label: 'Completed' },
    failed:              { cls: 'badge-failed',     label: 'Failed' },
    partially_generated: { cls: 'badge-warning',    label: 'Partially Generated' },
  };

  const { cls, label } = config[status] ?? config.draft;
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ─── 3-dot context menu ─────────────────────────────────────
function CardMenu({
  assignment,
  onView,
  onRegenerate,
  onDelete,
  isDeleting,
}: {
  assignment: Assignment;
  onView: (assignmentId: string) => void;
  onRegenerate: (assignmentId: string) => Promise<void>;
  onDelete: (assignmentId: string) => Promise<void>;
  isDeleting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="menu-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="Card options"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="dropdown-menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            <button
              type="button"
              className="dropdown-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                onView(assignment._id);
              }}
              style={{ padding: '8px 14px', fontSize: '13px', color: '#111827', fontWeight: '500' }}
            >
              View Assignment
            </button>
            <button
              type="button"
              className="dropdown-item danger"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                await onDelete(assignment._id);
              }}
              disabled={isDeleting}
              style={{ padding: '8px 14px', fontSize: '13px', color: '#DC2626', fontWeight: '500' }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Assignment card ─────────────────────────────────────────
function AssignmentCard({
  assignment,
  index,
  onView,
  onRegenerate,
  onDelete,
  isDeleting,
}: {
  assignment: Assignment;
  index: number;
  onView: (assignmentId: string) => void;
  onRegenerate: (assignmentId: string) => Promise<void>;
  onDelete: (assignmentId: string) => Promise<void>;
  isDeleting: boolean;
}) {
  const isLive = assignment.status === 'generating' || assignment.status === 'queued';
  const isPartial = assignment.status === 'partially_generated';
  const genMeta = assignment.generationMeta;
  const assignedDate = format(new Date(assignment.createdAt), 'dd-MM-yyyy');
  const dueDate = format(new Date(assignment.dueDate), 'dd-MM-yyyy');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.04 }}
      className="assignment-card"
      style={{ overflow: 'visible' }}
    >
      {/* Live pulse border */}
      {isLive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--brand)',
            opacity: 0.4,
            animation: 'pulse-ring 2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
      )}

      {/* Header row: title + 3-dot */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="card-title" style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#111827' }}>
            {assignment.title}
          </h3>
        </div>
        <CardMenu
          assignment={assignment}
          onView={onView}
          onRegenerate={onRegenerate}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </div>

      {/* Meta row (clean side-by-side dates, no divider, bold dark text) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 18,
          fontSize: '11.5px',
          fontWeight: '700',
          color: '#111827',
        }}
      >
        <span>Assigned on : {assignedDate}</span>
        <span>Due : {dueDate}</span>
      </div>

      {/* Processing indicator */}
      {isLive && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            fontSize: 12,
            color: 'var(--brand)',
            fontWeight: 600,
          }}
        >
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          Generating paper…
        </div>
      )}
    </motion.div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="assignment-card" style={{ animation: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 18, width: '65%', borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 100 }} />
        </div>
        <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
      </div>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: 100, borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────
function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="empty-state">
      {/* Illustration */}
      <div className="empty-illustration" aria-hidden="true">
        <img 
          src="/empty-state.png" 
          alt="No assignments yet" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>

      <h2 className="empty-title">
        {isFiltered ? 'No matching assignments' : 'No assignments yet'}
      </h2>
      <p className="empty-desc">
        {isFiltered
          ? 'Try adjusting your search or filter criteria.'
          : 'Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.'}
      </p>

      {!isFiltered && (
        <Link 
          href="/assignments/create" 
          className="btn btn-dark"
          style={{
            borderRadius: '100px',
            padding: '12px 28px',
            fontWeight: '700',
            fontSize: '14.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: '500', lineHeight: 1 }}>+</span>
          Create Your First Assignment
        </Link>
      )}
    </div>
  );
}

// ─── Stats bar ───────────────────────────────────────────────
function StatsBar({ assignments }: { assignments: Assignment[] }) {
  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === 'completed').length;
  const partial = assignments.filter((a) => a.status === 'partially_generated').length;
  const inProgress = assignments.filter((a) => a.status === 'generating' || a.status === 'queued').length;
  const failed = assignments.filter((a) => a.status === 'failed').length;

  const stats = [
    { label: 'Total', value: total, color: '#6366F1' },
    { label: 'Completed', value: completed, color: '#10B981' },
    { label: 'In Progress', value: inProgress, color: '#F59E0B' },
    { label: 'Partial', value: partial, color: '#EA580C' },
    { label: 'Failed', value: failed, color: '#EF4444' },
  ];

  return (
    <div className="stats-grid">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="stat-card">
          <div className="stat-value" style={{ color }}>{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────
export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState('All');
  const effectiveStatus = statusFilter === 'All' ? undefined : statusFilter;
  const { assignments, isLoading, error, reload } = useAssignments(1, effectiveStatus);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error, { id: 'dashboard-error', position: 'bottom-center' });
    }
  }, [error]);

  const handleView = (assignmentId: string) => {
    void router.push(`/assignments/${assignmentId}`);
  };

  const handleDelete = async (assignmentId: string) => {
    const confirmed = window.confirm('Delete this assignment? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingId(assignmentId);
      await deleteAssignmentRequest(assignmentId);
      toast.success('Assignment deleted');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete assignment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegenerate = async (assignmentId: string) => {
    try {
      await generateAssignmentRequest(assignmentId);
      toast.success('Regeneration queued');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to queue regeneration');
    }
  };

  const filtered = assignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isFiltered = Boolean(search || statusFilter !== 'All');

  return (
    <>
      {/* Page heading (responsive structures defined in globals.css) */}
      <div className="page-header-container">
        {/* Desktop-only Page Header */}
        <div className="desktop-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="status-dot" aria-hidden="true" />
            <h1 className="page-title">Assignments</h1>
          </div>
          <p className="page-subtitle">Manage and create assignments for your classes.</p>
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
          <h1 className="mobile-header-title">Assignments</h1>
          <div style={{ width: '32px' }} /> {/* Spacer to center the title */}
        </div>
      </div>

      {/* Stats (only when there is data) */}
      {!isLoading && assignments.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <StatsBar assignments={assignments} />
        </motion.div>
      )}

      {/* Search + Filter bar */}
      <div className="search-filter-row">
        {/* Filter By */}
        <div
          className="filter-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            paddingRight: 10,
          }}
        >
          <Filter size={14} />
          <label className="filter-label" htmlFor="status-filter" style={{ fontSize: 14, fontWeight: 500 }}>
            Filter By
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter assignments by status"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <option value="All">All</option>
            <option value="draft">Draft</option>
            <option value="queued">Queued</option>
            <option value="generating">Generating</option>
            <option value="completed">Completed</option>
            <option value="partially_generated">Partial</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown size={13} />
        </div>

        {/* Search */}
        <div className="search-wrap">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search Assignment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input search-input"
            aria-label="Search assignments"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="assignment-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          {/* Illustration */}
          <div className="empty-illustration" aria-hidden="true">
            <img 
              src="/empty-state.png" 
              alt="Error illustration" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>

          <h2 className="empty-title">Failed to load assignments</h2>
          <p className="empty-desc">
            Something went wrong while retrieving your assignments. Please check your connection or try reloading the page.
          </p>

          <button 
            onClick={() => void reload()} 
            className="btn btn-dark"
            style={{
              borderRadius: '100px',
              padding: '12px 28px',
              fontWeight: '700',
              fontSize: '14.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            <RefreshCw size={14} style={{ marginRight: '4px' }} />
            Retry loading
          </button>
        </div>
      ) : assignments.length === 0 || filtered.length === 0 ? (
        <EmptyState isFiltered={isFiltered && assignments.length > 0} />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="assignment-grid">
            {filtered.map((assignment, i) => (
              <AssignmentCard
                key={assignment._id}
                assignment={assignment}
                index={i}
                onView={handleView}
                onRegenerate={handleRegenerate}
                onDelete={handleDelete}
                isDeleting={deletingId === assignment._id}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Floating Create button (desktop only — mobile uses FAB in bottom nav) */}
      {assignments.length > 0 && (
        <div className="dashboard-fab">
          <Link href="/assignments/create" className="btn btn-dark">
            <Plus size={16} />
            Create Assignment
          </Link>
        </div>
      )}
    </>
  );
}
