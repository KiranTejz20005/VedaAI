'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, Terminal, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Badge } from '@/design-system/Badge';
import { LoadingState } from '@/design-system/LoadingState';
import { EmptyState } from '@/design-system/EmptyState';
import { Button } from '@/design-system/Button';

interface AuditEntry {
  id: string;
  userId: string | null;
  userEmail?: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export default function SuperAdminAudit() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);
  const [actions, setActions] = useState<string[]>([]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (actionFilter) params.set('action', actionFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (search) params.set('search', search);

      const res = await api.get(`/admin/audit?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data.logs || res.data.data);
        setTotalPages(res.data.data.totalPages || 1);
        const distinct = Array.from(new Set((res.data.data.logs || res.data.data).map((l: AuditEntry) => l.action))).filter(Boolean) as string[];
        setActions(prev => prev.length ? prev : distinct);
      }
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadLogs(); }, [page, actionFilter, dateFrom, dateTo, search]);

  const handleFilter = () => { setPage(1); loadLogs(); };

  const getActionVariant = (action: string): 'error' | 'info' | 'warning' | 'success' | 'draft' => {
    if (action.includes('FAIL') || action.includes('ERR') || action.includes('DELETE')) return 'error';
    if (action.includes('CREATE') || action.includes('RESET')) return 'info';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'warning';
    if (action.includes('LOGIN') || action.includes('APPROVE')) return 'success';
    return 'draft';
  };

  const formatIpAddress = (ip: string) => {
    if (!ip) return '-';
    let cleanIp = ip.split(',')[0].trim();
    if (cleanIp === '::1') return '127.0.0.1';
    if (cleanIp.startsWith('::ffff:')) return cleanIp.substring(7);
    return cleanIp;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Audit Log Viewer"
        subtitle="Track all platform-wide actions, changes, and administrative operations."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 16,
        alignItems: 'start',
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search by user, action, or IP..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 14px 8px 36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontFamily: 'inherit', background: 'var(--bg-input)', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 83, 29, 0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                style={{ padding: '8px 32px 8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontFamily: 'inherit', background: 'var(--bg-input)', outline: 'none', appearance: 'none', minWidth: 140, cursor: 'pointer' }}>
                <option value="">All Actions</option>
                {actions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontFamily: 'inherit', background: 'var(--bg-input)', outline: 'none' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontFamily: 'inherit', background: 'var(--bg-input)', outline: 'none' }} />
              <Button variant="primary" size="sm" onClick={handleFilter}>Apply</Button>
            </div>
          </div>

          {loading ? (
            <LoadingState lines={8} />
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<Terminal size={32} />}
              title="No audit logs found"
              description="Try adjusting your filters or search terms."
            />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Timestamp', 'User', 'Action', 'Entity / ID', 'IP Address', ''].map(h => (
                        <th key={h} style={{ textAlign: h === '' ? 'right' : 'left', padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 'var(--text-xs)' }}>
                          {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{log.userEmail || log.userId || 'System'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <Badge variant={getActionVariant(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          <div>{log.entity || '-'}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{log.entityId ? log.entityId.substring(0, 12) + '...' : '-'}</div>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{formatIpAddress(log.ipAddress)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft size={14} />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card padding="clamp(16px, 2vw, 20px)" style={{ position: 'sticky', top: '88px' }}>
          {!selectedLog ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' }}>
              <Terminal size={32} color="var(--text-muted)" style={{ marginBottom: 8 }} />
              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entry Details</h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4, maxWidth: 200 }}>Click "View" on a log entry to inspect full details and metadata.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audit Entry</h3>
                  <Badge variant={getActionVariant(selectedLog.action)}>{selectedLog.action}</Badge>
                </div>
                <Button variant="ghost" size="sm" icon={<X size={16} />} onClick={() => setSelectedLog(null)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 'var(--text-sm)' }}>
                {[
                  { label: 'Timestamp', value: new Date(selectedLog.createdAt).toLocaleString() },
                  { label: 'User', value: selectedLog.userEmail || selectedLog.userId || 'System' },
                  { label: 'Entity', value: selectedLog.entity || '-' },
                  { label: 'Entity ID', value: selectedLog.entityId || '-' },
                  { label: 'IP Address', value: formatIpAddress(selectedLog.ipAddress) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: 8 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Metadata</span>
                <pre style={{ background: '#111827', color: '#34D399', padding: 16, borderRadius: 'var(--radius-md)', fontSize: '10px', overflow: 'auto', maxHeight: 250, lineHeight: 1.5, border: '1px solid #1F2937', margin: 0 }}>
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
