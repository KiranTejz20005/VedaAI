'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, Edit3, Trash2, Users, Loader2, X, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuthStore } from '@/store/admin-auth.store';

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

  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [viewingClass, setViewingClass] = useState<ClassRecord | null>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  
  const [analytics, setAnalytics] = useState<any>(null);

  const { activeOrganizationId } = useAdminAuthStore();

  const loadData = async (isInitial = false) => {
    try {
      setLoading(true);
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const [res, analyticsRes] = await Promise.all([
        api.get(`/admin/classrooms${queryParams}`),
        api.get(`/admin/analytics/dashboard${queryParams}`).catch(() => null)
      ]);
      
      if (res.data?.success) {
        setList(res.data.data);
        if (isInitial && res.data.data.length === 0) {
          setShowBulkModal(true);
        }
      }
      if (analyticsRes?.data?.success) {
        setAnalytics(analyticsRes.data.data);
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
    // Optimistic update - remove immediately from UI
    setList(prev => prev.filter(c => c.id !== id));
    const toastId = toast.loading('Deleting class...');
    try {
      const res = await api.delete(`/admin/classrooms/${id}`);
      if (res.data?.success) {
        toast.success('Class deleted successfully', { id: toastId });
        loadData(); // re-sync in background
      } else {
        toast.error('Failed to delete class', { id: toastId });
        loadData(); // revert
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to delete class', { id: toastId });
      loadData(); // revert optimistic update
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) {
      toast.error('Grade is required');
      return;
    }

    const payload = { grade, section, academicYear };
    setSubmitting(true);
    const toastId = toast.loading(modalType === 'create' ? 'Creating class...' : 'Updating class...');
    try {
      if (modalType === 'create') {
        const res = await api.post('/admin/classrooms', payload);
        if (res.data?.success) {
          toast.success('Class created successfully!', { id: toastId });
          setShowModal(false);
          loadData();
        }
      } else if (selectedClass) {
        const res = await api.put(`/admin/classrooms/${selectedClass.id}`, payload);
        if (res.data?.success) {
          // Optimistic update in list immediately
          setList(prev => prev.map(c => c.id === selectedClass.id ? { ...c, grade, section, academicYear } : c));
          toast.success('Class updated successfully!', { id: toastId });
          setShowModal(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Operation failed', { id: toastId });
    } finally {
      setSubmitting(false);
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

  const handleViewStudents = async (c: ClassRecord) => {
    setViewingClass(c);
    setShowStudentsModal(true);
    setStudentsLoading(true);
    try {
      const res = await api.get('/admin/students');
      if (res.data?.success) {
        const filtered = res.data.data.filter((s: any) => s.classId === c.id);
        setClassStudents(filtered);
        setStudentSearch('');
      }
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setStudentsLoading(false);
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
      if (numA === numB) return (a.section || '').localeCompare(b.section || '');
      return numA - numB;
    }
    return (a.grade || '').localeCompare(b.grade || '');
  });

  const filteredClassStudents = classStudents.filter(s => 
    `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.rollNo || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="text-gray-500">Dashboard /</span>
        <span className="font-bold text-gray-900">Classes</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Class Management</h1>
          <p className="text-gray-500 mt-1 text-[15px]">Manage classes and student enrollments across the organization.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl font-semibold text-sm transition-all shadow-sm">
            <Layers size={16} /> Bulk Create
          </button>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold text-sm transition-all shadow-sm">
            <Plus size={16} /> Add Class
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-[#F97316] rounded-xl flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Classes</div>
            <div className="text-2xl font-bold text-gray-900">{analytics?.totalClasses || list.length || 0}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Active Students</div>
            <div className="text-2xl font-bold text-gray-900">{analytics?.totalStudents || 0}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Faculty</div>
            <div className="text-2xl font-bold text-gray-900">{analytics?.totalFaculty || 0}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Attendance Rate</div>
            <div className="text-2xl font-bold text-gray-900">94%</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by grade or section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50/50"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-[#004EEB]" />
              <span className="text-gray-500">Loading classes...</span>
            </div>
          </div>
        ) : sortedList.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No classes found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedList.map((c) => {
              // Real progress could be tracked from analytics or class properties. Defaulting to empty/neutral state if unavailable.
              const progress = c.progress || 0; // assuming progress can be injected from backend, else 0
              let statusText = 'Active';
              let statusBg = 'bg-blue-50';
              let statusColor = 'text-blue-600';
              if (progress >= 80) { statusText = 'Top Tier'; statusBg = 'bg-green-50'; statusColor = 'text-green-600'; }
              else if (progress > 0 && progress <= 50) { statusText = 'Needs Review'; statusBg = 'bg-red-50'; statusColor = 'text-red-600'; }

              return (
                <div key={c.id} onClick={() => handleViewStudents(c)} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-xl text-gray-900">Class {c.grade}</h3>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleOpenEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors" title="Edit"><Edit3 size={16} /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-500 mb-5">Section {c.section}</p>

                    <div className="flex items-center gap-2 mb-8">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100/80 px-2.5 py-1 rounded-full">
                        <Users size={14} />
                        <span>{c._count?.students || 0} Students</span>
                      </div>
                      <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBg} ${statusColor}`}>
                        {statusText === 'Top Tier' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>}
                        {statusText === 'Needs Review' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>}
                        {statusText}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm text-sm mt-2 flex items-center justify-center gap-2">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Saving...' : (modalType === 'create' ? 'Create Class' : 'Save Changes')}
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

      {showStudentsModal && viewingClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl border border-gray-200 p-6 relative max-h-[80vh] flex flex-col">
            <button onClick={() => setShowStudentsModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Students in Class {viewingClass.grade} - Section {viewingClass.section}
            </h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search students by name, email, or roll no..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-[200px] pr-2">
              {studentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                </div>
              ) : classStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No students found in this class.
                </div>
              ) : filteredClassStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No students match your search.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredClassStudents.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <Users size={16} className="text-blue-600" />
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{s.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-gray-700 font-semibold">{s.rollNo || 'N/A'}</div>
                        <div className={`text-xs px-2 py-1 rounded-full mt-1 inline-block font-semibold ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {s.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
