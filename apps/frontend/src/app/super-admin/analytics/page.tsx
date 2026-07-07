'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Building2, Users, FileText, School
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PlatformAnalytics {
  totals: {
    organizations: number;
    users: number;
    assessments: number;
    papers: number;
  };
  usageTrends: Array<{
    month: string;
    papers: number;
    users: number;
    assessments: number;
  }>;
  topOrganizations: Array<{
    id: string;
    name: string;
    code: string;
    papersCount: number;
    userCount: number;
    assessmentCount: number;
  }>;
}

export default function SuperAdminAnalytics() {
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/super-admin/analytics');
        if (res.data?.success) setData(res.data.data);
      } catch { toast.error('Failed to load analytics'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const d = data || {
    totals: { organizations: 0, users: 0, assessments: 0, papers: 0 },
    usageTrends: [],
    topOrganizations: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Platform Analytics</h2>
        <p className="text-gray-500 text-xs md:text-sm">High-level platform metrics, usage trends, and top performing organizations.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Organizations</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{d?.totals?.organizations || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Building2 size={22} /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Users</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{d?.totals?.users || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Users size={22} /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Assessments</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{d?.totals?.assessments || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><FileText size={22} /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Papers Generated</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{d?.totals?.papers || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><FileText size={22} /></div>
          </div>
        </div>
      </div>

      {/* Usage Trends Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Usage Trends</h3>
        {(!d?.usageTrends || d.usageTrends.length === 0) ? (
          <div className="text-center py-8 text-gray-400 text-xs">No trend data available yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Month</th>
                  <th className="py-2.5 text-center">Papers</th>
                  <th className="py-2.5 text-center">Users</th>
                  <th className="py-2.5 text-center">Assessments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(d?.usageTrends || []).map(t => (
                  <tr key={t.month} className="hover:bg-gray-50/50">
                    <td className="py-3 font-semibold text-gray-800">{t.month}</td>
                    <td className="py-3 text-center font-bold text-blue-600">{t.papers}</td>
                    <td className="py-3 text-center font-bold text-emerald-600">{t.users}</td>
                    <td className="py-3 text-center font-bold text-purple-600">{t.assessments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Organizations */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Top Organizations by Usage</h3>
        {(!d?.topOrganizations || d.topOrganizations.length === 0) ? (
          <div className="text-center py-8 text-gray-400 text-xs">No organization data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Organization</th>
                  <th className="py-2.5 text-center">Users</th>
                  <th className="py-2.5 text-center">Papers</th>
                  <th className="py-2.5 text-center">Assessments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(d?.topOrganizations || []).map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-semibold text-gray-800 flex items-center gap-2">
                      <School size={14} className="text-blue-600" /> {o.name}
                    </td>
                    <td className="py-3 text-center text-gray-600">{o.userCount}</td>
                    <td className="py-3 text-center text-blue-600 font-bold">{o.papersCount}</td>
                    <td className="py-3 text-center text-purple-600 font-bold">{o.assessmentCount}</td>
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
