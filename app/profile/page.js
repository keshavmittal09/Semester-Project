"use client";
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, BarChart3, Clock, Shield, Activity } from 'lucide-react';

export default function ProfilePage() {
    const [profile, setProfile] = useState({ name: '', email: '', phone: '', organization: '' });
    const [stats, setStats] = useState({ total: 0, thisWeek: 0 });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('userProfile');
        if (stored) setProfile(JSON.parse(stored));
        const history = JSON.parse(sessionStorage.getItem('diagnosisHistory') || '[]');
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        setStats({
            total: history.length,
            thisWeek: history.filter(h => new Date(h.timestamp) > weekAgo).length,
        });
    }, []);

    const handleSave = () => {
        localStorage.setItem('userProfile', JSON.stringify(profile));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));

    return (
        <div className="anim-fadeInUp">
            <div className="page-header">
                <h2>Profile</h2>
                <p>Manage your account and view diagnostic statistics.</p>
            </div>

            <div className="profile-grid">
                {/* User Info */}
                <div className="profile-card">
                    <div className="profile-avatar-large">{profile.name ? profile.name[0].toUpperCase() : 'U'}</div>
                    <div className="profile-field">
                        <label>Full Name</label>
                        <input className="profile-input" value={profile.name} onChange={e => update('name', e.target.value)} placeholder="Enter your name" />
                    </div>
                    <div className="profile-field">
                        <label>Email</label>
                        <input className="profile-input" type="email" value={profile.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" />
                    </div>
                    <div className="profile-field">
                        <label>Phone</label>
                        <input className="profile-input" type="tel" value={profile.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 234 567 8900" />
                    </div>
                    <div className="profile-field">
                        <label>Organization</label>
                        <input className="profile-input" value={profile.organization} onChange={e => update('organization', e.target.value)} placeholder="Hospital / Clinic" />
                    </div>
                    <button className="btn-save" onClick={handleSave} style={{ marginTop: 8 }}>
                        <Save size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {saved ? 'Saved ✓' : 'Save Profile'}
                    </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="profile-card">
                        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.02em' }}>Diagnostic Activity</h4>
                        <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="stat-card">
                                <div className="stat-icon blue"><BarChart3 size={16} /></div>
                                <div className="stat-info"><h4>Total Diagnoses</h4><div className="stat-value">{stats.total}</div></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon green"><Clock size={16} /></div>
                                <div className="stat-info"><h4>This Week</h4><div className="stat-value">{stats.thisWeek}</div></div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card">
                        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>System Info</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'ML Model', value: 'Random Forest (200 trees)', icon: Activity },
                                { label: 'XAI Engine', value: 'SHAP TreeExplainer', icon: Shield },
                                { label: 'LLM Provider', value: 'Groq (Llama 3.3 70B)', icon: BarChart3 },
                                { label: 'Data Source', value: "Harrison's, Merck, WHO ICD-11", icon: Clock },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid var(--gray-100)' }}>
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <item.icon size={14} style={{ opacity: 0.5 }} /> {item.label}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
