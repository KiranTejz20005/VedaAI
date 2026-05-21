'use client';

import { Library, Search, Filter, Download, Eye, FileText, Clock, BookOpen, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_PAPERS = [
  { id: '1', title: 'Mid-Term Physics Exam', subject: 'Physics', class: '10-A', date: '12-03-2025', questions: 17, marks: 50, status: 'completed' },
  { id: '2', title: 'Unit Test — Organic Chemistry', subject: 'Chemistry', class: '11-B', date: '05-03-2025', questions: 20, marks: 40, status: 'completed' },
  { id: '3', title: 'Annual Maths Paper', subject: 'Mathematics', class: '12-A', date: '28-02-2025', questions: 25, marks: 80, status: 'completed' },
  { id: '4', title: 'Biology Chapter 5 Quiz', subject: 'Biology', class: '10-B', date: '20-02-2025', questions: 10, marks: 20, status: 'completed' },
  { id: '5', title: 'Computer Science Practicals', subject: 'Computer Science', class: '12-B', date: '15-02-2025', questions: 8, marks: 30, status: 'completed' },
  { id: '6', title: 'English Comprehension Test', subject: 'English', class: '11-A', date: '10-02-2025', questions: 12, marks: 25, status: 'completed' },
];

const SUBJECT_COLORS: Record<string, { bg: string; color: string }> = {
  Physics:          { bg: '#EDE9FE', color: '#7C3AED' },
  Chemistry:        { bg: '#D1FAE5', color: '#059669' },
  Mathematics:      { bg: '#DBEAFE', color: '#2563EB' },
  Biology:          { bg: '#FEF3C7', color: '#D97706' },
  'Computer Science': { bg: '#FCE7F3', color: '#DB2777' },
  English:          { bg: '#FEF9C3', color: '#CA8A04' },
};

export default function LibraryPage() {
  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="status-dot" aria-hidden="true" />
              <h1 className="page-title">My Library</h1>
            </div>
            <p className="page-subtitle">All your generated question papers, saved and ready to reuse.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Papers', value: 6, color: '#6366F1' },
          { label: 'Total Questions', value: 92, color: '#10B981' },
          { label: 'Subjects Covered', value: 6, color: '#F59E0B' },
          { label: 'This Month', value: 4, color: '#E8531D' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="filter-btn" aria-label="Filter">
          <Filter size={14} />
          Filter
        </button>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search papers…"
            className="input search-input"
            aria-label="Search library"
          />
        </div>
      </div>

      {/* Papers list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK_PAPERS.map((paper, i) => {
          const subjectStyle = SUBJECT_COLORS[paper.subject] ?? { bg: '#F3F4F6', color: '#374151' };
          return (
            <motion.div
              key={paper.id}
              className="card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ padding: '14px 18px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: subjectStyle.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FileText size={18} color={subjectStyle.color} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="card-title" style={{ fontSize: 14 }}>{paper.title}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px',
                      borderRadius: 100, background: subjectStyle.bg, color: subjectStyle.color,
                      flexShrink: 0,
                    }}>
                      {paper.subject}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <BookOpen size={12} /> {paper.class}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Library size={12} /> {paper.questions} questions · {paper.marks} marks
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Clock size={12} /> {paper.date}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" style={{ gap: 5 }} aria-label="View paper">
                    <Eye size={13} /> View
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ gap: 5 }} aria-label="Download paper">
                    <Download size={13} /> PDF
                  </button>
                  <button className="menu-btn" aria-label="More options">
                    <MoreVertical size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
