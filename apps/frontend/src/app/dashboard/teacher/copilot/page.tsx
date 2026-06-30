'use client';

import { useState } from 'react';
import { Bot, Sparkles, BookOpen, Layers, CheckCircle2, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Input } from '@/design-system/Input';
import { copilotService } from '@/services/copilot.service';

export default function CopilotPage() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('60');
  const [outcomes, setOutcomes] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<any | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic || !duration) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsGenerating(true);
    setLessonPlan(null);
    try {
      const plan = await copilotService.generateLessonPlan({
        subject,
        topic,
        duration: parseInt(duration, 10),
        learningOutcomes: outcomes ? outcomes.split('\n').filter(Boolean) : [],
      });
      setLessonPlan(plan);
      toast.success('Lesson plan generated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate lesson plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Teacher AI Copilot"
        subtitle="Your intelligent assistant for lesson planning and academic workflows."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
        <Card padding="24px" style={{ position: 'sticky', top: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C' }}>
              <Bot size={18} />
            </div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Plan a Lesson</h2>
          </div>
          
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Subject"
              placeholder="e.g. Computer Science"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <Input
              label="Topic"
              placeholder="e.g. Introduction to Data Structures"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
            <Input
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>Learning Outcomes (one per line)</label>
              <textarea
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                placeholder="Understand basic data types..."
                rows={4}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-base)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
            <Button type="submit" variant="primary" isLoading={isGenerating} style={{ marginTop: 8 }}>
              {isGenerating ? 'Generating...' : 'Generate Lesson Plan'}
            </Button>
          </form>
        </Card>

        <Card padding="24px" style={{ minHeight: 600, display: 'flex', flexDirection: 'column' }}>
          {isGenerating ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--brand)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Drafting your lesson plan...</h3>
              <p>Consulting the knowledge base and pedagogical guidelines.</p>
            </div>
          ) : lessonPlan ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{topic}</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{subject} &middot; {duration} mins</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" size="sm">Export PDF</Button>
                  <Button variant="primary" size="sm">Save to Library</Button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <section>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <CheckCircle2 size={16} color="var(--brand)" /> Objectives
                  </h3>
                  <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-secondary)' }}>
                    {lessonPlan.content.objectives?.map((obj: string, i: number) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Layers size={16} color="var(--brand)" /> Structure
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {lessonPlan.content.structure?.map((phase: any, i: number) => (
                      <div key={i} style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ fontSize: 'var(--text-sm)' }}>{phase.phase}</strong>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{phase.time}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{phase.activity}</p>
                      </div>
                    ))}
                  </div>
                </section>
                
                {lessonPlan.ragContext && lessonPlan.ragContext.length > 0 && (
                  <section>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <BookOpen size={16} color="var(--brand)" /> Source Material
                    </h3>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 12, background: '#F9FAFB', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                      This lesson plan was grounded using institutional documents.
                    </div>
                  </section>
                )}
              </div>
            </div>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Sparkles size={40} style={{ margin: '0 auto 16px', opacity: 0.5, color: 'var(--brand)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>AI Lesson Planner</h3>
              <p style={{ maxWidth: 400, margin: '0 auto' }}>Fill out the details on the left to generate a personalized, RAG-grounded lesson plan instantly.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
