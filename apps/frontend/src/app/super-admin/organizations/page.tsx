'use client';
import { NativeSelect } from '@/components/ui/native-select';


import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Building2, Plus, Edit3, Trash2, Power, Search, Mail, Phone, MapPin,
  Users, X, Loader2, GraduationCap, BookOpen, ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/PageHeader';
import { DataTable } from '@/design-system/DataTable';
import { Badge } from '@/design-system/Badge';
import { Dialog } from '@/design-system/Dialog';
import { Button } from '@/design-system/Button';
import { Input } from '@/design-system/Input';
import { Select } from '@/design-system/Select';
import { EmptyState } from '@/design-system/EmptyState';
import { LoadingState } from '@/design-system/LoadingState';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { useAuthStore } from '@/store/auth.store';

interface Organization {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  subscriptionPlan: string;
  createdAt: string;
  _count?: { users: number };
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

const ROLE_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  STUDENT:     { label: 'Student',     color: '#059669', bg: '#ECFDF5', icon: <GraduationCap size={11} /> },
  FACULTY:     { label: 'Faculty',     color: '#D97706', bg: '#FFFBEB', icon: <BookOpen size={11} /> },
  TEACHER:     { label: 'Faculty',     color: '#D97706', bg: '#FFFBEB', icon: <BookOpen size={11} /> },
  ADMIN:       { label: 'Admin',       color: '#7C3AED', bg: '#F5F3FF', icon: <ShieldCheck size={11} /> },
  SUPER_ADMIN: { label: 'Super Admin', color: '#DC2626', bg: '#FEF2F2', icon: <ShieldCheck size={11} /> },
};

function getRoleMeta(role: string) {
  return ROLE_META[role] || { label: role, color: '#6B7280', bg: '#F3F4F6', icon: <Users size={11} /> };
}

