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
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

  const getMermaidUrl = (code: string) => {
    try {
      const cleaned = code.trim();
      const encoded = btoa(encodeURIComponent(cleaned).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
      return `https://mermaid.ink/svg/${encoded}`;
    } catch {
      return '';
    }
  };

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
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Generated Diagram: {topic}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{
                  background: viewMode === 'visual' ? '#E5E7EB' : 'transparent',
                  fontWeight: viewMode === 'visual' ? 700 : 500
                }}
                onClick={() => setViewMode('visual')}
              >
                Visual
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{
                  background: viewMode === 'code' ? '#E5E7EB' : 'transparent',
                  fontWeight: viewMode === 'code' ? 700 : 500
                }}
                onClick={() => setViewMode('code')}
              >
                Code
              </button>
              {viewMode === 'visual' && getMermaidUrl(result) && (
                <a 
                  href={getMermaidUrl(result)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm" 
                  style={{ gap: 4, textDecoration: 'none', display: 'flex', alignItems: 'center', height: 28 }}
                >
                  <Download size={13} /> Export SVG
                </a>
              )}
            </div>
          </div>
          
          {viewMode === 'visual' ? (
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border)', minHeight: 300 }}>
              <img 
                src={getMermaidUrl(result)} 
                alt={`${type} diagram about ${topic}`}
                style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
                onError={() => {
                  toast.error('Failed to render visual diagram. Please check the Code view.');
                }}
              />
            </div>
          ) : (
            <pre style={{
              fontFamily: 'monospace',
              fontSize: 14,
              lineHeight: 1.5,
              background: '#F9FAFB',
              borderRadius: 12,
              padding: 24,
              textAlign: 'left',
              overflowX: 'auto',
              margin: 0,
              color: 'var(--text-primary)',
            }}>
              {result}
            </pre>
          )}
        </motion.div>
      )}
    </div>
  );
}