"use client";
import { useState, useEffect } from 'react';
import { Clock, FileText, Trash2 } from 'lucide-react';

export default function HistoryPage() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        // Fetch from backend API
        fetch('http://localhost:8000/history')
            .then(res => res.json())
            .then(data => setHistory(data.history || []))
            .catch(err => {
                console.error("Failed to fetch history from server:", err);
                // Fallback to local
                const local = JSON.parse(sessionStorage.getItem('diagnosisHistory') || '[]');
                setHistory(local);
            });
    }, []);

    const clearHistory = () => {
        sessionStorage.removeItem('diagnosisHistory');
        setHistory([]);
    };

    const timeAgo = (ts) => {
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const severityColor = (s) => {
        if (s === 'High') return { bg: '#fef2f2', color: '#dc2626' };
        if (s === 'Moderate') return { bg: '#fffbeb', color: '#d97706' };
        return { bg: '#ecfdf5', color: '#059669' };
    };

    return (
        <div className="anim-fadeInUp">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Diagnosis History</h2>
                    <p>{history.length > 0 ? `${history.length} diagnosis${history.length > 1 ? 'es' : ''} in this session` : 'No diagnoses yet'}</p>
                </div>
                {history.length > 0 && (
                    <button onClick={clearHistory} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', background: '#fef2f2', color: '#dc2626',
                        border: 'none', borderRadius: 'var(--radius-full)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}><Trash2 size={14} /> Clear</button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon"><Clock size={24} style={{ color: 'var(--accent)' }} /></div>
                        <h3 className="empty-title">No History Yet</h3>
                        <p className="empty-desc">Run a diagnosis and your results will appear here. History is stored for this browser session.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {history.map((item, i) => {
                        const sc = severityColor(item.severity);
                        return (
                            <div key={i} className="history-card anim-fadeInUp" style={{ animationDelay: `${i * 0.06}s` }}>
                                <div className="history-icon" style={{ background: sc.bg, color: sc.color }}>
                                    <FileText size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>{item.condition}</h4>
                                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.inputSymptoms}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{item.confidence}%</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{timeAgo(item.timestamp)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
