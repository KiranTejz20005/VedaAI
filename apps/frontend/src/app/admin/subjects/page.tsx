'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SubjectRecord {
  id: string;
  name: string;
  code: string;
  classes: Array<{ id: string; grade: string; section: string }>;
  teachers: Array<{ id: string; firstName: string; lastName: string }>;
}

export default function SubjectsPage() {
  const [list, setList] = useState<SubjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedSubject, setSelectedSubject] = useState<SubjectRecord | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subjects');
      if (res.data?.success) setList(res.data.data);
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
    setModalType('create'); setSelectedSubject(null);
    setName(''); setCode('');
    setShowModal(true);
  };

  const handleOpenEdit = (s: SubjectRecord) => {
    setModalType('edit'); setSelectedSubject(s);
    setName(s.name); setCode(s.code || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { toast.error('Subject name is required.'); return; }
    const payload = { name, code: code || undefined };
    try {
      if (modalType === 'create') {
        const res = await api.post('/admin/subjects', payload);
        if (res.data?.success) { toast.success('Subject created!'); setShowModal(false); loadData(); }
      } else if (selectedSubject) {
        const res = await api.put(`/admin/subjects/${selectedSubject.id}`, payload);
        if (res.data?.success) { toast.success('Subject updated!'); setShowModal(false); loadData(); }
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      const res = await api.delete(`/admin/subjects/${id}`);
      if (res.data?.success) { toast.success('Subject deleted.'); loadData(); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Deletion failed'); }
  };

  const filteredList = list.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Subjects</h2>
          <p className="text-gray-500 text-xs md:text-sm">Manage academic subjects offered across classes.</p>
        </div>
        <button onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm">
          <Plus size={16} /> Create Subject
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input type="text" placeholder="Search subjects by name or code..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No subjects found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Subject Name</th>
                  <th className="py-2.5">Code</th>
                  <th className="py-2.5">Classes</th>
                  <th className="py-2.5">Teachers Assigned</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredList.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-gray-800 flex items-center gap-1.5">
                        <BookOpen size={15} className="text-blue-600" />
                        {s.name}
                      </div>
                    </td>
                    <td className="py-3 font-mono text-gray-600 uppercase">{s.code || '—'}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.classes || []).slice(0, 3).map((c, i) => (
                          <span key={i} className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[9px] font-medium">
                            {c.grade} - {c.section}
                          </span>
                        ))}
                        {(s.classes || []).length > 3 && <span className="text-gray-400 text-[9px]">+{s.classes.length - 3}</span>}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-gray-400" />
                        <span className="text-gray-600 font-medium">{(s.teachers || []).length}</span>
                      </div>
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
              {modalType === 'create' ? 'Create Subject' : 'Edit Subject'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Subject Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Subject Code</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="e.g. MATH101" />
              </div>
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs">
                {modalType === 'create' ? 'Create Subject' : 'Update Subject'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
