'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this fetches from the new /v1/questions endpoint
    // We mock the fetch for MVP display purposes
    setTimeout(() => {
      setQuestions([
        { id: '1', content: 'What is the capital of France?', subject: 'Geography', unit: 'Europe', difficulty: 'EASY', bloomLevel: 'REMEMBER' },
        { id: '2', content: 'Explain the theory of relativity.', subject: 'Physics', unit: 'Modern Physics', difficulty: 'HARD', bloomLevel: 'UNDERSTAND' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
          <input type="text" placeholder="Search Questions..." className="input search-input" />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20 }}>Loading questions...</div>
      ) : (
        <div className="table-container" style={{ marginTop: 20, background: 'white', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: 14 }}>
                <th style={{ padding: 12 }}>Question</th>
                <th style={{ padding: 12 }}>Subject</th>
                <th style={{ padding: 12 }}>Difficulty</th>
                <th style={{ padding: 12 }}>Bloom Level</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                  <td style={{ padding: 12, fontWeight: 500, color: '#111827' }}>{q.content}</td>
                  <td style={{ padding: 12, color: '#4b5563' }}>{q.subject}</td>
                  <td style={{ padding: 12 }}>
                    <span className={`badge ${q.difficulty === 'EASY' ? 'badge-completed' : 'badge-failed'}`}>{q.difficulty}</span>
                  </td>
                  <td style={{ padding: 12, color: '#4b5563' }}>{q.bloomLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
