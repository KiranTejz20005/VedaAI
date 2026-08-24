'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Building2,
  Users,
  Monitor,
  Database,
  Activity,
  Plus,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface SuperAdminStats {
  totalOrganizations: number;
  totalUsers: number;
  activeSessions: number;
  securityAlerts?: number;
  systemUptime: number | null;
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/super-admin/dashboard/stats');
      if (res.data?.success) {
        setData(res.data.data);
        setError(null);
      } else {
        setError('Failed to load dashboard');
      }
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const stats = data || {
    totalOrganizations: 0,
    totalUsers: 0,
    activeSessions: 0,
    securityAlerts: 0,
    systemUptime: 99.9,
  };

  const uptime = stats.systemUptime ?? 99.9;

  if (loading && !data) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col gap-6 text-slate-900 font-sans">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-8 w-64 rounded-xl" />
          <div className="skeleton h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Super Admin Control Plane
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Global Multi-Tenant Administration, Cluster Health, and Identity Gateway
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/system-health"
            className="px-4 py-2.5 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Telemetry Status</span>
          </Link>
          <Link
            href="/super-admin/organizations"
            className="px-4 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Organization</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: 'ORGANIZATIONS',
            value: stats.totalOrganizations,
            sub: 'Active educational institutions',
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            title: 'TOTAL IDENTITIES',
            value: stats.totalUsers,
            sub: 'Across all active tenants',
            icon: Users,
            color: 'text-[#e05934]',
            bg: 'bg-orange-50',
          },
          {
            title: 'ACTIVE SESSIONS',
            value: stats.activeSessions,
            sub: 'Live connected users',
            icon: Monitor,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            title: 'SYSTEM UPTIME',
            value: `${uptime}%`,
            sub: 'Service level agreement',
            icon: Database,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
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
                <div className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">{item.value}</div>
                <div className="text-xs text-neutral-500 font-medium mt-1">{item.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Control Plane Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Multi-Tenant Management',
            desc: 'Manage school and college organizations, provision new environments, and configure domain routing.',
            href: '/super-admin/organizations',
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            title: 'Global Security & Audit Logs',
            desc: 'Inspect tamper-evident system logs, track administrative operations, and monitor authentication anomalies.',
            href: '/super-admin/audit',
            icon: ShieldCheck,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
          },
          {
            title: 'System Telemetry & Health',
            desc: 'Monitor real-time server latency, Redis queue workers, database connection pools, and API throughput.',
            href: '/super-admin/system-health',
            icon: Activity,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            title: 'AI Model Gateway & Providers',
            desc: 'Configure generative AI model providers (Gemini, OpenAI, Anthropic), token rate limits, and fallback pipelines.',
            href: '/super-admin/ai',
            icon: Cpu,
            color: 'text-[#e05934]',
            bg: 'bg-orange-50',
          },
          {
            title: 'Enterprise Subscriptions',
            desc: 'Manage tenant licensing tiers, active seat allocations, feature flags, and institutional renewals.',
            href: '/super-admin/subscriptions',
            icon: Layers,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            title: 'Global User Directory',
            desc: 'Search, audit, and manage administrator and faculty accounts across all registered organizations.',
            href: '/super-admin/users',
            icon: Users,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.03 }}
              className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs hover:border-neutral-300 transition-all flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 group-hover:text-[#e05934] transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed mt-1">{card.desc}</p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <Link
                  href={card.href}
                  className="text-xs font-bold text-[#e05934] hover:underline flex items-center gap-1.5"
                >
                  <span>Open Control Panel</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
