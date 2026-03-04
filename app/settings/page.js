"use client";
import { Settings as SettingsIcon, Bell, Shield, Globe, Moon, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
    const [notifications, setNotifications] = useState(true);
    const [autoSave, setAutoSave] = useState(true);

    const handleClearData = () => {
        if (confirm('Clear all local data? This will remove your profile and diagnosis history.')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }
    };

    const Toggle = ({ checked, onChange }) => (
        <button
            onClick={() => onChange(!checked)}
            style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: checked ? 'var(--accent)' : 'var(--gray-200)',
                position: 'relative', transition: 'background 200ms',
            }}>
            <span style={{
                position: 'absolute', top: 2, left: checked ? 22 : 2,
                width: 20, height: 20, borderRadius: 10,
                background: 'white', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
        </button>
    );

    const SettingRow = ({ icon: Icon, title, desc, children }) => (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0', borderBottom: '0.5px solid var(--gray-100)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon size={16} style={{ color: 'var(--text-tertiary)' }} />
                <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{desc}</div>
                </div>
            </div>
            {children}
        </div>
    );

    return (
        <div className="anim-fadeInUp">
            <div className="page-header">
                <h2>Settings</h2>
                <p>Configure your MedAI experience.</p>
            </div>

            <div style={{ maxWidth: 640 }}>
                <div className="card" style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Preferences</h4>
                    <SettingRow icon={Bell} title="Notifications" desc="Show notification alerts">
                        <Toggle checked={notifications} onChange={setNotifications} />
                    </SettingRow>
                    <SettingRow icon={Shield} title="Auto-save Reports" desc="Save diagnosis reports to history">
                        <Toggle checked={autoSave} onChange={setAutoSave} />
                    </SettingRow>
                    <SettingRow icon={Globe} title="Language" desc="Interface language">
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>English</span>
                    </SettingRow>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>API Configuration</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12 }}>Groq API powers LLM-generated clinical narratives. Add your key in <code style={{ fontSize: 12, background: 'var(--gray-50)', padding: '2px 6px', borderRadius: 4 }}>backend/.env</code></p>
                    <div style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        GROQ_API_KEY=your_groq_api_key_here
                    </div>
                </div>

                <div className="card">
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', color: '#dc2626' }}>Danger Zone</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12 }}>Permanently delete all locally stored data.</p>
                    <button onClick={handleClearData} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 20px', background: '#fef2f2', color: '#dc2626',
                        border: '1px solid #fecaca', borderRadius: 'var(--radius-full)',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}><Trash2 size={14} /> Clear All Data</button>
                </div>
            </div>
        </div>
    );
}
