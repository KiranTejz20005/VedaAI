'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, Edit3, Trash2, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClassRecord {
  id: string;
  grade: string;
  section: string;
  _count?: { students: number };
}

export default function ClassesManagement() {
  const [list, setList] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/classrooms');
      if (res.data?.success) setList(res.data.data);
    } catch (err) {
      toast.error('Failed to load classes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredList = list.filter(c =>
    c.grade.toLowerCase().includes(search.toLowerCase()) ||
    c.section.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-600">Manage classes and student enrollments.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm">
          <Plus size={18} /> Add Class
        </button>
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
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No classes found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((c) => (
              <div key={c.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{c.grade}</h3>
                    <p className="text-sm text-gray-600">Section {c.section}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-white rounded text-gray-600" title="Edit"><Edit3 size={16} /></button>
                    <button className="p-1 hover:bg-white rounded text-red-600" title="Delete"><Trash2 size={16} /></button>
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
    </div>
  );
}
