'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  GraduationCap,
  Plus,
  Search,
  Edit3,
  Trash2,
  Power,
  Key,
  Upload,
  X,
  Mail,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FacultyRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: { id: string; name: string } | null;
  departmentId?: string | null;
  designation: string;
  subjects: string[];
  classes: Array<{ id: string; grade: string; section: string }>;
  status: string;
}

interface Department {
  id: string;
  name: string;
}

export default function FacultyManagement() {
  const [list, setList] = useState<FacultyRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyRecord | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('');
  const [subjects, setSubjects] = useState('');
  const [sendInvite, setSendInvite] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facRes, deptRes] = await Promise.all([
        api.get('/admin/users?role=FACULTY'),
        api.get('/admin/departments'),
      ]);
      if (facRes.data?.success) setList(facRes.data.data);
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
    } catch {
      toast.error('Failed to load faculty data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedFaculty(null);
    setFirstName(''); setLastName(''); setEmail('');
    setDepartmentId(''); setDesignation(''); setSubjects(''); setSendInvite(false);
    setShowModal(true);
  };

  const handleOpenEdit = (f: FacultyRecord) => {
    setModalType('edit');
    setSelectedFaculty(f);
    setFirstName(f.firstName);
    setLastName(f.lastName);
    setEmail(f.email);
    setDepartmentId(f.departmentId || '');
    setDesignation(f.designation || '');
    setSubjects((f.subjects || []).join(', '));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast.error('First Name, Last Name, and Email are required.');
      return;
    }
    const payload = {
      firstName, lastName, email,
      role: 'FACULTY',
      departmentId: departmentId || undefined,
      designation,
      subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (modalType === 'create') {
        const endpoint = sendInvite ? '/admin/users/invite' : '/admin/users';
        const res = await api.post(endpoint, payload);
        if (res.data?.success) {
          toast.success(sendInvite ? 'Invitation sent!' : 'Faculty created successfully!');
          setShowModal(false); loadData();
        }
      } else if (selectedFaculty) {
        const res = await api.put(`/admin/users/${selectedFaculty.id}`, payload);
        if (res.data?.success) {
          toast.success('Faculty updated successfully!');
          setShowModal(false); loadData();
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleToggleSuspend = async (f: FacultyRecord) => {
    const isSuspended = f.status === 'SUSPENDED';
    if (!confirm(`Are you sure you want to ${isSuspended ? 'activate' : 'suspend'} this faculty?`)) return;
    try {
      const res = await api.put(`/admin/users/${f.id}/suspend`, { suspend: !isSuspended });
      if (res.data?.success) {
        toast.success(`Faculty ${isSuspended ? 'activated' : 'suspended'}.`);
        loadData();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Toggle suspend failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data?.success) { toast.success('Faculty deleted.'); loadData(); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Deletion failed'); }
  };

  const handleResetPassword = async (f: FacultyRecord) => {
    const newPass = prompt(`Enter new password for ${f.firstName}:`, 'TempPassword@123');
    if (!newPass || newPass.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    try {
      const res = await api.post(`/admin/users/${f.id}/reset-password`, { newPassword: newPass });
      if (res.data?.success) { toast.success('Password reset successfully.'); loadData(); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Reset failed'); }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) { toast.error('Please select a CSV file.'); return; }
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const res = await api.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        toast.success('Faculty imported successfully!');
        setShowImportModal(false); setCsvFile(null); loadData();
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Import failed'); }
  };

  const filteredList = list.filter(f =>
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Faculty Management</h2>
          <p className="text-gray-500 text-xs md:text-sm">Manage teachers, designations, and department assignments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)}
            className="border border-gray-200 hover:bg-gray-50 bg-white text-gray-700 font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm">
            <Upload size={14} /> Import CSV
          </button>
          <button onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm">
            <Plus size={16} /> Invite Faculty
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input type="text" placeholder="Search faculty by name or email..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No faculty members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Department</th>
                  <th className="py-2.5">Designation</th>
                  <th className="py-2.5">Subjects</th>
                  <th className="py-2.5 text-center">Classes</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredList.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-gray-800 flex items-center gap-1.5">
                        <GraduationCap size={15} className="text-blue-600" />
                        {f.firstName} {f.lastName}
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">
                      <span className="flex items-center gap-1"><Mail size={10} /> {f.email}</span>
                    </td>
                    <td className="py-3 text-gray-600">{f.department?.name || '—'}</td>
                    <td className="py-3 text-gray-600">{f.designation || '—'}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {(f.subjects || []).slice(0, 2).map((s, i) => (
                          <span key={i} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-medium">{s}</span>
                        ))}
                        {(f.subjects || []).length > 2 && <span className="text-gray-400 text-[9px]">+{f.subjects.length - 2}</span>}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[9px] font-semibold">
                        <Users size={10} /> {(f.classes || []).length}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${f.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {f.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleOpenEdit(f)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Edit"><Edit3 size={14} /></button>
                        <button onClick={() => handleResetPassword(f)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Reset Password"><Key size={14} /></button>
                        <button onClick={() => handleToggleSuspend(f)} className={`p-1.5 hover:bg-gray-100 rounded ${f.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'}`} title={f.status === 'ACTIVE' ? 'Suspend' : 'Activate'}><Power size={14} /></button>
                        <button onClick={() => handleDelete(f.id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-400" title="Delete"><Trash2 size={14} /></button>
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
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              {modalType === 'create' ? 'Invite / Create Faculty' : 'Edit Faculty'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">First Name *</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="John" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Last Name *</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Email *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="john.doe@school.edu" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Department</label>
                  <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Designation</label>
                  <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="e.g. Professor" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Subjects (comma separated)</label>
                <input type="text" value={subjects} onChange={(e) => setSubjects(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="Math, Physics, Chemistry" />
              </div>
              {modalType === 'create' && (
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} className="rounded" />
                  Send invitation email
                </label>
              )}
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs">
                {modalType === 'create' ? (sendInvite ? 'Send Invitation' : 'Create Faculty') : 'Update Faculty'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => { setShowImportModal(false); setCsvFile(null); }} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Import Faculty CSV</h3>
            <form onSubmit={handleImportCsv} className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                <input type="file" accept=".csv" required onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                <Upload className="mx-auto text-blue-600 mb-2" size={32} />
                <span className="text-xs font-bold text-gray-800 block">{csvFile ? csvFile.name : 'Select CSV file'}</span>
                <span className="text-[10px] text-gray-400 mt-1 block">CSV with columns: firstName, lastName, email, department, designation, subjects</span>
              </div>
              <button type="submit" disabled={!csvFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs disabled:opacity-50">
                Import Faculty
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
