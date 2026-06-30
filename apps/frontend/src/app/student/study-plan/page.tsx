'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle, ArrowRight, Play, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { useAuthStore } from '@/store/auth.store';
import { learningService } from '@/services/learning.service';

export default function StudyPlanPage() {
  const { user } = useAuthStore();
  const [studyPlan, setStudyPlan] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await learningService.getStudyPlan(user.id);
      setStudyPlan(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load study plan');
      toast.error('Could not load your study plan');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchPlan();
  }, [fetchPlan, user]);

  if (isLoading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchPlan} />;

  const tasks = studyPlan?.dailyPlan || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Personalized Study Plan"
        subtitle="AI-generated tasks to boost your mastery based on recent performance."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Calendar size={20} color="var(--brand)" /> Today's Plan
          </h2>
          
          {tasks.length === 0 ? (
            <Card style={{ padding: 48, textAlign: 'center' }}>
              <CheckCircle2 size={40} style={{ color: '#10B981', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>You're all caught up!</h3>
              <p style={{ color: 'var(--text-muted)' }}>Take a break or explore some practice quizzes.</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tasks.map((task: any, index: number) => (
                <Card key={index} padding="0" style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <div style={{ width: 6, background: task.priority === 'HIGH' ? '#EF4444' : task.priority === 'MEDIUM' ? '#F59E0B' : '#3B82F6' }} />
                    <div style={{ padding: '16px 20px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: task.priority === 'HIGH' ? '#EF4444' : 'var(--text-muted)' }}>
                            {task.priority} PRIORITY
                          </span>
                          <span style={{ color: 'var(--border)', fontSize: 'var(--text-xs)' }}>&bull;</span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> {task.estimatedMinutes} mins
                          </span>
                        </div>
                        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{task.topic}</h3>
                        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{task.activity}</p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {task.type === 'PRACTICE' ? (
                          <Button variant="outline" size="sm" style={{ gap: 6 }}><Play size={14} /> Practice</Button>
                        ) : (
                          <Button variant="outline" size="sm" style={{ gap: 6 }}><BookOpen size={14} /> Review</Button>
                        )}
                        <Button variant="primary" size="sm" style={{ gap: 6 }}><CheckCircle2 size={14} /> Done</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding="20px">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Why this plan?</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              The AI generated this plan based on your recent <strong>{studyPlan?.rationaleContext || 'quiz performance'}</strong>, identifying specific weak concepts that need reinforcement before your next assessment.
            </p>
          </Card>

          {studyPlan?.recommendedResources?.length > 0 && (
            <Card padding="20px">
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} color="var(--brand)" /> Reference Material
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {studyPlan.recommendedResources.map((res: any, i: number) => (
                  <div key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ArrowRight size={14} /> {res.title}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
