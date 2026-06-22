'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsData {
  security: {
    passwordMinLength: number;
    requireSpecialChar: boolean;
    requireNumbers: boolean;
    mfaEnabled: boolean;
  };
  uploadLimits: {
    maxFileSizeBytes: number;
  };
  aiLimits: {
    maxTokensPerRequest: number;
  };
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/settings');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!data) return;
    try {
      setSaving(true);
      const res = await api.put('/admin/settings', data);
      if (res.data?.success) {
        toast.success('Settings saved successfully!');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={40} className="animate-spin text-blue-600" />
          <span className="text-gray-500">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon size={28} className="text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and policies</p>
        </div>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Security Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Security Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Password Length</label>
                <input
                  type="number"
                  value={data.security.passwordMinLength}
                  onChange={(e) =>
                    setData({
                      ...data,
                      security: { ...data.security, passwordMinLength: parseInt(e.target.value) },
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.security.requireSpecialChar}
                    onChange={(e) =>
                      setData({
                        ...data,
                        security: { ...data.security, requireSpecialChar: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">Require Special Characters in Passwords</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.security.requireNumbers}
                    onChange={(e) =>
                      setData({
                        ...data,
                        security: { ...data.security, requireNumbers: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">Require Numbers in Passwords</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.security.mfaEnabled}
                    onChange={(e) =>
                      setData({
                        ...data,
                        security: { ...data.security, mfaEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">Enable Multi-Factor Authentication (MFA)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Upload Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upload Settings</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum File Size (MB)</label>
              <input
                type="number"
                value={Math.round(data.uploadLimits.maxFileSizeBytes / (1024 * 1024))}
                onChange={(e) =>
                  setData({
                    ...data,
                    uploadLimits: { maxFileSizeBytes: parseInt(e.target.value) * 1024 * 1024 },
                  })
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">AI Settings</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Tokens Per Request</label>
              <input
                type="number"
                value={data.aiLimits.maxTokensPerRequest}
                onChange={(e) =>
                  setData({
                    ...data,
                    aiLimits: { maxTokensPerRequest: parseInt(e.target.value) },
                  })
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-sm"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
