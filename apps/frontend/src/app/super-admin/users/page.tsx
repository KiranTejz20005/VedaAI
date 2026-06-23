'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { DataTable } from '@/design-system/DataTable';
import { Badge } from '@/design-system/Badge';
import { Input } from '@/design-system/Input';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { Search, Mail, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/format';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  organization?: { name: string } | null;
  createdAt: string;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/users');
      if (res.data?.success) {
        setUsers(res.data.data || []);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.organization?.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState lines={6} />;
  if (error) return <ErrorState message={error} onRetry={loadUsers} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="User Directory"
        subtitle="View all users across all organizations."
      />

      <Input
        icon={<Search size={16} />}
        placeholder="Search by name, email, or organization..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 400 }}
      />

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (_: any, row: User) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                {row.firstName} {row.lastName}
              </div>
            ),
          },
          {
            key: 'email',
            header: 'Email',
            render: (value: string) => (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                <Mail size={12} /> {value}
              </span>
            ),
          },
          {
            key: 'organization',
            header: 'Organization',
            render: (_: any, row: User) => (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                <Building2 size={12} /> {row.organization?.name || 'N/A'}
              </span>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (value: string) => (
              <Badge variant="info">{value}</Badge>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            align: 'center',
            render: (value: string) => (
              <Badge variant={value === 'ACTIVE' ? 'success' : value === 'SUSPENDED' ? 'error' : 'warning'}>
                {value || 'ACTIVE'}
              </Badge>
            ),
          },
          {
            key: 'createdAt',
            header: 'Created',
            render: (value: string) => formatDate(value),
          },
        ]}
        data={filteredUsers}
        emptyMessage={search ? 'No users match your search' : 'No users found'}
      />
    </div>
  );
}
