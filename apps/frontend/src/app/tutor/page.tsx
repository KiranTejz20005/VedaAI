'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, User, HelpCircle, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const PRESETS = [
  { text: 'Explain Object Oriented Programming in simple words.', label: 'Explain OOP' },
  { text: 'Solve this doubt: Why do leaves appear green in sunlight?', label: 'Doubt Solver' },
  { text: 'Give me 3 practice questions on quadratic equations with answers.', label: 'Practice Problems' },
  { text: 'Explain the difference between SQL and NoSQL databases.', label: 'SQL vs NoSQL' },
];

export default function TutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    
    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    const updatedHistory = [...messages, userMsg];
    
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post<{ success: boolean; data: string }>('/tutor/chat', {
        history: updatedHistory
      });
      setMessages([...updatedHistory, { role: 'assistant', content: res.data.data }]);
    } catch {
      toast.error('Tutor failed to respond');
      // Remove last user message on failure so they can try again
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear current chat conversation?')) {
      setMessages([]);
    }
  };

  return (
    <div style={{ padding: 'var(--page-pad)', maxWidth: '800px', margin: '0 auto', width: '100%', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 22 }}>
            <Sparkles size={22} color="var(--brand)" /> AI Tutor
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Ask doubts, request examples, or practice exercises with your study companion.
          </p>
        </div>
        {messages.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleClearChat}>
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages / Welcome View */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 20, marginBottom: 16, display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 10px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--brand)' }}>
              <Sparkles size={26} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Welcome to VedaAI Tutor!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420, marginTop: 8 }}>
              I am your academic assistant. Pick a prompt below or type your question to start learning.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, width: '100%', maxWidth: 500, marginTop: 28 }}>
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(preset.text)}
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    color: '#374151'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = 'var(--brand)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                >
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--brand)', marginBottom: 4 }}>{preset.label}</span>
                  {preset.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  gap: 12, 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {msg.role !== 'user' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
                    <Sparkles size={14} />
                  </div>
                )}
                <div style={{ 
                  padding: 14, 
                  borderRadius: 12, 
                  background: msg.role === 'user' ? 'var(--brand)' : '#f3f4f6', 
                  color: msg.role === 'user' ? '#fff' : '#1e293b',
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
                  <Sparkles size={14} />
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                  <Loader2 size={14} className="animate-spin" /> Tutor is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input row */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Ask a question or explain a concept..."
          className="input"
          style={{ flex: 1, height: 44, borderRadius: 22, paddingLeft: 20 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="btn btn-dark" 
          style={{ width: 44, height: 44, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          disabled={loading || !input.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
