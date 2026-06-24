'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/design-system/PageHeader';
import { LoadingState } from '@/design-system/LoadingState';
import { User, Mail, Building2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) return <LoadingState lines={6} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Profile"
        subtitle="View and manage your profile information."
      />

      <div style={{
        maxWidth: 600,
        padding: 24,
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#FFEDD5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700,
            color: '#EA580C'
          }}>
            {user?.firstName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              {user?.firstName} {user?.lastName}
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', textTransform: 'capitalize' }}>
              {user?.role?.toLowerCase().replace('_', ' ')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
            <Mail size={18} color="#9CA3AF" />
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Email</p>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{user?.email}</p>
            </div>
          </div>

          {user?.organizationName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
              <Building2 size={18} color="#9CA3AF" />
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Organization</p>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{user.organizationName}</p>
              </div>
            </div>
          )}

          {user?.departmentName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <User size={18} color="#9CA3AF" />
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Department</p>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{user.departmentName}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
