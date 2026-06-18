'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Loader2, AlertCircle, Bookmark, Layers, 
  Filter, History, Edit3, X, Check, CheckSquare, Square, Eye, FolderPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface Question {
  id: string;
  content: string;
  options: any;
  answer?: string;
  hint?: string;
  subject: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  tags: string[];
  createdAt: string;
}

interface QuestionVersion {
  id: string;
  versionNumber: number;
  content: string;
  options: any;
  answer?: string;
  updatedBy: string;
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  questions?: Question[];
  _count?: { questions: number };
}

export default function QuestionBankPage() {
  const [activeTab, setActiveTab] = useState<'questions' | 'collections'>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [bloomLevel, setBloomLevel] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // Detailed Modal view states
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questionVersions, setQuestionVersions] = useState<QuestionVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  // Collections state
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [newCollDesc, setNewCollDesc] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  // Fetch Questions
  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (subject) params.append('subject', subject);
      if (topic) params.append('topic', topic);
      if (difficulty) params.append('difficulty', difficulty);
      if (bloomLevel) params.append('bloomLevel', bloomLevel);

      const res = await apiClient.get<{ success: boolean; data: Question[] }>(`/question-bank?${params.toString()}`);
      setQuestions(res.data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Fetch Collections
  const fetchCollections = async () => {
    setLoadingCollections(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: Collection[] }>('/question-bank/collections');
      setCollections(res.data.data);
    } catch (err) {
      toast.error('Failed to load collections');
    } finally {
      setLoadingCollections(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [search, subject, topic, difficulty, bloomLevel]);

  useEffect(() => {
    if (activeTab === 'collections') {
      fetchCollections();
    }
  }, [activeTab]);

  // Load versions when a question is selected
  useEffect(() => {
    if (!selectedQuestion) return;
    setLoadingVersions(true);
    apiClient.get<{ success: boolean; data: QuestionVersion[] }>(`/question-bank/${selectedQuestion.id}/versions`)
      .then((res) => setQuestionVersions(res.data.data))
      .catch(() => toast.error('Failed to load version history'))
      .finally(() => setLoadingVersions(false));
  }, [selectedQuestion]);

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion) return;
    try {
      const res = await apiClient.put<{ success: boolean; data: Question }>(`/question-bank/${selectedQuestion.id}`, {
        content: editContent,
        answer: editAnswer,
        options: selectedQuestion.options
      });
      toast.success('Question updated successfully!');
      setSelectedQuestion(res.data.data);
      setIsEditing(false);
      fetchQuestions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollName.trim()) {
      toast.error('Collection name is required');
      return;
    }
    try {
      await apiClient.post('/question-bank/collections', {
        name: newCollName,
        description: newCollDesc,
        questionIds: selectedQuestions
      });
      toast.success('Collection created successfully!');
      setIsCreateCollectionOpen(false);
      setNewCollName('');
      setNewCollDesc('');
      setSelectedQuestions([]);
      if (activeTab === 'collections') {
        fetchCollections();
      } else {
        setActiveTab('collections');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create collection');
    }
  };

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const selectAllQuestions = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="desktop-page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bookmark size={24} color="var(--brand)" />
              <h1 className="page-title">Enterprise Question Bank</h1>
            </div>
            <p className="page-subtitle">Store, search, version, and group all your assessment questions.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedQuestions.length > 0 && (
              <button 
                className="btn btn-dark btn-pill" 
                onClick={() => setIsCreateCollectionOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FolderPlus size={16} />
                Create Collection ({selectedQuestions.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 24, fontSize: 14, marginBottom: 20 }}>
        <button
          onClick={() => { setActiveTab('questions'); setSelectedCollection(null); }}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '12px 4px',
            fontWeight: 600,
            color: activeTab === 'questions' && !selectedCollection ? 'var(--brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'questions' && !selectedCollection ? '2px solid var(--brand)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          All Questions
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '12px 4px',
            fontWeight: 600,
            color: activeTab === 'collections' || selectedCollection ? 'var(--brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'collections' || selectedCollection ? '2px solid var(--brand)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Collections ({collections.length || 0})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'questions' && !selectedCollection ? (
          <motion.div
            key="questions-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Filter Bar */}
            <div className="card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by keywords..."
                    className="input"
                    style={{ paddingLeft: 36, width: '100%' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select className="input" style={{ width: 140 }} value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">All Subjects</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                </select>
                <select className="input" style={{ width: 140 }} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
                <select className="input" style={{ width: 140 }} value={bloomLevel} onChange={(e) => setBloomLevel(e.target.value)}>
                  <option value="">All Bloom Levels</option>
                  <option value="REMEMBER">Remember</option>
                  <option value="UNDERSTAND">Understand</option>
                  <option value="APPLY">Apply</option>
                  <option value="ANALYZE">Analyze</option>
                  <option value="EVALUATE">Evaluate</option>
                  <option value="CREATE">Create</option>
                </select>
              </div>
            </div>

            {/* Questions Table */}
            {loadingQuestions ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
                <Loader2 size={18} className="animate-spin" /> Loading bank questions...
              </div>
            ) : error ? (
              <div style={{ padding: 20, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} /> {error}
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: 12, width: 40, textAlign: 'center' }}>
                        <button 
                          onClick={selectAllQuestions} 
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand)' }}
                        >
                          {selectedQuestions.length === questions.length && questions.length > 0 ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th style={{ padding: 12 }}>Question Content</th>
                      <th style={{ padding: 12, width: 150 }}>Subject/Topic</th>
                      <th style={{ padding: 12, width: 100 }}>Difficulty</th>
                      <th style={{ padding: 12, width: 120 }}>Bloom Level</th>
                      <th style={{ padding: 12, width: 80, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                          No questions found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      questions.map((q) => (
                        <tr key={q.id} style={{ borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                          <td style={{ padding: 12, textAlign: 'center' }}>
                            <button 
                              onClick={() => toggleSelectQuestion(q.id)} 
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                              {selectedQuestions.includes(q.id) ? (
                                <CheckSquare size={16} color="var(--brand)" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>
                          <td style={{ padding: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                            <div style={{ maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {q.content}
                            </div>
                          </td>
                          <td style={{ padding: 12, color: 'var(--text-secondary)', fontSize: 13 }}>
                            <div>{q.subject}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.topic}</div>
                          </td>
                          <td style={{ padding: 12 }}>
                            <span className={`badge ${q.difficulty === 'EASY' ? 'badge-completed' : q.difficulty === 'HARD' ? 'badge-failed' : 'badge-pending'}`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{q.bloomLevel}</td>
                          <td style={{ padding: 12, textAlign: 'center' }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedQuestion(q);
                                setEditContent(q.content);
                                setEditAnswer(q.answer || '');
                                setIsEditing(false);
                              }}
                              style={{ padding: '4px 8px', fontSize: 12 }}
                            >
                              <Eye size={12} style={{ marginRight: 4 }} /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          // Collections Tab or selected collection detail
          <motion.div
            key="collections-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {selectedCollection ? (
              <div>
                <button 
                  onClick={() => setSelectedCollection(null)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: 16,
                    padding: 0
                  }}
                >
                  &larr; Back to Collections
                </button>
                <div className="card" style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{selectedCollection.name}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '8px 0 0 0' }}>{selectedCollection.description || 'No description provided.'}</p>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: 12 }}>Question</th>
                        <th style={{ padding: 12, width: 150 }}>Subject</th>
                        <th style={{ padding: 12, width: 100 }}>Difficulty</th>
                        <th style={{ padding: 12, width: 120 }}>Bloom Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCollection.questions?.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                            No questions in this collection.
                          </td>
                        </tr>
                      ) : (
                        selectedCollection.questions?.map((q) => (
                          <tr key={q.id} style={{ borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                            <td style={{ padding: 12, fontWeight: 500 }}>{q.content}</td>
                            <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{q.subject}</td>
                            <td style={{ padding: 12 }}>
                              <span className={`badge ${q.difficulty === 'EASY' ? 'badge-completed' : q.difficulty === 'HARD' ? 'badge-failed' : 'badge-pending'}`}>
                                {q.difficulty}
                              </span>
                            </td>
                            <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{q.bloomLevel}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Collections Repository</h3>
                  <button className="btn btn-dark btn-pill btn-sm" onClick={() => setIsCreateCollectionOpen(true)}>
                    <Plus size={14} style={{ marginRight: 4 }} /> New Collection
                  </button>
                </div>
                
                {loadingCollections ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
                    <Loader2 size={18} className="animate-spin" /> Loading collections...
                  </div>
                ) : collections.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                    No collections created yet. Select questions from "All Questions" to pool them.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {collections.map((c) => (
                      <div 
                        key={c.id} 
                        className="card" 
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}
                        onClick={async () => {
                          try {
                            const res = await apiClient.get<{ success: boolean; data: Collection }>(`/question-bank/collections/${c.id}`);
                            setSelectedCollection(res.data.data);
                          } catch {
                            toast.error('Failed to get collection details');
                          }
                        }}
                      >
                        <div>
                          <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{c.name}</h4>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {c.description || 'No description provided.'}
                          </p>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Collection Pool</span>
                          <span>{c._count?.questions ?? c.questions?.length ?? 0} questions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Details / Versions Modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuestion(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="card"
              style={{ width: '100%', maxWidth: 700, position: 'relative', zIndex: 101, padding: 24, maxHeight: '85vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>
                  Question Details
                </h3>
                <button onClick={() => setSelectedQuestion(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Question Content</label>
                    {!isEditing && (
                      <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)} style={{ padding: '2px 8px', fontSize: 12 }}>
                        <Edit3 size={12} style={{ marginRight: 4 }} /> Edit
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <textarea
                      className="input"
                      style={{ width: '100%', minHeight: 80, fontFamily: 'monospace' }}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                  ) : (
                    <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 6, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {selectedQuestion.content}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Correct Answer</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%' }}
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                    />
                  ) : (
                    <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                      {selectedQuestion.answer || <em style={{ color: 'var(--text-muted)' }}>No answer key specified</em>}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-pill btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
                    <button className="btn btn-dark btn-pill btn-sm" onClick={handleUpdateQuestion}>Save Changes</button>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <History size={16} /> Version History
                  </h4>
                  {loadingVersions ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                      <Loader2 size={14} className="animate-spin" /> Loading versions...
                    </div>
                  ) : questionVersions.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No previous versions found.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {questionVersions.map((v) => (
                        <div key={v.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 10, fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>
                            <span>Version #{v.versionNumber} by {v.updatedBy}</span>
                            <span>{new Date(v.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: 6, borderRadius: 4, marginTop: 4 }}>
                            {v.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Collection Dialog Modal */}
      <AnimatePresence>
        {isCreateCollectionOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateCollectionOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="card"
              style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 101, padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>
                  Create New Collection
                </h3>
                <button onClick={() => setIsCreateCollectionOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCollection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label htmlFor="collName" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Collection Name
                  </label>
                  <input
                    id="collName"
                    type="text"
                    required
                    placeholder="e.g. Midterm Pool 2026 or Final Review"
                    className="input"
                    style={{ width: '100%' }}
                    value={newCollName}
                    onChange={(e) => setNewCollName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="collDesc" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Description (Optional)
                  </label>
                  <textarea
                    id="collDesc"
                    placeholder="Provide details about this question pool..."
                    className="input"
                    style={{ width: '100%', minHeight: 80 }}
                    value={newCollDesc}
                    onChange={(e) => setNewCollDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="button" className="btn btn-secondary btn-pill" onClick={() => setIsCreateCollectionOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark btn-pill">Create Pool</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
