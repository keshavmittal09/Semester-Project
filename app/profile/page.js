"use client";
import { User, Mail, Shield, Clock, FileText, Settings, Activity, Languages } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
    const [historyCount, setHistoryCount] = useState(0);

    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        fetch(`${API_URL}/history`)
            .then(res => res.json())
            .then(data => setHistoryCount(data.count || 0))
            .catch(() => setHistoryCount(0));
    }, []);

    return (
        <div className="anim-fadeIn" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 32 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32, fontWeight: 600 }}>
                    K
                </div>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Keshav Mittal</h1>
                    <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={14} /> keshav.mittal@example.com
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <span className="pill-high"><Shield size={12} /> Verified Patient</span>
                        <span className="pill-moderate"><Activity size={12} /> MedAI Premium</span>
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><Clock size={16} /></div>
                    <div className="stat-info">
                        <h4>Total Diagnoses</h4>
                        <div className="stat-value">{historyCount}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><FileText size={16} /></div>
                    <div className="stat-info">
                        <h4>Saved Reports</h4>
                        <div className="stat-value">{historyCount}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><Settings size={16} /></div>
                    <div className="stat-info">
                        <h4>Account Settings</h4>
                        <div className="stat-value" style={{ fontSize: 14, color: 'var(--accent)', cursor: 'pointer' }}>Manage</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Preferences</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--gray-100)' }}>
                        <div>
                            <div style={{ fontWeight: 500 }}>Language / भाषा</div>
                            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Choose your preferred interface language</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-secondary active" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Languages size={14} /> English</button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--gray-100)' }}>
                        <div>
                            <div style={{ fontWeight: 500 }}>Data Privacy</div>
                            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Allow anonymized data for AI training</div>
                        </div>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 500 }}>Two-Factor Authentication</div>
                            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Secure your health data</div>
                        </div>
                        <button className="btn-secondary" style={{ color: 'var(--accent)' }}>Enable</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
