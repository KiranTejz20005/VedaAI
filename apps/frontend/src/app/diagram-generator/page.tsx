'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Download, GitBranch, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateDiagram } from '@/services/ai-tools.service';

const DIAGRAM_TYPES = [
  { id: 'flowchart', label: 'Flowchart' },
  { id: 'venn', label: 'Venn Diagram' },
  { id: 'cycle', label: 'Cycle Diagram' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'pyramid', label: 'Pyramid' },
  { id: 'network', label: 'Network Diagram' },
];

export default function DiagramGeneratorPage() {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('flowchart');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return; }
    setGenerating(true);
    try {
      const result = await generateDiagram(topic.trim(), type);
      setResult(result.diagram);
      toast.success('Diagram generated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate diagram');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image size={24} color="#D97706" />
          <h1 className="page-title">Diagram Generator</h1>
        </div>
        <p className="page-subtitle">Auto-generate labelled diagrams and figures for science and maths questions.</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 2, minWidth: 200 }}>
            <label className="label">Topic / Concept</label>
            <input type="text" className="input" placeholder="e.g. Water Cycle, Photosynthesis, Network Topology" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="label">Diagram Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {DIAGRAM_TYPES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} style={{ gap: 6, height: 40 }}>
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate
          </button>
        </div>
      </div>

      {result && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Generated Diagram: {topic}</h3>
            <button className="btn btn-secondary btn-sm" style={{ gap: 4 }} onClick={() => toast.success('PDF export coming soon')}>
              <Download size={13} /> Export
            </button>
          </div>
          <pre style={{
            fontFamily: 'monospace',
            fontSize: 14,
            lineHeight: 1.5,
            background: '#F9FAFB',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            overflowX: 'auto',
            margin: 0,
            color: 'var(--text-primary)',
          }}>
            {result}
          </pre>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
            Visual rendering and export features coming soon.
          </p>
        </motion.div>
      )}
    </div>
  );
}