import { useState, useMemo, useEffect } from 'react';

export interface UnifiedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  institution: string;
  lastActivity: string;
}

export function useUserFilters(users: UnifiedUser[]) {
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [orgFilter, setOrgFilter] = useState('All Organizations');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [periodFilter, setPeriodFilter] = useState('All Time');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Use state to capture the time once to keep render pure
  const [now] = useState(() => Date.now());

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const clearFilters = () => {
    setRoleFilter('All Roles');
    setOrgFilter('All Organizations');
    setStatusFilter('All Statuses');
    setPeriodFilter('All Time');
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // 1. Role Filter
      if (roleFilter !== 'All Roles') {
        const matchesRole = 
          (roleFilter === 'Faculty' && u.role === 'TEACHER') ||
          (roleFilter === 'Student' && u.role === 'STUDENT') ||
          (roleFilter === 'Org Admin' && u.role === 'ORG_ADMIN') ||
          (roleFilter === 'Super Admin' && u.role === 'SUPER_ADMIN') ||
          (u.role === roleFilter);
        
        if (!matchesRole) return false;
      }

      // 2. Organization Filter
      if (orgFilter !== 'All Organizations' && u.institution !== orgFilter) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'All Statuses') {
        const expectedStatus = statusFilter === 'Active Only' ? 'ACTIVE' : 'SUSPENDED';
        if (u.status !== expectedStatus) return false;
      }

      // 4. Period Filter
      if (periodFilter !== 'All Time' && u.lastActivity) {
        const activityDate = new Date(u.lastActivity).getTime();
        const daysDiff = (now - activityDate) / (1000 * 60 * 60 * 24);
        
        if (periodFilter === 'Last 30 Days' && daysDiff > 30) return false;
        if (periodFilter === 'Last 7 Days' && daysDiff > 7) return false;
      }

      // 5. Search Query
      if (debouncedSearch.trim() !== '') {
        const q = debouncedSearch.toLowerCase();
        const nameMatch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const roleMatch = u.role.toLowerCase().includes(q);
        const orgMatch = (u.institution || '').toLowerCase().includes(q);

        if (!nameMatch && !emailMatch && !roleMatch && !orgMatch) {
          return false;
        }
      }

      return true;
    });
  }, [users, roleFilter, orgFilter, statusFilter, periodFilter, debouncedSearch, now]);

  return {
    roleFilter,
    setRoleFilter,
    orgFilter,
    setOrgFilter,
    statusFilter,
    setStatusFilter,
    periodFilter,
    setPeriodFilter,
    searchQuery,
    setSearchQuery,
    clearFilters,
    filteredUsers
  };
}
