'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { useAssignments } from '@/hooks/useAssignments';
import { deleteAssignment as deleteAssignmentRequest } from '@/services/assignment.service';
import type { Assignment } from '@/types/assignment.types';

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

function CardMenu({
  assignment,
  onView,
  onDelete,
  isDeleting,
}: {
  assignment: Assignment;
  onView: (assignmentId: string) => void;
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
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        className="menu-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
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
            <button type="button" className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onView(assignment._id); }}>
              View Assignment
            </button>
            <div className="dropdown-divider" />
            <button
              type="button"
              className="dropdown-item danger"
              onClick={async (e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); await onDelete(assignment._id); }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssignmentCard({
  assignment,
  index,
  onView,
  onDelete,
  isDeleting,
}: {
  assignment: Assignment;
  index: number;
  onView: (assignmentId: string) => void;
  onDelete: (assignmentId: string) => Promise<void>;
  isDeleting: boolean;
}) {
  const isLive = assignment.status === 'generating' || assignment.status === 'queued';
  const assignedDate = format(new Date(assignment.createdAt), 'dd-MM-yyyy');
  const dueDate = format(new Date(assignment.dueDate), 'dd-MM-yyyy');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.04 }}
      className="assignment-card assignment-card-v3"
    >
      {isLive && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-lg)', border: '2px solid var(--brand)', opacity: 0.4, animation: 'pulse-ring 2s ease-in-out infinite', pointerEvents: 'none' }} aria-hidden="true" />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="card-title assignment-card-title-v3">{assignment.title}</h3>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <StatusBadge status={assignment.status} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {assignment.subject}
            </span>
          </div>
        </div>
        <CardMenu assignment={assignment} onView={onView} onDelete={onDelete} isDeleting={isDeleting} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '12px', color: '#111827', gap: 8, flexWrap: 'wrap' }}>
        <span><strong>Assigned on : </strong><span style={{ color: '#6B7280', fontWeight: 500 }}>{assignedDate}</span></span>
        <span><strong>Due : </strong><span style={{ color: '#6B7280', fontWeight: 500 }}>{dueDate}</span></span>
      </div>

      {isLive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 600 }}>
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          Generating paper...
        </div>
      )}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="assignment-card" style={{ animation: 'none' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 20, width: '65%', borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 22, width: 90, borderRadius: 100 }} />
        </div>
        <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }} />
      </div>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: 100, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function EmptyState({ isFiltered, assignmentsCount }: { isFiltered: boolean; assignmentsCount: number }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <Image src="/empty-state.png" alt="" fill sizes="(max-width: 768px) 100vw, 320px" style={{ objectFit: 'contain' }} />
      </div>
      <h2 className="empty-title">
        {isFiltered && assignmentsCount > 0 ? 'No matching assignments' : 'No assignments yet'}
      </h2>
      <p className="empty-desc">
        {isFiltered && assignmentsCount > 0
          ? 'Try adjusting your search or filter criteria.'
          : 'Create your first assignment to start collecting and grading student submissions.'}
      </p>
      {!(isFiltered && assignmentsCount > 0) && (
        <Link href="/assignments/create" className="btn btn-dark btn-pill">
          <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1 }}>+</span>
          Create Your First Assignment
        </Link>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const effectiveStatus = statusFilter === 'All' ? undefined : statusFilter;
  const { assignments, isLoading, error, phase, reload } = useAssignments(1, effectiveStatus);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (error) toast.error(error, { id: 'dashboard-error', position: 'bottom-center' });
  }, [error]);

  const handleView = (assignmentId: string) => void router.push(`/assignments/${assignmentId}/paper`);
  const handleDelete = async (assignmentId: string) => {
    if (!window.confirm('Delete this assignment? This action cannot be undone.')) return;
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

  const filtered = assignments.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isFiltered = Boolean(search || statusFilter !== 'All');

  return (
    <>
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="status-dot" aria-hidden="true" />
          <h1 className="page-title">Assignments</h1>
        </div>
        <p className="page-subtitle">Manage and create assignments for your classes.</p>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="mobile-header-title">Assignments</h1>
        <div style={{ width: 32 }} />
      </div>

      <div className="search-filter-row search-filter-row-v3">
        <div className="filter-select-wrap modern-filter" ref={filterRef}>
          <button
            type="button"
            className={`modern-filter-trigger${filterOpen ? ' open' : ''}`}
            onClick={() => setFilterOpen((s) => !s)}
            aria-label="Filter assignments by status"
            aria-expanded={filterOpen}
          >
            <Filter size={14} className="filter-icon" aria-hidden="true" />
            <span>{statusFilter === 'All' ? 'All' : statusFilter.replace('_', ' ')}</span>
            <ChevronDown size={14} className={`filter-chevron${filterOpen ? ' open' : ''}`} aria-hidden="true" />
          </button>
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                className="modern-filter-menu"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.14 }}
              >
                {['All', 'draft', 'queued', 'generating', 'completed', 'partially_generated', 'failed'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`modern-filter-item${statusFilter === status ? ' active' : ''}`}
                    onClick={() => {
                      setStatusFilter(status);
                      setFilterOpen(false);
                    }}
                  >
                    {status === 'All' ? 'All' : status.replace('_', ' ')}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="search-wrap">
              <Search size={15} className="search-icon" aria-hidden="true" />
              <input type="text" placeholder="Search Assignment" value={search} onChange={(e) => setSearch(e.target.value)} className="input search-input" aria-label="Search assignments" />
        </div>
      </div>

      {isLoading ? (
          <div className="assignment-grid assignment-grid-v3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
      ) : phase === 'error' && error ? (
        <div className="empty-state">
          <div className="empty-illustration" aria-hidden="true">
            <Image src="/empty-state.png" alt="" fill sizes="(max-width: 768px) 100vw, 320px" style={{ objectFit: 'contain' }} />
          </div>
          <h2 className="empty-title">Failed to load assignments</h2>
          <p className="empty-desc">Could not connect to server. {error}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => void reload()} className="btn btn-dark btn-pill">
              <RefreshCw size={14} />
              Retry loading
            </button>
            <button onClick={() => window.history.back()} className="btn btn-secondary btn-pill">
              Go back
            </button>
          </div>
        </div>
      ) : assignments.length === 0 || filtered.length === 0 ? (
        <EmptyState isFiltered={isFiltered} assignmentsCount={assignments.length} />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="assignment-grid assignment-grid-v3">
            {filtered.map((assignment, i) => (
              <AssignmentCard
                key={assignment._id}
                assignment={assignment}
                index={i}
                onView={handleView}
                onDelete={handleDelete}
                isDeleting={deletingId === assignment._id}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {assignments.length > 0 && (
        <div className="dashboard-fab dashboard-fab-v3">
          <Link href="/assignments/create" className="btn btn-dark btn-pill">
            <Plus size={16} />
            Create Assignment
          </Link>
        </div>
      )}
    </>
  );
}
