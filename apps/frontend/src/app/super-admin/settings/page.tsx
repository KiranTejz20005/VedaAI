'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Building2, 
  Trash2, 
  Settings as SettingsIcon, 
  AlertTriangle, 
  Loader2, 
  Image as ImageIcon,
  CheckCircle,
  Save,
  Plus,
  Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSystemStore } from '@/store/system.store';

export default function SuperAdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);

  // Mocked state to support new UI fields
  const [platformName, setPlatformName] = useState('Vidya AI Education');
  const [brandColor, setBrandColor] = useState('#2563EB');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const [timezone, setTimezone] = useState('UTC-5:00 Eastern Time (US & Canada)');
  const [retentionPolicy, setRetentionPolicy] = useState('90 Days');
  
  const [enableAiAnalytics, setEnableAiAnalytics] = useState(true);
  const [notifyApiSpikes, setNotifyApiSpikes] = useState(true);
  const [forceMfa, setForceMfa] = useState(false);

  const { updateLocalSettings } = useSystemStore();

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/settings');
      if (res.data?.success) {
        const s = res.data.data;
        if (s.platformName) setPlatformName(s.platformName);
        if (s.brandColor) setBrandColor(s.brandColor);
        if (s.maintenanceMode !== undefined) setMaintenanceMode(s.maintenanceMode);
        if (s.defaultTimezone) setTimezone(s.defaultTimezone);
        if (s.dataRetentionDays !== undefined) setRetentionPolicy(`${s.dataRetentionDays} Days`);
        if (s.enableAiAnalytics !== undefined) setEnableAiAnalytics(s.enableAiAnalytics);
        if (s.notifyApiSpikes !== undefined) setNotifyApiSpikes(s.notifyApiSpikes);
        if (s.forceMfa !== undefined) setForceMfa(s.forceMfa);
      }
      const intRes = await api.get('/super-admin/integrations');
      if (intRes.data?.success) {
        setIntegrations(intRes.data.data);
      }
    } catch {
      toast.error('Failed to load settings');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        platformName,
        brandColor,
        maintenanceMode,
        defaultTimezone: timezone,
        dataRetentionDays: parseInt(retentionPolicy.split(' ')[0]),
        enableAiAnalytics,
        notifyApiSpikes,
        forceMfa,
      };
      
      const res = await api.put('/super-admin/settings', payload);
      
      if (res.data?.success) {
        toast.success('Global settings saved successfully!');
        updateLocalSettings(payload);
      }
    } catch (err) { 
      toast.error('Failed to save settings'); 
    }
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
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
          <p className="text-gray-500 text-sm mt-1">Manage global parameters, branding, and core API integrations across the Vidya AI ecosystem.</p>
        </div>
        <button className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-2">
          View Audit Logs
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold">NEW IN V2.0</span>
        </button>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Branding & API) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Branding & Identity */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Building2 size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Branding & Identity</h3>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <label className="block text-xs font-bold text-gray-700 mb-2">Platform Logo</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-gray-50 border border-gray-200 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="text-center">
                        <ImageIcon size={20} className="mx-auto text-gray-400 mb-1" />
                        <span className="text-[9px] text-gray-500 font-semibold block">Upload SVG<br/>or PNG (2MB)</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="w-12 h-12 bg-[#0F172A] rounded-lg flex items-center justify-center mb-2 shadow-sm">
                        <span className="text-white font-bold text-xs tracking-tighter">Vidya AI</span>
                      </div>
                      <button type="button" className="text-blue-600 font-bold text-xs hover:underline">Replace Logo</button>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-2/3 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Primary Brand Color</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg shadow-inner overflow-hidden border border-gray-200 shrink-0">
                        <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-14 h-14 -m-2 cursor-pointer" />
                      </div>
                      <input type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Platform Name</label>
                    <input type="text" value={platformName} onChange={e => setPlatformName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* API Integrations */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">API Integrations</h3>
                </div>
                <button type="button" className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1">
                  <Plus size={14} /> Add Integration
                </button>
              </div>
              
              <div className="space-y-3">
                {integrations.map(integration => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        {integration.id === 'openai' && (
                          <div className="w-5 h-5 bg-black rounded-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 rounded-full scale-150 transform -translate-x-1/4 -translate-y-1/4"></div>
                          </div>
                        )}
                        {integration.id === 'anthropic' && (
                          <div className="text-orange-500 font-bold text-lg">A</div>
                        )}
                        {integration.id === 'google' && (
                          <div className="text-blue-500 font-bold text-lg">G</div>
                        )}
                        {integration.id === 'nvidia' && (
                          <div className="text-green-600 font-bold text-lg">N</div>
                        )}
                        {integration.id === 'groq' && (
                          <div className="text-red-500 font-bold text-lg">Q</div>
                        )}
                        {integration.id === 'canvas' && (
                          <div className="w-5 h-5 border-2 border-red-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                        )}
                        {integration.id === 'google_workspace' && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{integration.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${integration.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          {integration.description.includes('sk-') || integration.description.includes('nvapi-') || integration.description.includes('gsk-') || integration.description.includes('AIza') ? (
                            <span>
                              {integration.description.split('-')[0]} - <span className="font-mono bg-gray-100 px-1 rounded">{integration.description.split('-').slice(1).join('-')}</span>
                            </span>
                          ) : (
                            integration.description
                          )}
                        </p>
                      </div>
                    </div>
                    {integration.status === 'active' ? (
                      <button type="button" className="text-gray-400 hover:text-gray-600"><SettingsIcon size={18} /></button>
                    ) : (
                      <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 rounded-lg text-xs transition-colors">
                        Configure
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (Critical Actions & Preferences) */}
          <div className="space-y-6">
            
            {/* Critical Actions */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle size={18} className="text-red-500" />
                <h3 className="text-sm font-bold text-gray-900">Critical Actions</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-red-50/50 border border-red-100 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-red-700 mb-1">Maintenance Mode</h4>
                    <p className="text-[11px] text-red-600/80 leading-tight">Blocks non-admin access and shows a downtime page to end-users.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input type="checkbox" className="sr-only peer" checked={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>

                <button type="button" className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                  <SettingsIcon size={14} className="text-gray-400" /> Clear System Cache
                </button>

                <button type="button" className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                  <Trash2 size={14} className="text-red-400" /> Remove Bounced Mail Logs
                </button>
              </div>
            </div>

            {/* System Preferences */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <SettingsIcon size={18} className="text-gray-600" />
                <h3 className="text-sm font-bold text-gray-900">System Preferences</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Default Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500">
                    <option value="UTC-5:00 Eastern Time (US & Canada)">UTC-5:00 Eastern Time (US & Canada)</option>
                    <option value="UTC-8:00 Pacific Time">UTC-8:00 Pacific Time</option>
                    <option value="UTC+0:00 Greenwich Mean Time">UTC+0:00 Greenwich Mean Time</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Data Retention Policy</label>
                  <select value={retentionPolicy} onChange={e => setRetentionPolicy(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500">
                    <option value="30 Days">30 Days</option>
                    <option value="90 Days">90 Days</option>
                    <option value="1 Year">1 Year</option>
                    <option value="Indefinite">Indefinite (Requires Enterprise)</option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1.5">Applies globally across all tenant organizations.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={enableAiAnalytics} onChange={e => setEnableAiAnalytics(e.target.checked)}
                        className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded focus:outline-none checked:bg-blue-600 checked:border-blue-600 transition-all" />
                      <CheckCircle size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Enable AI Analytics for Instructors</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={notifyApiSpikes} onChange={e => setNotifyApiSpikes(e.target.checked)}
                        className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded focus:outline-none checked:bg-blue-600 checked:border-blue-600 transition-all" />
                      <CheckCircle size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Notify Admins on API Usage Spikes</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={forceMfa} onChange={e => setForceMfa(e.target.checked)}
                        className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded focus:outline-none checked:bg-blue-600 checked:border-blue-600 transition-all" />
                      <CheckCircle size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Force Multi-Factor Authentication (MFA)</span>
                  </label>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer opacity-50">
               <input type="checkbox" checked readOnly className="w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-0" />
               <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">1 unsaved configuration</span>
            </label>
            <button type="button" className="text-gray-500 hover:text-gray-900 font-semibold text-xs transition-colors hidden sm:block">
              Discard Changes
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-2 px-5 rounded-xl text-xs transition-colors hidden sm:block">
              Preview Brand Changes
            </button>
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-sm flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Global Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
