'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import {
  Building2,
  Users,
  FileText,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  ListChecks,
  DollarSign,
  GraduationCap,
  BookOpen,
  Loader2,
  Search,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { ActionCard } from '@/design-system/ActionCard';
import { Card } from '@/design-system/Card';
import { DataTable } from '@/design-system/DataTable';
import { Badge } from '@/design-system/Badge';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';

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

interface OrgUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface OrgDetail {
  id: string;
  name: string;
  code: string;
  status: string;
}

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const { availableOrganizations, fetchAvailableOrganizations } = useAdminAuthStore();
  const [data, setData] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Org Explorer State
  const [orgs, setOrgs] = useState<OrgDetail[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [orgUsersLoading, setOrgUsersLoading] = useState(false);
  const [userTab, setUserTab] = useState<'all' | 'student' | 'faculty'>('all');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, orgRes] = await Promise.all([
          api.get('/super-admin/dashboard'),
          api.get('/super-admin/organizations'),
        ]);
        if (dashRes.data?.success) setData(dashRes.data.data);
        else setError('Failed to load dashboard');
        if (orgRes.data?.success) {
          setOrgs(orgRes.data.data || []);
          if (orgRes.data.data?.length > 0) setSelectedOrgId(orgRes.data.data[0].id);
        }
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
    fetchAvailableOrganizations();
  }, [fetchAvailableOrganizations]);

  const loadOrgUsers = useCallback(async (orgId: string) => {
    setOrgUsersLoading(true);
    setOrgUsers([]);
    try {
      const res = await api.get(`/super-admin/organizations/${orgId}/users`);
      if (res.data?.success) {
        setOrgUsers(res.data.data || []);
      }
    } catch {
      setOrgUsers([]);
    } finally {
      setOrgUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedOrgId) loadOrgUsers(selectedOrgId);
  }, [selectedOrgId, loadOrgUsers]);

  if (loading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />;

  const stats = data || {
    totalOrganizations: 0, totalUsers: 0, activeUsers: 0, totalAssessments: 0, totalPapers: 0,
    revenue: { total: 0, monthly: 0 },
    recentOrganizations: [],
    health: { api: true, database: true, ai: true, storage: true }
  };

  const selectedOrg = orgs.find(o => o.id === selectedOrgId);

  const filteredUsers = orgUsers.filter(u => {
    const matchesTab =
      userTab === 'all' ? true :
      userTab === 'student' ? (u.role === 'STUDENT') :
      ['FACULTY', 'TEACHER'].includes(u.role);
    const matchesSearch = !userSearch ||
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const studentCount = orgUsers.filter(u => u.role === 'STUDENT').length;
  const facultyCount = orgUsers.filter(u => ['FACULTY', 'TEACHER'].includes(u.role)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader
          title="Super Admin Dashboard"
          subtitle={`Welcome back, ${user?.firstName || 'Super Admin'}. Platform overview at a glance.`}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#D1FAE5', border: '1px solid #A7F3D0', color: '#065F46', padding: '8px 14px', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0 }}>
          <ShieldCheck size={16} />
          <span>All Systems Operational</span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 12,
      }}>
        <MetricCard
          icon={<Building2 size={18} />}
          label="Total Organizations"
          value={stats.totalOrganizations}
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Total Users"
          value={stats.totalUsers}
          description={`Active: ${stats.activeUsers}`}
        />
        <MetricCard
          icon={<FileText size={18} />}
          label="Total Assessments"
          value={stats.totalAssessments}
          description={`Papers: ${stats.totalPapers}`}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label="Revenue"
          value={`$${stats.revenue.total.toFixed(2)}`}
          description={`Monthly: $${stats.revenue.monthly.toFixed(2)}`}
        />
      </div>

      {/* ── Organization Explorer ── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #F3F4F6',
          background: '#FAFAFA',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Organization Explorer</h3>
              <p style={{ fontSize: 11, color: '#6B7280', margin: 0, marginTop: 1 }}>Select an organization to view its students and faculty</p>
            </div>
          </div>
          <Link href="/super-admin/organizations" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#7C3AED', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, border: '1px solid #DDD6FE', background: '#F5F3FF' }}>
            Manage Organizations <ChevronRight size={13} />
          </Link>
        </div>

        {/* Org Tabs */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid #E5E7EB', padding: '0 16px' }}>
          {orgs.length === 0 ? (
            <div style={{ padding: '16px 0', fontSize: 13, color: '#9CA3AF' }}>No organizations found</div>
          ) : orgs.map(org => {
            const isSelected = org.id === selectedOrgId;
            return (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedOrgId(org.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '12px 18px',
                  border: 'none',
                  borderBottom: isSelected ? '2px solid #7C3AED' : '2px solid transparent',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#7C3AED' : '#6B7280',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 6, background: isSelected ? '#7C3AED' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: isSelected ? '#fff' : '#6B7280' }}>
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {org.name}
                <span style={{ fontSize: 10, background: org.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2', color: org.status === 'ACTIVE' ? '#065F46' : '#B91C1C', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                  {org.status}
                </span>
              </button>
            );
          })}
        </div>

        {/* Users Panel */}
        {selectedOrg && (
          <div style={{ padding: 20 }}>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Members', value: orgUsersLoading ? '…' : orgUsers.length, icon: <Users size={16} />, color: '#7C3AED', bg: '#F5F3FF' },
                { label: 'Students', value: orgUsersLoading ? '…' : studentCount, icon: <GraduationCap size={16} />, color: '#059669', bg: '#ECFDF5' },
                { label: 'Faculty', value: orgUsersLoading ? '…' : facultyCount, icon: <BookOpen size={16} />, color: '#D97706', bg: '#FFFBEB' },
              ].map(({ label, value, icon, color, bg }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: bg, borderRadius: 10, border: `1px solid ${color}22` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{value}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {/* Tab pills */}
              <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                {(['all', 'student', 'faculty'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setUserTab(tab)}
                    style={{
                      padding: '5px 14px',
                      border: 'none',
                      borderRadius: 6,
                      background: userTab === tab ? '#FFFFFF' : 'transparent',
                      color: userTab === tab ? '#111827' : '#6B7280',
                      fontSize: 12,
                      fontWeight: userTab === tab ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: userTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab === 'all' ? `All (${orgUsers.length})` : tab === 'student' ? `Students (${studentCount})` : `Faculty (${facultyCount})`}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: 32,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#111827',
                    background: '#FAFAFA',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => loadOrgUsers(selectedOrgId!)}
                style={{ padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'inherit' }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {/* Users list */}
            {orgUsersLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10, color: '#9CA3AF' }}>
                <Loader2 size={20} className="animate-spin" />
                <span style={{ fontSize: 13 }}>Loading members…</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
                <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: 13, margin: 0 }}>No {userTab !== 'all' ? userTab + 's' : 'members'} found{userSearch ? ` matching "${userSearch}"` : ''}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: 0, padding: '9px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['Name', 'Email', 'Role', 'Status'].map(col => (
                    <span key={col} style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</span>
                  ))}
                </div>
                {filteredUsers.map((u, idx) => {
                  const isStudent = u.role === 'STUDENT';
                  const isFaculty = ['FACULTY', 'TEACHER'].includes(u.role);
                  const roleColor = isStudent ? '#059669' : isFaculty ? '#D97706' : '#7C3AED';
                  const roleBg = isStudent ? '#ECFDF5' : isFaculty ? '#FFFBEB' : '#F5F3FF';

                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 2fr 1fr 1fr',
                        gap: 0,
                        padding: '11px 16px',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                        alignItems: 'center',
                        transition: 'background 0.1s',
                      }}
                    >
                      {/* Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${roleColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: roleColor, flexShrink: 0 }}>
                          {u.firstName?.charAt(0)?.toUpperCase()}{u.lastName?.charAt(0)?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                      {/* Email */}
                      <span style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                      {/* Role badge */}
                      <span style={{ fontSize: 10, fontWeight: 700, background: roleBg, color: roleColor, padding: '3px 8px', borderRadius: 10, display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {u.role}
                      </span>
                      {/* Status */}
                      <span style={{ fontSize: 10, fontWeight: 700, background: u.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2', color: u.status === 'ACTIVE' ? '#065F46' : '#B91C1C', padding: '3px 8px', borderRadius: 10, display: 'inline-block' }}>
                        {u.status || 'ACTIVE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Revenue Trend
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160 }}>
            {[20, 40, 30, 70, 50, 80, 90, 65, 85, 95, 75, 100].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: 'var(--brand)', borderRadius: '4px 4px 0 0', height: `${h}px`, opacity: 0.5 + (h / 200) }} />
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ActionCard
              icon={<Building2 size={16} />}
              label="Create Organization"
              href="/super-admin/organizations"
              variant="primary"
            />
            <ActionCard
              icon={<ListChecks size={16} />}
              label="View Audit Logs"
              href="/super-admin/audit"
            />
            <ActionCard
              icon={<BarChart3 size={16} />}
              label="View Analytics"
              href="/super-admin/analytics"
              variant="primary"
            />
          </div>
        </Card>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Organizations
            </h3>
            <Link href="/super-admin/organizations" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <DataTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'code', header: 'Code' },
              {
                key: 'status',
                header: 'Status',
                render: (value: string) => (
                  <Badge variant={value === 'ACTIVE' ? 'success' : 'error'}>{value}</Badge>
                ),
              },
              { key: 'subscriptionPlan', header: 'Plan' },
              {
                key: '_count',
                header: 'Users',
                align: 'right',
                render: (_: any, row: any) => row._count?.users || 0,
              },
            ]}
            data={stats.recentOrganizations}
            emptyMessage="No organizations yet"
          />
        </Card>

        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Platform Health
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'API Service', key: 'api' as const },
              { label: 'Database', key: 'database' as const },
              { label: 'AI Engine', key: 'ai' as const },
              { label: 'Storage', key: 'storage' as const },
            ].map(({ label, key }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                <Badge variant={stats.health[key] ? 'success' : 'error'}>
                  {stats.health[key] ? 'Operational' : 'Down'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
