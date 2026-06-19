'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  ListChecks, 
  RefreshCw, 
  ShieldAlert, 
  Zap, 
  Clock, 
  CheckCircle,
  FileCode,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QueueStats {
  generation: {
    active: number;
    waiting: number;
    failed: number;
    completed: number;
    delayed: number;
  };
  pdf: {
    active: number;
    waiting: number;
    failed: number;
    completed: number;
    delayed: number;
  };
}

interface FailedJob {
  id: string;
  name: string;
  queue: string;
  data: any;
  failedReason: string;
  stacktrace: string[];
  timestamp: string;
}

export default function QueuesAdmin() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Retry job loading indicator state
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);

  // Stacktrace inspection state
  const [selectedJob, setSelectedJob] = useState<FailedJob | null>(null);

  useEffect(() => {
    loadQueues();
  }, []);

  const loadQueues = async () => {
    try {
      setLoading(true);
      const [healthRes, failedRes] = await Promise.all([
        api.get('/admin/queues/health'),
        api.get('/admin/queues/failed'),
      ]);

      if (healthRes.data?.success) setStats(healthRes.data.data);
      if (failedRes.data?.success) setFailedJobs(failedRes.data.data);
    } catch (err) {
      toast.error('Failed to query BullMQ queue health');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async (queueName: string, jobId: string) => {
    try {
      setRetryingJobId(jobId);
      const res = await api.post('/admin/queues/retry', { queueName, jobId });
      
      if (res.data?.success) {
        toast.success(`Job ${jobId} successfully resubmitted to the ${queueName} queue.`);
        loadQueues();
        if (selectedJob?.id === jobId) setSelectedJob(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Retry request failed');
    } finally {
      setRetryingJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Queue Management</h2>
          <p className="text-gray-500 text-xs md:text-sm">Monitor active BullMQ workers, debug exceptions, and retry failed paper creations.</p>
        </div>
        <button
          onClick={loadQueues}
          className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <RefreshCw size={14} /> Refresh Dashboard
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main dashboard stats columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats count boxes */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Generation Queue card */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <strong className="text-xs font-bold text-gray-800 uppercase tracking-wider block">Paper Generator Queue</strong>
                    <span className="text-[9px] text-gray-400 font-bold">BULLMQ</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                      <span className="text-blue-600 text-[10px] font-bold block">Active</span>
                      <strong className="text-sm font-bold text-blue-900">{stats.generation.active}</strong>
                    </div>
                    <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                      <span className="text-amber-600 text-[10px] font-bold block">Waiting</span>
                      <strong className="text-sm font-bold text-amber-900">{stats.generation.waiting}</strong>
                    </div>
                    <div className="bg-red-50/50 p-2 rounded-xl border border-red-100">
                      <span className="text-red-600 text-[10px] font-bold block">Failed</span>
                      <strong className="text-sm font-bold text-red-900">{stats.generation.failed}</strong>
                    </div>
                  </div>
                </div>

                {/* PDF Compositor Queue card */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <strong className="text-xs font-bold text-gray-800 uppercase tracking-wider block">PDF Composer Queue</strong>
                    <span className="text-[9px] text-gray-400 font-bold">BULLMQ</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                      <span className="text-blue-600 text-[10px] font-bold block">Active</span>
                      <strong className="text-sm font-bold text-blue-900">{stats.pdf.active}</strong>
                    </div>
                    <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                      <span className="text-amber-600 text-[10px] font-bold block">Waiting</span>
                      <strong className="text-sm font-bold text-amber-900">{stats.pdf.waiting}</strong>
                    </div>
                    <div className="bg-red-50/50 p-2 rounded-xl border border-red-100">
                      <span className="text-red-600 text-[10px] font-bold block">Failed</span>
                      <strong className="text-sm font-bold text-red-900">{stats.pdf.failed}</strong>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* DLQ Failed Jobs List */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Dead Letter Queue (Failed Jobs)</h3>
                <p className="text-gray-400 text-[10px]">Inspect runtime errors and resubmit jobs to work executors.</p>
              </div>

              {failedJobs.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">Dead Letter Queue is clear. No failed jobs recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5">Job Detail</th>
                        <th className="py-2.5">Error Reason</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {failedJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3">
                            <strong className="text-gray-800 font-bold block">{job.name}</strong>
                            <div className="text-[9px] text-gray-400 mt-0.5">
                              Queue: <span className="uppercase font-bold text-blue-600">{job.queue}</span> | ID: {job.id}
                            </div>
                          </td>
                          <td className="py-3 max-w-[200px] truncate text-red-600 font-semibold pr-2">
                            {job.failedReason}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedJob(job)}
                                className="px-2 py-1 hover:bg-gray-100 border border-gray-200 rounded-lg text-[9px] text-gray-700"
                              >
                                Debug
                              </button>
                              <button
                                onClick={() => handleRetryJob(job.queue, job.id)}
                                disabled={retryingJobId === job.id}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-[9px] flex items-center gap-1 disabled:opacity-50"
                              >
                                {retryingJobId === job.id ? (
                                  <>
                                    <RefreshCw size={11} className="animate-spin" /> Retrying...
                                  </>
                                ) : (
                                  <>
                                    <Zap size={11} /> Retry Job
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Job inspector Column */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1 space-y-4">
            {!selectedJob ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                <ListChecks className="text-gray-300 mb-2" size={32} />
                <h4 className="text-xs font-bold text-gray-400 uppercase">Job Debug Inspector</h4>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Select a failed job row and click "Debug" to view trace details and runtime logs.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase">Error Diagnostics</h3>
                    <span className="text-[9px] text-gray-500 font-semibold uppercase">{selectedJob.name} ({selectedJob.id})</span>
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Error Reason</span>
                    <p className="text-xs font-semibold text-red-600 mt-0.5 leading-relaxed bg-red-50 p-3 border border-red-100 rounded-xl">
                      {selectedJob.failedReason}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Failed Payload Data</span>
                    <div className="bg-gray-900 text-gray-300 p-3 rounded-xl font-mono text-[9px] overflow-auto max-h-[140px] border border-gray-950">
                      <pre>{JSON.stringify(selectedJob.data, null, 2)}</pre>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Stacktrace Trace logs</span>
                    <div className="bg-gray-950 text-red-400 p-3 rounded-xl font-mono text-[9px] overflow-auto max-h-[160px] border border-gray-900 leading-relaxed">
                      {selectedJob.stacktrace.map((st, index) => (
                        <div key={index} className="py-0.5 truncate">{st}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRetryJob(selectedJob.queue, selectedJob.id)}
                  disabled={retryingJobId === selectedJob.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs transition-colors shadow-sm mt-4 flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Zap size={14} /> Re-queue this job
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
