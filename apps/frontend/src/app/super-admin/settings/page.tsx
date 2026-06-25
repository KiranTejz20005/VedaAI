'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Globe, Cpu, ShieldAlert, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuperAdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [platformName, setPlatformName] = useState('VidyaAI');
  const [defaultPlan, setDefaultPlan] = useState('FREE');
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4');
  const [maxTokens, setMaxTokens] = useState(4096);
  const [requireMfa, setRequireMfa] = useState(false);
  const [allowPublicSignup, setAllowPublicSignup] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(60);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/settings');
      if (res.data?.success) {
        const s = res.data.data;
        setPlatformName(s.platformName || 'VidyaAI');
        setDefaultPlan(s.defaultSubscriptionPlan || 'FREE');
        setAiProvider(s.aiProvider?.provider || 'openai');
        setAiApiKey(s.aiProvider?.apiKey || '');
        setAiModel(s.aiProvider?.model || 'gpt-4');
        setMaxTokens(s.aiProvider?.maxTokens || 4096);
        setRequireMfa(s.security?.requireMfa || false);
        setAllowPublicSignup(s.security?.allowPublicSignup ?? true);
        setSessionTimeout(s.security?.sessionTimeout || 60);
      }
    } catch {
      // Use defaults
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/super-admin/settings', {
        platformName,
        defaultSubscriptionPlan: defaultPlan,
        aiProvider: { provider: aiProvider, apiKey: aiApiKey, model: aiModel, maxTokens },
        security: { requireMfa, allowPublicSignup, sessionTimeout },
      });
      if (res.data?.success) toast.success('Settings saved successfully!');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Super Admin Settings</h2>
        <p className="text-gray-500 text-xs md:text-sm">Configure platform-wide settings, subscription defaults, and AI provider integration.</p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {/* Platform Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Globe size={18} className="text-blue-600" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Platform Configuration</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Platform Name</label>
              <input type="text" value={platformName} onChange={e => setPlatformName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Default Subscription Plan</label>
              <select value={defaultPlan} onChange={e => setDefaultPlan(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
                <option value="FREE">FREE</option>
                <option value="STARTER">STARTER</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Provider Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Cpu size={18} className="text-purple-600" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">AI Provider Configuration</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Provider</label>
              <select value={aiProvider} onChange={e => setAiProvider(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Model</label>
              <input type="text" value={aiModel} onChange={e => setAiModel(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">API Key</label>
              <input type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="sk-..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Max Tokens</label>
              <input type="number" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldAlert size={18} className="text-orange-600" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">System Security</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-xs font-bold text-gray-700">Require Multi-Factor Authentication</span>
              <input type="checkbox" checked={requireMfa} onChange={e => setRequireMfa(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-xs font-bold text-gray-700">Allow Public Signup</span>
              <input type="checkbox" checked={allowPublicSignup} onChange={e => setAllowPublicSignup(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Session Timeout (minutes)</label>
              <input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={load} className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-xl text-xs transition-colors">
            Reset
          </button>
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5">
            <CheckCircle size={14} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
