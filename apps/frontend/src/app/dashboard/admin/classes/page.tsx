'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, Edit3, Trash2, Users, Loader2, X, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClassRecord {
  id: string;
  grade: string;
  section: string;
  academicYear: string;
  facultyId?: string;
  _count?: { students: number };
}

export default function ClassesManagement() {
  const [list, setList] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStart, setBulkStart] = useState('1');
  const [bulkEnd, setBulkEnd] = useState('12');

  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  const loadData = async (isInitial = false) => {
    try {
      setLoading(true);
      const res = await api.get('/admin/classrooms');
      if (res.data?.success) {
        setList(res.data.data);
        if (isInitial && res.data.data.length === 0) {
          setShowBulkModal(true);
        }
      }
    } catch (err) {
      toast.error('Failed to load classes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(true); }, []);

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedClass(null);
    setGrade('');
    setSection('A');
    setAcademicYear(new Date().getFullYear().toString());
    setShowModal(true);
  };

  const handleOpenEdit = (c: ClassRecord) => {
    setModalType('edit');
    setSelectedClass(c);
    setGrade(c.grade);
    setSection(c.section);
    setAcademicYear(c.academicYear || new Date().getFullYear().toString());
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class? All associated students will lose their class assignment.')) return;
    try {
      const res = await api.delete(`/admin/classrooms/${id}`);
      if (res.data?.success) {
        toast.success('Class deleted successfully');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete class');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) {
      toast.error('Grade is required');
      return;
    }

    const payload = { grade, section, academicYear };

    try {
      if (modalType === 'create') {
        const res = await api.post('/admin/classrooms', payload);
        if (res.data?.success) {
          toast.success('Class created successfully');
          setShowModal(false);
          loadData();
        }
      } else if (selectedClass) {
        const res = await api.put(`/admin/classrooms/${selectedClass.id}`, payload);
        if (res.data?.success) {
          toast.success('Class updated successfully');
          setShowModal(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = parseInt(bulkStart);
    const end = parseInt(bulkEnd);
    if (isNaN(start) || isNaN(end) || start > end) {
      toast.error('Invalid grade range');
      return;
    }
    
    setLoading(true);
    setShowBulkModal(false);
    
    try {
      const promises = [];
      const year = new Date().getFullYear().toString();
      for (let i = start; i <= end; i++) {
        promises.push(api.post('/admin/classrooms', {
          grade: i.toString(),
          section: 'A',
          academicYear: year
        }));
      }
      await Promise.all(promises);
      toast.success(`Created classes ${start} to ${end} successfully!`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to create some classes');
      console.error(err);
      loadData();
    }
  };

  const filteredList = list.filter(c =>
    (c.grade || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.section || '').toLowerCase().includes(search.toLowerCase())
  );

  const sortedList = [...filteredList].sort((a, b) => {
    const numA = parseInt(a.grade);
    const numB = parseInt(b.grade);
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA === numB) return a.section.localeCompare(b.section);
      return numA - numB;
    }
    return (a.grade || '').localeCompare(b.grade || '');
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-600">Manage classes and student enrollments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowBulkModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm">
            <Layers size={18} /> Bulk Create
          </button>
          <button 
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm">
            <Plus size={18} /> Add Class
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by grade or section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <span className="text-gray-500">Loading classes...</span>
            </div>
          </div>
        ) : sortedList.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No classes found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedList.map((c) => (
              <div key={c.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Class {c.grade}</h3>
                    <p className="text-sm text-gray-600">Section {c.section}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenEdit(c)} className="p-1 hover:bg-white rounded text-gray-600" title="Edit"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-white rounded text-red-600" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white bg-opacity-50 px-3 py-2 rounded">
                  <Users size={16} />
                  <span>{c._count?.students || 0} Students</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-sm w-full bg-white rounded-lg shadow-xl border border-gray-200 p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {modalType === 'create' ? 'Add New Class' : 'Edit Class'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Grade *</label>
                <input type="text" required value={grade} onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g., 10" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Section</label>
                <input type="text" value={section} onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g., A" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Year</label>
                <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g., 2024" />
              </div>
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm text-sm mt-2">
                {modalType === 'create' ? 'Create Class' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-sm w-full bg-white rounded-lg shadow-xl border border-gray-200 p-6 relative">
            <button onClick={() => setShowBulkModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Auto-generate Classes
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              It looks like you don't have any classes yet. We can bulk generate them for you to save time!
            </p>
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">From Grade</label>
                  <input type="number" required value={bulkStart} onChange={(e) => setBulkStart(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">To Grade</label>
                  <input type="number" required value={bulkEnd} onChange={(e) => setBulkEnd(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
              <button type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm text-sm mt-2 flex items-center justify-center gap-2">
                <Layers size={18} /> Generate Classes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
