'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { Users, Building, Activity, Shield, ActivitySquare, Server, Link as LinkIcon } from 'lucide-react';

export default function SuperAdminDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Global System Control & Monitoring."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<Building size={18} />} label="Total Organizations" value={45} />
        <MetricCard icon={<Users size={18} />} label="Total Users" value={12500} />
        <MetricCard icon={<Activity size={18} />} label="Active Sessions" value={1240} />
        <MetricCard icon={<LinkIcon size={18} />} label="API Usage" value="84%" />
        <MetricCard icon={<Server size={18} />} label="System Uptime" value="99.99%" />
        <MetricCard icon={<Shield size={18} />} label="Security Alerts" value={0} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Audit Logs</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for global system logs...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>Tenant Management</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for organization list and billing...</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)">
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 16 }}>System Metrics</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Placeholder for infrastructure health...</p>
        </Card>
      </div>
    </div>
  );
}
