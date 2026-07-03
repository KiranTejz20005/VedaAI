'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Building2,
  Users,
  Monitor,
  Database,
  History,
  Activity,
  ChevronRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';

interface SuperAdminStats {
  totalOrganizations: number;
  totalUsers: number;
  activeSessions: number;
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
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && !data) return <LoadingState lines={8} />;
  if (error && !data) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); loadData(); }} />;

  const stats = data || {
    totalOrganizations: 0,
    totalUsers: 0,
    activeSessions: 0,
    systemUptime: 99.9,
  };

  const uptime = stats.systemUptime ?? 99.9;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, marginBottom: 4 }}>Super Admin Dashboard</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Global System Control & Monitoring.</p>
      </div>

      {/* Top Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard
          icon={<Building2 size={16} color="#9CA3AF" />}
          label={'TOTAL\nORGANIZATIONS'}
          value={stats.totalOrganizations}
        />
        <MetricCard
          icon={<Users size={16} color="#9CA3AF" />}
          label="TOTAL USERS"
          value={stats.totalUsers}
        />
        <MetricCard
          icon={<Monitor size={16} color="#9CA3AF" />}
          label="ACTIVE SESSIONS"
          value={stats.activeSessions}
        />
        <MetricCard
          icon={<Database size={16} color="#9CA3AF" />}
          label="SYSTEM UPTIME"
          value={`${uptime}%`}
        />
      </div>

      {/* Action Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <ActionPanel
          icon={<History size={20} />}
          title="Audit Logs"
          description="View global system audit logs, track configuration changes, and monitor administrative actions across all tenants."
          linkText="View Global Logs"
          href="/dashboard/super-admin/audit"
        />
        <ActionPanel
          icon={<Building2 size={20} />}
          title="Tenant Management"
          description="Manage organization profiles, handle complex billing cycles, and provision new AI-powered learning environments."
          linkText="Manage Organizations"
          href="/dashboard/super-admin/organizations"
        />
        <ActionPanel
          icon={<Activity size={20} />}
          title="System Metrics"
          description="Real-time infrastructure health, API performance monitoring, and resource utilization analytics for the Vidya cluster."
          linkText="Detailed Metrics"
          href="/dashboard/super-admin/analytics"
        />
      </div>

      {/* Bottom Banner */}
      <div style={{
        background: '#000000',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        minHeight: 280,
      }}>
        <div style={{ padding: 48, zIndex: 10, maxWidth: '60%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', margin: 0, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Intelligent Infrastructure
          </h2>
          <p style={{ fontSize: 14, color: '#D1D5DB', margin: 0, marginBottom: 32, lineHeight: 1.6 }}>
            Vidya AI's core engine is distributed across multiple cloud providers to ensure 99.9% uptime and low-latency response for educators globally.
          </p>
          <button style={{
            background: '#FFFFFF',
            color: '#000000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}>
            Deploy New Cluster
          </button>
        </div>
        
        {/* Network Image Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: '40%',
          backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.5,
          maskImage: 'linear-gradient(to right, transparent, black 40%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)'
        }} />

        {/* Floating Plus Button */}
        <button style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#000000',
          color: '#FFFFFF',
          border: '2px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 20,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}

// ── Local Components ──

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 16,
      padding: '24px',
      border: '1px solid #F3F4F6',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em', whiteSpace: 'pre-line', lineHeight: 1.2 }}>
          {label}
        </span>
        {icon}
      </div>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#111827', lineHeight: 1, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function ActionPanel({ icon, title, description, linkText, href }: { icon: React.ReactNode; title: string; description: string; linkText: string; href: string }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 16,
      padding: '32px 24px',
      border: '1px solid #F3F4F6',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      height: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#374151',
        border: '1px solid #E5E7EB'
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.5, flex: 1 }}>
        {description}
      </p>
      <Link href={href} style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        color: '#111827',
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
        marginTop: 8,
        transition: 'background 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        {linkText}
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
