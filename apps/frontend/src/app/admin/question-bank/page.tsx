'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Database, 
  Search, 
  Edit3, 
  Trash2, 
  Tag, 
  X,
  Upload,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  content: string;
  options: any; // MCQ options
  answer: string | null;
  hint: string | null;
  subject: string;
  topic: string;
  difficulty: string;
  bloomLevel: string;
  tags: string[];
}

export default function QuestionBankAdmin() {
  const [list, setList] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [bloomFilter, setBloomFilter] = useState('');

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Forms
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  
  // Question edit fields
  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [bloomLevel, setBloomLevel] = useState('UNDERSTAND');
  
  // Tag fields
  const [tagInput, setTagInput] = useState('');
  const [tagsList, setTagsList] = useState<string[]>([]);

  // Bulk import fields
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/question-bank');
      if (res.data?.success) {
        setList(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load questions from database');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (q: Question) => {
    setSelectedQuestion(q);
    setContent(q.content);
    setAnswer(q.answer || '');
    setHint(q.hint || '');
    setSubject(q.subject);
    setTopic(q.topic);
    setDifficulty(q.difficulty);
    setBloomLevel(q.bloomLevel);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;

    try {
      const res = await api.put(`/admin/question-bank/${selectedQuestion.id}`, {
        content,
        answer: answer || null,
        hint: hint || null,
        subject,
        topic,
        difficulty,
        bloomLevel
      });

      if (res.data?.success) {
        toast.success('Question modified successfully!');
        setShowEditModal(false);
        loadQuestions();
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleOpenTag = (q: Question) => {
    setSelectedQuestion(q);
    setTagsList(q.tags || []);
    setTagInput('');
    setShowTagModal(true);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (tagsList.includes(tagInput.trim())) return;
    setTagsList([...tagsList, tagInput.trim()]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTagsList(tagsList.filter(t => t !== tag));
  };

  const handleSaveTags = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;

    try {
      const res = await api.post(`/admin/question-bank/${selectedQuestion.id}/tag`, {
        tags: tagsList
      });

      if (res.data?.success) {
        toast.success('Question tags updated.');
        setShowTagModal(false);
        loadQuestions();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to edit tags');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this question?')) return;
    try {
      const res = await api.delete(`/admin/question-bank/${id}`);
      if (res.data?.success) {
        toast.success('Question deleted successfully.');
        loadQuestions();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(bulkText);
      if (!Array.isArray(parsed)) {
        toast.error('Data must be a JSON array of questions.');
        return;
      }

      const res = await api.post('/admin/question-bank/bulk-import', {
        questions: parsed
      });

      if (res.data?.success) {
        toast.success(`Successfully imported ${res.data.count} questions into the bank!`);
        setShowImportModal(false);
        setBulkText('');
        loadQuestions();
      }
    } catch (err: any) {
      toast.error('JSON parsing failed. Make sure formatting is correct.');
    }
  };

  // Get distinct subjects for filters
  const subjects = Array.from(new Set(list.map(q => q.subject))).filter(Boolean);

  const filteredList = list.filter(q => {
    const matchSearch = q.content.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !subjectFilter || q.subject === subjectFilter;
    const matchDifficulty = !difficultyFilter || q.difficulty === difficultyFilter;
    const matchBloom = !bloomFilter || q.bloomLevel === bloomFilter;
    return matchSearch && matchSubject && matchDifficulty && matchBloom;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Question Bank</h2>
          <p className="text-gray-500 text-xs md:text-sm">Inspect curriculum questions, modify content, tag metadata, and import JSON datasets.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="border border-gray-200 hover:bg-gray-50 bg-white text-gray-700 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Upload size={14} /> Bulk JSON Import
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search content or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={bloomFilter}
            onChange={(e) => setBloomFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">All Bloom Levels</option>
            <option value="REMEMBER">Remember</option>
            <option value="UNDERSTAND">Understand</option>
            <option value="APPLY">Apply</option>
            <option value="ANALYZE">Analyze</option>
            <option value="EVALUATE">Evaluate</option>
            <option value="CREATE">Create</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">No questions matched the filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Question Content</th>
                  <th className="py-2.5">Subject & Topic</th>
                  <th className="py-2.5">Level & Bloom</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredList.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 max-w-[280px] pr-2">
                      <div className="font-semibold text-gray-800 line-clamp-2">{q.content}</div>
                      {q.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {q.tags.map(t => (
                            <span key={t} className="bg-gray-50 text-gray-400 text-[8px] font-bold px-1 py-0.5 rounded border border-gray-150 uppercase">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-gray-500 font-medium">
                      <div className="text-gray-700 font-bold">{q.subject}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{q.topic}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                        q.difficulty === 'EASY' ? 'bg-green-50 text-green-700 border-green-200' :
                        q.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {q.difficulty}
                      </span>
                      <div className="text-[9px] text-gray-500 font-bold uppercase mt-1">{q.bloomLevel}</div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenTag(q)}
                          className="p-1.5 hover:bg-gray-100 rounded text-blue-600"
                          title="Manage Tags"
                        >
                          <Tag size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-400"
                          title="Delete"
                        >
                          <Trash2 size={14} />
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

      {/* 1. Edit Question Modal */}
      {showEditModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowEditModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Edit Question</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Question Content *</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Enter question prompt..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Topic *</label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Difficulty *</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Bloom Level *</label>
                  <select
                    value={bloomLevel}
                    onChange={(e) => setBloomLevel(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="REMEMBER">Remember</option>
                    <option value="UNDERSTAND">Understand</option>
                    <option value="APPLY">Apply</option>
                    <option value="ANALYZE">Analyze</option>
                    <option value="EVALUATE">Evaluate</option>
                    <option value="CREATE">Create</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Answer Explanation (Optional)</label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Enter answer details"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Tag Question Modal */}
      {showTagModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowTagModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Manage Question Tags</h3>
            <p className="text-[10px] text-gray-500 mb-4 font-semibold">Tag curriculum references or units for database index searching.</p>

            <form onSubmit={handleSaveTags} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  placeholder="e.g. Chapter 3"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {tagsList.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic">No tags configured yet.</span>
                ) : (
                  tagsList.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 rounded px-2 py-0.5 text-[10px] font-bold">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="text-blue-500 hover:text-blue-700">
                        <X size={10} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs mt-4"
              >
                Apply Tags
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Bulk JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowImportModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Bulk JSON Dataset Import</h3>
            <p className="text-[10px] text-gray-500 mb-4 font-semibold">Paste a JSON array containing question prompts, subjects, topics, and difficulty states.</p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <textarea
                  required
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[10px] font-mono focus:outline-none focus:border-blue-500"
                  placeholder='[&#10;  {&#10;    "content": "What is 2+2?",&#10;    "subject": "Mathematics",&#10;    "topic": "Addition",&#10;    "difficulty": "EASY",&#10;    "bloomLevel": "REMEMBER"&#10;  }&#10;]'
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs"
              >
                Execute JSON Import
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
