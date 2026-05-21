'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Clock,
  BookOpen,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Hourglass,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Assignment } from '@/types';

interface AssignmentCardProps {
  assignment: Assignment;
  index?: number;
}

type StatusKey = Assignment['status'];

const statusConfig: Record<
  StatusKey,
  { label: string; icon: React.ElementType; badgeCls: string; spin?: boolean }
> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    badgeCls: 'badge-draft',
  },
  queued: {
    label: 'Queued',
    icon: Hourglass,
    badgeCls: 'badge-queued',
  },
  generating: {
    label: 'Generating',
    icon: Loader2,
    badgeCls: 'badge-generating',
    spin: true,
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    badgeCls: 'badge-completed',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    badgeCls: 'badge-failed',
  },
};

export function AssignmentCard({ assignment, index = 0 }: AssignmentCardProps) {
  const status = statusConfig[assignment.status] ?? statusConfig.draft;
  const StatusIcon = status.icon;
  const isActive = assignment.status === 'generating' || assignment.status === 'queued';

  const href =
    assignment.status === 'completed'
      ? `/assignments/${assignment._id}/paper`
      : `/assignments/${assignment._id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
    >
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          className="assignment-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            border: isActive ? '1px solid var(--brand-border)' : undefined,
          }}
        >
          {/* Active pulse border */}
          {isActive && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--brand)',
                opacity: 0.3,
                animation: 'pulse-ring 2s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            {/* Icon */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--brand-light)',
                border: '1px solid var(--brand-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={18} color="var(--brand)" />
            </div>

            {/* Status badge */}
            <span className={`badge ${status.badgeCls}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <StatusIcon size={11} className={status.spin ? 'animate-spin' : undefined} />
              {status.label}
            </span>
          </div>

          {/* Title & Subject */}
          <div style={{ marginTop: 12 }}>
            <h3
              className="card-title"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {assignment.title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {assignment.subject}
            </p>
          </div>

          {/* Meta row */}
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FileText size={11} />
              {assignment.questionConfig?.count ?? 0} questions
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              {assignment.duration} min
            </span>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })}
            </span>
            <ChevronRight size={14} color="var(--text-muted)" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
