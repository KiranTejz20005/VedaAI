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
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';

interface StudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rollNo: string;
  class?: { id: string; grade: string; section: string } | null;
  classId?: string | null;
  section?: string;
  status: string;
}

interface ClassRecord {
  id: string;
  grade: string;
  section: string;
}

export default function StudentManagement() {
  const [list, setList] = useState<StudentRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');

  const { user } = useAuthStore();
  const { activeOrganizationId, availableOrganizations } = useAdminAuthStore();

  let domain = 'vedaai.com';
  if (user?.role === 'SUPER_ADMIN') {
    const activeOrg = availableOrganizations.find(o => o.id === activeOrganizationId);
    if (activeOrg?.email) domain = activeOrg.email.split('@')[1];
  } else {
    if (user?.email) domain = user.email.split('@')[1];
  }
  
  const [rollNo, setRollNo] = useState('');
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = user?.role === 'SUPER_ADMIN' && activeOrganizationId 
        ? `?organizationId=${activeOrganizationId}` 
        : '';
        
      const [stuRes, clsRes] = await Promise.all([
        api.get(`/admin/students${queryParams}`),
        api.get(`/admin/classrooms${queryParams}`),
      ]);
      if (stuRes.data?.success) setList(stuRes.data.data);
      if (clsRes.data?.success) setClasses(clsRes.data.data);
    } catch (err) { 
      toast.error('Failed to load student data');
      console.error(err);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    if (user?.role === 'SUPER_ADMIN' && !activeOrganizationId) return;
    loadData(); 
  }, [user?.role, activeOrganizationId]);

  const handleOpenCreate = () => {
    setModalType('create'); setSelectedStudent(null);
    setFirstName(''); setLastName(''); setEmailPrefix(''); setRollNo(''); setClassId(''); setSection('');
    setShowModal(true);
  };

  const handleOpenEdit = (s: StudentRecord) => {
    setModalType('edit'); setSelectedStudent(s);
    setFirstName(s.firstName); setLastName(s.lastName); 
    setEmailPrefix(s.email.split('@')[0]);
    setRollNo(s.rollNo || ''); setClassId(s.classId || ''); setSection(s.section || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !emailPrefix) {
      toast.error('First Name, Last Name, and Email Prefix are required.');
      return;
    }
    const fullEmail = `${emailPrefix}@${domain}`;
    const payload: Record<string, unknown> = {
      firstName, lastName, email: fullEmail,
      role: 'STUDENT',
      rollNo: rollNo || undefined,
      classId: classId || undefined,
      section: section || undefined,
    };
    if (user?.role === 'SUPER_ADMIN' && activeOrganizationId) {
      payload.organizationId = activeOrganizationId;
    }

    try {
      if (modalType === 'create') {
        const res = await api.post('/admin/students', payload);
        if (res.data?.success) { toast.success('Student created successfully!'); setShowModal(false); loadData(); }
      } else if (selectedStudent) {
        const res = await api.put(`/admin/students/${selectedStudent.id}`, payload);
        if (res.data?.success) { toast.success('Student updated successfully!'); setShowModal(false); loadData(); }
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const queryParams = user?.role === 'SUPER_ADMIN' && activeOrganizationId 
        ? `?organizationId=${activeOrganizationId}` 
        : '';
      const res = await api.delete(`/admin/users/${id}${queryParams}`);
      if (res.data?.success) { toast.success('Student deleted.'); loadData(); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Deletion failed'); }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) { toast.error('Please select a CSV file.'); return; }
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const queryParams = user?.role === 'SUPER_ADMIN' && activeOrganizationId 
        ? `?organizationId=${activeOrganizationId}` 
        : '';
      const res = await api.post(`/admin/students/import${queryParams}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) { toast.success('Students imported successfully!'); setShowImportModal(false); setCsvFile(null); loadData(); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Import failed'); }
  };

  const filteredList = list.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNo || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-gray-600">Manage student profiles, class assignments, and bulk imports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)}
            className="border border-gray-300 hover:bg-gray-50 bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm">
            <Upload size={16} /> Bulk Import
          </button>
          <button onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm">
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Search students by name, email, or roll number..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <span className="text-gray-500">Loading students...</span>
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No students found. Create one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 font-semibold">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredList.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <UserIcon size={16} className="text-blue-600" />
                        {s.firstName} {s.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="flex items-center gap-1"><Mail size={14} /> {s.email}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{s.rollNo || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{s.class ? `${s.class.grade} - ${s.class.section}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{s.section || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {s.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(s)} className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900" title="Edit"><Edit3 size={16} /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded text-gray-400" title="Delete"><Trash2 size={16} /></button>
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
              {modalType === 'create' ? 'Add New Student' : 'Edit Student'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Roll Number</label>
                  <input type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="R-101" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Section</label>
                  <input type="text" value={section} onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="A" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
                <select value={classId} onChange={(e) => setClassId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">Select Class</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={`Class ${i + 1}`}>
                      Class {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm text-sm">
                {modalType === 'create' ? 'Create Student' : 'Update Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200 p-6 relative">
            <button onClick={() => { setShowImportModal(false); setCsvFile(null); }} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Import Students</h3>
            <form onSubmit={handleImportCsv} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                <input type="file" accept=".csv" required onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                <Upload className="mx-auto text-blue-600 mb-2" size={32} />
                <span className="text-sm font-semibold text-gray-800 block">{csvFile ? csvFile.name : 'Click to select CSV file'}</span>
                <span className="text-xs text-gray-500 mt-1 block">Columns: firstName, lastName, email, rollNo, classId, section</span>
              </div>
              <button type="submit" disabled={!csvFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Import Students
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
