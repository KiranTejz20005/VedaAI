'use client';

import { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { MetricCard } from '@/design-system/MetricCard';
import { Target, CheckCircle2, TrendingUp, Sparkles, Download, Layers, AlertTriangle, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';

// Mock Data for CO-PO Mapping
const COURSE_OUTCOMES = [
  { id: 'CO1', desc: 'Understand the mathematical foundations of deep learning.', bloom: 'Understand' },
  { id: 'CO2', desc: 'Design and implement neural networks using modern frameworks.', bloom: 'Create' },
  { id: 'CO3', desc: 'Evaluate model performance using various metrics.', bloom: 'Evaluate' },
];

const PROGRAM_OUTCOMES = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5'];

const INITIAL_MAPPING: Record<string, Record<string, number | null>> = {
  'CO1': { 'PO1': 3, 'PO2': 2, 'PO3': null, 'PO4': null, 'PO5': 1 },
  'CO2': { 'PO1': 1, 'PO2': 3, 'PO3': 3, 'PO4': 2, 'PO5': null },
  'CO3': { 'PO1': 2, 'PO2': 2, 'PO3': 3, 'PO4': 1, 'PO5': 2 },
};

export default function OBEDashboard() {
  const [mapping, setMapping] = useState(INITIAL_MAPPING);

  const getBloomColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'remember': return '#94A3B8';
      case 'understand': return '#38BDF8';
      case 'apply': return '#4ADE80';
      case 'analyze': return '#FBBF24';
      case 'evaluate': return '#F87171';
      case 'create': return '#A78BFA';
      default: return '#94A3B8';
    }
  };

  const handleAIMapping = () => {
    toast.success('AI OBE Copilot is analyzing syllabi...');
    setTimeout(() => {
      setMapping({
        'CO1': { 'PO1': 3, 'PO2': 2, 'PO3': 1, 'PO4': null, 'PO5': 1 },
        'CO2': { 'PO1': 2, 'PO2': 3, 'PO3': 3, 'PO4': 2, 'PO5': 1 },
        'CO3': { 'PO1': 2, 'PO2': 2, 'PO3': 3, 'PO4': 2, 'PO5': 2 },
      });
      toast.success('Matrix optimized by AI!');
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Outcome-Based Education (OBE)"
          subtitle="Curriculum Mapping & Accreditation Quality Assurance."
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline"><Download size={16} style={{ marginRight: 8 }} /> NAAC Report</Button>
          <Button variant="outline"><Download size={16} style={{ marginRight: 8 }} /> NBA Report</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard icon={<Target size={18} />} label="Total COs" value="3" />
        <MetricCard icon={<Layers size={18} />} label="Mapped POs" value="5" />
        <MetricCard icon={<CheckCircle2 size={18} />} label="Avg. Attainment" value="82%" />
        <MetricCard icon={<TrendingUp size={18} color="#10B981" />} label="CQI Status" value="On Track" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24 }}>
        {/* CO-PO Mapping Matrix */}
        <Card padding="24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>CO-PO Mapping Matrix</h3>
            <Button variant="outline" size="sm" onClick={handleAIMapping}>
              <Sparkles size={16} style={{ marginRight: 8, color: 'var(--brand)' }} /> Auto-Map with AI
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>Course Outcome</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Bloom Level</th>
                  {PROGRAM_OUTCOMES.map(po => (
                    <th key={po} style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>{po}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COURSE_OUTCOMES.map(co => (
                  <tr key={co.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 12px', textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{co.id}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{co.desc}</div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 12, fontSize: 'var(--text-xs)', fontWeight: 600,
                        background: `${getBloomColor(co.bloom)}20`, color: getBloomColor(co.bloom) 
                      }}>
                        {co.bloom}
                      </span>
                    </td>
                    {PROGRAM_OUTCOMES.map(po => {
                      const val = mapping[co.id][po];
                      return (
                        <td key={po} style={{ padding: '16px 12px' }}>
                          <div style={{ 
                            width: 32, height: 32, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 8, background: val ? 'var(--brand-light)' : 'transparent', 
                            color: val ? 'var(--brand)' : 'var(--text-muted)',
                            fontWeight: val ? 700 : 400,
                            border: val ? 'none' : '1px dashed var(--border)'
                          }}>
                            {val || '-'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'right' }}>
            Mapping Weightage: 1 = Low, 2 = Medium, 3 = High
          </div>
        </Card>

        {/* Bloom's Taxonomy Distribution */}
        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 24px 0' }}>Bloom's Taxonomy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((level, idx) => {
              // Mock distribution
              const percentage = [5, 20, 30, 25, 15, 5][idx];
              const color = getBloomColor(level);
              return (
                <div key={level}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    <span>{level}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{percentage}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--bg-muted)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      {/* CQI Action Taken Reports */}
      <Card padding="24px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Continuous Quality Improvement (CQI)</h3>
          <Button variant="outline" size="sm">
            <PenTool size={16} style={{ marginRight: 8 }} /> Log Action Taken Report
          </Button>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 24 }}>
          Track and resolve underperforming Course Outcomes across your classes.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: '#991B1B' }}>CO2 Attainment: 54%</span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#DC2626', padding: '4px 8px', background: '#FEE2E2', borderRadius: 12 }}>ACTION REQUIRED</span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: '#7F1D1D', margin: '0 0 16px 0' }}>Target attainment (70%) not reached for: Design and implement neural networks.</p>
            <Button variant="outline" size="sm" style={{ width: '100%', borderColor: '#FCA5A5', color: '#991B1B' }}>Submit Remedial Plan</Button>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>CO1 Attainment: 88%</span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#059669', padding: '4px 8px', background: '#D1FAE5', borderRadius: 12 }}>TARGET MET</span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>No action required. Maintaining high attainment through interactive labs.</p>
            <Button variant="outline" size="sm" style={{ width: '100%' }}>View Attainment Breakdown</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
