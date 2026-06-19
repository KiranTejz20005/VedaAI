'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  ClipboardList, 
  Search, 
  XSquare, 
  Unlock, 
  Calendar,
  Download,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  duration: number;
  totalMarks: number;
  status: string;
  createdAt: string;
}

export default function AssignmentsAdmin() {
  const [list, setList] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Date edit modal states
  const [showDateModal, setShowDateModal] = useState(false);
  const [modalType, setModalType] = useState<'reassign' | 'reopen'>('reassign');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/assignments');
      if (res.data?.success) {
        setList(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load assignments list');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm('Are you sure you want to close this assignment? Students will no longer be able to submit.')) return;
    try {
      const res = await api.put(`/admin/assignments/${id}/close`);
      if (res.data?.success) {
        toast.success('Assignment closed.');
        loadAssignments();
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleOpenDateChange = (asg: Assignment, type: 'reassign' | 'reopen') => {
    setSelectedAssignment(asg);
    setModalType(type);
    // Format date string to match datetime-local input (YYYY-MM-DDTHH:MM)
    const d = new Date(asg.dueDate);
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
    setDueDate(localISOTime);
    setShowDateModal(true);
  };

  const handleDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !dueDate) return;

    try {
      const endpoint = modalType === 'reassign' 
        ? `/admin/assignments/${selectedAssignment.id}/reassign`
        : `/admin/assignments/${selectedAssignment.id}/reopen`;

      const payload = modalType === 'reassign' ? { dueDate } : { dueDate };
      const res = modalType === 'reassign' 
        ? await api.post(endpoint, payload)
        : await api.put(endpoint, payload);

      if (res.data?.success) {
        toast.success(`Assignment successfully ${modalType === 'reassign' ? 'rescheduled' : 'reopened'}.`);
        setShowDateModal(false);
        loadAssignments();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update assignment date');
    }
  };

  const handleExportGrades = async (id: string, title: string) => {
    try {
      const res = await api.get(`/admin/assignments/${id}/export`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `grades_${title.toLowerCase().replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Grades exported successfully!');
    } catch (err) {
      toast.error('Failed to export grades CSV');
    }
  };

  const filteredList = list.filter(asg => 
    asg.title.toLowerCase().includes(search.toLowerCase()) ||
    asg.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Assignments</h2>
        <p className="text-gray-500 text-xs md:text-sm">Manage student homework deadlines, toggle submission states, and export grade CSV files.</p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search assignments by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No assignments match your search query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Assignment & Subject</th>
                  <th className="py-2.5">Due Date Deadline</th>
                  <th className="py-2.5">Marks & Duration</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredList.map((asg) => (
                  <tr key={asg.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-gray-800 flex items-center gap-1.5">
                        <ClipboardList size={15} className="text-purple-600" />
                        {asg.title}
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase">Subject: {asg.subject}</div>
                    </td>
                    <td className="py-3 text-gray-500 font-semibold">
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-gray-400" />
                        {new Date(asg.dueDate).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 text-gray-400 font-semibold">
                      {asg.totalMarks} Marks | {asg.duration} mins
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        asg.status === 'closed' 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {asg.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleExportGrades(asg.id, asg.title)}
                          className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-150 rounded-lg text-[9px] font-semibold flex items-center gap-1"
                        >
                          <Download size={11} /> Export Grades
                        </button>
                        <button
                          onClick={() => handleOpenDateChange(asg, 'reassign')}
                          className="p-1.5 hover:bg-gray-100 rounded text-blue-600"
                          title="Reschedule Due Date"
                        >
                          <Calendar size={14} />
                        </button>
                        {asg.status === 'closed' ? (
                          <button
                            onClick={() => handleOpenDateChange(asg, 'reopen')}
                            className="p-1.5 hover:bg-gray-100 rounded text-green-600"
                            title="Reopen Assignment"
                          >
                            <Unlock size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClose(asg.id)}
                            className="p-1.5 hover:bg-gray-100 rounded text-red-500"
                            title="Close Assignment"
                          >
                            <XSquare size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Date edit Modal */}
      {showDateModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowDateModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
              {modalType === 'reassign' ? 'Reschedule Assignment' : 'Reopen Assignment'}
            </h3>
            <p className="text-[10px] text-gray-500 mb-4 font-semibold">Specify a new submission deadline for <strong>{selectedAssignment.title}</strong>.</p>

            <form onSubmit={handleDateSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Due Date Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                {modalType === 'reassign' ? 'Confirm Reschedule' : 'Reopen & Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
