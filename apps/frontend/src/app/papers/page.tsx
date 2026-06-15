'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PapersPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetching generated papers
    setTimeout(() => {
      setPapers([
        { id: '1', title: 'Midterm Geography Exam', subject: 'Geography', totalMarks: 100, questionCount: 20, status: 'PUBLISHED' },
        { id: '2', title: 'Physics Final Assessment', subject: 'Physics', totalMarks: 50, questionCount: 10, status: 'DRAFT' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleExport = (id: string) => {
    toast.success('Paper exported as PDF successfully!');
  };

  return (
    <div className="dashboard-view" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={24} color="#0f172a" />
          <h1 className="page-title">Paper Management</h1>
        </div>
        <p className="page-subtitle">Assemble, review, and export full assessment question papers.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Create New Paper
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 20 }}>Loading papers...</div>
      ) : (
        <div className="table-container" style={{ background: 'white', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: 14 }}>
                <th style={{ padding: 12 }}>Title</th>
                <th style={{ padding: 12 }}>Subject</th>
                <th style={{ padding: 12 }}>Metrics</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {papers.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                  <td style={{ padding: 12, fontWeight: 500, color: '#111827' }}>{p.title}</td>
                  <td style={{ padding: 12, color: '#4b5563' }}>{p.subject}</td>
                  <td style={{ padding: 12, color: '#4b5563' }}>{p.questionCount} Qs / {p.totalMarks} Marks</td>
                  <td style={{ padding: 12 }}>
                    <span className={`badge ${p.status === 'PUBLISHED' ? 'badge-completed' : 'badge-pending'}`}>{p.status}</span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="View">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleExport(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9' }} title="Export PDF">
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
