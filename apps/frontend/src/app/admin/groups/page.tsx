'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  UsersRound, 
  Plus, 
  Search, 
  Upload, 
  FileSpreadsheet, 
  X,
  User,
  Trash2,
  Bookmark,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GroupRecord {
  id: string;
  name: string;
  subject: string;
  institutionId: string;
  facultyId: string | null;
  faculty?: {
    firstName: string;
    lastName: string;
  } | null;
  _count: {
    students: number;
  };
}

interface Institution {
  id: string;
  name: string;
}

interface FacultySummary {
  id: string;
  firstName: string;
  lastName: string;
}

interface PaperSummary {
  id: string;
  title: string;
}

export default function GroupsAdmin() {
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [insts, setInsts] = useState<Institution[]>([]);
  const [faculties, setFaculties] = useState<FacultySummary[]>([]);
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);

  // Forms
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('General');
  const [instId, setInstId] = useState('');
  const [facultyId, setFacultyId] = useState('');

  // CSV file state
  const [selectedGroup, setSelectedGroup] = useState<GroupRecord | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<Array<{ name: string; rollNo?: string; email?: string }>>([]);

  // Paper assignment state
  const [selectedPaperId, setSelectedPaperId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupRes, instRes, userRes, paperRes] = await Promise.all([
        api.get('/admin/groups'),
        api.get('/admin/institutions'),
        api.get('/admin/users'),
        api.get('/admin/papers'),
      ]);

      if (groupRes.data?.success) setGroups(groupRes.data.data);
      if (instRes.data?.success) setInsts(instRes.data.data);
      if (userRes.data?.success) {
        setFaculties(userRes.data.data.filter((u: any) => u.role === 'FACULTY' || u.role === 'HOD'));
      }
      if (paperRes.data?.success) {
        setPapers(paperRes.data.data.map((p: any) => ({ id: p.id, title: p.title })));
      }
    } catch (err) {
      toast.error('Failed to load study groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !instId) {
      toast.error('Group Name and Institution are required.');
      return;
    }

    try {
      const res = await api.post('/admin/groups', {
        name,
        subject,
        institutionId: instId,
        facultyId: facultyId || undefined,
      });

      if (res.data?.success) {
        toast.success('Study Group synthesized successfully!');
        setShowCreateModal(false);
        setName('');
        setSubject('General');
        setInstId('');
        setFacultyId('');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Group synthesis failed');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study group?')) return;
    try {
      const res = await api.delete(`/admin/groups/${id}`);
      if (res.data?.success) {
        toast.success('Study group deleted.');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  // CSV parsing logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      const items = [];

      for (let i = 0; i < lines.length; i++) {
        // Skip header row if present
        if (i === 0 && lines[0].toLowerCase().includes('name') && lines[0].toLowerCase().includes('roll')) {
          continue;
        }
        
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length >= 1 && cols[0]) {
          items.push({
            name: cols[0],
            rollNo: cols[1] || `R-${Math.floor(1000 + Math.random() * 9000)}`,
            email: cols[2] || `${cols[0].toLowerCase().replace(/\s+/g, '.')}@school.edu`
          });
        }
      }
      setCsvPreview(items.slice(0, 10)); // preview first 10 rows
    };
    reader.readAsText(file);
  };

  const handleUploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !csvFile) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      const parsedStudents = [];

      for (let i = 0; i < lines.length; i++) {
        // Skip header row
        if (i === 0 && lines[0].toLowerCase().includes('name')) continue;
        
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols[0]) {
          parsedStudents.push({
            name: cols[0],
            rollNo: cols[1] || undefined,
            email: cols[2] || undefined,
          });
        }
      }

      try {
        const res = await api.post(`/admin/groups/${selectedGroup.id}/import`, {
          students: parsedStudents
        });

        if (res.data?.success) {
          toast.success(`Successfully uploaded CSV and imported ${parsedStudents.length} students.`);
          setShowCsvModal(false);
          setCsvFile(null);
          setCsvPreview([]);
          loadData();
        }
      } catch (err: any) {
        toast.error(err.message || 'CSV upload failed');
      }
    };
    reader.readAsText(csvFile);
  };

  const handleAssignPaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedPaperId) return;

    try {
      const res = await api.post(`/admin/groups/${selectedGroup.id}/assign-papers`, {
        paperId: selectedPaperId
      });

      if (res.data?.success) {
        toast.success('Paper successfully aligned with study group.');
        setShowPaperModal(false);
        setSelectedPaperId('');
        setSelectedGroup(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to align paper');
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Study Groups</h2>
          <p className="text-gray-500 text-xs md:text-sm">Synthesize specific course groups, align syllabus topics, and bulk import rosters.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm w-fit"
        >
          <Plus size={16} /> Synthesize Group
        </button>
      </div>

      {/* Table grid layout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search study groups by name or subject tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No active study groups configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Study Group & Course</th>
                  <th className="py-2.5">Mentor Faculty</th>
                  <th className="py-2.5 text-center">Student Enrolls</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredGroups.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-gray-800 flex items-center gap-1.5">
                        <UsersRound size={15} className="text-blue-600" />
                        {g.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase">Course: {g.subject}</div>
                    </td>
                    <td className="py-3 text-gray-600 font-semibold">
                      {g.faculty ? (
                        <div className="flex items-center gap-1">
                          <User size={13} className="text-gray-400" />
                          {g.faculty.firstName} {g.faculty.lastName}
                        </div>
                      ) : (
                        <span className="text-gray-300 italic font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 text-center text-gray-700 font-bold">
                      <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-100 text-[10px]">
                        {g._count.students} students
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedGroup(g);
                            setShowPaperModal(true);
                          }}
                          className="px-2.5 py-1 hover:bg-gray-50 border border-gray-150 rounded-lg text-[9px] font-semibold text-gray-600 flex items-center gap-1"
                        >
                          <Bookmark size={12} /> Link Paper
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGroup(g);
                            setCsvFile(null);
                            setCsvPreview([]);
                            setShowCsvModal(true);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-[9px] flex items-center gap-1"
                        >
                          <Upload size={12} /> CSV Import
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(g.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
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

      {/* 1. Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Synthesize Course Group</h3>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Stanford CS-101 A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Course Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Institution Link *</label>
                  <select
                    required
                    value={instId}
                    onChange={(e) => setInstId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose School...</option>
                    {insts.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Faculty Advisor / Mentor</label>
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {faculties.map(fac => (
                    <option key={fac.id} value={fac.id}>{fac.firstName} {fac.lastName}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs mt-2"
              >
                Synthesize Group
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. CSV Bulk Import Modal */}
      {showCsvModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowCsvModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">CSV Bulk Import Students</h3>
            <p className="text-[10px] text-gray-500 mb-4 font-semibold">Bulk import students for study group <strong>{selectedGroup.name}</strong>.</p>
            
            <form onSubmit={handleUploadCsv} className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileSpreadsheet className="mx-auto text-blue-600 mb-2" size={32} />
                <span className="text-xs font-bold text-gray-800 block">
                  {csvFile ? csvFile.name : 'Select student_list.csv file'}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 block">Drag and drop or click to browse.</span>
              </div>

              {csvPreview.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-1.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">CSV File Roster Preview (First {csvPreview.length} rows)</span>
                  <div className="max-h-[120px] overflow-y-auto text-[9px] font-mono text-gray-600 divide-y divide-gray-100">
                    {csvPreview.map((item, idx) => (
                      <div key={idx} className="py-1 flex justify-between">
                        <span>{item.name} ({item.rollNo})</span>
                        <span className="text-gray-400">{item.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!csvFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs disabled:opacity-50"
              >
                Execute Bulk Import
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Link Paper Modal */}
      {showPaperModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowPaperModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Link Exam Paper</h3>
            <p className="text-[10px] text-gray-500 mb-4 font-semibold">Assign an existing assessment paper to study group <strong>{selectedGroup.name}</strong>.</p>

            <form onSubmit={handleAssignPaperSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Select Paper</label>
                <select
                  required
                  value={selectedPaperId}
                  onChange={(e) => setSelectedPaperId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select paper...</option>
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                Assign Assessment Paper
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
