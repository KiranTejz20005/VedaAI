'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/services/api.client';

interface Question {
  id: string;
  content: string;
  difficulty: string;
  bloomLevel: string;
  author?: { firstName: string; lastName: string };
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiClient.get<{ success: boolean; data: Question[] }>('/questions')
      .then((res) => { if (!cancelled) setQuestions(res.data.data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load questions'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = questions.filter((q) =>
    !search || q.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="status-dot" aria-hidden="true" />
          <h1 className="page-title">Question Bank</h1>
        </div>
        <p className="page-subtitle">Manage, review, and organize your assessment questions.</p>
      </div>

      <div className="search-filter-row search-filter-row-v3">
        <div className="search-wrap">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search Questions..."
            className="input search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
          <Loader2 size={18} className="animate-spin" /> Loading questions...
        </div>
      ) : error ? (
        <div style={{ padding: 20, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} /> {error}
        </div>
      ) : (
        <div className="table-container" style={{ marginTop: 20, background: 'white', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              {search ? 'No questions match your search.' : 'No questions yet. Generate your first question!'}
            </div>
          ) : (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: 14 }}>
                  <th style={{ padding: 12 }}>Question</th>
                  <th style={{ padding: 12 }}>Difficulty</th>
                  <th style={{ padding: 12 }}>Bloom Level</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                    <td style={{ padding: 12, fontWeight: 500, color: '#111827' }}>{q.content}</td>
                    <td style={{ padding: 12 }}>
                      <span className={`badge ${q.difficulty === 'EASY' ? 'badge-completed' : q.difficulty === 'HARD' ? 'badge-failed' : 'badge-pending'}`}>{q.difficulty}</span>
                    </td>
                    <td style={{ padding: 12, color: '#4b5563' }}>{q.bloomLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="dashboard-fab-v3">
        <Link href="/generate" className="dashboard-fab-btn">
          <Plus size={16} strokeWidth={2.5} />
          Generate Question
        </Link>
      </div>
    </div>
  );
}
