'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Building2,
  Users,
  FileText,
  School,
  TrendingUp,
  Award,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading && !data) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col gap-6 text-slate-900 font-sans">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const d = data || {
    totals: { organizations: 0, users: 0, assessments: 0, papers: 0 },
    usageTrends: [],
    topOrganizations: [],
  };

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Platform Analytics & Usage
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Global aggregate metrics, content generation throughput, and institution rankings
          </p>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: 'ORGANIZATIONS',
            value: d.totals.organizations,
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            sub: 'Active school & college tenants',
          },
          {
            title: 'TOTAL USERS',
            value: d.totals.users,
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            sub: 'Enrolled students and faculty',
          },
          {
            title: 'ASSESSMENTS',
            value: d.totals.assessments,
            icon: BarChart3,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            sub: 'Examinations scheduled & scored',
          },
          {
            title: 'PAPERS GENERATED',
            value: d.totals.papers,
            icon: FileText,
            color: 'text-[#e05934]',
            bg: 'bg-orange-50',
            sub: 'AI curriculum blueprints & papers',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">{item.title}</span>
                <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {item.value.toLocaleString()}
                </div>
                <div className="text-xs text-neutral-500 font-medium mt-1">{item.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Usage Trends Chart */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Ecosystem Growth & Generation Trends</h3>
            <p className="text-xs text-neutral-400">Monthly breakdown of assessments, AI papers, and user onboarding</p>
          </div>
        </div>

        {d.usageTrends.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">No trend data available yet.</div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.usageTrends}>
                <defs>
                  <linearGradient id="papersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e05934" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#e05934" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="assessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="papers"
                  name="Papers Generated"
                  stroke="#e05934"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#papersGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="assessments"
                  name="Assessments Created"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#assessGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Organizations Leaderboard */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Top Institutional Tenants by Activity</h3>
            <p className="text-xs text-neutral-400">Ranked by volume of active learners and generated exam artifacts</p>
          </div>
        </div>

        {d.topOrganizations.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">No organization data recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3.5 px-6">Rank</th>
                  <th className="py-3.5 px-6">Institution</th>
                  <th className="py-3.5 px-6">Code</th>
                  <th className="py-3.5 px-6 text-center">Active Learners</th>
                  <th className="py-3.5 px-6 text-center">Papers Produced</th>
                  <th className="py-3.5 px-6 text-center">Assessments Scored</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {d.topOrganizations.map((org, index) => (
                  <tr key={org.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-extrabold text-neutral-900">
                      {index === 0 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 inline-flex items-center justify-center font-black">
                          1
                        </span>
                      ) : index === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 inline-flex items-center justify-center font-black">
                          2
                        </span>
                      ) : index === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 inline-flex items-center justify-center font-black">
                          3
                        </span>
                      ) : (
                        <span className="text-neutral-500 pl-2">{index + 1}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-neutral-900 flex items-center gap-2">
                      <School className="w-4 h-4 text-neutral-400" />
                      <span>{org.name}</span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-neutral-600 font-semibold">{org.code}</td>
                    <td className="py-3.5 px-6 text-center font-semibold text-neutral-700">
                      {org.userCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-center font-extrabold text-[#e05934]">
                      {org.papersCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-center font-extrabold text-purple-700">
                      {org.assessmentCount.toLocaleString()}
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
