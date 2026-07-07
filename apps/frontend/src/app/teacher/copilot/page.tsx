'use client';

import { useState, useRef } from 'react';
import { Bot, Sparkles, BookOpen, Layers, CheckCircle2, Loader2, Eye, Trash2, Printer, ArrowLeft, History, FileText, FileSignature } from 'lucide-react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Input } from '@/design-system/Input';
import { useLessonPlanner } from '@/hooks/useLessonPlanner';
import { useReactToPrint } from 'react-to-print';

export default function CopilotPage() {
  const { 
    plans, 
    loading, 
    isGenerating, 
    activePlan, 
    setActivePlan, 
    generatePlan, 
    updatePlan, 
    deletePlan 
  } = useLessonPlanner();

  // Form State
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('60');
  const [outcomes, setOutcomes] = useState('');

  // UI State
  const [view, setView] = useState<'GENERATOR' | 'HISTORY' | 'EDITOR'>('GENERATOR');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Printing Reference
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: activePlan?.title || 'Lesson_Plan',
  });

  // Extract structured content safely
  const parseContent = (contentStr: string) => {
    try {
      return JSON.parse(contentStr);
    } catch {
      return {};
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const plan = await generatePlan(subject, topic, duration, outcomes);
    if (plan) {
      setView('EDITOR');
    }
  };

  const saveFieldEdit = async (field: string, value: any) => {
    if (!activePlan) return;
    
    // Determine if the field is a top-level schema field or inside "content"
    const isTopLevel = ['title', 'subject', 'duration', 'objectives', 'activities', 'assessments'].includes(field);
    
    const updates: any = {};
    if (isTopLevel) {
      updates[field] = value;
    } else {
      const currentContent = parseContent(activePlan.content);
      currentContent[field] = value;
      updates.content = JSON.stringify(currentContent);
    }

    await updatePlan(activePlan.id, updates);
    setEditMode(null);
  };

  const renderSection = (title: string, field: string, data: any, icon: any, isList: boolean = true) => {
    const isEditing = editMode === field;

    const startEditing = () => {
      setEditValue(isList ? (Array.isArray(data) ? data.join('\n') : String(data || '')) : String(data || ''));
      setEditMode(field);
    };

    const handleSave = () => {
      const finalValue = isList ? editValue.split('\n').filter(Boolean) : editValue;
      saveFieldEdit(field, finalValue);
    };

    return (
      <div className="mb-8 p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors group print:border-none print:p-0 print:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <div className="print:hidden">
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={startEditing} className="opacity-0 group-hover:opacity-100 transition-opacity">
                Edit
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea 
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full min-h-[150px] p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter content (one item per line for lists)"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
            </div>
          </div>
        ) : (
          <div className="text-slate-600 text-sm leading-relaxed">
            {isList ? (
              <ul className="space-y-2 list-disc pl-5 marker:text-indigo-500">
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((item: string, i: number) => (
                    <li key={i} className="pl-1">{item}</li>
                  ))
                ) : (
                  <p className="italic text-slate-400">No content generated.</p>
                )}
              </ul>
            ) : (
              <p className="whitespace-pre-wrap">{data || <span className="italic text-slate-400">No content generated.</span>}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Saved Lesson Plans</h2>
        <Button variant="primary" onClick={() => setView('GENERATOR')}>
          + Generate New
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : plans.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No lesson plans found in history.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card key={plan.id} className="p-6 flex flex-col hover:border-indigo-300 transition-colors">
              <div className="flex-1">
                <div className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wider">{plan.subject}</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{plan.title.replace(`${plan.subject} - `, '')}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{plan.objectives}</p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">{new Date(plan.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setActivePlan(plan); setView('EDITOR'); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deletePlan(plan.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderEditor = () => {
    if (!activePlan) return null;
    const content = parseContent(activePlan.content);

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button variant="outline" onClick={() => setView('HISTORY')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={() => handlePrint()}>
              <Printer className="w-4 h-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 print:shadow-none print:border-none print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{activePlan.title}</h1>
                <p className="text-lg text-slate-600 font-medium">{activePlan.subject} • {activePlan.duration} Mins</p>
              </div>
              <div className="text-right text-sm text-slate-500 space-y-1">
                <p className="font-semibold text-slate-800">VidyaAI LMS</p>
                <p>Generated: {new Date(activePlan.createdAt).toLocaleDateString()}</p>
                <p>Status: Approved</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">AI Generated</span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">Classroom Ready</span>
            </div>
          </div>

          {/* Sections */}
          {renderSection('Learning Objectives', 'objectives', activePlan.objectives?.split('\n') || [], <CheckCircle2 className="w-5 h-5 text-emerald-500" />)}
          {renderSection('Prerequisites', 'prerequisites', content.prerequisites, <Layers className="w-5 h-5 text-indigo-500" />)}
          {renderSection('Teaching Materials', 'materials', content.materials, <BookOpen className="w-5 h-5 text-amber-500" />)}
          {renderSection('Introduction', 'introduction', content.introduction, <Sparkles className="w-5 h-5 text-blue-500" />, false)}
          {renderSection('Core Concepts', 'coreConcepts', content.coreConcepts, <FileText className="w-5 h-5 text-purple-500" />)}
          {renderSection('Teaching Activities', 'activities', activePlan.activities, <Bot className="w-5 h-5 text-rose-500" />)}
          {renderSection('Classroom Interaction', 'interaction', content.interaction, <Sparkles className="w-5 h-5 text-cyan-500" />, false)}
          {renderSection('Practical Exercises', 'practicalExercises', content.practicalExercises, <Layers className="w-5 h-5 text-teal-500" />)}
          {renderSection('Assessment Strategy', 'assessments', activePlan.assessments, <FileSignature className="w-5 h-5 text-orange-500" />)}
          {renderSection('Homework / Assignments', 'homework', content.homework, <BookOpen className="w-5 h-5 text-slate-500" />)}
          {renderSection('Expected Outcomes', 'outcomes', content.outcomes, <CheckCircle2 className="w-5 h-5 text-emerald-600" />)}
          {renderSection('Teacher Notes', 'teacherNotes', content.teacherNotes, <FileText className="w-5 h-5 text-slate-600" />, false)}
          
          <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 hidden print:block">
            Generated securely by VidyaAI Faculty Copilot • Page 1
          </div>
        </div>
      </div>
    );
  };

  const renderGenerator = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Panel */}
      <div className="lg:col-span-1">
        <Card className="p-6 sticky top-24 border-indigo-100 shadow-indigo-900/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Config</h2>
              <p className="text-xs text-slate-500 font-medium">Hybrid RAG Engine</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
              <Input 
                placeholder="e.g., Physics, Data Structures" 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Topic</label>
              <Input 
                placeholder="e.g., Quantum Mechanics, Trees" 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (mins)</label>
              <Input 
                type="number"
                placeholder="60" 
                value={duration}
                onChange={e => setDuration(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Learning Outcomes (Optional)</label>
              <textarea 
                className="w-full h-32 p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm resize-none"
                placeholder="What should students know by the end?&#10;- Understand wave duality&#10;- Solve equations"
                value={outcomes}
                onChange={e => setOutcomes(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full justify-center h-12 text-base font-bold shadow-lg shadow-indigo-500/30"
              disabled={isGenerating || !subject || !topic}
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Plan...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Generate Lesson Plan</>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full justify-center mt-3"
              onClick={() => setView('HISTORY')}
            >
              <History className="w-4 h-4 mr-2" /> View History
            </Button>
          </form>
        </Card>
      </div>

      {/* Guide / Empty State */}
      <div className="lg:col-span-2">
        {isGenerating ? (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-100 rounded-full animate-pulse" />
              <div className="w-20 h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute inset-0" />
              <Bot className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mt-6">Analyzing Institutional Knowledge...</h3>
            <p className="text-slate-500 mt-2 text-center max-w-sm">
              The AI is gathering context from the syllabus and generating a structured lesson plan.
            </p>
          </div>
        ) : (
          <div className="h-full bg-slate-50 rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">AI-Powered Lesson Planning</h2>
            <p className="text-slate-600 max-w-lg mb-8 leading-relaxed">
              Generate comprehensive, classroom-ready lesson plans instantly. Our Hybrid RAG engine aligns the content with your organization's curriculum and generates structured PDFs with a single click.
            </p>
            <div className="grid grid-cols-2 gap-4 text-left max-w-lg w-full">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <Layers className="w-5 h-5 text-indigo-500 mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Highly Structured</h4>
                <p className="text-xs text-slate-500 mt-1">10+ explicit sections generated.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <Printer className="w-5 h-5 text-indigo-500 mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Flawless PDF Export</h4>
                <p className="text-xs text-slate-500 mt-1">Beautiful layouts, zero overlap.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 print:space-y-0 print:m-0 print:bg-white min-h-screen">
      <div className="print:hidden">
        <PageHeader 
          title="Teacher AI Copilot" 
          subtitle="Generate, edit, and export structured lesson plans instantly."
        />
      </div>

      <div className="print:m-0">
        {view === 'GENERATOR' && renderGenerator()}
        {view === 'HISTORY' && renderHistory()}
        {view === 'EDITOR' && renderEditor()}
      </div>
    </div>
  );
}
