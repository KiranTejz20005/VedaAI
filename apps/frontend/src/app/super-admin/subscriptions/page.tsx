'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Building2, Filter, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/format';

interface OrgSubscription {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  plan: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function SuperAdminSubscriptions() {
  const [list, setList] = useState<OrgSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/billing/subscriptions');
      if (res.data?.success) setList(res.data.data);
    } catch { toast.error('Failed to load subscriptions'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const handleChangePlan = async (orgId: string, orgName: string, newPlan: string) => {
    if (!confirm(`Change ${orgName}'s plan to ${newPlan}?`)) return;
    try {
      const res = await api.put(`/admin/billing/subscriptions/${orgId}`, { plan: newPlan });
      if (res.data?.success) { toast.success(`${orgName} plan changed to ${newPlan}`); load(); }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Plan change failed'); }
  };

  const PLANS = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

  const filtered = list.filter(s => !planFilter || s.plan === planFilter);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Subscription Management</h2>
        <p className="text-gray-500 text-xs md:text-sm">View and manage subscription plans across all organizations.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <div className="flex gap-1">
            {['', ...PLANS].map(p => (
              <button key={p || 'all'} onClick={() => setPlanFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${planFilter === p ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                {p || 'All Plans'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No subscriptions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Organization</th>
                  <th className="py-2.5">Code</th>
                  <th className="py-2.5">Plan</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Expires</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-bold text-gray-800 flex items-center gap-1.5">
                      <Building2 size={14} className="text-blue-600" />
                      <Link href={`/super-admin/organizations/${sub.organizationId}`} className="hover:text-blue-600">{sub.organizationName}</Link>
                    </td>
                    <td className="py-3 text-gray-500">{sub.organizationCode}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        sub.plan === 'FREE' ? 'bg-gray-100 text-gray-700' :
                        sub.plan === 'STARTER' ? 'bg-blue-50 text-blue-700' :
                        sub.plan === 'PRO' ? 'bg-purple-50 text-purple-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${sub.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">{sub.expiresAt ? formatDate(sub.expiresAt) : 'N/A'}</td>
                    <td className="py-3 text-right">
                      <div className="relative inline-block text-left group">
                        <button className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-1 px-3 rounded-lg text-[10px] flex items-center gap-1">
                          Change Plan <ChevronRight size={12} />
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-10 hidden group-hover:block">
                          {PLANS.filter(p => p !== sub.plan).map(plan => (
                            <button key={plan} onClick={() => handleChangePlan(sub.organizationId, sub.organizationName, plan)}
                              className="block w-full text-left px-3 py-1.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl">
                              {plan}
                            </button>
                          ))}
                        </div>
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
  );
}
