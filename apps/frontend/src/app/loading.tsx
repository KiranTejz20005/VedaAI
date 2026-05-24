import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="empty-state">
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      <p className="page-subtitle" style={{ marginTop: 12 }}>Loading...</p>
    </div>
  );
}
