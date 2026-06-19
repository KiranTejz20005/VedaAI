'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  BrainCircuit, 
  Settings, 
  HelpCircle, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AiProvider {
  name: string;
  status: string; // HEALTHY, UNCONFIGURED
  model: string;
  responseTimeMs: number;
  pricing: string;
}

interface FailoverConfig {
  primaryProvider: string;
  failoverProvider: string;
  maxRetries: number;
  timeoutMs: number;
  autoFailover: boolean;
}

export default function AiProvidersAdmin() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [failover, setFailover] = useState<FailoverConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Testing states
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/ai-providers');
      if (res.data?.success) {
        setProviders(res.data.data);
        setFailover(res.data.failoverSettings);
      }
    } catch (err) {
      toast.error('Failed to load AI providers settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestHealth = async (provName: string) => {
    try {
      setTestingProvider(provName);
      const res = await api.post('/admin/ai-providers/health', { provider: provName });
      
      if (res.data?.success) {
        if (res.data.healthy) {
          toast.success(`${provName} connection test passed! Key is valid and online.`);
        } else {
          toast.error(`${provName} test failed: Key is missing or invalid in server environment.`);
        }
        loadProviders();
      }
    } catch (err: any) {
      toast.error(err.message || 'Health test failed');
    } finally {
      setTestingProvider(null);
    }
  };

  const handleFailoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failover) return;

    try {
      const res = await api.put('/admin/ai-providers/failover', failover);
      if (res.data?.success) {
        toast.success('AI Failover settings updated successfully!');
        loadProviders();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    }
  };

  const handleToggleAutoFailover = async (val: boolean) => {
    if (!failover) return;
    const nextConfig = { ...failover, autoFailover: val };
    setFailover(nextConfig);

    try {
      const res = await api.put('/admin/ai-providers/failover', nextConfig);
      if (res.data?.success) {
        toast.success(`Auto-failover router ${val ? 'enabled' : 'disabled'}.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">AI Provider Engines</h2>
        <p className="text-gray-500 text-xs md:text-sm">Manage API integrations with OpenAI, Anthropic, Groq, NVIDIA, and Gemini.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List of active AI vendors */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Configured Integrations</h3>

            <div className="space-y-4">
              {providers.map((p) => {
                const isHealthy = p.status === 'HEALTHY';
                return (
                  <div key={p.name} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isHealthy ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                      }`}>
                        <Cpu size={20} />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-gray-800 block">{p.name}</strong>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Primary Model: <strong className="text-gray-600 font-semibold">{p.model}</strong></span>
                        <span className="text-[10px] text-gray-400 block">Pricing: <strong className="text-gray-600 font-semibold">{p.pricing}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6">
                      <div className="text-left md:text-right">
                        {isHealthy ? (
                          <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                            <ShieldCheck size={14} /> ONLINE ({p.responseTimeMs}ms)
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                            <ShieldAlert size={14} /> KEY NOT FOUND
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleTestHealth(p.name)}
                        disabled={testingProvider === p.name}
                        className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {testingProvider === p.name ? (
                          <>
                            <RefreshCw size={11} className="animate-spin" /> Testing...
                          </>
                        ) : (
                          <>
                            <Play size={11} /> Test Connection
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Failover Routing Column */}
          {failover && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1 space-y-6">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Failover Routing</h3>
                  <p className="text-gray-400 text-[9px] mt-0.5">Configure model fallbacks in case of API speed/limit exceptions.</p>
                </div>
                <div className="text-blue-600">
                  <Zap size={18} />
                </div>
              </div>

              <form onSubmit={handleFailoverSubmit} className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-xs font-bold text-gray-700">Auto Failover Switch</span>
                  <input
                    type="checkbox"
                    checked={failover.autoFailover}
                    onChange={(e) => handleToggleAutoFailover(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Primary Vendor</label>
                  <select
                    value={failover.primaryProvider}
                    onChange={(e) => setFailover({ ...failover, primaryProvider: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {providers.map(p => (
                      <option key={p.name} value={p.name.toLowerCase()}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Fallback Model Vendor</label>
                  <select
                    value={failover.failoverProvider}
                    onChange={(e) => setFailover({ ...failover, failoverProvider: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {providers.map(p => (
                      <option key={p.name} value={p.name.toLowerCase()}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Retry Attempts</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={5}
                      value={failover.maxRetries}
                      onChange={(e) => setFailover({ ...failover, maxRetries: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Timeout (ms)</label>
                    <input
                      type="number"
                      required
                      step={1000}
                      value={failover.timeoutMs}
                      onChange={(e) => setFailover({ ...failover, timeoutMs: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs mt-2"
                >
                  Save Routing Guidelines
                </button>
              </form>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
