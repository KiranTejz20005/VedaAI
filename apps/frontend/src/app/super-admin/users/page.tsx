'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Upload,
  X,
  Mail,
  User as UserIcon,
  Loader2,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/format';
import { useAdminAuthStore } from '@/store/admin-auth.store';

interface FacultyRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  organization?: { id: string, name: string, email?: string } | null;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  email?: string;
}

export default function FacultyManagement() {
  const [list, setList] = useState<FacultyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyRecord | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  
  const { activeOrganizationId } = useAdminAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const selectedOrg = organizations.find(o => o.id === activeOrganizationId);
  const domain = selectedOrg?.email ? selectedOrg.email.split('@')[1] : 'vedaai.com';

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const [usersRes, orgsRes] = await Promise.all([
        api.get(`/admin/faculty${queryParams}`),
        api.get('/super-admin/organizations')
      ]);
      if (usersRes.data?.success) setList(usersRes.data.data);
      if (orgsRes.data?.success) setOrganizations(orgsRes.data.data);
    } catch (err) { 
      toast.error('Failed to load data');
      console.error(err);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    if (!activeOrganizationId) return;
    loadData(); 
  }, [activeOrganizationId]);

  const handleOpenCreate = () => {
    setModalType('create'); setSelectedFaculty(null);
    setFirstName(''); setLastName(''); setEmailPrefix('');
    setShowModal(true);
  };

  const handleOpenEdit = (f: FacultyRecord) => {
    setModalType('edit'); setSelectedFaculty(f);
    setFirstName(f.firstName); setLastName(f.lastName); 
    setEmailPrefix(f.email.split('@')[0]);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !emailPrefix) {
      toast.error('First Name, Last Name, and Email Prefix are required.');
      return;
    }
    const fullEmail = `${emailPrefix}@${domain}`;
    const payload: any = {
      firstName, lastName, email: fullEmail,
      role: 'FACULTY',
    };
    if (activeOrganizationId) payload.organizationId = activeOrganizationId;

    try {
      if (modalType === 'create') {
        const res = await api.post('/admin/faculty', payload);
        if (res.data?.success) { toast.success('Faculty created successfully!'); setShowModal(false); loadData(); }
      } else if (selectedFaculty) {
        const res = await api.put(`/admin/faculty/${selectedFaculty.id}`, payload);
        if (res.data?.success) { toast.success('Faculty updated successfully!'); setShowModal(false); loadData(); }
      }
    } catch (err: any) { toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;
    try {
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const res = await api.delete(`/admin/users/${id}${queryParams}`);
      if (res.data?.success) { toast.success('Faculty deleted.'); loadData(); }
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Deletion failed'); }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) { toast.error('Please select a CSV file.'); return; }
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const res = await api.post(`/admin/faculty/import${queryParams}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) { toast.success('Faculty imported successfully!'); setShowImportModal(false); setCsvFile(null); loadData(); }
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Import failed'); }
  };

  const filteredList = list.filter(f =>
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase()) ||
    (f.organization?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Faculty Management</h2>
          <p className="text-gray-600">Manage faculty profiles, assignments, and bulk imports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)}
            className="border border-gray-300 hover:bg-gray-50 bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm">
            <Upload size={16} /> Bulk Import
          </button>
          <button onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm">
            <Plus size={18} /> Add Faculty
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Search faculty by name, email, or organization..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <span className="text-gray-500">Loading faculty...</span>
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No faculty found. Create one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 font-semibold">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredList.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <UserIcon size={16} className="text-blue-600" />
                        {f.firstName} {f.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="flex items-center gap-1"><Mail size={14} /> {f.email}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="flex items-center gap-1"><Building2 size={14} /> {f.organization?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                        {f.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${f.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : f.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {f.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(f.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(f)} className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900" title="Edit"><Edit3 size={16} /></button>
                        <button onClick={() => handleDelete(f.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded text-gray-400" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200 p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {modalType === 'create' ? 'Add New Faculty' : 'Edit Faculty'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <div className="flex">
                  <input type="text" required value={emailPrefix} onChange={(e) => setEmailPrefix(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="john.doe" />
                  <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                    @{domain}
                  </span>
                </div>
              </div>
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm text-sm">
                {modalType === 'create' ? 'Create Faculty' : 'Update Faculty'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200 p-6 relative">
            <button onClick={() => { setShowImportModal(false); setCsvFile(null); }} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Import Faculty</h3>
            <form onSubmit={handleImportCsv} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                <input type="file" accept=".csv" required onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                <Upload className="mx-auto text-blue-600 mb-2" size={32} />
                <span className="text-sm font-semibold text-gray-800 block">{csvFile ? csvFile.name : 'Click to select CSV file'}</span>
                <span className="text-xs text-gray-500 mt-1 block">Columns: firstName, lastName, email</span>
              </div>
              <button type="submit" disabled={!csvFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Import Faculty
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
