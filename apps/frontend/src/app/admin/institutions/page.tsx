'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  School, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Power,
  Globe, 
  Phone, 
  MapPin, 
  X,
  TrendingUp,
  Brain
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Organization {
  id: string;
  name: string;
  code: string;
  domain: string | null;
  address: string | null;
  contact: string | null;
  website: string | null;
  status: string;
  _count: {
    users: number;
    departments: number;
  };
}

interface OrgStats {
  totalUsers: number;
  facultyCount: number;
  studentCount: number;
  papersGenerated: number;
  aiUsage: {
    tokensUsed: number;
    estimatedCost: number;
  };
}

export default function OrganizationsAdmin() {
  const [list, setList] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [domain, setDomain] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState('');

  // Analytics panel state
  const [activeStatsOrg, setActiveStatsOrg] = useState<Organization | null>(null);
  const [statsData, setStatsData] = useState<OrgStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/organizations');
      if (res.data?.success) {
        setList(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedOrgId(null);
    setName('');
    setCode('');
    setDomain('');
    setAddress('');
    setContact('');
    setWebsite('');
    setShowModal(true);
  };

  const handleOpenEdit = (org: Organization) => {
    setModalType('edit');
    setSelectedOrgId(org.id);
    setName(org.name);
    setCode(org.code);
    setDomain(org.domain || '');
    setAddress(org.address || '');
    setContact(org.contact || '');
    setWebsite(org.website || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Name and Code are required.');
      return;
    }

    const payload = { name, code, domain, address, contact, website };
    try {
      if (modalType === 'create') {
        const res = await api.post('/admin/organizations', payload);
        if (res.data?.success) {
          toast.success('Organization created successfully!');
          setShowModal(false);
          loadOrganizations();
        }
      } else {
        const res = await api.put(`/admin/organizations/${selectedOrgId}`, payload);
        if (res.data?.success) {
          toast.success('Organization updated successfully!');
          setShowModal(false);
          loadOrganizations();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this organization? This action will remove all departments and users.')) return;
    try {
      const res = await api.delete(`/admin/organizations/${id}`);
      if (res.data?.success) {
        toast.success('Organization deleted successfully.');
        loadOrganizations();
        if (activeStatsOrg?.id === id) setActiveStatsOrg(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleToggleSuspend = async (org: Organization) => {
    const isSuspended = org.status === 'SUSPENDED';
    const actionText = isSuspended ? 'activate' : 'suspend';
    if (!confirm(`Are you sure you want to ${actionText} this organization?`)) return;

    try {
      const res = await api.put(`/admin/organizations/${org.id}/suspend`, { suspend: !isSuspended });
      if (res.data?.success) {
        toast.success(`Organization ${isSuspended ? 'activated' : 'suspended'} successfully.`);
        loadOrganizations();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update suspension status');
    }
  };

  const handleViewStats = async (org: Organization) => {
    setActiveStatsOrg(org);
    try {
      setStatsLoading(true);
      const res = await api.get(`/admin/organizations/${org.id}/analytics`);
      if (res.data?.success) {
        setStatsData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load organization telemetry');
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredList = list.filter(org => 
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Organizations</h2>
          <p className="text-gray-500 text-xs md:text-sm">Manage tenant schools, domains, contact channels, and system usages.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm w-fit"
        >
          <Plus size={16} /> Add Organization
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table column */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or short code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">No organizations match your search query.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5">Organization Code & Name</th>
                    <th className="py-2.5">Contact Details</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredList.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="font-bold text-gray-800 flex items-center gap-1.5">
                          <School size={15} className="text-blue-600" />
                          {org.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase">Code: {org.code}</div>
                      </td>
                      <td className="py-3 text-gray-500 max-w-[180px] truncate">
                        {org.website && (
                          <div className="flex items-center gap-1">
                            <Globe size={11} /> {org.website}
                          </div>
                        )}
                        {org.contact && (
                          <div className="flex items-center gap-1 text-[10px] mt-0.5">
                            <Phone size={11} /> {org.contact}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                          org.status === 'ACTIVE' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewStats(org)}
                            className="p-1.5 hover:bg-gray-100 rounded text-blue-600 font-semibold text-[10px]"
                            title="Analytics Summary"
                          >
                            Telemetry
                          </button>
                          <button
                            onClick={() => handleOpenEdit(org)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleSuspend(org)}
                            className={`p-1.5 hover:bg-gray-100 rounded ${org.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'}`}
                            title={org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(org.id)}
                            className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-400"
                            title="Delete"
                          >
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

        {/* Telemetry panel column */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-1 space-y-6">
          {!activeStatsOrg ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <School className="text-gray-300 mb-2" size={32} />
              <h4 className="text-xs font-bold text-gray-400 uppercase">Tenant Telemetry</h4>
              <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Select an organization and click "Telemetry" to audit active user loads and generations cost.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase">Usage Metrics</h3>
                  <span className="text-[10px] text-gray-500 font-semibold">{activeStatsOrg.name}</span>
                </div>
                <button onClick={() => setActiveStatsOrg(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>

              {statsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : statsData ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Departments</span>
                      <strong className="text-xl font-bold text-gray-800 mt-1 block">{activeStatsOrg._count.departments}</strong>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Total Users</span>
                      <strong className="text-xl font-bold text-gray-800 mt-1 block">{statsData.totalUsers}</strong>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium border-b border-gray-50 pb-2">
                      <span className="text-gray-500">Faculty Members</span>
                      <span className="font-semibold text-gray-800">{statsData.facultyCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium border-b border-gray-50 pb-2">
                      <span className="text-gray-500">Student Enrolls</span>
                      <span className="font-semibold text-gray-800">{statsData.studentCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium border-b border-gray-50 pb-2">
                      <span className="text-gray-500">Papers Generated</span>
                      <span className="font-semibold text-gray-800">{statsData.papersGenerated}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium pb-2">
                      <span className="text-gray-500">AI Cost Estimate</span>
                      <span className="font-semibold text-emerald-600">${statsData.aiUsage.estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-2">
                    <Brain className="text-blue-600 flex-shrink-0" size={18} />
                    <div className="text-[10px] leading-relaxed text-blue-800">
                      <strong>AI Provider Telemetry:</strong> This school has processed approximately <strong>{statsData.aiUsage.tokensUsed.toLocaleString()} tokens</strong> since onboarding.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs">Failed to load statistics.</div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Creation / Editing Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              {modalType === 'create' ? 'Add New Organization' : 'Edit Organization Details'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Stanford University"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. STANFORD"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Domain</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. stanford.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 450 Serra Mall, Stanford, CA"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. +1-650-723-2300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Website URL</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. https://www.stanford.edu"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 mt-2 text-xs"
              >
                {modalType === 'create' ? 'Save Organization' : 'Update Details'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
