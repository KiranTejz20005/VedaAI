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
  Building2,
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/format';
import { useAdminAuthStore } from '@/store/admin-auth.store';

interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  organization?: { id: string, name: string, email?: string } | null;
  createdAt: string;
  phone?: string;
}

interface Organization {
  id: string;
  name: string;
  email?: string;
}

export default function UsersManagement() {
  const [activeTab, setActiveTab] = useState<'FACULTY' | 'STUDENT'>('FACULTY');
  const [list, setList] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  
  const { activeOrganizationId } = useAdminAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const selectedOrg = organizations.find(o => o.id === activeOrganizationId);
  const domain = selectedOrg?.email ? selectedOrg.email.split('@')[1] : 'vidyaai.com';

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const endpoint = activeTab === 'FACULTY' ? '/admin/faculty' : '/admin/students';
      const [usersRes, orgsRes] = await Promise.all([
        api.get(`${endpoint}${queryParams}`),
        api.get('/admin/organizations')
      ]);
      if (usersRes.data?.success) setList(usersRes.data.data);
      if (orgsRes.data?.success) setOrganizations(orgsRes.data.data);
    } catch (err) { 
      toast.error(`Failed to load ${activeTab.toLowerCase()}`);
      console.error(err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (!activeOrganizationId) return;
    loadData(); 
  }, [activeOrganizationId, activeTab]);

  const handleOpenCreate = () => {
    setModalType('create'); setSelectedUser(null);
    setFirstName(''); setLastName(''); setEmailPrefix('');
    setShowModal(true);
  };

  const handleOpenEdit = (u: UserRecord) => {
    setModalType('edit'); setSelectedUser(u);
    setFirstName(u.firstName); setLastName(u.lastName); 
    setEmailPrefix(u.email.split('@')[0] || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !emailPrefix) {
      toast.error('First Name, Last Name, and Email Prefix are required.');
      return;
    }
    const fullEmail = `${emailPrefix.trim()}@${domain}`;
    const payload: any = {
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      email: fullEmail,
      role: activeTab === 'FACULTY' ? 'TEACHER' : 'STUDENT',
    };
    if (activeOrganizationId) payload.organizationId = activeOrganizationId;

    try {
      const endpoint = activeTab === 'FACULTY' ? '/admin/faculty' : '/admin/students';
      setSubmitting(true);
      const toastId = toast.loading(modalType === 'create' ? 'Creating...' : 'Updating...');
      if (modalType === 'create') {
        const res = await api.post(endpoint, payload);
        if (res.data?.success) { 
          toast.success(`${activeTab === 'FACULTY' ? 'Faculty' : 'Student'} created successfully!`, { id: toastId }); 
          setShowModal(false); 
          loadData(); 
        }
      } else if (selectedUser) {
        const res = await api.put(`${endpoint}/${selectedUser.id}`, payload);
        if (res.data?.success) { 
          // Optimistic update - update immediately in list
          setList(prev => prev.map(u => u.id === selectedUser.id ? { ...u, firstName: firstName.trim(), lastName: lastName.trim(), email: fullEmail } : u));
          toast.success(`${activeTab === 'FACULTY' ? 'Faculty' : 'Student'} updated successfully!`, { id: toastId }); 
          setShowModal(false); 
          loadData(); 
        }
      }
    } catch (err: any) { 
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Operation failed'); 
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab.toLowerCase()} member?`)) return;
    // Optimistic update - remove from list immediately
    setList(prev => prev.filter(u => u.id !== id));
    const toastId = toast.loading('Deleting...');
    try {
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const endpoint = '/admin/users';
      const res = await api.delete(`${endpoint}/${id}${queryParams}`);
      if (res.data?.success) { 
        toast.success(`${activeTab === 'FACULTY' ? 'Faculty' : 'Student'} deleted successfully.`, { id: toastId }); 
        loadData(); // re-sync
      } else {
        toast.error('Failed to delete user.', { id: toastId });
        loadData(); // revert
      }
    } catch (err: any) { 
      toast.error(err?.response?.data?.message || 'Deletion failed', { id: toastId });
      loadData(); // revert optimistic update
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) { toast.error('Please select a CSV file.'); return; }
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const endpoint = activeTab === 'FACULTY' ? '/admin/faculty/import' : '/admin/students/import';
      const res = await api.post(`${endpoint}${queryParams}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) { 
        toast.success(`${activeTab === 'FACULTY' ? 'Faculty' : 'Students'} imported successfully!`); 
        setShowImportModal(false); 
        setCsvFile(null); 
        loadData(); 
      }
    } catch (err: any) { 
      toast.error(err?.response?.data?.message || 'Import failed'); 
    }
  };

  const filteredList = list.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.organization?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage faculty and student profiles for your organization.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)}
            className="border border-gray-300 hover:bg-gray-50 bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm">
            <Upload size={16} /> Bulk Import
          </button>
          <button onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm">
            <Plus size={18} /> Add {activeTab === 'FACULTY' ? 'Faculty' : 'Student'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('FACULTY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'FACULTY'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <UserIcon size={16} /> Faculty
        </button>
        <button
          onClick={() => setActiveTab('STUDENT')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'STUDENT'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <GraduationCap size={16} /> Students
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder={`Search ${activeTab.toLowerCase()} by name, email, or organization...`}
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <span className="text-gray-500">Loading {activeTab.toLowerCase()}...</span>
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No {activeTab.toLowerCase()} found. Create one to get started.</div>
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
                {filteredList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {activeTab === 'FACULTY' ? <UserIcon size={16} className="text-blue-600" /> : <GraduationCap size={16} className="text-blue-600" />}
                        {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (u as any).name || 'Unknown User'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="flex items-center gap-1"><Mail size={14} /> {u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="flex items-center gap-1"><Building2 size={14} /> {u.organization?.code || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : u.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(u)} className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900" title="Edit"><Edit3 size={16} /></button>
                        <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded text-gray-400" title="Delete"><Trash2 size={16} /></button>
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
              {modalType === 'create' ? `Add New ${activeTab === 'FACULTY' ? 'Faculty' : 'Student'}` : `Edit ${activeTab === 'FACULTY' ? 'Faculty' : 'Student'}`}
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
                  <input type="text" required value={emailPrefix} onChange={(e) => setEmailPrefix(e.target.value.replace(/\s+/g, ''))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="john.doe" />
                  <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                    @{domain}
                  </span>
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm text-sm flex items-center justify-center gap-2">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Saving...' : (modalType === 'create' ? 'Create' : 'Update')}
              </button>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200 p-6 relative">
            <button onClick={() => { setShowImportModal(false); setCsvFile(null); }} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Import {activeTab === 'FACULTY' ? 'Faculty' : 'Students'}</h3>
            <form onSubmit={handleImportCsv} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                <input type="file" accept=".csv" required onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                <Upload className="mx-auto text-blue-600 mb-2" size={32} />
                <span className="text-sm font-semibold text-gray-800 block">{csvFile ? csvFile.name : 'Click to select CSV file'}</span>
                <span className="text-xs text-gray-500 mt-1 block">Columns: firstName, lastName, email{activeTab === 'STUDENT' && ', rollNo (optional)'}</span>
              </div>
              <button type="submit" disabled={!csvFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Import {activeTab === 'FACULTY' ? 'Faculty' : 'Students'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
