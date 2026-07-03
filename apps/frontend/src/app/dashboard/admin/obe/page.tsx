'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { MetricCard } from '@/design-system/MetricCard';
import { ShieldCheck, Target, TrendingUp, AlertTriangle, Download, Building, FileText } from 'lucide-react';

const DEPARTMENTS = [
  { id: 'cs', name: 'Computer Science', attainment: 82, direct: 68, indirect: 14, status: 'On Track' },
  { id: 'me', name: 'Mechanical Engineering', attainment: 76, direct: 60, indirect: 16, status: 'Needs Review' },
  { id: 'ee', name: 'Electrical Engineering', attainment: 88, direct: 72, indirect: 16, status: 'Excellent' },
];

export default function InstitutionOBEDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Institution Accreditation & OBE"
          subtitle="Track attainment and continuous quality improvement across all departments."
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="primary"><FileText size={16} style={{ marginRight: 8 }} /> Generate SSR</Button>
          <Button variant="outline"><Download size={16} style={{ marginRight: 8 }} /> Export Attainment</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard icon={<Building size={18} />} label="Total Departments" value="8" />
        <MetricCard icon={<Target size={18} />} label="Institution Attainment" value="81.5%" />
        <MetricCard icon={<ShieldCheck size={18} color="#10B981" />} label="Accreditation Readiness" value="High" />
        <MetricCard icon={<AlertTriangle size={18} color="#EF4444" />} label="CQI Actions Pending" value="12" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Department Comparison */}
        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 24px 0' }}>Department Attainment Comparison</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {DEPARTMENTS.map(dept => (
              <div key={dept.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{dept.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: dept.status === 'On Track' ? '#10B981' : dept.status === 'Excellent' ? '#3B82F6' : '#F59E0B' }}>
                      {dept.status}
                    </span>
                    <span style={{ fontWeight: 700 }}>{dept.attainment}%</span>
                  </div>
                </div>
                
                {/* Stacked Bar for Direct/Indirect */}
                <div style={{ width: '100%', height: 12, background: 'var(--bg-muted)', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${dept.direct}%`, height: '100%', background: 'var(--brand)', borderRight: '1px solid white' }} title={`Direct Attainment: ${dept.direct}%`} />
                  <div style={{ width: `${dept.indirect}%`, height: '100%', background: '#38BDF8' }} title={`Indirect Attainment: ${dept.indirect}%`} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '10px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }}/> Direct ({dept.direct}%)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38BDF8' }}/> Indirect ({dept.indirect}%)</span>
                  </div>
                  <span>Target: 75%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actionable Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 16px 0' }}>CQI Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontWeight: 600, marginBottom: 4 }}>
                  <AlertTriangle size={16} /> Mechanical Engineering
                </div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: '#7F1D1D' }}>PO4 (Modern Tool Usage) attainment is significantly below target (52%). Requires immediate CQI action.</p>
              </div>
              
              <div style={{ padding: '16px', background: 'var(--bg-muted)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
                  <TrendingUp size={16} /> Computer Science
                </div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Successfully closed 3 Action Taken Reports for PO2.</p>
              </div>
            </div>
            <Button variant="outline" style={{ width: '100%', marginTop: 16 }}>View All CQI Actions</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
