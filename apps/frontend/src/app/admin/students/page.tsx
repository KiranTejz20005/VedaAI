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
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [email, setEmail] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stuRes, clsRes] = await Promise.all([
        api.get('/admin/users?role=STUDENT'),
        api.get('/admin/classes'),
      ]);
      if (stuRes.data?.success) setList(stuRes.data.data);
      if (clsRes.data?.success) setClasses(clsRes.data.data);
    } catch { toast.error('Failed to load student data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
    setModalType('create'); setSelectedStudent(null);
    setFirstName(''); setLastName(''); setEmail(''); setRollNo(''); setClassId(''); setSection('');
    setShowModal(true);
  };

  const handleOpenEdit = (s: StudentRecord) => {
    setModalType('edit'); setSelectedStudent(s);
    setFirstName(s.firstName); setLastName(s.lastName); setEmail(s.email);
    setRollNo(s.rollNo || ''); setClassId(s.classId || ''); setSection(s.section || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast.error('First Name, Last Name, and Email are required.');
      return;
    }
    const payload: Record<string, unknown> = {
      firstName, lastName, email,
      role: 'STUDENT',
      rollNo: rollNo || undefined,
      classId: classId || undefined,
      section: section || undefined,
    };

    try {
      if (modalType === 'create') {
        const res = await api.post('/admin/users', payload);
        if (res.data?.success) { toast.success('Student created successfully!'); setShowModal(false); loadData(); }
      } else if (selectedStudent) {
        const res = await api.put(`/admin/users/${selectedStudent.id}`, payload);
        if (res.data?.success) { toast.success('Student updated successfully!'); setShowModal(false); loadData(); }
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data?.success) { toast.success('Student deleted.'); loadData(); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Deletion failed'); }
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
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-gray-500 text-xs md:text-sm">Manage student profiles, class assignments, and bulk imports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)}
            className="border border-gray-200 hover:bg-gray-50 bg-white text-gray-700 font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm">
            <Upload size={14} /> Bulk Import
          </button>
          <button onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm">
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input type="text" placeholder="Search students by name, email, or roll number..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Roll Number</th>
                  <th className="py-2.5">Class</th>
                  <th className="py-2.5">Section</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredList.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-gray-800 flex items-center gap-1.5">
                        <User size={15} className="text-blue-600" />
                        {s.firstName} {s.lastName}
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">
                      <span className="flex items-center gap-1"><Mail size={10} /> {s.email}</span>
                    </td>
                    <td className="py-3 text-gray-600 font-mono">{s.rollNo || '—'}</td>
                    <td className="py-3 text-gray-600">{s.class ? `${s.class.grade} - ${s.class.section}` : '—'}</td>
                    <td className="py-3 text-gray-600">{s.section || '—'}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${s.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {s.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleOpenEdit(s)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Edit"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-400" title="Delete"><Trash2 size={14} /></button>
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
              {modalType === 'create' ? 'Add Student' : 'Edit Student'}
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
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Roll Number</label>
                  <input type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="e.g. R-101" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Section</label>
                  <input type="text" value={section} onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="e.g. A" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Class</label>
                <select value={classId} onChange={(e) => setClassId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.grade} - {c.section}</option>)}
                </select>
              </div>
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs">
                {modalType === 'create' ? 'Add Student' : 'Update Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => { setShowImportModal(false); setCsvFile(null); }} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Bulk Import Students</h3>
            <form onSubmit={handleImportCsv} className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                <input type="file" accept=".csv" required onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                <Upload className="mx-auto text-blue-600 mb-2" size={32} />
                <span className="text-xs font-bold text-gray-800 block">{csvFile ? csvFile.name : 'Select CSV file'}</span>
                <span className="text-[10px] text-gray-400 mt-1 block">CSV with columns: firstName, lastName, email, rollNo, class, section</span>
              </div>
              <button type="submit" disabled={!csvFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs disabled:opacity-50">
                Import Students
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
