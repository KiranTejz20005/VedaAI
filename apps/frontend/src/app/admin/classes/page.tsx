'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  User, 
  Users, 
  Activity,
  X,
  School,
  TrendingUp,
  Mail,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ClassRecord {
  id: string;
  grade: string;
  section: string;
  academicYear: string;
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

interface ClassAnalytics {
  classId: string;
  grade: string;
  section: string;
  attendancePct: number;
  assignmentCompletionPct: number;
  averageScore: number;
}

interface Institution {
  id: string;
  name: string;
}

interface FacultySummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function ClassesAdmin() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [insts, setInsts] = useState<Institution[]>([]);
  const [faculties, setFaculties] = useState<FacultySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Roster input modal state
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<ClassRecord | null>(null);
  const [rosterRawText, setRosterRawText] = useState(''); // Textarea containing comma or tab separated data

  // Stats drawer/panel state
  const [selectedClassForStats, setSelectedClassForStats] = useState<ClassRecord | null>(null);
  const [statsData, setStatsData] = useState<ClassAnalytics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Class creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [instId, setInstId] = useState('');
  const [facultyId, setFacultyId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classRes, instRes, userRes] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/institutions'),
        api.get('/admin/users'),
      ]);

      if (classRes.data?.success) setClasses(classRes.data.data);
      if (instRes.data?.success) setInsts(instRes.data.data);
      if (userRes.data?.success) {
        // filter faculties
        const list = userRes.data.data.filter((u: any) => u.role === 'FACULTY' || u.role === 'HOD');
        setFaculties(list);
      }
    } catch (err) {
      toast.error('Failed to load class listings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade || !section || !instId) {
      toast.error('Grade, Section, and Institution link are required.');
      return;
    }

    try {
      const res = await api.post('/admin/classes', {
        grade,
        section,
        academicYear,
        institutionId: instId,
        facultyId: facultyId || undefined,
      });

      if (res.data?.success) {
        toast.success('Academic Class created successfully!');
        setShowCreateModal(false);
        setGrade('');
        setSection('');
        setInstId('');
        setFacultyId('');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create class');
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class? This will wipe the associated student roster too.')) return;
    try {
      const res = await api.delete(`/admin/classes/${id}`);
      if (res.data?.success) {
        toast.success('Class deleted.');
        loadData();
        if (selectedClassForStats?.id === id) setSelectedClassForStats(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleOpenRoster = (cls: ClassRecord) => {
    setSelectedClassForRoster(cls);
    setRosterRawText('');
    setShowRosterModal(true);
  };

  const handleSaveRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForRoster) return;

    // Parse textarea text: each line represents a student in format: RollNo, Name, Email
    const lines = rosterRawText.split('\n').filter(l => l.trim().length > 0);
    const parsedStudents = [];

    for (const line of lines) {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts.length < 2) {
        toast.error(`Invalid formatting on line: "${line}". Format must be: RollNo, Name, Email`);
        return;
      }
      parsedStudents.push({
        rollNo: parts[0],
        name: parts[1],
        email: parts[2] || `${parts[1].toLowerCase().replace(/\s+/g, '.')}@school.edu`
      });
    }

    if (parsedStudents.length === 0) {
      toast.error('No students found to parse.');
      return;
    }

    try {
      const res = await api.post(`/admin/classes/${selectedClassForRoster.id}/assign-students`, {
        students: parsedStudents
      });

      if (res.data?.success) {
        toast.success(`Successfully populated class roster with ${parsedStudents.length} students.`);
        setShowRosterModal(false);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign students roster');
    }
  };

  const handleViewAnalytics = async (cls: ClassRecord) => {
    setSelectedClassForStats(cls);
    try {
      setStatsLoading(true);
      const res = await api.get(`/admin/classes/${cls.id}/analytics`);
      if (res.data?.success) {
        setStatsData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load class metrics');
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredClasses = classes.filter(cls => 
    `${cls.grade}-${cls.section}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Academic Classes</h2>
          <p className="text-gray-500 text-xs md:text-sm">Manage educational grades, assign faculty mentors, and import student lists.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm w-fit"
        >
          <Plus size={16} /> Create Class
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table column */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search classes by grade (e.g. Class 10)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">No active class records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5">Grade & Section</th>
                    <th className="py-2.5">Faculty Leader</th>
                    <th className="py-2.5 text-center">Students Roster</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredClasses.map((cls) => (
                    <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-gray-800 flex items-center gap-1.5">
                          <GraduationCap size={15} className="text-blue-600" />
                          {cls.grade} - {cls.section}
                        </div>
                        <div className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase">Year: {cls.academicYear}</div>
                      </td>
                      <td className="py-3 text-gray-600 font-semibold">
                        {cls.faculty ? (
                          <div className="flex items-center gap-1">
                            <User size={13} className="text-gray-400" />
                            {cls.faculty.firstName} {cls.faculty.lastName}
                          </div>
                        ) : (
                          <span className="text-gray-300 italic font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 text-center text-gray-700 font-bold">
                        <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-150 text-[10px]">
                          <Users size={12} className="text-gray-400" /> {cls._count.students}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewAnalytics(cls)}
                            className="px-2.5 py-1 hover:bg-gray-50 border border-gray-150 rounded-lg text-[9px] font-semibold text-gray-600 flex items-center gap-1"
                          >
                            <Activity size={12} /> Stats
                          </button>
                          <button
                            onClick={() => handleOpenRoster(cls)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-[9px]"
                          >
                            Edit Roster
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Delete class"
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

        {/* Stats Column */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-1 space-y-6">
          {!selectedClassForStats ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <GraduationCap className="text-gray-300 mb-2" size={32} />
              <h4 className="text-xs font-bold text-gray-400 uppercase">Class Telemetry</h4>
              <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Select a class and click "Stats" to monitor completion ratios, attendance, and aggregate scores.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase">Academic Telemetry</h3>
                  <span className="text-[10px] text-gray-500 font-semibold">{selectedClassForStats.grade} - {selectedClassForStats.section}</span>
                </div>
                <button onClick={() => setSelectedClassForStats(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>

              {statsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : statsData ? (
                <div className="space-y-6">
                  {/* Visual percentages */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-500">Student Attendance</span>
                        <span className="text-gray-900 font-bold">{statsData.attendancePct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${statsData.attendancePct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-500">Assignments Completed</span>
                        <span className="text-gray-900 font-bold">{statsData.assignmentCompletionPct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: `${statsData.assignmentCompletionPct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-500">Class Average Score</span>
                        <span className="text-gray-900 font-bold">{statsData.averageScore}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${statsData.averageScore}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex gap-2">
                    <TrendingUp className="text-purple-600 flex-shrink-0" size={18} />
                    <div className="text-[10px] leading-relaxed text-purple-800">
                      This division is performing <strong>5.4% above</strong> the institutional average. 87% of student assignments have been graded successfully by AI.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs">No analytics available for this class.</div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 1. Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Create Academic Class</h3>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Grade / Year *</label>
                  <input
                    type="text"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Class 10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Section A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Academic Cycle</label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 2026-2027"
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
                    <option value="">Choose Institution...</option>
                    {insts.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Faculty Mentor / Teacher</label>
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {faculties.map(fac => (
                    <option key={fac.id} value={fac.id}>{fac.firstName} {fac.lastName} ({fac.email})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs mt-2"
              >
                Save Class Config
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Class Roster Modal */}
      {showRosterModal && selectedClassForRoster && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowRosterModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Edit Class Roster</h3>
            <p className="text-[10px] text-gray-500 mb-4 font-semibold">Import students roster for class <strong>{selectedClassForRoster.grade} - {selectedClassForRoster.section}</strong>.</p>
            
            <form onSubmit={handleSaveRoster} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Roster CSV rows (Format: Roll No, Full Name, Email)</label>
                <textarea
                  required
                  rows={8}
                  value={rosterRawText}
                  onChange={(e) => setRosterRawText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[10px] font-mono focus:outline-none focus:border-blue-500"
                  placeholder="R-101, Alice Johnson, alice.johnson@school.edu&#10;R-102, Bob Smith, bob.smith@school.edu"
                />
              </div>

              <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-[10px] font-medium leading-relaxed">
                Provide one student per line. If email is omitted, the system will automatically format it based on the name.
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                Re-populate Student Roster
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
