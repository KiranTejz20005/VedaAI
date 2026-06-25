'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Building2, Plus, Edit3, Trash2, Power, Search, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
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

export default function SuperAdminOrganizations() {
  const [list, setList] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { fetchAvailableOrganizations } = useAdminAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/organizations');
      if (res.data?.success) setList(res.data.data);
    } catch { toast.error('Failed to load organizations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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
        const payload = { name, code, email, phone, address, adminEmail };
        const res = await api.post('/super-admin/organizations', payload);
        if (res.data?.success) { toast.success('Organization created!'); setShowModal(false); load(); fetchAvailableOrganizations(); }
      } else {
        const payload = { name, code, email, phone, address, adminEmail };
        const res = await api.post(`/super-admin/organizations/${selectedId}/update`, payload);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader
          title="Organizations"
          subtitle="Manage all tenant organizations on the platform."
        />
        <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
          Create Organization
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Input
          icon={<Search size={16} />}
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'All Status' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'SUSPENDED', label: 'Suspended' },
            { value: 'INACTIVE', label: 'Inactive' },
          ]}
        />
      </div>

      {loading ? (
        <LoadingState lines={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={32} />}
          title="No organizations found"
          description="Try adjusting your search or create a new organization."
          action={search || statusFilter ? undefined : openCreate}
          actionLabel={search || statusFilter ? undefined : 'Create Organization'}
        />
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (_: any, row: Organization) => (
              <Link href={`/super-admin/organizations/${row.id}`} style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={14} color="var(--brand)" />
                {row.name}
              </Link>
            )},
            { key: 'code', header: 'Code' },
            { key: 'status', header: 'Status', render: (value: string) => (
              <Badge variant={value === 'ACTIVE' ? 'success' : value === 'SUSPENDED' ? 'error' : 'draft'}>{value}</Badge>
            )},
            { key: 'subscriptionPlan', header: 'Plan' },
            { key: '_count', header: 'Users', align: 'center', render: (_: any, row: Organization) => row._count?.users || 0 },
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

      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        title={modalType === 'create' ? 'Create Organization' : 'Edit Organization'}
        size="sm"
      >
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
    </div>
  );
}
