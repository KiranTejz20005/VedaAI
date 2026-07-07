'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cloud, Zap, Sparkles, Activity, ArrowUpRight, Play } from 'lucide-react';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { adminService } from '@/services/admin.service';
import { format } from 'date-fns';

interface SystemHealthData {
  uptime: number;
  dbLatencyMs: number;
  redis: {
    usedGB: number;
    totalGB: number;
  };
  traffic24h: number[];
  aiProviders: {
    providerName: string;
    modelName: string;
    latencyMs: number;
    apiKey?: string;
  }[];
  events: {
    id: string;
    action: string;
    details: any;
    userName?: string;
    createdAt: string;
  }[];
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await adminService.getSystemHealth();
      setHealth(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load system health');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (isLoading && !health) return <LoadingState lines={8} />;
  if (error && !health) return <ErrorState message={error} onRetry={fetchHealth} />;

  const data = health || {
    uptime: 99.98,
    dbLatencyMs: 12,
    redis: { usedGB: 4.2, totalGB: 8.0 },
    traffic24h: Array(24).fill(20),
    aiProviders: [],
    events: []
  };

  const getProviderIcon = (name: string) => {
    const lName = name.toLowerCase();
    if (lName.includes('openai')) return <Zap size={16} />;
    if (lName.includes('anthropic')) return <Sparkles size={16} />;
    return <Sparkles size={16} />;
  };

  const formatLatency = (ms: number) => (ms / 1000).toFixed(1) + 's';

  const getTimeAgo = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getEventSeverity = (action: string) => {
    const l = action.toLowerCase();
    if (l.includes('error') || l.includes('failed') || l.includes('alert')) return 'red';
    if (l.includes('warn') || l.includes('limit') || l.includes('scale')) return 'orange';
    return 'grey';
  };

  const maxTraffic = Math.max(...(data.traffic24h.length > 0 ? data.traffic24h : [100]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, marginBottom: 4 }}>System Health</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Real-time infrastructure monitoring and API performance.</p>
        </div>
      </div>

      {/* Top Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
        {/* Main Infrastructure */}
        <Card padding="24px" style={{ display: 'flex', flexDirection: 'column', gap: 24, background: '#FFFFFF', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', letterSpacing: '0.05em' }}>MAIN INFRASTRUCTURE</span>
            <Cloud size={18} color="#D97706" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Primary Cluster (US-East)</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{data.uptime}% Uptime</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#D97706' }}>Stable</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Database (PostgreSQL)</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{data.dbLatencyMs}ms Latency</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#D97706' }}>Optimal</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Cache Layer (Redis)</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{data.redis.usedGB}GB / {data.redis.totalGB}GB</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#D97706' }}>Healthy</div>
            </div>
          </div>
        </Card>

        {/* Traffic & Throughput */}
        <Card padding="24px" style={{ display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', letterSpacing: '0.05em' }}>TRAFFIC & THROUGHPUT (24H)</span>
            <div style={{ background: '#F3F4F6', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#4B5563' }}>LIVE</div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4%', height: 160 }}>
            {data.traffic24h.map((val, i) => {
              const heightPct = Math.max(10, (val / maxTraffic) * 100);
              const opacity = 0.3 + (0.7 * (heightPct / 100));
              return (
                <div key={i} style={{ 
                  flex: 1, 
                  background: '#B45309', 
                  opacity,
                  height: `${heightPct}%`,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease'
                }} />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>Now</span>
          </div>
        </Card>
      </div>

      {/* Middle Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        
        {/* AI Provider Latency */}
        <Card padding="24px" style={{ background: '#FFFFFF', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', letterSpacing: '0.05em' }}>AI PROVIDER LATENCY</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', cursor: 'pointer' }}>View full report</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.aiProviders.map((provider, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '16px 20px', 
                background: '#F9FAFB', 
                borderRadius: 12,
                border: '1px solid #F3F4F6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 36, height: 36, background: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    {getProviderIcon(provider.providerName)}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                      {provider.providerName === 'openai' ? 'OpenAI GPT-4o' : 
                       provider.providerName === 'anthropic' ? 'Anthropic Claude 3.5' : 
                       provider.providerName === 'google' ? 'Google Gemini Pro' : 
                       provider.providerName}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Model: {provider.modelName}</div>
                    {provider.apiKey && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontFamily: 'monospace' }}>
                        Key: {provider.apiKey.substring(0, 8)}...{provider.apiKey.substring(provider.apiKey.length - 4)}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{formatLatency(provider.latencyMs)}</div>
                  {provider.latencyMs > 2000 ? (
                    <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                      <Activity size={12} /> Latency spike
                    </div>
                  ) : provider.latencyMs < 1100 ? (
                    <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                      <ArrowUpRight size={12} /> 4% improvement
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                      <Activity size={12} /> Stable
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* System Events */}
        <Card padding="24px" style={{ background: '#FFFFFF', borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', letterSpacing: '0.05em' }}>SYSTEM EVENTS</span>
            <div style={{ background: '#DC2626', padding: '4px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800, color: '#FFFFFF' }}>
              {data.events.filter(e => getEventSeverity(e.action) === 'red').length} ALERTS
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto', maxHeight: 320, paddingRight: 8 }}>
            {data.events.length === 0 ? (
              <div style={{ color: '#6B7280', fontSize: 14 }}>No recent events.</div>
            ) : (
              data.events.map((event, i) => {
                const severity = getEventSeverity(event.action);
                const color = severity === 'red' ? '#DC2626' : severity === 'orange' ? '#D97706' : '#9CA3AF';
                return (
                  <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                    <div style={{ width: 3, background: color, borderRadius: 2 }} />
                    <div style={{ flex: 1, paddingBottom: i !== data.events.length - 1 ? 16 : 0, borderBottom: i !== data.events.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color }}>{event.action.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>
                          {format(new Date(event.createdAt), "MM/dd/yyyy, HH:mm:ss.SSS")}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>
                        {event.userName || 'System'}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          
          <button style={{ 
            marginTop: 24,
            width: '100%', 
            padding: '12px', 
            background: '#000000', 
            color: '#FFFFFF', 
            border: 'none', 
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            Clear All Non-Critical
          </button>
        </Card>
      </div>

      {/* Bottom Banner */}
      <div style={{
        background: '#000000',
        borderRadius: 16,
        padding: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8
      }}>
        <div style={{ maxWidth: '60%' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', margin: 0, marginBottom: 8 }}>
            AI Diagnostic Toolkit
          </h2>
          <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
            Run deep-trace analysis on prompt-response chains to identify potential bottlenecks or hallucination patterns in real-time across all providers.
          </p>
        </div>
        <button style={{
          background: 'transparent',
          color: '#FFFFFF',
          border: '1px solid #D97706',
          padding: '12px 24px',
          borderRadius: 9999,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.2s',
        }}>
          <Play size={16} color="#D97706" />
          Launch AI Diagnostics
        </button>
      </div>
    </div>
  );
}
