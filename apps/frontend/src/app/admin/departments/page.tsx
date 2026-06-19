'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Building2, 
  Plus, 
  Search, 
  User, 
  ArrowLeftRight, 
  Archive, 
  X,
  School,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Organization {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
  status: string;
  hodId: string | null;
  organizationId: string;
  organization: {
    name: string;
  };
  createdAt: string;
}

interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function DepartmentsAdmin() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHODModal, setShowHODModal] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [orgId, setOrgId] = useState('');
  
  // Assign HOD/Transfer
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptsRes, orgsRes, usersRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/organizations'),
        api.get('/admin/users'),
      ]);

      if (deptsRes.data?.success) setDepts(deptsRes.data.data);
      if (orgsRes.data?.success) setOrgs(orgsRes.data.data);
      if (usersRes.data?.success) setUsers(usersRes.data.data);
    } catch (err) {
      toast.error('Failed to load department records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !orgId) {
      toast.error('Name and Organization are required.');
      return;
    }

    try {
      const res = await api.post('/admin/departments', {
        name,
        code: code || null,
        organizationId: orgId,
      });

      if (res.data?.success) {
        toast.success('Department created successfully!');
        setShowCreateModal(false);
        setName('');
        setCode('');
        setOrgId('');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create department');
    }
  };

  const handleAssignHOD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !selectedFacultyId) return;

    try {
      const res = await api.post(`/admin/departments/${selectedDept.id}/assign-hod`, {
        hodId: selectedFacultyId,
      });

      if (res.data?.success) {
        toast.success('HOD assigned successfully.');
        setShowHODModal(false);
        setSelectedFacultyId('');
        setSelectedDept(null);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'HOD assignment failed');
    }
  };

  const handleTransferFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId || !targetDeptId) return;

    try {
      const res = await api.post('/admin/departments/transfer-faculty', {
        facultyId: selectedFacultyId,
        targetDepartmentId: targetDeptId,
      });

      if (res.data?.success) {
        toast.success('Faculty member transferred successfully.');
        setShowTransferModal(false);
        setSelectedFacultyId('');
        setTargetDeptId('');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
    }
  };

  const handleArchive = async (dept: Department) => {
    if (!confirm(`Are you sure you want to archive the ${dept.name} department?`)) return;
    try {
      const res = await api.delete(`/admin/departments/${dept.id}`);
      if (res.data?.success) {
        toast.success('Department archived successfully.');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive department');
    }
  };

  const filteredDepts = depts.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.organization.name.toLowerCase().includes(search.toLowerCase())
  );

  const getHodName = (hodId: string | null) => {
    if (!hodId) return 'Not Assigned';
    const found = users.find(u => u.id === hodId);
    return found ? `${found.firstName} ${found.lastName}` : 'Unknown';
  };

  // Only users who belong to the same organization can be assigned/transferred
  const getFacultyOptions = (organizationId?: string) => {
    return users.filter(u => 
      u.role === 'FACULTY' || 
      u.role === 'HOD' || 
      u.role === 'DEPARTMENT_ADMIN'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Departments</h2>
          <p className="text-gray-500 text-xs md:text-sm">Configure branch offices, map head of departments (HOD), and manage staff rosters.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="border border-gray-200 hover:bg-gray-50 bg-white text-gray-700 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <ArrowLeftRight size={14} /> Transfer Staff
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Plus size={16} /> Create Department
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by department or school name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No department records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Organization & Division</th>
                  <th className="py-2.5">Division Code</th>
                  <th className="py-2.5">Head of Department (HOD)</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDepts.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-gray-800 flex items-center gap-1.5">
                        <Building2 size={15} className="text-blue-600" />
                        {dept.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                        <School size={10} /> {dept.organization.name}
                      </div>
                    </td>
                    <td className="py-3 font-semibold text-gray-700 uppercase">
                      {dept.code || 'None'}
                    </td>
                    <td className="py-3 text-gray-600 font-medium">
                      <div className="flex items-center gap-1">
                        <User size={13} className="text-gray-400" />
                        {getHodName(dept.hodId)}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        dept.status === 'ACTIVE' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {dept.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedDept(dept);
                            setShowHODModal(true);
                          }}
                          className="px-2.5 py-1 hover:bg-blue-50 text-blue-600 font-semibold border border-blue-100 rounded-lg text-[10px]"
                        >
                          Assign HOD
                        </button>
                        <button
                          onClick={() => handleArchive(dept)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-400"
                          title="Archive"
                        >
                          <Archive size={14} />
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

      {/* 1. Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Create Department</h3>
            <form onSubmit={handleCreateDept} className="space-y-4">
              <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Organization Link *</label>
                  <select
                    required
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Organization...</option>
                    {orgs.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Department of Computer Science"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Department Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="e.g. CS"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm mt-2 text-xs"
              >
                Save Department
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Assign HOD Modal */}
      {showHODModal && selectedDept && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowHODModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Assign HOD</h3>
            <p className="text-[10px] text-gray-500 mb-4 font-medium">Select a faculty leader for <strong>{selectedDept.name}</strong>.</p>
            
            <form onSubmit={handleAssignHOD} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Select leader</label>
                <select
                  required
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select HOD candidate...</option>
                  {getFacultyOptions(selectedDept.organizationId).map(fac => (
                    <option key={fac.id} value={fac.id}>{fac.firstName} {fac.lastName} ({fac.email})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                Confirm Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Transfer Faculty Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowTransferModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Transfer Faculty</h3>
            <p className="text-[10px] text-gray-500 mb-4 font-medium">Reassign an educator's primary department affiliation.</p>
            
            <form onSubmit={handleTransferFaculty} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Select Staff Member *</label>
                <select
                  required
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose Faculty...</option>
                  {users.filter(u => u.role === 'FACULTY').map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Target Department *</label>
                <select
                  required
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose target department...</option>
                    {depts.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name} ({dept.organization.name})</option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                Execute Reassignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
