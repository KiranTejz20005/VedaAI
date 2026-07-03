'use client';

import { useState, useEffect } from 'react';
import { Bot, Sparkles, BookOpen, Layers, CheckCircle2, Loader2, X, Eye, Trash2 } from 'lucide-react';
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
  const [showModal, setShowModal] = useState(false);
  
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [isViewingSaved, setIsViewingSaved] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any | null>(null);

  const fetchPlans = async () => {
    try {
      const plans = await copilotService.getLessonPlans();
      setSavedPlans(plans);
    } catch (e) {
      console.error('Failed to fetch lesson plans', e);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleExportPDF = async () => {
    try {
      const element = document.getElementById('lesson-plan-content');
      if (!element) return;
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       1,
        filename:     `${topic.replace(/\s+/g, '_') || 'Lesson'}_Plan.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
      toast.success('Exporting PDF...');
    } catch (e) {
      toast.error('Failed to export PDF');
    }
  };

  const handleSaveToLibrary = () => {
    setShowModal(false);
    fetchPlans();
    toast.success('Saved to Library');
  };

  const handleCancel = () => {
    setShowModal(false);
    if (!isViewingSaved) {
      setLessonPlan(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic || !duration) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsGenerating(true);
    setLessonPlan(null);
    setIsViewingSaved(false);
    try {
      const plan = await copilotService.generateLessonPlan({
        subject,
        topic,
        duration: parseInt(duration, 10),
        learningOutcomes: outcomes ? outcomes.split('\n').filter(Boolean) : [],
      });
      setLessonPlan(plan);
      setShowModal(true);
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
            <Button type="submit" variant="primary" loading={isGenerating} style={{ marginTop: 8 }}>
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
          ) : savedPlans.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Saved Lesson Plans</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {savedPlans.map((plan: any) => (
                  <div key={plan.id} style={{ padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 12, background: 'var(--bg-hover)', display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{plan.title || plan.topic}</h4>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{plan.subject} &middot; {plan.duration} mins</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="outline" size="sm" onClick={() => {
                        setLessonPlan(plan);
                        setIsViewingSaved(true);
                        setShowModal(true);
                        setTopic(plan.title || plan.topic || '');
                        setSubject(plan.subject || '');
                        setDuration(plan.duration?.toString() || '');
                      }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Eye size={16} /> View Plan
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setPlanToDelete(plan);
                      }} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', borderColor: '#FCA5A5' }}>
                        <Trash2 size={16} /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
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
      
      {showModal && lessonPlan && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '80%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', borderRadius: 12, padding: 32, position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div id="lesson-plan-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{topic}</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{subject} &middot; {duration} mins</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>Export PDF</Button>
                  {!isViewingSaved && (
                    <Button variant="primary" size="sm" onClick={handleSaveToLibrary}>Save to Library</Button>
                  )}
                  <button onClick={handleCancel} style={{ marginLeft: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: '50%' }} aria-label="Cancel">
                    <X size={20} color="var(--text-secondary)" />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <section>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <CheckCircle2 size={16} color="var(--brand)" /> Objectives
                  </h3>
                  <div style={{ paddingLeft: 20, margin: 0, color: 'var(--text-secondary)' }}>
                    {typeof lessonPlan.objectives === 'string' ? (
                      <p>{lessonPlan.objectives}</p>
                    ) : (
                      <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(lessonPlan.objectives || []).map((obj: string, i: number) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>

                <section>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Layers size={16} color="var(--brand)" /> Structure
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Array.isArray(lessonPlan.activities) && lessonPlan.activities.map((activity: any, i: number) => (
                      <div key={i} style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 8 }}>
                        {typeof activity === 'string' ? (
                          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{activity}</p>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <strong style={{ fontSize: 'var(--text-sm)' }}>{activity.phase || `Activity ${i + 1}`}</strong>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{activity.time || ''}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{activity.activity || activity.description || ''}</p>
                          </>
                        )}
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
          </div>
        </div>
      )}

      {planToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 12, padding: 24, position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <button onClick={() => setPlanToDelete(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: '50%' }} aria-label="Cancel">
              <X size={20} color="var(--text-secondary)" />
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Delete Lesson Plan</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Are you sure you want to delete "{planToDelete.title || planToDelete.topic}"? This action cannot be undone.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Button variant="outline" onClick={() => setPlanToDelete(null)} style={{ flex: 1 }}>Cancel</Button>
              <Button variant="primary" style={{ flex: 1, backgroundColor: '#EF4444', borderColor: '#EF4444' }} onClick={async () => {
                try {
                  await copilotService.deleteLessonPlan(planToDelete.id);
                  toast.success('Lesson plan deleted');
                  setPlanToDelete(null);
                  fetchPlans();
                } catch (e) {
                  toast.error('Failed to delete lesson plan');
                }
              }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
