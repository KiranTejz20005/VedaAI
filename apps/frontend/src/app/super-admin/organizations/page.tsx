'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Building2, Plus, Search, Edit3, Trash2, Power, X, Mail, Phone, MapPin
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/organizations');
      if (res.data?.success) setList(res.data.data);
    } catch { toast.error('Failed to load organizations'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setModalType('create'); setSelectedId(null);
    setName(''); setCode(''); setEmail(''); setPhone(''); setAddress('');
    setShowModal(true);
  };

  const openEdit = (org: Organization) => {
    setModalType('edit'); setSelectedId(org.id);
    setName(org.name); setCode(org.code);
    setEmail(org.email || ''); setPhone(org.phone || ''); setAddress(org.address || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) { toast.error('Name and Code are required.'); return; }
    const payload = { name, code, email, phone, address };
    try {
      if (modalType === 'create') {
        const res = await api.post('/super-admin/organizations', payload);
        if (res.data?.success) { toast.success('Organization created!'); setShowModal(false); load(); }
      } else {
        const res = await api.put(`/super-admin/organizations/${selectedId}`, payload);
        if (res.data?.success) { toast.success('Organization updated!'); setShowModal(false); load(); }
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this organization? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/super-admin/organizations/${id}`);
      if (res.data?.success) { toast.success('Organization deleted.'); load(); }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Delete failed'); }
  };

  const handleToggleSuspend = async (org: Organization) => {
    const isSuspended = org.status === 'SUSPENDED';
    if (!confirm(`Are you sure you want to ${isSuspended ? 'activate' : 'suspend'} ${org.name}?`)) return;
    try {
      const res = await api.post(`/super-admin/organizations/${org.id}/suspend`);
      if (res.data?.success) { toast.success(`Organization ${isSuspended ? 'activated' : 'suspended'}.`); load(); }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to update status'); }
  };

  const filtered = list.filter(org => {
    const matchSearch = org.name.toLowerCase().includes(search.toLowerCase()) || org.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || org.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Organizations</h2>
          <p className="text-gray-500 text-xs md:text-sm">Manage all tenant organizations on the platform.</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm w-fit">
          <Plus size={16} /> Create Organization
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input type="text" placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 min-w-[140px]">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No organizations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Code</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Subscription</th>
                  <th className="py-2.5 text-center">Users</th>
                  <th className="py-2.5">Created</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(org => (
                  <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <Link href={`/super-admin/organizations/${org.id}`} className="font-bold text-gray-800 flex items-center gap-1.5 hover:text-blue-600">
                        <Building2 size={15} className="text-blue-600" />
                        {org.name}
                      </Link>
                    </td>
                    <td className="py-3 font-semibold text-gray-600">{org.code}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${org.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : org.status === 'SUSPENDED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{org.subscriptionPlan}</td>
                    <td className="py-3 text-center text-gray-500">{org._count?.users || 0}</td>
                    <td className="py-3 text-gray-400">{new Date(org.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(org)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Edit">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleToggleSuspend(org)} className={`p-1.5 hover:bg-gray-100 rounded ${org.status === 'ACTIVE' ? 'text-orange-500' : 'text-green-500'}`} title={org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}>
                          <Power size={14} />
                        </button>
                        <button onClick={() => handleDelete(org.id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-400" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              {modalType === 'create' ? 'Create Organization' : 'Edit Organization'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Name *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="e.g. Acme University" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Code *</label>
                <input type="text" required value={code} onChange={e => setCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="e.g. ACME" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1"><Mail size={11} className="inline mr-1" />Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="admin@acme.edu" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1"><Phone size={11} className="inline mr-1" />Phone</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="+1-555-1234" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1"><MapPin size={11} className="inline mr-1" />Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="123 Main St, City" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs">
                {modalType === 'create' ? 'Create Organization' : 'Update Organization'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