export default function SuperAdminOrganizations() {
  const [list, setList] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { fetchAvailableOrganizations, switchOrganization, setOriginalAdminToken, originalAdminToken } = useAdminAuthStore();
  const { accessToken } = useAuthStore();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Users slide-over panel
  const [usersPanel, setUsersPanel] = useState<{ org: Organization } | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [orgUsersLoading, setOrgUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/organizations');
      if (res.data?.success) setList(res.data.data);
    } catch { toast.error('Failed to load organizations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openUsersPanel = useCallback(async (org: Organization) => {
    setUsersPanel({ org });
    setUserSearch('');
    setRoleFilter('');
    setOrgUsers([]);
    setOrgUsersLoading(true);
    try {
      const res = await api.get(`/super-admin/organizations/${org.id}/users`);
      if (res.data?.success) setOrgUsers(res.data.data || []);
    } catch { toast.error('Failed to load users'); }
    finally { setOrgUsersLoading(false); }
  }, []);

  const openCreate = () => {
    setModalType('create'); setSelectedId(null);
    setName(''); setCode(''); setEmail(''); setPhone(''); setAddress(''); setAdminEmail('');
    setShowModal(true);
  };

  const openEdit = (org: Organization & { users?: { email: string }[] }) => {
    setModalType('edit'); setSelectedId(org.id);
    setName(org.name); setCode(org.code);
    setEmail(org.email || ''); setPhone(org.phone || ''); setAddress(org.address || '');
    setAdminEmail(org.users?.[0]?.email || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) { toast.error('Name and Code are required.'); return; }
    try {
      if (modalType === 'create') {
        const res = await api.post('/super-admin/organizations', { name, code, email, phone, address, adminEmail });
        if (res.data?.success) { toast.success('Organization created!'); setShowModal(false); load(); fetchAvailableOrganizations(); }
      } else {
        const res = await api.post(`/super-admin/organizations/${selectedId}/update`, { name, code, email, phone, address, adminEmail });
        if (res.data?.success) { toast.success('Organization updated!'); setShowModal(false); load(); if (typeof fetchAvailableOrganizations === 'function') fetchAvailableOrganizations(); }
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this organization? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/super-admin/organizations/${id}`);
      if (res.data?.success) { toast.success('Organization deleted.'); load(); fetchAvailableOrganizations(); }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Delete failed'); }
  };

  const handleToggleSuspend = async (org: Organization) => {
    const isSuspended = org.status === 'SUSPENDED';
    if (!confirm(`Are you sure you want to ${isSuspended ? 'activate' : 'suspend'} ${org.name}?`)) return;
    try {
      const res = await api.post(`/super-admin/organizations/${org.id}/suspend`, { action: isSuspended ? 'activate' : 'suspend' });
      if (res.data?.success) { toast.success(`Organization ${isSuspended ? 'activated' : 'suspended'}.`); load(); fetchAvailableOrganizations(); }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to update status'); }
  };

  const filtered = list.filter(org => {
    const matchSearch = org.name.toLowerCase().includes(search.toLowerCase()) || org.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || org.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredUsers = orgUsers.filter(u => {
    const matchSearch = !userSearch || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter || (roleFilter === 'FACULTY' && u.role === 'TEACHER');
    return matchSearch && matchRole;
  });

  const studentCount = orgUsers.filter(u => u.role === 'STUDENT').length;
  const facultyCount = orgUsers.filter(u => ['FACULTY', 'TEACHER'].includes(u.role)).length;
  const adminCount = orgUsers.filter(u => ['ADMIN', 'SUPER_ADMIN'].includes(u.role)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader title="Organizations" subtitle="Manage all tenant organizations on the platform." />
        <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
          Create Organization
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Input icon={<Search size={16} />} placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'SUSPENDED', label: 'Suspended' }, { value: 'INACTIVE', label: 'Inactive' }]} />
      </div>

      {loading ? (
        <LoadingState lines={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Building2 size={32} />} title="No organizations found" description="Try adjusting your search or create a new organization." action={search || statusFilter ? undefined : openCreate} actionLabel={search || statusFilter ? undefined : 'Create Organization'} />
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (_: any, row: Organization) => (
              <button onClick={async () => {
                try {
                  if (!originalAdminToken && accessToken) {
                    setOriginalAdminToken(accessToken);
                  }
                  const success = await switchOrganization(row.id);
                  if (success) {
                    toast.success(`Switched to ${row.name}`);
                    window.location.href = '/dashboard/admin';
                  } else {
                    toast.error('Failed to switch organization');
                  }
                } catch {
                  toast.error('Error switching organization');
                }
              }} style={{ fontWeight: 700, color: 'var(--brand)', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0 }}>
                <Building2 size={14} color="var(--brand)" />{row.name}
              </button>
            )},
            { key: 'code', header: 'Code' },
            { key: 'status', header: 'Status', render: (value: string) => (
              <Badge variant={value === 'ACTIVE' ? 'success' : value === 'SUSPENDED' ? 'error' : 'draft'}>{value}</Badge>
            )},
            { key: 'subscriptionPlan', header: 'Plan' },
            {
              key: '_count', header: 'Users', align: 'center',
              render: (_: any, row: Organization) => (
                <button
                  type="button"
                  onClick={() => openUsersPanel(row)}
                  title={`View ${row._count?.users ?? 0} users in ${row.name}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px', borderRadius: 20,
                    border: '1.5px solid #E5E7EB', background: '#F9FAFB',
                    cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#374151',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#1D4ED8'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
                >
                  <Users size={13} />
                  {row._count?.users ?? 0}
                </button>
              )
            },
            { key: 'createdAt', header: 'Created', render: (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
            { key: 'id', header: 'Actions', align: 'right', render: (_: any, row: Organization) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                <Button variant="ghost" size="sm" icon={<Edit3 size={14} />} onClick={() => openEdit(row)} />
                <Button variant="ghost" size="sm" icon={<Power size={14} />} onClick={() => handleToggleSuspend(row)} />
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(row.id)} />
              </div>
            )},
          ]}
          data={filtered}
        />
      )}

      {/* Create / Edit org dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} title={modalType === 'create' ? 'Create Organization' : 'Edit Organization'} size="sm">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Name *" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme University" />
            <Input label="Code *" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. ACME" />
          </div>
          <Input label="Admin Email" icon={<Mail size={14} />} type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@organization.com" />
          <Input label="General Email" icon={<Mail size={14} />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@organization.com" />
          <Input label="Phone" icon={<Phone size={14} />} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1-555-1234" />
          <Input label="Address" icon={<MapPin size={14} />} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }} type="button">Cancel</Button>
            <Button variant="primary" style={{ flex: 1 }} type="submit">
              {modalType === 'create' ? 'Create Organization' : 'Update Organization'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ── Users Slide-over Panel ── */}
      {usersPanel && (
        <>
          <div
            onClick={() => setUsersPanel(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', zIndex: 48, animation: 'fadeInBg 0.2s ease' }}
          />

          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 'min(480px, 95vw)',
            background: '#FFFFFF',
            boxShadow: '-6px 0 40px rgba(0,0,0,0.14)',
            zIndex: 49,
            display: 'flex', flexDirection: 'column',
            animation: 'slideInFromRight 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}>

            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={17} color="#fff" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0 }}>{usersPanel.org.name}</h2>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, marginTop: 1 }}>
                    Code: {usersPanel.org.code} &nbsp;·&nbsp; {usersPanel.org.status}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setUsersPanel(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
                <X size={15} />
              </button>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
              {[
                { label: 'Students', value: studentCount, color: '#059669', bg: '#F0FDF4' },
                { label: 'Faculty',  value: facultyCount, color: '#D97706', bg: '#FFFBEB' },
                { label: 'Admins',   value: adminCount,   color: '#7C3AED', bg: '#F5F3FF' },
              ].map(({ label, value, color, bg }, i) => (
                <div key={label} style={{ padding: '12px 0', background: bg, borderRight: i < 2 ? '1px solid #E5E7EB' : 'none', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{orgUsersLoading ? '—' : value}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Search + role filter */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 8, flexShrink: 0 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  autoFocus
                  style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, color: '#111827', background: '#FAFAFA', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <NativeSelect
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                style={{ padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, color: '#374151', background: '#FAFAFA', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="FACULTY">Faculty</option>
                <option value="ADMIN">Admins</option>
              </NativeSelect>
            </div>

            {/* User cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orgUsersLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: '#9CA3AF' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 13 }}>Loading members…</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                  <Users size={34} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p style={{ fontSize: 13, margin: 0, fontWeight: 600, color: '#6B7280' }}>No users found</p>
                  {(userSearch || roleFilter) && <p style={{ fontSize: 11, margin: '4px 0 0' }}>Try clearing your search or filter</p>}
                </div>
              ) : (
                filteredUsers.map(u => {
                  const meta = getRoleMeta(u.role);
                  const initials = `${u.firstName?.charAt(0) ?? ''}${u.lastName?.charAt(0) ?? ''}`.toUpperCase();
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 14px',
                        background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12,
                        transition: 'box-shadow 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#C7D2FE'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB'; }}
                    >
                      {/* Avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: meta.color, border: `2px solid ${meta.color}25` }}>
                        {initials || '?'}
                      </div>

                      {/* Name + email */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.firstName} {u.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                          {u.email}
                        </div>
                      </div>

                      {/* Role + Status */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, background: meta.bg, color: meta.color, padding: '3px 8px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {meta.icon} {meta.label}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, background: (u.status === 'ACTIVE' || !u.status) ? '#D1FAE5' : '#FEE2E2', color: (u.status === 'ACTIVE' || !u.status) ? '#065F46' : '#B91C1C', padding: '2px 7px', borderRadius: 8 }}>
                          {u.status || 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 18px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                {orgUsersLoading ? 'Loading…' : `${filteredUsers.length} of ${orgUsers.length} members`}
              </span>
              <button type="button" onClick={() => setUsersPanel(null)} style={{ padding: '6px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'inherit' }}>
                Close
              </button>
            </div>
          </div>

          <style>{`
            @keyframes fadeInBg { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideInFromRight { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
            @keyframes spin { to { transform: rotate(360deg) } }
          `}</style>
        </>
      )}
    </div>
  );
}

