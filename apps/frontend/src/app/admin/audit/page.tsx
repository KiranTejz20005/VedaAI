'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Activity, 
  Search, 
  Terminal, 
  X,
  FileCode,
  Calendar,
  Smartphone,
  Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  ipAddress: string;
  userAgent: string;
  metadata: any;
  createdAt: string;
}

export default function AuditLogsAdmin() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Metadata detailed view state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit');
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load audit logs trail');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (ua: string) => {
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
    return isMobile ? <Smartphone size={13} className="text-gray-400" /> : <Monitor size={13} className="text-gray-400" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('FAIL') || action.includes('ERR')) return 'bg-red-50 text-red-700 border-red-200';
    if (action.includes('CREATE') || action.includes('RESET')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('IMPERSONATE')) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Distinct action names for filter
  const actions = Array.from(new Set(logs.map(l => l.action))).filter(Boolean);

  const filteredLogs = logs.filter(l => {
    const matchSearch = 
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.ipAddress.includes(search) ||
      (l.userId && l.userId.toLowerCase().includes(search.toLowerCase()));
    
    const matchAction = !actionFilter || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Audit Trail Logs</h2>
        <p className="text-gray-500 text-xs md:text-sm">Audit user actions, login attempts, token creations, and administrative modifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by action keyword or IP address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 min-w-[150px]"
            >
              <option value="">All Actions</option>
              {actions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">No audit logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5">Action Code</th>
                    <th className="py-2.5">Network & Device</th>
                    <th className="py-2.5">Timestamp</th>
                    <th className="py-2.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <div className="text-[9px] text-gray-400 mt-1 font-semibold">User: {log.userId || 'Guest User'}</div>
                      </td>
                      <td className="py-3 text-gray-500 font-semibold">
                        <div className="text-gray-700">{log.ipAddress}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 max-w-[160px] truncate">
                          {getDeviceIcon(log.userAgent)} {log.userAgent}
                        </div>
                      </td>
                      <td className="py-3 text-gray-400 font-semibold">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 hover:bg-gray-100 rounded text-blue-600 font-semibold text-[10px]"
                        >
                          Inspect Metadata
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Metadata inspect column */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-1 space-y-4">
          {!selectedLog ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <Terminal className="text-gray-300 mb-2" size={32} />
              <h4 className="text-xs font-bold text-gray-400 uppercase">Inspect Metadata</h4>
              <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Select a log row and click "Inspect Metadata" to examine JSON inputs and payload records.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase">Log Payload</h3>
                  <span className="text-[9px] text-gray-500 font-semibold uppercase">{selectedLog.action}</span>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">System JSON Payload</span>
                <div className="bg-gray-950 text-emerald-400 p-4 rounded-xl font-mono text-[9px] overflow-auto max-h-[350px] leading-normal border border-gray-900">
                  <pre>{JSON.stringify(selectedLog.metadata || { message: 'No payload logged.' }, null, 2)}</pre>
                </div>
              </div>

              <div className="text-[9px] text-gray-400 flex items-center gap-1">
                <FileCode size={12} /> ID: {selectedLog.id}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
