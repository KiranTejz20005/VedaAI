'use client';

import { Settings, User, Bell, Shield, Palette, Database, ChevronRight, Building2, Moon, Sun, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    icon: User,
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    items: ['Profile Information', 'Change Password', 'Email Preferences'],
  },
  {
    title: 'School & Institution',
    icon: Building2,
    iconBg: '#FFF0E8',
    iconColor: '#E8531D',
    items: ['School Profile', 'Department Settings', 'Academic Year'],
  },
  {
    title: 'Notifications',
    icon: Bell,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    items: ['Email Notifications', 'In-App Alerts', 'Weekly Digest'],
  },
  {
    title: 'Appearance',
    icon: Palette,
    iconBg: '#D1FAE5',
    iconColor: '#059669',
    items: ['Theme', 'Font Size', 'Language'],
  },
  {
    title: 'Privacy & Security',
    icon: Shield,
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    items: ['Two-Factor Authentication', 'Active Sessions', 'Data Export'],
  },
  {
    title: 'Data & Storage',
    icon: Database,
    iconBg: '#FCE7F3',
    iconColor: '#DB2777',
    items: ['Storage Usage', 'Export All Data', 'Delete Account'],
  },
];

const TOGGLE_SETTINGS = [
  { label: 'Email notifications', desc: 'Receive updates about your assignments via email', enabled: true },
  { label: 'Dark mode', desc: 'Switch between light and dark interface', enabled: false },
  { label: 'Auto-save drafts', desc: 'Automatically save assignment drafts every 5 minutes', enabled: true },
  { label: 'Weekly digest', desc: 'Get a weekly summary of your activity', enabled: false },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 100,
        background: enabled ? 'var(--brand)' : 'var(--border-strong)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: enabled ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

export default function SettingsPage() {
  const [toggles, setToggles] = useState(TOGGLE_SETTINGS.map((s) => s.enabled));

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="status-dot" aria-hidden="true" />
          <h1 className="page-title">Settings</h1>
        </div>
        <p className="page-subtitle">Manage your account preferences and application settings.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Profile card */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, gridColumn: 'span 2' }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #E8531D, #F97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: 'white', flexShrink: 0,
          }}>
            JD
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>John Doe</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>john.doe@dps-bokaro.edu.in</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Building2 size={13} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Delhi Public School, Bokaro Steel City</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm">Edit Profile</button>
        </motion.div>
      </div>

      {/* Quick toggles */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ marginBottom: 16 }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Quick Settings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {TOGGLE_SETTINGS.map((setting, i) => (
            <div
              key={setting.label}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, padding: '14px 0',
                borderBottom: i < TOGGLE_SETTINGS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{setting.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{setting.desc}</div>
              </div>
              <Toggle
                enabled={toggles[i]}
                onChange={() => setToggles((prev) => prev.map((v, j) => (j === i ? !v : v)))}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Settings sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 12 }}>
        {SETTINGS_SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              className="card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: section.iconBg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={17} color={section.iconColor} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{section.title}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {section.items.map((item, j) => (
                  <button
                    key={item}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 0', background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: j < section.items.length - 1 ? '1px solid var(--border)' : 'none',
                      width: '100%', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item}</span>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
