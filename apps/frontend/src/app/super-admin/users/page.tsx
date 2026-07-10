'use client';
import { NativeSelect } from '@/components/ui/native-select';


import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Upload,
  UserPlus,
  ChevronDown,
  Building,
  Calendar,
  X,
  Search,
  MoreVertical,
  Zap
} from 'lucide-react';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useUserFilters } from '@/hooks/useUserFilters';

interface UnifiedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  institution: string;
  lastActivity: string;
}

interface DirectoryData {
  users: UnifiedUser[];
  stats: {
    activeUsers: number;
    inactiveUsers: number;
    crossOrgEngagement: number;
    orgBreakdown: { name: string; count: number; id: string | null; code: string }[];
  }
}

export default function GlobalUsersDirectory() {
  const [data, setData] = useState<DirectoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Menus
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STUDENT',
    organizationId: '',
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Bulk Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false);

  // Filters
  const {
    roleFilter, setRoleFilter,
    orgFilter, setOrgFilter,
    statusFilter, setStatusFilter,
    periodFilter, setPeriodFilter,
    searchQuery, setSearchQuery,
    sortField, setSortField,
    sortOrder, setSortOrder,
    clearFilters,
    filteredUsers
  } = useUserFilters(data?.users || []);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, orgFilter, statusFilter, periodFilter, searchQuery, sortField, sortOrder]);

  const fetchDirectoryData = useCallback(async () => {
    try {
      const response = await api.get('/admin/users/global-directory');
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load directory data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectoryData();
    const interval = setInterval(fetchDirectoryData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [fetchDirectoryData]);

  const handleCreateUser = async () => {
    try {
      setIsCreatingUser(true);
      setCreateUserError(null);
      await api.post('/admin/users', newUserForm);
      setIsNewUserOpen(false);
      setNewUserForm({ firstName: '', lastName: '', email: '', role: 'STUDENT', organizationId: '' });
      setIsEmailManuallyEdited(false);
      fetchDirectoryData(); // Refresh list
    } catch (err: any) {
      setCreateUserError(err.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      setImportError('Please select a file to import.');
      return;
    }
    try {
      setIsImporting(true);
      setImportError(null);
      
      const formData = new FormData();
      formData.append('file', importFile);
      
      // Need to post as multipart/form-data
      const res = await api.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setImportResult(res.data || res);
      fetchDirectoryData();
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    if (isEmailManuallyEdited) return;
    if (!newUserForm.firstName && !newUserForm.lastName) {
      setNewUserForm(prev => ({ ...prev, email: '' }));
      return;
    }
    
    let domain = 'vidya.ai'; // default domain
    
    if (newUserForm.organizationId && data?.stats?.orgBreakdown) {
      const org = data.stats.orgBreakdown.find(o => o.id === newUserForm.organizationId);
      if (org && org.code) {
        domain = org.code.toLowerCase() + '.com';
      } else if (org && org.name) {
        domain = org.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
      }
    }
    
    const first = newUserForm.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const last = newUserForm.lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let emailPrefix = '';
    if (first && last) emailPrefix = `${first}${last}`;
    else if (first) emailPrefix = first;
    else if (last) emailPrefix = last;
    
    if (emailPrefix) {
      setNewUserForm(prev => ({ ...prev, email: `${emailPrefix}@${domain}` }));
    }
  }, [newUserForm.firstName, newUserForm.lastName, newUserForm.organizationId, data?.stats?.orgBreakdown, isEmailManuallyEdited]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (isLoading && !data) return <LoadingState lines={8} />;
  if (error && !data) return <ErrorState message={error} onRetry={fetchDirectoryData} />;

  const getInitials = (f: string, l: string) => `${f?.[0]||''}${l?.[0]||''}`.toUpperCase();

  const getRoleStyle = (role: string, status: string) => {
    if (status === 'SUSPENDED') return { bg: '#FEE2E2', color: '#DC2626', label: 'Suspended' };
    if (role === 'TEACHER') return { bg: '#F3F4F6', color: '#4B5563', label: 'Faculty' };
    if (role === 'ORG_ADMIN') return { bg: '#FFF7ED', color: '#EA580C', label: 'Org Admin' };
    if (role === 'STUDENT') return { bg: '#F3F4F6', color: '#4B5563', label: 'Student' };
    if (role === 'SUPER_ADMIN') return { bg: '#EFF6FF', color: '#3B82F6', label: 'Super Admin' };
    return { bg: '#F3F4F6', color: '#4B5563', label: role };
  };

  const { stats } = data || { stats: { activeUsers: 0, inactiveUsers: 0, crossOrgEngagement: 0, orgBreakdown: [] } };

  // Calculate dynamic bar chart heights (max 120px)
  const totalBarCount = stats.activeUsers + stats.inactiveUsers;
  const activeHeight = totalBarCount > 0 ? (stats.activeUsers / totalBarCount) * 120 : 0;
  const inactiveHeight = totalBarCount > 0 ? (stats.inactiveUsers / totalBarCount) * 120 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%', paddingBottom: 48 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Directory / <span style={{ color: '#111827' }}>Global Users</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '4px 0 8px 0' }}>Global User Directory</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0, maxWidth: 600, lineHeight: 1.5 }}>
              Manage cross-ecosystem identities, synchronize permissions, and audit activity across all organizations within the Vidya AI network.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => setIsBulkImportOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <Upload size={16} /> Bulk Import
            </button>
            <button 
              onClick={() => setIsNewUserOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F97316', border: 'none', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)' }}>
              <UserPlus size={16} /> New User
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="16px" style={{ display: 'flex', flexDirection: 'column', gap: 16, background: '#FFFFFF', borderRadius: 16, overflow: 'visible' }}>
        
        {/* Filters Row (Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'end' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Role</label>
            <div 
              onClick={() => setActiveDropdown(activeDropdown === 'role' ? null : 'role')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', cursor: 'pointer', width: '100%' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{roleFilter}</span>
              <ChevronDown size={14} color="#9CA3AF" />
            </div>
            {activeDropdown === 'role' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '100%' }}>
                {['All Roles', 'Student', 'Faculty', 'Org Admin', 'Super Admin'].map(r => (
                  <div key={r} onClick={() => { setRoleFilter(r); setActiveDropdown(null); setCurrentPage(1); }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{r}</div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Organization</label>
            <div 
              onClick={() => setActiveDropdown(activeDropdown === 'org' ? null : 'org')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', cursor: 'pointer', width: '100%' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{orgFilter}</span>
              <ChevronDown size={14} color="#9CA3AF" />
            </div>
            {activeDropdown === 'org' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '100%', maxHeight: 200, overflowY: 'auto' }}>
                {['All Organizations', ...(stats?.orgBreakdown.map((o: any) => o.name) || []), 'Unknown'].map(o => (
                  <div key={o} onClick={() => { setOrgFilter(o); setActiveDropdown(null); setCurrentPage(1); }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{o}</div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Status</label>
            <div 
              onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', cursor: 'pointer', width: '100%' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{statusFilter}</span>
              <ChevronDown size={14} color="#9CA3AF" />
            </div>
            {activeDropdown === 'status' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '100%' }}>
                {['All Statuses', 'Active Only', 'Suspended'].map(s => (
                  <div key={s} onClick={() => { setStatusFilter(s); setActiveDropdown(null); setCurrentPage(1); }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{s}</div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Activity Period</label>
            <div 
              onClick={() => setActiveDropdown(activeDropdown === 'period' ? null : 'period')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', cursor: 'pointer', width: '100%' }}>
              <Calendar size={14} color="#6B7280" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{periodFilter}</span>
            </div>
            {activeDropdown === 'period' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '100%' }}>
                {['All Time', 'Last 30 Days', 'Last 7 Days'].map(p => (
                  <div key={p} onClick={() => { setPeriodFilter(p); setActiveDropdown(null); setCurrentPage(1); }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{p}</div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => { clearFilters(); setCurrentPage(1); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: 'none', color: '#D97706', fontSize: 13, fontWeight: 600, cursor: 'pointer', height: 38, justifySelf: 'start', gridColumn: 'auto' }}>
            <X size={14} /> Clear Filters
          </button>
        </div>

        {/* Search Row */}
        <div style={{ width: '100%', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: 10, color: '#9CA3AF' }}>
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, role or organization..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ 
              width: '100%', 
              padding: '10px 12px 10px 36px', 
              border: '1px solid #E5E7EB', 
              borderRadius: 8, 
              fontSize: 14, 
              outline: 'none',
              background: '#F9FAFB'
            }}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="0" style={{ background: '#FFFFFF', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
              <th 
                style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#6B7280', cursor: 'pointer' }}
                onClick={() => { setSortOrder(sortField === 'name' && sortOrder === 'asc' ? 'desc' : 'asc'); setSortField('name'); }}
              >
                Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th 
                style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#6B7280', cursor: 'pointer' }}
                onClick={() => { setSortOrder(sortField === 'role' && sortOrder === 'asc' ? 'desc' : 'asc'); setSortField('role'); }}
              >
                Role {sortField === 'role' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th 
                style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#6B7280', cursor: 'pointer' }}
                onClick={() => { setSortOrder(sortField === 'organization' && sortOrder === 'asc' ? 'desc' : 'asc'); setSortField('organization'); }}
              >
                Assigned Organization {sortField === 'organization' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th 
                style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#6B7280', cursor: 'pointer' }}
                onClick={() => { setSortOrder(sortField === 'lastActivity' && sortOrder === 'asc' ? 'desc' : 'asc'); setSortField('lastActivity'); }}
              >
                Last Activity {sortField === 'lastActivity' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#6B7280', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: '#F3F4F6', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Search size={24} color="#9CA3AF" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>No users found</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#6B7280' }}>Try adjusting your filters or search query to find what you're looking for.</p>
                    </div>
                    <button 
                      onClick={() => { clearFilters(); setCurrentPage(1); }}
                      style={{ marginTop: 8, padding: '8px 16px', background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u, idx) => {
                const roleStyle = getRoleStyle(u.role, u.status);
                return (
                  <tr key={u.id} style={{ borderBottom: idx === paginatedUsers.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 99, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#111827' }}>
                          {getInitials(u.firstName, u.lastName)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: 13, color: '#6B7280' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: roleStyle.bg,
                        color: roleStyle.color,
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        {roleStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building size={16} color="#D1D5DB" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#4B5563' }}>{u.institution}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                        {u.lastActivity ? formatDistanceToNow(new Date(u.lastActivity), { addSuffix: true }) : 'Never'}
                      </div>
                      {/* Mocked activity string for visual parity */}
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>System Login</div>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right', position: 'relative' }}>
                      <button 
                        onClick={() => setActiveActionMenu(activeActionMenu === u.id ? null : u.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                        <MoreVertical size={20} />
                      </button>
                      {activeActionMenu === u.id && (
                        <div style={{ position: 'absolute', right: 24, top: '100%', marginTop: -10, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, width: 140, textAlign: 'left' }}>
                          <div onClick={() => setActiveActionMenu(null)} style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>View Profile</div>
                          <div onClick={() => setActiveActionMenu(null)} style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>Reset Password</div>
                          <div onClick={() => setActiveActionMenu(null)} style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#DC2626' }}>Suspend User</div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB' }}>
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
            {filteredUsers.length > 0 
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, filteredUsers.length)} of ${filteredUsers.length.toLocaleString()} users`
              : 'Showing 0 users'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ padding: '6px 10px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              {'<'}
            </button>
            <button style={{ padding: '6px 12px', background: '#000000', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>1</button>
            <button style={{ padding: '6px 12px', background: 'transparent', color: '#4B5563', border: 'none', fontSize: 13, fontWeight: 600 }}>2</button>
            <button style={{ padding: '6px 12px', background: 'transparent', color: '#4B5563', border: 'none', fontSize: 13, fontWeight: 600 }}>3</button>
            <span style={{ color: '#9CA3AF' }}>...</span>
            <button 
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '6px 10px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, cursor: (currentPage >= totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
            >
              {'>'}
            </button>
          </div>
        </div>
      </Card>

      {/* Bottom Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 24 }}>
        
        {/* Active vs Inactive Chart Card */}
        <Card padding="24px" style={{ background: '#FFFFFF', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#374151' }}>Active vs. Inactive</h3>
            <Zap size={16} color="#D97706" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, marginBottom: 24 }}>
            <div style={{ flex: 1, background: '#000000', borderRadius: '4px 4px 0 0', height: `${Math.max(activeHeight, 20)}%` }} />
            <div style={{ flex: 1, background: '#E5E7EB', borderRadius: '4px 4px 0 0', height: `${Math.max(inactiveHeight, 10)}%` }} />
            <div style={{ flex: 1, background: '#000000', borderRadius: '4px 4px 0 0', height: '60%' }} />
            <div style={{ flex: 1, background: '#E5E7EB', borderRadius: '4px 4px 0 0', height: '30%' }} />
            <div style={{ flex: 1, background: '#000000', borderRadius: '4px 4px 0 0', height: '90%' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>
            Cross-Org Engagement: <span style={{ color: '#D97706', fontWeight: 800 }}>{stats.crossOrgEngagement}%</span>
          </div>
        </Card>

        {/* Org Breakdown Card */}
        <Card padding="24px" style={{ background: '#FFFFFF', borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 24px 0', color: '#374151' }}>Org Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {stats.orgBreakdown.map((org, idx) => {
              const maxCount = Math.max(...stats.orgBreakdown.map(o => o.count));
              const width = Math.max((org.count / maxCount) * 100, 10);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                    <span>{org.name}</span>
                    <span>{org.count.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: '#F3F4F6', borderRadius: 99 }}>
                    <div style={{ width: `${width}%`, height: '100%', background: idx === 0 ? '#000000' : '#D97706', borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: 16 }}>
            View full org audit →
          </button>
        </Card>

        {/* AI Toolkit Notice */}
        <Card padding="24px" style={{ background: '#FFF7ED', borderRadius: 16, border: '1px solid #FED7AA', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={18} color="#D97706" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>AI Toolkit Notice</span>
          </div>
          <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, margin: '0 0 24px 0', flex: 1 }}>
            Automated anomaly detection found 3 user accounts with inconsistent permission hierarchies across Stanford and MIT organizations.
          </p>
          <button style={{ background: '#000000', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Zap size={16} color="#D97706" /> Resolve with AI Assistant
          </button>
        </Card>

      </div>

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFF', borderRadius: 16, width: '100%', maxWidth: 480, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 8, color: '#111827' }}>Bulk Import Users</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Upload a CSV file to create multiple users at once.</p>
            </div>
            
            <div style={{ position: 'relative', border: '2px dashed #E5E7EB', borderRadius: 12, padding: 48, textAlign: 'center', background: '#F9FAFB', cursor: 'pointer' }}>
              <input 
                type="file" 
                accept=".csv,.xlsx" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setImportFile(e.target.files[0]);
                    setImportError(null);
                    setImportResult(null);
                  }
                }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
              <Upload size={24} color="#9CA3AF" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                {importFile ? importFile.name : 'Click to upload or drag and drop'}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>CSV or XLSX files only, max 5MB</div>
            </div>

            {importError && (
              <div style={{ padding: 12, background: '#FEE2E2', color: '#DC2626', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                {importError}
              </div>
            )}
            
            {importResult && (
              <div style={{ padding: 16, background: '#ECFDF5', color: '#065F46', borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Import Successful</div>
                <div>Created: {importResult.created || 0}</div>
                <div>Skipped: {importResult.skipped || 0}</div>
                <div>Duplicates: {importResult.duplicates || 0}</div>
                <div>Invalid Emails: {importResult.invalidEmails || 0}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button 
                onClick={() => {
                  setIsBulkImportOpen(false);
                  setImportFile(null);
                  setImportResult(null);
                  setImportError(null);
                }}
                disabled={isImporting}
                style={{ padding: '10px 16px', background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer', opacity: isImporting ? 0.5 : 1 }}>
                Cancel
              </button>
              <button 
                onClick={handleBulkImport}
                disabled={!importFile || isImporting}
                style={{ padding: '10px 16px', background: '#000', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#FFF', cursor: 'pointer', opacity: (!importFile || isImporting) ? 0.5 : 1 }}>
                {isImporting ? 'Importing...' : 'Import Users'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {isNewUserOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFF', borderRadius: 16, width: '100%', maxWidth: 480, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 8, color: '#111827' }}>Add New User</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Create a new global identity across the network.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {createUserError && (
                <div style={{ padding: 12, background: '#FEE2E2', color: '#DC2626', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                  {createUserError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>First Name</label>
                  <input 
                    type="text" 
                    placeholder="John" 
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Doe" 
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }} 
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@example.com" 
                  value={newUserForm.email}
                  onChange={(e) => {
                    setIsEmailManuallyEdited(true);
                    setNewUserForm(prev => ({ ...prev, email: e.target.value }));
                  }}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }} 
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Role</label>
                <NativeSelect 
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none', backgroundColor: '#FFF' }}
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Faculty</option>
                  <option value="ORG_ADMIN">Org Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </NativeSelect>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Organization</label>
                <NativeSelect 
                  value={newUserForm.organizationId}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, organizationId: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none', backgroundColor: '#FFF' }}
                >
                  <option value="">Select Organization (Optional for Super Admin)</option>
                  {stats?.orgBreakdown.filter(o => o.id).map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button 
                onClick={() => {
                  setIsNewUserOpen(false);
                  setCreateUserError(null);
                }}
                disabled={isCreatingUser}
                style={{ padding: '10px 16px', background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer', opacity: isCreatingUser ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateUser}
                disabled={isCreatingUser}
                style={{ padding: '10px 16px', background: '#000', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#FFF', cursor: 'pointer', opacity: isCreatingUser ? 0.5 : 1 }}
              >
                {isCreatingUser ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
