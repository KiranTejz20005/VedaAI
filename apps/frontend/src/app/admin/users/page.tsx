'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Power, 
  Key, 
  UserSquare, 
  X,
  School,
  Building2,
  Phone,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { useRouter } from 'next/navigation';

interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  status: string;
  forcePasswordReset: boolean;
  institutionId: string | null;
  departmentId: string | null;
  institution?: { name: string } | null;
  department?: { name: string } | null;
  createdAt: string;
}

interface Institution {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  institutionId: string;
}

export default function UsersAdmin() {
  const { user: currentUser } = useAuthStore();
  const { setOriginalAdminToken } = useAdminAuthStore();
  const router = useRouter();

  const [list, setList] = useState<UserRecord[]>([]);
  const [insts, setInsts] = useState<Institution[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('FACULTY');
  const [instId, setInstId] = useState('');
  const [deptId, setDeptId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, instsRes, deptsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/institutions'),
        api.get('/admin/departments'),
      ]);

      if (usersRes.data?.success) setList(usersRes.data.data);
      if (instsRes.data?.success) setInsts(instsRes.data.data);
      if (deptsRes.data?.success) setDepts(deptsRes.data.data);
    } catch (err) {
      toast.error('Failed to load user list');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedUser(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole('FACULTY');
    setInstId('');
    setDeptId('');
    setPassword('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserRecord) => {
    setModalType('edit');
    setSelectedUser(user);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setPhone(user.phone || '');
    setRole(user.role);
    setInstId(user.institutionId || '');
    setDeptId(user.departmentId || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast.error('First Name, Last Name, and Email are required.');
      return;
    }

    const payload = {
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      role,
      institutionId: instId || undefined,
      departmentId: deptId || undefined,
      ...(modalType === 'create' ? { password: password || undefined } : {}),
    };

    try {
      if (modalType === 'create') {
        const res = await api.post('/admin/users', payload);
        if (res.data?.success) {
          toast.success('User created successfully!');
          setShowModal(false);
          loadData();
        }
      } else if (selectedUser) {
        const res = await api.put(`/admin/users/${selectedUser.id}`, payload);
        if (res.data?.success) {
          toast.success('User details updated successfully!');
          setShowModal(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleToggleSuspend = async (user: UserRecord) => {
    const isSuspended = user.status === 'SUSPENDED';
    if (!confirm(`Are you sure you want to ${isSuspended ? 'activate' : 'suspend'} this user?`)) return;

    try {
      const res = await api.put(`/admin/users/${user.id}/suspend`, { suspend: !isSuspended });
      if (res.data?.success) {
        toast.success(`User successfully ${isSuspended ? 'activated' : 'suspended'}.`);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Suspension toggle failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to soft-delete this user? They will not be able to log in.')) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data?.success) {
        toast.success('User deleted successfully.');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  const handleResetPassword = async (user: UserRecord) => {
    const newPass = prompt(`Enter new password for ${user.firstName} (force reset active on next login):`, 'TempPassword@123');
    if (newPass === null) return;
    if (newPass.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    try {
      const res = await api.post(`/admin/users/${user.id}/reset-password`, { newPassword: newPass });
      if (res.data?.success) {
        toast.success('Password successfully reset. User will be forced to change it on their next login.');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Password reset failed');
    }
  };

  const handleImpersonate = async (user: UserRecord) => {
    if (currentUser?.id === user.id) {
      toast.error('You cannot impersonate yourself.');
      return;
    }
    if (!confirm(`Switch session and log in as ${user.firstName} ${user.lastName} (${user.email})?`)) return;

    try {
      const currentToken = useAuthStore.getState().accessToken;
      const res = await api.post(`/admin/users/${user.id}/impersonate`);
      
      if (res.data?.success && currentToken) {
        const { accessToken, user: targetUser } = res.data.data;
        
        // Save original admin token
        setOriginalAdminToken(currentToken);
        
        // Load impersonated session
        useAuthStore.getState().setAuth(targetUser, accessToken);
        
        toast.success(`Session swapped! You are now logged in as ${targetUser.firstName}.`);
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Impersonation failed');
    }
  };

  const filteredDepts = depts.filter(d => !instId || d.institutionId === instId);

  const filteredList = list.filter(u => {
    const matchSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">User Directory</h2>
          <p className="text-gray-500 text-xs md:text-sm">Manage administrators, teachers, students, and parents permissions.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm w-fit"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users by name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 min-w-[150px]"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="INSTITUTION_ADMIN">Institution Admin</option>
            <option value="DEPARTMENT_ADMIN">Department Admin</option>
            <option value="HOD">HOD</option>
            <option value="FACULTY">Faculty</option>
            <option value="STUDENT">Student</option>
            <option value="PARENT">Parent</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Affiliation</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-gray-800 flex items-center gap-1.5">
                        <UserSquare size={15} className="text-blue-600" />
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1"><Mail size={10} /> {u.email}</span>
                        {u.phone && <span className="flex items-center gap-1"><Phone size={10} /> {u.phone}</span>}
                      </div>
                    </td>
                    <td className="py-3 text-gray-500">
                      <div className="font-semibold text-gray-700 bg-gray-100 text-[9px] px-1.5 py-0.5 rounded w-fit uppercase mb-1">
                        {u.role.replace('_', ' ')}
                      </div>
                      {u.institution && (
                        <div className="text-[10px] flex items-center gap-1">
                          <School size={10} /> {u.institution.name}
                        </div>
                      )}
                      {u.department && (
                        <div className="text-[10px] flex items-center gap-1 mt-0.5">
                          <Building2 size={10} /> {u.department.name}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        u.status === 'ACTIVE' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {u.status}
                      </span>
                      {u.forcePasswordReset && (
                        <div className="text-[8px] text-orange-600 font-bold mt-1 uppercase">Reset Req</div>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {currentUser?.role === 'SUPER_ADMIN' && currentUser.id !== u.id && (
                          <button
                            onClick={() => handleImpersonate(u)}
                            className="p-1 hover:bg-orange-50 text-orange-600 border border-orange-100 rounded text-[10px] font-bold"
                            title="Login As"
                          >
                            Login As
                          </button>
                        )}
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                          title="Reset Password"
                        >
                          <Key size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleSuspend(u)}
                          className={`p-1.5 hover:bg-gray-100 rounded ${u.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'}`}
                          title={u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        >
                          <Power size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
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

      {/* Add / Edit user Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              {modalType === 'create' ? 'Add New User Account' : 'Edit User Profile'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. John"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="e.g. john.doe@school.edu"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. +1-555-0144"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Portal Role *</label>
                  <select
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="INSTITUTION_ADMIN">Institution Admin</option>
                    <option value="DEPARTMENT_ADMIN">Department Admin</option>
                    <option value="HOD">HOD</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="STUDENT">Student</option>
                    <option value="PARENT">Parent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Institution Link</label>
                  <select
                    value={instId}
                    onChange={(e) => {
                      setInstId(e.target.value);
                      setDeptId(''); // reset department
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None (Independent Admin)</option>
                    {insts.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Department Link</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None</option>
                    {filteredDepts.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {modalType === 'create' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Temp Password (Optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="Defaults to Temporary@123"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                {modalType === 'create' ? 'Save User Account' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
