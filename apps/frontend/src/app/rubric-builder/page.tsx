'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateRubric } from '@/services/ai-tools.service';

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  levels: { label: string; points: number; description: string }[];
}

function createLevel(points: number) {
  const labels = ['Below Expectation', 'Approaching', 'Meeting', 'Exceeding'];
  return { label: labels[points - 1] || `Level ${points}`, points, description: '' };
}

function createCriterion(name = ''): RubricCriterion {
  return {
    id: Math.random().toString(36).slice(2),
    name,
    description: '',
    levels: Array.from({ length: 4 }, (_, i) => createLevel(i + 1)),
  };
}

export default function RubricBuilderPage() {
  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState<RubricCriterion[]>([createCriterion('Knowledge & Understanding'), createCriterion('Application')]);
  const [generating, setGenerating] = useState(false);

  const addCriterion = () => setCriteria((prev) => [...prev, createCriterion()]);

  const removeCriterion = (id: string) => {
    if (criteria.length <= 1) { toast.error('Need at least one criterion'); return; }
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCriterion = (id: string, field: keyof RubricCriterion, value: string) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const updateLevel = (cId: string, lIndex: number, field: string, value: string | number) => {
    setCriteria((prev) => prev.map((c) => c.id === cId ? {
      ...c,
      levels: c.levels.map((l, i) => i === lIndex ? { ...l, [field]: value } : l),
    } : c));
  };

  const handleAISuggest = async () => {
    if (!title.trim()) { toast.error('Enter a rubric title first'); return; }
    setGenerating(true);
    try {
      const result = await generateRubric(title.trim());
      setCriteria(result.criteria.map((c: any) => ({
        id: Math.random().toString(36).slice(2),
        name: c.name,
        description: c.description || '',
        levels: c.levels.map((l: any) => ({ label: l.label, points: l.points, description: l.description || '' })),
      })));
      toast.success('AI suggested rubric criteria');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate rubric');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) { toast.error('Enter a rubric title'); return; }
    localStorage.setItem(`rubric-${Date.now()}`, JSON.stringify({ title, criteria }));
    toast.success('Rubric saved locally');
  };

  const totalPoints = criteria[0]?.levels.length
    ? Math.max(...criteria[0].levels.map((l) => l.points)) * criteria.length
    : 0;

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={24} color="#059669" />
          <h1 className="page-title">Rubric Builder</h1>
        </div>
        <p className="page-subtitle">Create detailed marking rubrics with AI assistance.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" className="input" placeholder="Rubric title (e.g. Science Project Rubric)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 1, minWidth: 260 }} />
        <button className="btn btn-secondary" onClick={handleAISuggest} disabled={generating} style={{ gap: 6 }}>
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          AI Suggest
        </button>
        <button className="btn btn-primary" onClick={handleSave} style={{ gap: 6 }}>
          Save Rubric
        </button>
      </div>

      {criteria.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)', minWidth: 160 }}>Criteria</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Description</th>
                  {criteria[0]?.levels.map((level, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: 'center', minWidth: 120, background: i === criteria[0].levels.length - 1 ? '#F0FDF4' : i === 0 ? '#FEF2F2' : 'transparent' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: i === criteria[0].levels.length - 1 ? '#059669' : i === 0 ? '#EF4444' : 'var(--text-primary)' }}>{level.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{level.points} pts</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((criterion) => (
                  <tr key={criterion.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <input type="text" className="input" value={criterion.name} onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)} style={{ height: 32, fontSize: 12, padding: '4px 8px' }} />
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <input type="text" className="input" value={criterion.description} onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)} style={{ height: 32, fontSize: 12, padding: '4px 8px' }} />
                    </td>
                    {criterion.levels.map((level, li) => (
                      <td key={li} style={{ padding: '10px 16px' }}>
                        <input type="text" className="input" value={level.description} onChange={(e) => updateLevel(criterion.id, li, 'description', e.target.value)} placeholder="Describe..." style={{ height: 32, fontSize: 12, padding: '4px 8px' }} />
                      </td>
                    ))}
                    <td style={{ padding: '10px 16px' }}>
                      <button className="menu-btn" onClick={() => removeCriterion(criterion.id)} aria-label="Remove"><Trash2 size={14} color="#EF4444" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <button className="btn btn-secondary" onClick={addCriterion} style={{ gap: 6 }}>
          <Plus size={14} /> Add Criterion
        </button>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Total: <strong style={{ color: 'var(--text-primary)' }}>{totalPoints} points</strong> across <strong>{criteria.length}</strong> criteria
        </div>
      </div>
    </div>
  );
}