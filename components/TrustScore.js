"use client";

export default function TrustScore({ trustData }) {
    if (!trustData) return <p style={{ color: 'var(--text-muted)' }}>Trust data not available.</p>;

    const { score, level, explanation, factors } = trustData;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;

    const color = level === 'High' ? 'var(--success)' : level === 'Moderate' ? 'var(--warning)' : 'var(--danger)';

    const factorItems = [
        { label: 'Model Confidence', value: factors.model_confidence, icon: '🎯' },
        { label: 'Prediction Margin', value: factors.prediction_margin, icon: '📊' },
        { label: 'Symptom Specificity', value: factors.symptom_specificity, icon: '🔍' },
        { label: 'Cross-Val Reliability', value: factors.cross_val_reliability, icon: '✅' },
    ];

    return (
        <div className="anim-fadeIn">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>AI Trust Score</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Multi-factor confidence assessment combining model certainty, prediction margin, data quality, and cross-validation reliability.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Ring */}
                <div style={{ textAlign: 'center' }}>
                    <svg width="140" height="140" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="8" />
                        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
                            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }} />
                        <text x="60" y="56" textAnchor="middle" style={{ fontSize: '1.75rem', fontWeight: 800, fill: 'var(--text-main)' }}>{score}</text>
                        <text x="60" y="74" textAnchor="middle" style={{ fontSize: '0.55rem', fill: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trust Score</text>
                    </svg>
                    <div style={{ marginTop: '0.5rem', padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)', background: level === 'High' ? 'var(--success-bg)' : level === 'Moderate' ? 'var(--warning-bg)' : 'var(--danger-bg)', color, fontSize: '0.75rem', fontWeight: 700, display: 'inline-block' }}>
                        {level} Trust
                    </div>
                </div>

                {/* Factors */}
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {factorItems.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1rem' }}>{f.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{f.label}</div>
                                    <div style={{ height: '6px', background: 'var(--bg-body)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${f.value}%`, background: 'var(--gradient-primary)', borderRadius: '3px', transition: 'width 1s ease' }}></div>
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', minWidth: '35px', textAlign: 'right' }}>{f.value}%</span>
                            </div>
                        ))}
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{explanation}</p>
                </div>
            </div>
        </div>
    );
}
