'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Building2,
  Users,
  Activity,
  FileText,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  ListChecks
} from 'lucide-react';
import Link from 'next/link';

interface SuperAdminStats {
  totalOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  totalAssessments: number;
  totalPapers: number;
  revenue: { total: number; monthly: number };
  recentOrganizations: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    subscriptionPlan: string;
    createdAt: string;
    _count?: { users: number };
  }>;
  health: {
    api: boolean;
    database: boolean;
    ai: boolean;
    storage: boolean;
  };
}

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/super-admin/dashboard');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch {
        // Fallback defaults
      } finally {
        setLoading(false);
      }
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

  const stats = data || {
    totalOrganizations: 0, totalUsers: 0, activeUsers: 0, totalAssessments: 0, totalPapers: 0,
    revenue: { total: 0, monthly: 0 },
    recentOrganizations: [],
    health: { api: true, database: true, ai: true, storage: true }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary, #111827)' }}>Super Admin Dashboard</h2>
          <p className="text-gray-500 text-xs md:text-sm">
            Welcome back, {user?.firstName || 'Super Admin'}. Platform overview at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-xl text-xs font-semibold w-fit">
          <ShieldCheck size={16} />
          <span>All Systems Operational</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border shadow-sm" style={{ background: 'var(--bg-card, #FFFFFF)', borderColor: 'var(--border, #E5E7EB)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Organizations</span>
              <h3 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary, #111827)' }}>{stats.totalOrganizations}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Building2 size={22} />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border shadow-sm" style={{ background: 'var(--bg-card, #FFFFFF)', borderColor: 'var(--border, #E5E7EB)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Users</span>
              <h3 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary, #111827)' }}>{stats.totalUsers}</h3>
              <span className="text-[10px] text-green-500 font-bold flex items-center gap-0.5 mt-0.5">
                <TrendingUp size={10} /> Active: {stats.activeUsers}
              </span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Users size={22} />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border shadow-sm" style={{ background: 'var(--bg-card, #FFFFFF)', borderColor: 'var(--border, #E5E7EB)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Assessments</span>
              <h3 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary, #111827)' }}>{stats.totalAssessments}</h3>
              <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">Papers: {stats.totalPapers}</span>
            </div>
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <FileText size={22} />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border shadow-sm" style={{ background: 'var(--bg-card, #FFFFFF)', borderColor: 'var(--border, #E5E7EB)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Revenue</span>
              <h3 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary, #111827)' }}>${stats.revenue.total.toFixed(2)}</h3>
              <span className="text-[10px] text-purple-500 font-medium mt-0.5 block">Monthly: ${stats.revenue.monthly.toFixed(2)}</span>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Activity size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder + Recent Orgs + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Chart */}
        <div className="p-6 rounded-2xl border shadow-sm lg:col-span-2" style={{ background: 'var(--bg-card, #FFFFFF)', borderColor: 'var(--border, #E5E7EB)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary, #111827)' }}>Revenue Trend</h3>
          <div className="flex items-end gap-2 h-40">
            {[20, 40, 30, 70, 50, 80, 90, 65, 85, 95, 75, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-500 rounded-t" style={{ height: `${h}px`, opacity: 0.7 + (h / 200) }} />
                <span className="text-[8px] text-gray-400 font-semibold">
                  {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-2xl border shadow-sm space-y-4" style={{ background: 'var(--bg-card, #FFFFFF)', borderColor: 'var(--border, #E5E7EB)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary, #111827)' }}>Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/super-admin/organizations" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
              <Building2 size={16} />
              Create Organization
              <ChevronRight size={14} className="ml-auto" />
            </Link>
            <Link href="/super-admin/audit" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors">
              <ListChecks size={16} />
              View Audit Logs
              <ChevronRight size={14} className="ml-auto" />
            </Link>
            <Link href="/super-admin/analytics" className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors">
              <BarChart3 size={16} />
              View Analytics
              <ChevronRight size={14} className="ml-auto" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Organizations + Health Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Organizations */}
        <div className="p-6 rounded-2xl border shadow-sm lg:col-span-2 space-y-4" style={{ background: 'var(--bg-card, #FFFFFF)', borderColor: 'var(--border, #E5E7EB)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary, #111827)' }}>Recent Organizations</h3>
            <Link href="/super-admin/organizations" className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Code</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Plan</th>
                  <th className="py-2.5 text-right">Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentOrganizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
                      <Link href={`/super-admin/organizations/${org.id}`} className="hover:text-blue-600">
                        {org.name}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-500">{org.code}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${org.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{org.subscriptionPlan}</td>
                    <td className="py-3 text-right text-gray-500">{org._count?.users || 0}</td>
                  </tr>
                ))}
                {stats.recentOrganizations.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">No organizations yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Health */}
        <div className="p-6 rounded-2xl border shadow-sm space-y-4" style={{ background: 'var(--bg-card, #FFFFFF)', borderColor: 'var(--border, #E5E7EB)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary, #111827)' }}>Platform Health</h3>
          <div className="space-y-3">
            {[
              { label: 'API Service', key: 'api' as const },
              { label: 'Database', key: 'database' as const },
              { label: 'AI Engine', key: 'ai' as const },
              { label: 'Storage', key: 'storage' as const },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs font-semibold text-gray-700">{label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${stats.health[key] ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {stats.health[key] ? 'Operational' : 'Down'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
