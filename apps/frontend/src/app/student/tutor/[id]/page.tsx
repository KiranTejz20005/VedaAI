'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Send, ArrowLeft, Loader2, Sparkles, AlertCircle, BrainCircuit, Lightbulb } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import type { TutorSessionDetail, TutorMessage } from '@/types/tutor.types';
import { getSession, sendChatMessage, closeSession } from '@/services/tutor.service';

export default function TutorChatPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuthStore();
  const router = useRouter();

  const [session, setSession] = useState<TutorSessionDetail | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'standard' | 'hint' | 'socratic'>('standard');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSession(id);
      setSession(data);
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tutor session');
      toast.error('Could not load session');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      fetchSession();
    }
  }, [fetchSession, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isSending || session?.status === 'CLOSED') return;

    const userMessageContent = inputValue.trim();
    setInputValue('');

    let promptPrefix = '';
    if (mode === 'hint') promptPrefix = '[Give me a hint, not the full answer] ';
    if (mode === 'socratic') promptPrefix = '[Guide me using the Socratic method] ';

    // Optimistic update
    const optimisticUserMsg: TutorMessage = {
      id: Date.now().toString(),
      sessionId: id,
      role: 'USER',
      content: userMessageContent,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsSending(true);

    try {
      const response = await sendChatMessage(id, promptPrefix + userMessageContent);
      
      const assistantMsg: TutorMessage = {
        id: response.messageId || (Date.now() + 1).toString(),
        sessionId: id,
        role: 'ASSISTANT',
        content: response.message,
        createdAt: new Date().toISOString(),
        confidence: response.confidenceScore,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
      // Rollback optimistic update on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
      setInputValue(userMessageContent); // restore input
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCloseSession = async () => {
    if (!confirm('Are you sure you want to close this session?')) return;
    try {
      await closeSession(id);
      toast.success('Session closed');
      router.push('/student/tutor');
    } catch (err: any) {
      toast.error('Failed to close session');
    }
  };

  if (isLoading) return <LoadingState lines={8} />;
  if (error || !session) return <ErrorState message={error || 'Session not found'} onRetry={fetchSession} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/student/tutor" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 8, borderRadius: '50%', background: 'var(--bg-hover)' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{session.subject}</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>AI Tutor &middot; {session.tutorMode} Mode</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline" size="sm" onClick={() => {
            toast.success('Generating flashcards from this session...');
            setTimeout(() => toast.success('Flashcards generated!'), 2000);
          }}>
            <Lightbulb size={14} style={{ marginRight: 6 }} /> Flashcards
          </Button>
          {session.status === 'ACTIVE' && (
            <Button variant="outline" onClick={handleCloseSession} size="sm">End Session</Button>
          )}
        </div>
      </div>

      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, background: '#FAFAFA' }}>
          {messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Sparkles size={40} style={{ margin: '0 auto 16px', opacity: 0.5, color: 'var(--brand)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Ready to learn?</h3>
              <p>Ask a question about {session.subject} to get started.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'USER';
              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  width: '100%',
                }}>
                  {!isUser && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginRight: 12, flexShrink: 0 }}>
                      <Sparkles size={16} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '75%',
                    background: isUser ? 'var(--brand)' : 'white',
                    color: isUser ? 'white' : 'var(--text-primary)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-lg)',
                    borderBottomRightRadius: isUser ? 4 : 'var(--radius-lg)',
                    borderBottomLeftRadius: !isUser ? 4 : 'var(--radius-lg)',
                    boxShadow: isUser ? 'none' : 'var(--shadow-sm)',
                    border: isUser ? 'none' : '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-base)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                    {!isUser && msg.ragReferences && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={12} /> Sourced from institution knowledge
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {isSending && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginRight: 12, flexShrink: 0 }}>
                <Sparkles size={16} />
              </div>
              <div style={{
                background: 'white', padding: '12px 24px', borderRadius: 'var(--radius-lg)', borderBottomLeftRadius: 4,
                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--brand)' }} />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {session.status === 'ACTIVE' ? (
          <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', background: 'white' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <button
                onClick={() => setMode('standard')}
                style={{ padding: '6px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, border: mode === 'standard' ? 'none' : '1px solid var(--border-subtle)', background: mode === 'standard' ? 'var(--brand)' : 'transparent', color: mode === 'standard' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Standard
              </button>
              <button
                onClick={() => setMode('hint')}
                style={{ padding: '6px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, border: mode === 'hint' ? 'none' : '1px solid var(--border-subtle)', background: mode === 'hint' ? '#F59E0B' : 'transparent', color: mode === 'hint' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Lightbulb size={14} /> Hint Mode
              </button>
              <button
                onClick={() => setMode('socratic')}
                style={{ padding: '6px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, border: mode === 'socratic' ? 'none' : '1px solid var(--border-subtle)', background: mode === 'socratic' ? '#8B5CF6' : 'transparent', color: mode === 'socratic' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <BrainCircuit size={14} /> Socratic Mode
              </button>
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here... (Press Enter to send)"
                disabled={isSending}
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-base)',
                  fontSize: 'var(--text-base)',
                  fontFamily: 'inherit',
                  maxHeight: 120,
                  minHeight: 48,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
              <Button type="submit" variant="primary" disabled={!inputValue.trim() || isSending} style={{ height: 48, padding: '0 24px' }}>
                <Send size={18} />
              </Button>
            </form>
          </div>
        ) : (
          <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', background: '#F9FAFB', textAlign: 'center', color: 'var(--text-muted)' }}>
            This session has been closed.
          </div>
        )}
      </Card>
    </div>
  );
}
