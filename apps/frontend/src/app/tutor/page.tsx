'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, RefreshCw } from 'lucide-react';
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

function parseMessageOptions(content: string) {
  const lines = content.split('\n');
  const options: { id: string; text: string }[] = [];
  const textLines: string[] = [];
  
  const optionRegex = /^([A-D])\)\s+(.*)/i;
  
  for (const line of lines) {
    const match = line.match(optionRegex);
    if (match) {
      options.push({ id: match[1].toUpperCase(), text: match[2].trim() });
    } else {
      textLines.push(line);
    }
  }
  
  return {
    text: textLines.join('\n').trim(),
    options
  };
}

const MessageRenderer = ({ content, role, onOptionClick }: { content: string, role: string, onOptionClick: (opt: string) => void }) => {
  if (role === 'user') {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>;
  }
  
  const parsed = parseMessageOptions(content);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ whiteSpace: 'pre-wrap' }}>{parsed.text}</div>
      {parsed.options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {parsed.options.map(opt => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => onOptionClick(`I choose option ${opt.id}) ${opt.text}`)}
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = 'var(--brand)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ 
                background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', 
                color: '#fff', 
                width: 28, height: 28, 
                borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0
              }}>{opt.id}</span>
              {opt.text}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function TutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div style={{ 
      position: 'relative',
      height: 'calc(100vh - 64px)', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
    }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ padding: '24px 32px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', padding: 6, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="#fff" />
              </div>
              AI Tutor
            </h1>
            <p style={{ margin: '6px 0 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
              Your intelligent academic companion. Ask questions or practice concepts.
            </p>
          </div>
          {messages.length > 0 && (
            <button 
              onClick={handleClearChat}
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(0,0,0,0.05)',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--brand)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <RefreshCw size={14} /> Clear Chat
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 24px', display: 'flex', flexDirection: 'column', scrollBehavior: 'smooth' }}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 10px', textAlign: 'center' }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 8px 24px rgba(99,102,241,0.2)' }}>
                <Sparkles size={30} color="#fff" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Hello, I'm VidyaAI!</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 460, lineHeight: 1.5 }}>
                I can help you understand complex concepts, solve doubts, or test your knowledge with interactive practice questions.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, width: '100%', maxWidth: 600, marginTop: 40 }}>
                {PRESETS.map((preset, idx) => (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    key={idx}
                    onClick={() => handleSendMessage(preset.text)}
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.9)',
                      borderRadius: 16,
                      fontSize: 13,
                      lineHeight: 1.4,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: 'var(--text-secondary)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.background = '#fff'; 
                      e.currentTarget.style.borderColor = 'var(--brand)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; 
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)'; 
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.02)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, fontSize: 14 }}>{preset.label}</span>
                    {preset.text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 20 }}>
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      gap: 16, 
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%'
                    }}
                  >
                    {msg.role !== 'user' && (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}>
                        <Sparkles size={18} color="#fff" />
                      </div>
                    )}
                    <div style={{ 
                      padding: '16px 20px', 
                      borderRadius: 20, 
                      borderTopRightRadius: msg.role === 'user' ? 4 : 20,
                      borderTopLeftRadius: msg.role !== 'user' ? 4 : 20,
                      background: msg.role === 'user' ? 'linear-gradient(135deg, var(--brand), #8b5cf6)' : '#fff', 
                      color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                      fontSize: 15,
                      lineHeight: 1.6,
                      boxShadow: msg.role === 'user' ? '0 8px 24px rgba(99,102,241,0.25)' : '0 4px 20px rgba(0,0,0,0.04)',
                      border: msg.role !== 'user' ? '1px solid rgba(0,0,0,0.02)' : 'none'
                    }}>
                      <MessageRenderer content={msg.content} role={msg.role} onOptionClick={handleSendMessage} />
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', gap: 16, alignSelf: 'flex-start' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}>
                      <Sparkles size={18} color="#fff" />
                    </div>
                    <div style={{ 
                      padding: '16px 20px', 
                      borderRadius: 20, 
                      borderTopLeftRadius: 4,
                      background: '#fff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      fontSize: 14, 
                      color: 'var(--text-muted)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                    }}>
                      <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', animation: 'pulse 1.5s infinite ease-in-out' }} />
                      <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', animation: 'pulse 1.5s infinite ease-in-out 0.2s' }} />
                      <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', animation: 'pulse 1.5s infinite ease-in-out 0.4s' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input Area */}
        <div style={{ padding: '0 32px 32px' }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            style={{ 
              display: 'flex', 
              gap: 12, 
              background: '#fff',
              padding: '8px 8px 8px 24px',
              borderRadius: 32,
              boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.02)',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Ask a question or explain a concept..."
              style={{ 
                flex: 1, 
                height: 44, 
                border: 'none', 
                outline: 'none', 
                fontSize: 15,
                background: 'transparent',
                color: 'var(--text-primary)'
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              style={{ 
                width: 44, 
                height: 44, 
                borderRadius: '50%', 
                padding: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: input.trim() && !loading ? 'linear-gradient(135deg, var(--brand), #8b5cf6)' : '#e2e8f0',
                color: input.trim() && !loading ? '#fff' : '#94a3b8',
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                transition: 'all 0.2s',
                boxShadow: input.trim() && !loading ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
              }}
              disabled={loading || !input.trim()}
            >
              <Send size={18} style={{ marginLeft: 2 }} />
            </button>
          </form>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}} />
    </div>
  );
}
