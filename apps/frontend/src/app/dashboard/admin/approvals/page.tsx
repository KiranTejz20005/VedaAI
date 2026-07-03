'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Eye,
  Filter,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Zap,
  History,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { format } from 'date-fns';
import { EmptyState } from '@/design-system/EmptyState';

interface PendingApproval {
  id: string;
  title: string;
  subject: string;
  typeBreakdown: string | null;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ApprovalsOverview() {
  const { user } = useAuthStore();
  const { activeOrganizationId } = useAdminAuthStore();
  
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/approvals');
      if (res.data?.success) {
        setApprovals(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load pending approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (activeOrganizationId || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN')) {
      fetchApprovals();
    }
  }, [activeOrganizationId, user]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/admin/approvals/${id}/approve`);
      toast.success('Approved successfully');
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/admin/approvals/${id}/reject`, { reviewComments: 'Rejected by admin' });
      toast.success('Rejected successfully');
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const paginatedApprovals = approvals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(approvals.length / itemsPerPage);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-[120px]">
          <div className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">Pending Tasks</div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900">{approvals.length}</div>
            <div className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              +12% from yesterday
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-[120px]">
          <div className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">Faculty Pending</div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900">08</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-3">
              <div className="bg-gray-900 h-1 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-[120px]">
          <div className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">Student Apps</div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900">24</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-3">
              <div className="bg-gray-900 h-1 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Approvals Queue</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage pending system registrations and content.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <Filter size={16} /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
             <div className="flex flex-col items-center gap-2">
                <Loader2 size={32} className="animate-spin text-[#004EEB]" />
                <span className="text-gray-500 text-sm">Loading approvals...</span>
             </div>
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<CheckCircle2 size={40} />}
              title="All caught up!"
              description="There are no pending approvals in the queue right now."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-4 px-6 text-[13px] font-semibold text-gray-500">Request Type</th>
                  <th className="py-4 px-6 text-[13px] font-semibold text-gray-500">Requester</th>
                  <th className="py-4 px-6 text-[13px] font-semibold text-gray-500">Date</th>
                  <th className="py-4 px-6 text-[13px] font-semibold text-gray-500">Status</th>
                  <th className="py-4 px-6 text-[13px] font-semibold text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApprovals.map((item) => {
                  const author = item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : 'Unknown Faculty';
                  const initials = author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">Assessment Publication</div>
                            <div className="text-xs text-gray-500 mt-0.5">Topic: {item.subject || item.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                             {initials}
                           </div>
                           <div>
                             <div className="text-sm font-bold text-gray-900">{author}</div>
                             <div className="text-xs text-gray-500">Faculty Member</div>
                           </div>
                         </div>
                      </td>
                      <td className="py-4 px-6">
                         <div className="text-sm text-gray-900">{format(new Date(item.createdAt), 'MMM dd, yyyy')}</div>
                         <div className="text-xs text-gray-500 mt-0.5">{format(new Date(item.createdAt), 'hh:mm a')}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
                          PENDING
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => window.open(`/assignments/${item.id}`, '_blank')} className="p-2 text-gray-400 hover:text-gray-900 transition-colors" title="View Details">
                            <Eye size={18} />
                          </button>
                          <button onClick={() => handleApprove(item.id)} className="px-4 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors">
                            Approve
                          </button>
                          <button onClick={() => handleReject(item.id)} className="px-4 py-1.5 bg-white text-red-600 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination */}
            {approvals.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {Math.min(itemsPerPage, approvals.length - (currentPage - 1) * itemsPerPage)} of {approvals.length} pending requests
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center ${currentPage === idx + 1 ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {idx + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
             <Zap size={28} className="text-[#F97316]" fill="#F97316" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Smart Approval Assistant</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4 leading-relaxed max-w-xl">
              Vidya AI has scanned the queue. Based on institutional patterns, 12 student enrollments meet all automated criteria and are ready for bulk approval.
            </p>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors">
               <Zap size={16} fill="white" /> Bulk Approve Verified Items
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-900 text-[15px]">Recent Activity</h3>
             <History size={16} className="text-gray-400" />
           </div>
           <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                <div>
                  <div className="text-[13px] text-gray-900"><span className="font-bold">You</span> approved Student Bulk Upload</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">2 mins ago</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                <div>
                  <div className="text-[13px] text-gray-900"><span className="font-bold">You</span> rejected External Faculty App</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">15 mins ago</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 shrink-0"></div>
                <div>
                  <div className="text-[13px] text-gray-900"><span className="font-bold">Dr. Jenkins</span> signed off on analytics</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">1 hour ago</div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
