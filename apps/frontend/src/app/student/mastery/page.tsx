'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target, TrendingUp, BarChart3, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { useAuthStore } from '@/store/auth.store';
import { learningService } from '@/services/learning.service';

export default function MasteryPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await learningService.getStudentProfile(user.id);
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load mastery data');
      toast.error('Could not load your learning profile');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [fetchProfile, user]);

  if (isLoading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchProfile} />;
  if (!profile) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Mastery Dashboard"
        subtitle="Visualize your knowledge growth and learning outcomes."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Card padding="20px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: 8 }}>
            <Target size={18} color="var(--brand)" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Overall Mastery</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{profile.overallMasteryScore || 0}%</div>
          <div style={{ fontSize: 'var(--text-xs)', color: '#10B981', marginTop: 4, fontWeight: 600 }}>+2.5% this week</div>
        </Card>

        <Card padding="20px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: 8 }}>
            <TrendingUp size={18} color="#8B5CF6" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Learning Velocity</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{profile.learningVelocity || 'Stable'}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Based on recent tests</div>
        </Card>

        <Card padding="20px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: 8 }}>
            <BarChart3 size={18} color="#3B82F6" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Concepts Mastered</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{profile.strongConcepts?.length || 0}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Across all subjects</div>
        </Card>

        <Card padding="20px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: 8 }}>
            <Award size={18} color="#F59E0B" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Exam Readiness</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{profile.predictedReadiness || 0}%</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Predicted performance</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Strong Concepts</h3>
          {profile.strongConcepts && profile.strongConcepts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile.strongConcepts.map((concept: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)', color: '#166534' }}>{concept}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: '#15803D', fontWeight: 700 }}>Mastered</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Keep practicing to build your strong concepts.</div>
          )}
        </Card>

        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Areas for Improvement</h3>
          {profile.weakConcepts && profile.weakConcepts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile.weakConcepts.map((concept: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)', color: '#991B1B' }}>{concept}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: '#B91C1C', fontWeight: 700 }}>Needs Review</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No weak areas identified currently.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
