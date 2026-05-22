import type { AssignmentStatus } from '@/types/assignment.types';

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStatusColor(status: AssignmentStatus): string {
  const map: Record<AssignmentStatus, string> = {
    draft: 'badge-draft',
    queued: 'badge-queued',
    generating: 'badge-generating',
    completed: 'badge-completed',
    failed: 'badge-failed',
    partially_generated: 'badge-warning',
  };
  return map[status];
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}
