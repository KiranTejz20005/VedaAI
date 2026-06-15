'use client';

import { useState, useEffect } from 'react';
import { Check, X, MessageSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReviewHubPage() {
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetching pending questions that need review
    setTimeout(() => {
      setPendingReviews([
        { id: '1', question: 'What is the main advantage of GraphQL over REST?', subject: 'Computer Science', difficulty: 'MEDIUM', bloom: 'ANALYZE', author: 'Dr. Smith' },
        { id: '2', question: 'Describe the economic impact of the Renaissance.', subject: 'History', difficulty: 'HARD', bloom: 'EVALUATE', author: 'Prof. Jones' }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleReviewAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    // Mock review API call
    setPendingReviews(prev => prev.filter(q => q.id !== id));
    if (action === 'APPROVE') {
      toast.success('Question approved and published to the bank.');
    } else {
      toast.error('Question rejected and returned to author.');
    }
  };

  return (
    <div className="dashboard-view" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="desktop-page-header dashboard-header-v3">
        <h1 className="page-title">Review Hub</h1>
        <p className="page-subtitle">Approve or reject AI-generated and faculty-submitted questions to ensure quality.</p>
      </div>

      {loading ? (
        <div style={{ padding: 20 }}>Loading pending reviews...</div>
      ) : pendingReviews.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
          <Check size={48} color="#10b981" style={{ margin: '0 auto', marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, color: '#0f172a' }}>All Caught Up!</h3>
          <p style={{ color: '#64748b', marginTop: 8 }}>There are no questions pending your review at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pendingReviews.map(review => (
            <div key={review.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span className="badge badge-pending">Needs Review</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Submitted by {review.author}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 500, color: '#0f172a' }}>{review.question}</h3>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{review.subject}</span>
                  <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{review.bloom}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleReviewAction(review.id, 'REJECT')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: '1px solid #ef4444', color: '#ef4444', background: 'white', cursor: 'pointer', fontWeight: 500 }}
                >
                  <X size={16} /> Reject
                </button>
                <button 
                  onClick={() => handleReviewAction(review.id, 'APPROVE')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', color: 'white', background: '#10b981', cursor: 'pointer', fontWeight: 500 }}
                >
                  <Check size={16} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
