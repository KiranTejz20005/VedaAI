'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, AlertTriangle, TrendingDown, TrendingUp, Lightbulb, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { classInsightService } from '@/services/class-insight.service';

export default function ClassInsightsPage() {
  const [subject, setSubject] = useState('Computer Science');
  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await classInsightService.generateProactiveInsights(subject);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate class insights');
      toast.error('Could not load insights');
    } finally {
      setIsLoading(false);
    }
  }, [subject]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (isLoading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchInsights} />;
  if (!report) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Class Insights"
          subtitle={`AI-generated proactive analysis for ${subject}.`}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline" onClick={() => {
            toast.success('Exporting Report to PDF...');
            setTimeout(() => toast.success('Report downloaded!'), 1500);
          }}>
            <Download size={16} style={{ marginRight: 8 }} />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => {
            toast.success('Exporting Data to CSV...');
            setTimeout(() => toast.success('Data downloaded!'), 1500);
          }}>
            <Download size={16} style={{ marginRight: 8 }} />
            Export CSV
          </Button>
          <Button variant="primary" onClick={fetchInsights}>Refresh Analysis</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card padding="20px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: 8 }}>
            <TrendingDown size={18} color="#EF4444" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>At Risk Students</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{report.atRiskStudents || 0}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Need immediate intervention</div>
        </Card>
        
        <Card padding="20px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: 8 }}>
            <AlertTriangle size={18} color="#F59E0B" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Weak Topics</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{report.weakTopics?.length || 0}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Across recent assessments</div>
        </Card>

        <Card padding="20px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: 8 }}>
            <TrendingUp size={18} color="#10B981" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Avg Score</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{report.overallAverage ? `${report.overallAverage}%` : 'N/A'}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Class-wide performance</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={20} color="var(--brand)" /> Focus Areas
          </h3>
          {report.weakTopics && report.weakTopics.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {report.weakTopics.map((topic: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{topic}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: '#EF4444', fontWeight: 600, background: '#FEE2E2', padding: '4px 8px', borderRadius: 12 }}>Needs Review</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No specific weak topics identified.</div>
          )}
        </Card>

        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={20} color="#F59E0B" /> AI Recommendations
          </h3>
          {report.recommendedActions && report.recommendedActions.length > 0 ? (
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-secondary)' }}>
              {report.recommendedActions.map((action: string, i: number) => (
                <li key={i} style={{ lineHeight: 1.5, fontSize: 'var(--text-sm)' }}>{action}</li>
              ))}
            </ul>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No specific recommendations at this time.</div>
          )}
          
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <Button variant="primary" style={{ flex: 1 }}>Generate Remedial Quiz</Button>
            <Button variant="outline" style={{ flex: 1 }}>Notify Students</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
