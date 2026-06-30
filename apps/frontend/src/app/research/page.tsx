'use client';

import { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { BookOpen, Search, FileText, Bookmark, Sparkles, Download, Quote } from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_LIBRARY = [
  { id: '1', title: 'Attention Is All You Need', authors: 'Vaswani et al.', type: 'Journal Paper', year: 2017 },
  { id: '2', title: 'Deep Learning for Education', authors: 'Smith, J.', type: 'Book', year: 2023 },
  { id: '3', title: 'Hybrid RAG Architecture', authors: 'Doe, A.', type: 'Conference Proceeding', year: 2025 },
  { id: '4', title: 'Multimodal Student Dataset', authors: 'Institution Lab', type: 'Dataset', year: 2026 },
  { id: '5', title: 'System for Dynamic RAG Orchestration', authors: 'Doe, A.', type: 'Patent', year: 2026 },
];

export default function ResearchHubPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopilotAction = () => {
    toast.success('AI Research Copilot is analyzing literature...');
    setTimeout(() => toast.success('Generated Literature Review!'), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Digital Library & Research Hub"
          subtitle="Explore institutional repositories, manage citations, and accelerate research."
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline"><Bookmark size={16} style={{ marginRight: 8 }} /> My Library</Button>
          <Button variant="primary">Upload Paper</Button>
        </div>
      </div>

      <Card padding="24px">
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by title, author, keyword, or semantic concept (Powered by Hybrid RAG)..." 
              style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: 'var(--text-base)', border: '1px solid var(--border)', borderRadius: 12, outline: 'none' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="primary" style={{ padding: '0 32px' }} onClick={() => toast.success('Searching knowledge base...')}>Search</Button>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Digital Library Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Institutional Repository</h3>
          {MOCK_LIBRARY.map(item => (
            <Card key={item.id} padding="20px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ 
                      fontSize: 'var(--text-xs)', fontWeight: 600, padding: '4px 8px', borderRadius: 12,
                      color: item.type === 'Dataset' ? '#059669' : item.type === 'Patent' ? '#7C3AED' : 'var(--brand)',
                      background: item.type === 'Dataset' ? '#D1FAE5' : item.type === 'Patent' ? '#EDE9FE' : 'var(--brand-light)'
                    }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{item.year}</span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-lg)', fontWeight: 700 }}>{item.title}</h4>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{item.authors}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" size="sm" onClick={() => toast.success('Citation copied to clipboard (APA Format)')}>
                    <Quote size={14} style={{ marginRight: 6 }} /> Cite
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download size={14} style={{ marginRight: 6 }} /> PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* AI Research Copilot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding="24px" style={{ background: 'var(--brand-light)', border: '1px solid var(--brand)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--brand)', margin: 0 }}>AI Research Copilot</h3>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 24 }}>
              Accelerate your research with our Hybrid RAG assistant. Ask questions, find gaps, and generate literature reviews.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button variant="outline" style={{ justifyContent: 'flex-start', background: 'white' }} onClick={handleCopilotAction}>
                <FileText size={16} style={{ marginRight: 12 }} /> Generate Literature Review
              </Button>
              <Button variant="outline" style={{ justifyContent: 'flex-start', background: 'white' }} onClick={handleCopilotAction}>
                <Search size={16} style={{ marginRight: 12 }} /> Detect Research Gaps
              </Button>
              <Button variant="outline" style={{ justifyContent: 'flex-start', background: 'white' }} onClick={handleCopilotAction}>
                <BookOpen size={16} style={{ marginRight: 12 }} /> Summarize Key Findings
              </Button>
              <Button variant="outline" style={{ justifyContent: 'flex-start', background: 'white', borderColor: '#7C3AED', color: '#7C3AED' }} onClick={handleCopilotAction}>
                <Sparkles size={16} style={{ marginRight: 12 }} /> Patent Novelty Detection
              </Button>
            </div>
          </Card>
          
          <Card padding="24px">
             <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 16px 0' }}>My Thesis Workspace</h3>
             <div style={{ padding: '16px', background: 'var(--bg-muted)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>PhD Proposal Draft</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: '#F59E0B', fontWeight: 600 }}>In Review</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', background: 'var(--brand)' }} />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 8 }}>Awaiting Supervisor Feedback</div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
