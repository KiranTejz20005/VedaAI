'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ShieldCheck, ShieldAlert, KeyRound, CheckSquare, Square, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Permission {
  id: string;
  name: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
}

export default function RolesAdmin() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit permissions modal state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  // New Role Form
  const [showRoleCreate, setShowRoleCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions'),
      ]);

      if (rolesRes.data?.success) setRoles(rolesRes.data.data);
      if (permsRes.data?.success) setPerms(permsRes.data.data);
    } catch (err) {
      toast.error('Failed to load roles and permissions matrix');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = (role: Role) => {
    setSelectedRole(role);
    setRolePermissions(role.permissions.map(p => p.id));
    setShowModal(true);
  };

  const handleTogglePermission = (permId: string) => {
    setRolePermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(id => id !== permId) 
        : [...prev, permId]
    );
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    try {
      const res = await api.post(`/admin/roles/${selectedRole.id}/permissions`, {
        permissionIds: rolePermissions,
      });

      if (res.data?.success) {
        toast.success(`Permissions updated successfully for role ${selectedRole.name}.`);
        setShowModal(false);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update permissions mapping');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;

    try {
      const res = await api.post('/admin/roles', {
        name: newRoleName.toUpperCase().replace(/\s+/g, '_'),
        description: newRoleDesc || null,
      });

      if (res.data?.success) {
        toast.success('Custom security role created successfully!');
        setNewRoleName('');
        setNewRoleDesc('');
        setShowRoleCreate(false);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'FACULTY', 'STUDENT'].includes(name)) {
      toast.error('System protected roles cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete custom role ${name}?`)) return;

    try {
      const res = await api.delete(`/admin/roles/${id}`);
      if (res.data?.success) {
        toast.success('Role deleted successfully.');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Roles & RBAC</h2>
          <p className="text-gray-500 text-xs md:text-sm">Manage database-driven security permissions, custom roles, and credential matrix.</p>
        </div>
        <button
          onClick={() => setShowRoleCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm w-fit"
        >
          <Plus size={16} /> Create Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table column */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Active System Roles</h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5">Role Name</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-center">Permissions Count</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {roles.map((role) => {
                    const isSystemRole = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'FACULTY', 'STUDENT'].includes(role.name);
                    return (
                      <tr key={role.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3">
                          <div className="font-bold text-gray-800 flex items-center gap-1.5">
                            {isSystemRole ? <ShieldCheck size={14} className="text-blue-600" /> : <ShieldAlert size={14} className="text-orange-500" />}
                            {role.name}
                          </div>
                        </td>
                        <td className="py-3 text-gray-500 font-medium max-w-[200px] truncate">
                          {role.description || 'No description provided.'}
                        </td>
                        <td className="py-3 text-center font-bold text-gray-700">
                          {role.permissions.length}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenAssign(role)}
                              className="px-2.5 py-1 hover:bg-blue-50 text-blue-600 font-semibold border border-blue-100 rounded-lg text-[10px]"
                            >
                              Assign Permissions
                            </button>
                            {!isSystemRole && (
                              <button
                                onClick={() => handleDeleteRole(role.id, role.name)}
                                className="px-2.5 py-1 hover:bg-red-50 text-red-600 font-semibold rounded-lg text-[10px]"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Permissions catalog Column */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound size={16} className="text-blue-600" /> Permissions Catalog
          </h3>
          <p className="text-[10px] text-gray-500 font-medium">Standard system security gates available to customize access thresholds.</p>
          
          <div className="space-y-3 pt-2">
            {perms.map(p => (
              <div key={p.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <strong className="text-[10px] font-bold text-gray-800 block uppercase">{p.name}</strong>
                <span className="text-[10px] text-gray-400 block mt-0.5">{p.description}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 1. Custom Role Creation Modal */}
      {showRoleCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowRoleCreate(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Create Custom Role</h3>
            
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="e.g. VISITING_LECTURER"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Describe the level of system access for this role..."
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                Save Custom Role
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Assign Permissions matrix Modal */}
      {showModal && selectedRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Assign Permissions</h3>
            <p className="text-[10px] text-gray-500 mb-4 font-semibold">Toggling rules for role: <strong className="text-blue-600">{selectedRole.name}</strong></p>

            <form onSubmit={handleSavePermissions} className="space-y-4">
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {perms.map(p => {
                  const isChecked = rolePermissions.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleTogglePermission(p.id)}
                      className="p-3 bg-gray-50 hover:bg-gray-100/85 rounded-xl border border-gray-150 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="pr-3">
                        <strong className="text-[10px] font-bold text-gray-800 uppercase block">{p.name}</strong>
                        <span className="text-[9px] text-gray-400 block mt-0.5">{p.description}</span>
                      </div>
                      <div className="text-blue-600 flex-shrink-0">
                        {isChecked ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                Save Role Config
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
