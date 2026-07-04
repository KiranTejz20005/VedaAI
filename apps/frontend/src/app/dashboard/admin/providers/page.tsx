'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Network, 
  Banknote, 
  Gauge, 
  Settings, 
  MoreVertical, 
  RefreshCw,
  Plus,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { adminService } from '@/services/admin.service';

interface ProviderKPIs {
  activeModels: number;
  mtdSpending: number;
  avgLatency: number;
}

interface ProviderData {
  id: string;
  name: string;
  tier: string;
  status: string;
  activeModels: string;
  usageQuota: number;
  usageLabel: string;
  costMtd: number;
  apiKey?: string;
}

interface ProvidersResponse {
  kpis: ProviderKPIs;
  providers: ProviderData[];
}

export default function ProvidersPage() {
  const [data, setData] = useState<ProvidersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const response = await adminService.getProviders();
      setData(response);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load providers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
    const interval = setInterval(fetchProviders, 10000);
    return () => clearInterval(interval);
  }, [fetchProviders]);

  if (isLoading && !data) return <LoadingState lines={8} />;
  if (error && !data) return <ErrorState message={error} onRetry={fetchProviders} />;

  const { kpis, providers } = data || {
    kpis: { activeModels: 0, mtdSpending: 0, avgLatency: 0 },
    providers: []
  };

  const getProviderIcon = (name: string) => {
    const lname = name.toLowerCase();
    if (lname.includes('openai')) return '/icons/openai.svg'; // Simplified as text if svg unavailable
    if (lname.includes('anthropic')) return '/icons/anthropic.svg';
    if (lname.includes('google')) return '/icons/google.svg';
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%', paddingBottom: 48 }}>
      {/* Header section with buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="AI Providers"
          subtitle="Management of integrated AI models and infrastructure providers."
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => {
              setData(null);
              setIsLoading(true);
              setTimeout(() => {
                fetchProviders();
              }, 400); // 400ms delay to simulate window refresh
            }} 
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <RefreshCw size={14} /> Refresh Status
          </button>
          <button 
            onClick={() => setIsConfigureModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#000000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}>
            <Plus size={14} /> Configure New Provider
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card padding="24px" style={{ background: '#FFFFFF', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', letterSpacing: '0.05em' }}>ACTIVE MODELS</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Network size={16} color="#374151" />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#111827', marginBottom: 8 }}>{kpis.activeModels}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#10B981' }}>
            <ArrowUpRight size={14} /> +2 from last month
          </div>
        </Card>

        <Card padding="24px" style={{ background: '#FFFFFF', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', letterSpacing: '0.05em' }}>MTD SPENDING</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={16} color="#D97706" />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            ${kpis.mtdSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Est. forecast: ${(kpis.mtdSpending * 1.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </Card>

        <Card padding="24px" style={{ background: '#FFFFFF', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', letterSpacing: '0.05em' }}>AVG LATENCY</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge size={16} color="#6B7280" />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#111827', marginBottom: 8 }}>{kpis.avgLatency}ms</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Global average response</div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card padding="0" style={{ background: '#FFFFFF', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F3F4F6' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>Integrated Providers</h2>
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4B5563', cursor: 'pointer' }}>
              Show: <span style={{ fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 4 }}>All Active <ChevronDown size={14} /></span>
            </div>
            {isFilterMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: 140, zIndex: 10 }}>
                {['All Active', 'Inactive', 'Error State'].map(opt => (
                  <div key={opt} onClick={() => setIsFilterMenuOpen(false)} style={{ padding: '8px 16px', fontSize: 13, color: '#374151', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', width: '25%' }}>PROVIDER</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', width: '15%' }}>STATUS</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', width: '25%' }}>ACTIVE MODELS</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', width: '15%' }}>USAGE QUOTA</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', width: '10%' }}>COST (MTD)</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', width: '10%', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p, idx) => (
              <tr key={p.id} style={{ borderBottom: idx === providers.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 10, 
                      background: p.name.toLowerCase().includes('openai') ? '#10A37F' : p.name.toLowerCase().includes('anthropic') ? '#D97757' : '#4285F4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 'bold'
                    }}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Tier: {p.tier}</div>
                      {p.apiKey && (
                        <div style={{ fontSize: 11, color: '#4B5563', marginTop: 4, fontFamily: 'monospace', background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                          {p.apiKey}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 6, 
                    padding: '6px 12px', borderRadius: 99, 
                    background: p.status === 'Operational' ? '#ECFDF5' : '#FEF3C7',
                    color: p.status === 'Operational' ? '#059669' : '#D97706',
                    fontSize: 12, fontWeight: 600
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                    {p.status}
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                    {p.activeModels}
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>
                    <span>{p.usageQuota}%</span>
                    <span style={{ color: '#9CA3AF' }}>{p.usageLabel}</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: '#F3F4F6', borderRadius: 2 }}>
                    <div style={{ width: `${p.usageQuota}%`, height: '100%', background: '#111827', borderRadius: 2 }} />
                  </div>
                </td>
                <td style={{ padding: '20px 24px', fontSize: 14, fontWeight: 700, color: '#111827' }}>
                  ${p.costMtd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '20px 24px', textAlign: 'right', position: 'relative' }}>
                  <button 
                    onClick={() => setActiveActionMenu(activeActionMenu === p.id ? null : p.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                    <MoreVertical size={18} />
                  </button>
                  {activeActionMenu === p.id && (
                    <div style={{ position: 'absolute', top: '100%', right: 24, marginTop: -10, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: 160, zIndex: 10, textAlign: 'left' }}>
                      <div onClick={() => setActiveActionMenu(null)} style={{ padding: '10px 16px', fontSize: 13, color: '#374151', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>View Details</div>
                      <div onClick={() => setActiveActionMenu(null)} style={{ padding: '10px 16px', fontSize: 13, color: '#D97706', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>Pause Activity</div>
                      <div onClick={() => setActiveActionMenu(null)} style={{ padding: '10px 16px', fontSize: 13, color: '#DC2626', cursor: 'pointer' }}>Delete API Key</div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #F3F4F6', background: '#F9FAFB' }}>
          <button style={{ background: 'transparent', border: 'none', fontSize: 13, fontWeight: 600, color: '#4B5563', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Load More Providers <ChevronDown size={14} />
          </button>
        </div>
      </Card>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Global Fallbacks */}
        <Card padding="32px" style={{ background: '#000000', borderRadius: 16, color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 8 }}>Configure Global Fallbacks</h2>
            <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.6, margin: 0, maxWidth: '85%' }}>
              Setup automatic model routing if primary providers experience downtime or degraded performance.
            </p>
          </div>
          <button style={{ 
            marginTop: 32,
            alignSelf: 'flex-start',
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 20px', 
            background: 'transparent', 
            border: '1px solid #D97706', 
            borderRadius: 99, 
            fontSize: 14, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' 
          }}>
            <Settings size={16} color="#D97706" /> Launch Routing Toolkit
          </button>
        </Card>

        {/* Usage Policies */}
        <Card padding="32px" style={{ background: '#FFFFFF', borderRadius: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 8, color: '#111827' }}>Usage Policies</h2>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
              Manage rate limits and content safety filters across all integrated AI models.
            </p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
            <div style={{ display: 'flex' }}>
              {['AI', 'LLM', '+3'].map((lbl, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#F3F4F6', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#374151',
                  border: '2px solid #FFFFFF',
                  marginLeft: i > 0 ? -12 : 0,
                  position: 'relative', zIndex: 3 - i
                }}>
                  {lbl}
                </div>
              ))}
            </div>
            
            <a href="#" style={{ fontSize: 14, fontWeight: 600, color: '#111827', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all policies <ArrowRight size={16} />
            </a>
          </div>
        </Card>
    </div>

      {/* Configure Provider Modal */}
      {isConfigureModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFF', borderRadius: 16, width: '100%', maxWidth: 480, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 8, color: '#111827' }}>Configure New Provider</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Enter the API details for the new AI provider.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Provider Name</label>
                <input type="text" placeholder="e.g. Cohere" style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>API Key</label>
                <input type="password" placeholder="sk-..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Base URL (Optional)</label>
                <input type="text" placeholder="https://api.provider.com/v1" style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button 
                onClick={() => setIsConfigureModalOpen(false)}
                style={{ padding: '10px 16px', background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                onClick={() => setIsConfigureModalOpen(false)}
                style={{ padding: '10px 16px', background: '#000', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#FFF', cursor: 'pointer' }}>
                Save Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
