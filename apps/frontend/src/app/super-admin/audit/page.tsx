'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Search, Terminal, X, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

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

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { loadLogs(); }, [page, actionFilter, dateFrom, dateTo, search]);

  const handleFilter = () => { setPage(1); loadLogs(); };

  const getActionColor = (action: string) => {
    if (action.includes('FAIL') || action.includes('ERR')) return 'bg-red-50 text-red-700 border-red-200';
    if (action.includes('CREATE') || action.includes('RESET')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('DELETE')) return 'bg-red-50 text-red-700 border-red-200';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Audit Log Viewer</h2>
        <p className="text-gray-500 text-xs md:text-sm">Track all platform-wide actions, changes, and administrative operations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input type="text" placeholder="Search by user, action, or IP..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500" />
            </div>
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 min-w-[140px]">
              <option value="">All Actions</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
              <span className="text-gray-400">to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
            </div>
            <button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 rounded-xl text-xs transition-colors">Apply</button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">No audit logs found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                      <th className="py-2.5">Timestamp</th>
                      <th className="py-2.5">User</th>
                      <th className="py-2.5">Action</th>
                      <th className="py-2.5">Entity / ID</th>
                      <th className="py-2.5">IP Address</th>
                      <th className="py-2.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 text-gray-400 font-semibold whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-3 text-gray-700 font-semibold">{log.userEmail || log.userId || 'System'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">
                          <div>{log.entity || '-'}</div>
                          <div className="text-[9px] text-gray-400">{log.entityId ? log.entityId.substring(0, 12) + '...' : '-'}</div>
                        </td>
                        <td className="py-3 text-gray-500 font-mono text-[10px]">{log.ipAddress || '-'}</td>
                        <td className="py-3 text-right">
                          <button onClick={() => setSelectedLog(log)} className="p-1 hover:bg-gray-100 rounded text-blue-600 font-semibold text-[10px]">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-gray-400">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronLeft size={16} /></button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronRight size={16} /></button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-1">
          {!selectedLog ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <Terminal className="text-gray-300 mb-2" size={32} />
              <h4 className="text-xs font-bold text-gray-400 uppercase">Entry Details</h4>
              <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Click &quot;View&quot; on a log entry to inspect full details and metadata.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase">Audit Entry</h3>
                  <span className="text-[9px] text-gray-500 font-semibold uppercase">{selectedLog.action}</span>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Timestamp</span><span className="font-semibold text-gray-800">{new Date(selectedLog.createdAt).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">User</span><span className="font-semibold text-gray-800">{selectedLog.userEmail || selectedLog.userId || 'System'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Entity</span><span className="font-semibold text-gray-800">{selectedLog.entity || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Entity ID</span><span className="font-semibold text-gray-800 font-mono text-[10px]">{selectedLog.entityId || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">IP Address</span><span className="font-semibold text-gray-800">{selectedLog.ipAddress || '-'}</span></div>
              </div>
              <div className="pt-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Metadata</span>
                <div className="bg-gray-950 text-emerald-400 p-4 rounded-xl font-mono text-[9px] overflow-auto max-h-[250px] leading-normal border border-gray-900">
                  <pre>{JSON.stringify(selectedLog.metadata || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
