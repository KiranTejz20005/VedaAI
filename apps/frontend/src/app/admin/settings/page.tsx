'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Settings, 
  ShieldAlert, 
  UploadCloud, 
  Mail, 
  Cpu, 
  CheckCircle,
  HelpCircle,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SystemConfig {
  security: {
    passwordMinLength: number;
    requireSpecialChar: boolean;
    requireNumbers: boolean;
    mfaEnabled: boolean;
  };
  rateLimits: {
    apiRequestsPerMinute: number;
    aiGenerationsPerDay: number;
  };
  uploadLimits: {
    maxFileSizeBytes: number;
    allowedExtensions: string[];
  };
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    fromEmail: string;
  };
  storageSettings: {
    provider: string;
    bucketName: string;
  };
  aiLimits: {
    maxTokensPerRequest: number;
    failoverThresholdMs: number;
  };
}

export default function SettingsAdmin() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'security' | 'storage' | 'ai'>('security');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data?.success) {
        setConfig(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      const res = await api.put('/admin/settings', config);
      if (res.data?.success) {
        toast.success('System settings saved successfully!');
        loadSettings();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update settings');
    }
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
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Portal Settings</h2>
        <p className="text-gray-500 text-xs md:text-sm">Manage universal security parameters, rate limits, SMTP servers, S3 storage keys, and token ceilings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all border ${
              activeTab === 'security' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-100'
            }`}
          >
            <ShieldAlert size={16} /> Security & Limits
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all border ${
              activeTab === 'storage' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-100'
            }`}
          >
            <UploadCloud size={16} /> Uploads & Storage
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all border ${
              activeTab === 'ai' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-100'
            }`}
          >
            <Cpu size={16} /> AI Engine Limits
          </button>
        </div>

        {/* Tab contents forms */}
        {config && (
          <form onSubmit={handleSave} className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            
            {/* Tab 1: Security & Limits */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-50">Security & Request Thresholds</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Min Password Length</label>
                    <input
                      type="number"
                      value={config.security.passwordMinLength}
                      onChange={(e) => setConfig({
                        ...config,
                        security: { ...config.security, passwordMinLength: parseInt(e.target.value) }
                      })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">API Request Rate Limit (per min)</label>
                    <input
                      type="number"
                      value={config.rateLimits.apiRequestsPerMinute}
                      onChange={(e) => setConfig({
                        ...config,
                        rateLimits: { ...config.rateLimits, apiRequestsPerMinute: parseInt(e.target.value) }
                      })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="text-xs font-bold text-gray-700">Require Numbers</span>
                    <input
                      type="checkbox"
                      checked={config.security.requireNumbers}
                      onChange={(e) => setConfig({
                        ...config,
                        security: { ...config.security, requireNumbers: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="text-xs font-bold text-gray-700">Require Special Chars</span>
                    <input
                      type="checkbox"
                      checked={config.security.requireSpecialChar}
                      onChange={(e) => setConfig({
                        ...config,
                        security: { ...config.security, requireSpecialChar: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Uploads & Storage */}
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-50">Upload Boundaries & S3 Storage</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Max File Upload Size (MB)</label>
                    <input
                      type="number"
                      value={config.uploadLimits.maxFileSizeBytes / (1024 * 1024)}
                      onChange={(e) => setConfig({
                        ...config,
                        uploadLimits: { ...config.uploadLimits, maxFileSizeBytes: parseInt(e.target.value) * 1024 * 1024 }
                      })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">AWS S3 Bucket Target</label>
                    <input
                      type="text"
                      value={config.storageSettings.bucketName}
                      onChange={(e) => setConfig({
                        ...config,
                        storageSettings: { ...config.storageSettings, bucketName: e.target.value }
                      })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">SMTP Outgoing Host (TLS)</label>
                  <input
                    type="text"
                    value={config.emailSettings.smtpHost}
                    onChange={(e) => setConfig({
                      ...config,
                      emailSettings: { ...config.emailSettings, smtpHost: e.target.value }
                    })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: AI Engine Limits */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-50">AI Tokens & Failover Constraints</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Max Tokens per request</label>
                    <input
                      type="number"
                      value={config.aiLimits.maxTokensPerRequest}
                      onChange={(e) => setConfig({
                        ...config,
                        aiLimits: { ...config.aiLimits, maxTokensPerRequest: parseInt(e.target.value) }
                      })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Failover Threshold Timeout (ms)</label>
                    <input
                      type="number"
                      value={config.aiLimits.failoverThresholdMs}
                      onChange={(e) => setConfig({
                        ...config,
                        aiLimits: { ...config.aiLimits, failoverThresholdMs: parseInt(e.target.value) }
                      })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save block */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={loadSettings}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl text-xs transition-colors"
              >
                Reset Defaults
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle size={14} /> Save Portal Configuration
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
