import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Sliders, Key, Monitor, Palette, Save } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="card" style={{ padding: '1.75rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ padding: '0.4rem', background: 'var(--primary-glow)', borderRadius: '8px' }}>
        <Icon size={18} color="var(--primary)" />
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>{children}</div>
  </div>
);

const SettingRow = ({ label, description, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.15rem' }}>{label}</div>
      {description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{description}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <label className="toggle">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="slider"></span>
  </label>
);

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: '', email: '', title: '' });
  const [notifications, setNotifications] = useState({ applicationSent: true, weeklyReport: true, agentErrors: true, newMatches: false });
  const [ats, setAts] = useState({ threshold: 85, autoApply: false, skipRedirect: true });
  const [theme, setTheme] = useState('light');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={28} color="var(--primary)" /> Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Manage your account and agent preferences.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          style={{ padding: '0.7rem 1.5rem' }}
        >
          {saved ? (
            <><span>✓</span> Saved!</>
          ) : (
            <><Save size={16} /> Save Changes</>
          )}
        </button>
      </div>

      {/* Profile Section */}
      <Section title="Profile" icon={User}>
        <SettingRow label="Full Name" description="Displayed on your dashboard profile.">
          <input
            className="form-input"
            style={{ width: '220px' }}
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
          />
        </SettingRow>
        <SettingRow label="Email Address" description="Used for notifications and reports.">
          <input
            className="form-input"
            style={{ width: '220px' }}
            value={profile.email}
            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
          />
        </SettingRow>
        <SettingRow label="Target Role" description="Your current job seeking position.">
          <input
            className="form-input"
            style={{ width: '220px' }}
            value={profile.title}
            onChange={e => setProfile(p => ({ ...p, title: e.target.value }))}
          />
        </SettingRow>
      </Section>

      {/* Agent Configuration */}
      <Section title="AI Agent Configuration" icon={Sliders}>
        <SettingRow label="Default ATS Threshold" description="Minimum ATS score before the agent applies.">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="range" min={50} max={100} value={ats.threshold}
              onChange={e => setAts(a => ({ ...a, threshold: +e.target.value }))}
              style={{ width: '120px', accentColor: 'var(--primary)' }}
            />
            <span style={{ minWidth: '40px', fontWeight: 600, color: 'var(--primary)', fontSize: '0.95rem' }}>{ats.threshold}%</span>
          </div>
        </SettingRow>
        <SettingRow label="Auto-Apply Mode" description="Agent will autonomously submit applications.">
          <Toggle checked={ats.autoApply} onChange={e => setAts(a => ({ ...a, autoApply: e.target.checked }))} />
        </SettingRow>
        <SettingRow label="Skip External Redirects" description="Skip jobs that redirect to external forms.">
          <Toggle checked={ats.skipRedirect} onChange={e => setAts(a => ({ ...a, skipRedirect: e.target.checked }))} />
        </SettingRow>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <SettingRow label="Application Sent" description="Alert when the agent successfully applies.">
          <Toggle checked={notifications.applicationSent} onChange={e => setNotifications(n => ({ ...n, applicationSent: e.target.checked }))} />
        </SettingRow>
        <SettingRow label="Weekly Report" description="Summary of your job search progress.">
          <Toggle checked={notifications.weeklyReport} onChange={e => setNotifications(n => ({ ...n, weeklyReport: e.target.checked }))} />
        </SettingRow>
        <SettingRow label="Agent Errors" description="Be notified if the agent encounters errors.">
          <Toggle checked={notifications.agentErrors} onChange={e => setNotifications(n => ({ ...n, agentErrors: e.target.checked }))} />
        </SettingRow>
        <SettingRow label="New Role Matches" description="Alert when high-match roles are found.">
          <Toggle checked={notifications.newMatches} onChange={e => setNotifications(n => ({ ...n, newMatches: e.target.checked }))} />
        </SettingRow>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" icon={Palette}>
        <SettingRow label="Interface Theme" description="Light mode is recommended for this SaaS design.">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['light', 'dark', 'system'].map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem',
                  fontWeight: 500, cursor: 'pointer', border: '1px solid',
                  borderColor: theme === t ? 'var(--primary)' : 'var(--border)',
                  background: theme === t ? 'var(--primary-glow)' : 'white',
                  color: theme === t ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </SettingRow>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield}>
        <SettingRow label="API Key" description="Backend API key for authentication.">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="password"
              className="form-input"
              style={{ width: '180px' }}
              value="••••••••••••••••"
              readOnly
            />
            <button className="btn btn-secondary" style={{ padding: '0.6rem 0.75rem', gap: 0 }}>
              <Key size={15} />
            </button>
          </div>
        </SettingRow>
        <SettingRow label="Session" description="Current active session.">
          <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            Active — localhost
          </span>
        </SettingRow>
      </Section>
    </div>
  );
}
