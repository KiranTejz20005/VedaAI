'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import {
  Upload,
  UserPlus,
  Search,
  Download,
  MoreVertical,
  Key,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  GraduationCap,
  Users as UsersIcon,
  Radio
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';

interface UnifiedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'FACULTY' | 'STUDENT';
  status: string;
  department?: { id: string; name: string } | null;
  lastActivity?: string;
  institution?: string;
  departmentId?: string | null;
  designation?: string;
  subjects?: string[];
  rollNo?: string;
  classId?: string | null;
  phone?: string | null;
}

interface Department { id: string; name: string; }
interface ClassRecord { id: string; grade: string; section: string; }

const getTimeAgo = (dateStr: string | Date | undefined) => {
  if (!dateStr) return 'Offline';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Offline (${diffInDays}d)`;
  return `Offline`;
};

export default function DirectoryOverview() {
  const { user } = useAuthStore();
  const { activeOrganizationId, availableOrganizations } = useAdminAuthStore();

  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Faculty' | 'Students'>('All');
  const [search, setSearch] = useState('');
  
  // Table Dropdown state
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => setActiveDropdownId(null);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [modalRole, setModalRole] = useState<'FACULTY' | 'STUDENT'>('FACULTY');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);

  // Add User Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('');
  const [subjects, setSubjects] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [classId, setClassId] = useState('');
  const [phone, setPhone] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Stats
  const [totalFaculty, setTotalFaculty] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);

  const activeOrg = availableOrganizations.find(o => o.id === activeOrganizationId);
  const orgName = activeOrg?.name || 'Institution';

  let emailDomain = 'institution.edu';
  if (user?.role === 'SUPER_ADMIN' && activeOrg?.email) emailDomain = activeOrg.email.split('@')[1];
  else if (user?.email) emailDomain = user.email.split('@')[1];

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = user?.role === 'SUPER_ADMIN' && activeOrganizationId 
        ? `?organizationId=${activeOrganizationId}` 
        : '';
        
      const [facRes, stuRes, deptRes, clsRes] = await Promise.all([
        api.get(`/admin/faculty${queryParams}`),
        api.get(`/admin/students${queryParams}`),
        api.get(`/admin/departments${queryParams}`),
        api.get(`/admin/classrooms${queryParams}`)
      ]);

      const facultyData = facRes.data?.data || [];
      const studentsData = stuRes.data?.data || [];
      
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
      if (clsRes.data?.success) setClasses(clsRes.data.data);

      setTotalFaculty(facultyData.length);
      setTotalStudents(studentsData.length);

      const unified: UnifiedUser[] = [
        ...facultyData.map((f: any) => ({
          ...f,
          role: 'FACULTY',
          institution: orgName,
          lastActivity: getTimeAgo(f.updatedAt)
        })),
        ...studentsData.map((s: any) => ({
          ...s,
          role: 'STUDENT',
          institution: orgName,
          lastActivity: getTimeAgo(s.updatedAt)
        }))
      ];

      setUsers(unified.sort((a, b) => a.firstName.localeCompare(b.firstName)));
      setActiveSessions(unified.filter(u => u.status === 'ACTIVE').length);
    } catch (err) {
      toast.error('Failed to load directory data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user?.role === 'SUPER_ADMIN' && !activeOrganizationId) return;
    loadData(); 
  }, [user?.role, activeOrganizationId, orgName]);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (activeTab === 'Faculty') filtered = filtered.filter(u => u.role === 'FACULTY');
    if (activeTab === 'Students') filtered = filtered.filter(u => u.role === 'STUDENT');
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(u => 
        u.firstName.toLowerCase().includes(q) || 
        u.lastName.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        (u.institution && u.institution.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [users, activeTab, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleOpenAddModal = () => {
    setModalRole('FACULTY');
    setFirstName(''); setLastName(''); setEmailPrefix('');
    setDepartmentId(''); setDesignation(''); setSubjects('');
    setClassId(''); setPhone(''); setRollNo('');
    setShowAddModal(true);
  };

  useEffect(() => {
    if (showAddModal && modalRole === 'STUDENT') {
      const fName = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const lName = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (fName || lName) setEmailPrefix(`${fName}${lName}`);
      else setEmailPrefix('');
    }
  }, [firstName, lastName, modalRole, showAddModal]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !emailPrefix) {
      return toast.error('First Name, Last Name, and Email Prefix are required.');
    }
    
    let domain = 'vidyaai.com';
    if (user?.role === 'SUPER_ADMIN' && activeOrg?.email) domain = activeOrg.email.split('@')[1];
    else if (user?.email) domain = user.email.split('@')[1];

    const fullEmail = `${emailPrefix}@${domain}`;
    const payload: Record<string, unknown> = {
      firstName, lastName, email: fullEmail, role: modalRole,
      organizationId: user?.role === 'SUPER_ADMIN' ? activeOrganizationId : undefined
    };

    try {
      if (modalRole === 'FACULTY') {
        Object.assign(payload, {
          departmentId: departmentId || undefined,
          designation: designation || undefined,
          subjects: subjects ? subjects.split(',').map(s => s.trim()).filter(Boolean) : []
        });
        const res = await api.post('/admin/faculty', payload);
        if (res.data?.success) toast.success('Faculty added successfully!');
      } else {
        Object.assign(payload, {
          rollNo: rollNo || undefined,
          classId: classId || undefined,
          phone: phone || undefined
        });
        const res = await api.post('/admin/students', payload);
        if (res.data?.success) toast.success('Student added successfully!');
      }
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return toast.error('Please select a CSV file');
    
    const formData = new FormData();
    formData.append('file', csvFile);
    if (user?.role === 'SUPER_ADMIN' && activeOrganizationId) {
      formData.append('organizationId', activeOrganizationId);
    }

    try {
      const endpoint = modalRole === 'FACULTY' ? '/admin/faculty/import' : '/admin/students/import';
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        toast.success(`${modalRole} imported successfully`);
        setShowBulkModal(false);
        setCsvFile(null);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    }
  };

  const handleAction = (action: string, u: UnifiedUser) => {
    if (action === 'delete') {
      toast.success(`Mock: Deleted ${u.firstName}`);
    } else if (action === 'reset') {
      toast.success(`Mock: Sent password reset to ${u.email}`);
    } else if (action === 'manage') {
      toast.success(`Mock: Opened access management for ${u.firstName}`);
    }
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return toast.error('No users to export');
    
    const headers = ['Name,Email,Role,Institution,Status,Last Activity'];
    const rows = filteredUsers.map(u => 
      `"${u.firstName} ${u.lastName}","${u.email}","${u.role}","${u.institution || ''}","${u.status}","${u.lastActivity || ''}"`
    );
    const csvContent = headers.concat(rows).join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'directory_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export started');
  };

  const getInitials = (f: string, l: string) => `${f?.[0]||''}${l?.[0]||''}`.toUpperCase();

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Directory Overview</h1>
          <p className="text-gray-500 mt-1 text-[15px]">Manage global user access across all integrated educational institutions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-all shadow-sm">
            <Upload size={16} />
            Bulk Upload
          </button>
          <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-4 py-2.5 bg-[#004EEB] hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm">
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-500 text-sm font-medium">Total Faculty</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{totalFaculty.toLocaleString()}</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-500 text-sm font-medium">Total Students</span>
            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <UsersIcon size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{totalStudents.toLocaleString()}</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">+4.2%</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-500 text-sm font-medium">Active Sessions</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Radio size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{activeSessions.toLocaleString()}</span>
            <span className="text-xs font-medium text-gray-500">Live now</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-50/80 p-1 rounded-xl">
          {(['All', 'Faculty', 'Students'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 flex-1 md:max-w-[400px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by institution or name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50/50"
            />
          </div>
          <button className="px-4 py-2 border border-gray-200 text-gray-700 bg-gray-50/50 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors whitespace-nowrap">
            Status: Active <ChevronDownIcon />
          </button>
          <button onClick={handleExportCSV} className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors" title="Export to CSV">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Institution</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                      Loading directory...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100/50 shrink-0">
                          {getInitials(u.firstName, u.lastName)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md tracking-wide ${
                        u.role === 'FACULTY' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {u.institution || 'Unknown Institution'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {u.lastActivity}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleAction('reset', u)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Reset Password">
                          <Key size={16} />
                        </button>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button 
                            title="More options"
                            onClick={() => setActiveDropdownId(activeDropdownId === u.id ? null : u.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          <div className={`absolute right-0 top-full mt-1 w-32 bg-white border border-gray-100 rounded-xl shadow-lg transition-all z-50 flex flex-col overflow-hidden ${activeDropdownId === u.id ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                            <button onClick={() => { handleAction('manage', u); setActiveDropdownId(null); }} className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 font-medium">Manage Access</button>
                            <button onClick={() => { handleAction('delete', u); setActiveDropdownId(null); }} className="px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 font-medium">Remove User</button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} results</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors bg-white shadow-sm font-medium text-gray-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Layout */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Pending Requests */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Pending Requests</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-2xl gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">External Researcher Access</div>
                    <div className="text-sm text-gray-500">Request from: Imperial College London</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toast.success('Mock: Request rejected')} className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors px-3 py-2">Reject</button>
                  <button onClick={() => toast.success('Mock: Request approved')} className="px-4 py-2 bg-[#004EEB] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">Approve</button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-2xl gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <UsersIcon size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Bulk Student Onboarding</div>
                    <div className="text-sm text-gray-500">420 seats requested by University of Toronto</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toast.success('Mock: Request rejected')} className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors px-3 py-2">Reject</button>
                  <button onClick={() => toast.success('Mock: Request approved')} className="px-4 py-2 bg-[#004EEB] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">Approve</button>
                </div>
              </div>
            </div>

            <button className="w-full mt-4 py-3 border border-dashed border-gray-300 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50/50 transition-colors">
              View All (12 Pending)
            </button>
          </div>

          {/* Global Security Status */}
          <div className="bg-[#24272D] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#407BFF] font-medium text-sm mb-4">
                <ShieldCheck size={18} />
                Global Security Status
              </div>
              <h2 className="text-white text-xl font-bold mb-3">Access Control Integrity</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Automated permission auditing is active. All institutional nodes are currently synced with Vidya's core protocol.
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-medium">
                <span>Audit Progress</span>
                <span>94% Complete</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mb-6 overflow-hidden">
                <div className="bg-[#407BFF] h-1.5 rounded-full w-[94%]"></div>
              </div>
              <button onClick={() => {
                toast.loading('Running global permission audit...', { duration: 3000 });
                setTimeout(() => toast.success('Audit complete. No anomalies detected.'), 3000);
              }} className="w-full bg-white text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                Run Global Audit
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" checked={modalRole === 'FACULTY'} onChange={() => setModalRole('FACULTY')} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Faculty</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" checked={modalRole === 'STUDENT'} onChange={() => setModalRole('STUDENT')} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Student</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                  <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                  <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Prefix</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500">
                  <input required type="text" value={emailPrefix} onChange={e => setEmailPrefix(e.target.value)} className="flex-1 px-4 py-2.5 bg-transparent focus:outline-none" />
                  <span className="px-4 py-2.5 text-gray-500 border-l border-gray-200 font-medium">@{emailDomain}</span>
                </div>
              </div>

              {modalRole === 'FACULTY' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                    <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white">
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Class / Section</label>
                      <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white">
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.grade} - {c.section}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Roll No (Optional)</label>
                      <input type="text" value={rollNo} onChange={e => setRollNo(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#004EEB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-colors">Add {modalRole === 'FACULTY' ? 'Faculty' : 'Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Bulk Upload Users</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleBulkUpload} className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Import Target</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="bulk_role" checked={modalRole === 'FACULTY'} onChange={() => setModalRole('FACULTY')} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Faculty CSV</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="bulk_role" checked={modalRole === 'STUDENT'} onChange={() => setModalRole('STUDENT')} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Students CSV</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select File</label>
                <label className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                  <Upload size={32} className="text-blue-500 mb-3" />
                  <span className="text-sm font-medium text-gray-700 mb-1">Click to browse or drag and drop</span>
                  <span className="text-xs text-gray-500">CSV format only</span>
                  <input type="file" accept=".csv" className="hidden" onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setCsvFile(e.target.files[0]);
                    }
                  }} />
                </label>
                {csvFile && (
                  <div className="mt-3 text-sm text-green-600 font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} /> {csvFile.name}
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#004EEB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-50" disabled={!csvFile}>
                  Upload & Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}
