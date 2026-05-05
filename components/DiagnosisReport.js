"use client";
import { useState } from 'react';
import { AlertTriangle, BarChart3, Shield, GitBranch, Target, FileText, CheckCircle2, XCircle, ArrowDown, ArrowUp, Layers, Fingerprint } from 'lucide-react';
import ExplainabilityChart from './ExplainabilityChart';
import TrustScore from './TrustScore';

export default function DiagnosisReport({ report }) {
    const [activeTab, setActiveTab] = useState('overview');
    if (!report) return null;

    const sc = report.severity === 'High' ? 'pill-high' : report.severity === 'Moderate' ? 'pill-moderate' : 'pill-low';

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'trust', label: 'Trust Score', icon: Fingerprint },
        { id: 'shap', label: 'SHAP', icon: BarChart3 },
        { id: 'radar', label: 'Radar', icon: Target },
        { id: 'counterfactual', label: 'What-If', icon: GitBranch },
        { id: 'interactions', label: 'Interactions', icon: Layers },
        { id: 'risk', label: 'Risk', icon: Shield },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                <h2 className="result-condition">{report.condition}</h2>
                <div className="result-meta">
                    <span className={`confidence-pill ${sc}`}><Target size={12} /> {report.confidence}%</span>
                    <span className={`severity-pill ${sc}`}><AlertTriangle size={12} /> {report.severity}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--gray-50)', borderRadius: 'var(--radius-full)', color: 'var(--text-tertiary)' }}>
                        {report.narrativeSource === 'groq' ? '🤖 Groq AI' : '🧠 ML Engine'}
                    </span>
                </div>
            </div>

            <div className="stats-grid anim-fadeInUp anim-delay-1">
                <div className="stat-card"><div className="stat-icon blue"><Target size={16} /></div><div className="stat-info"><h4>Confidence</h4><div className="stat-value">{report.confidence}%</div></div></div>
                <div className="stat-card"><div className="stat-icon purple"><BarChart3 size={16} /></div><div className="stat-info"><h4>Features</h4><div className="stat-value">{report.factors?.length || 0}</div></div></div>
                <div className="stat-card"><div className="stat-icon orange"><Fingerprint size={16} /></div><div className="stat-info"><h4>Trust</h4><div className="stat-value">{report.trustScore?.score || '—'}</div></div></div>
                <div className="stat-card"><div className="stat-icon green"><Shield size={16} /></div><div className="stat-info"><h4>Risks</h4><div className="stat-value">{report.riskFactors?.length || 0}</div></div></div>
                <div className="stat-card"><div className="stat-icon pink"><GitBranch size={16} /></div><div className="stat-info"><h4>Diffs</h4><div className="stat-value">{report.differentialDiagnoses?.length || 0}</div></div></div>
            </div>

            <div className="card anim-fadeInUp anim-delay-2">
                <div className="xai-tabs" style={{ marginBottom: 20 }}>
                    {tabs.map(t => (
                        <button key={t.id} className={`xai-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                            <t.icon size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{t.label}
                        </button>
                    ))}
                </div>
                <div className="xai-content">
                    {activeTab === 'overview' && (
                        <div className="anim-fadeIn">
                            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>Clinical Analysis</h4>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20, fontSize: 14 }}>{report.explanation}</p>
                            {report.differentialDiagnoses?.length > 0 && (
                                <>
                                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.02em' }}>Differential Diagnoses</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
                                        {report.differentialDiagnoses.map((d, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                                                <span style={{ fontWeight: 500, fontSize: 14 }}>{d.condition}</span>
                                                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{d.probability}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Recommendations</h4>
                            <div className="recommendations-list">
                                {report.recommendations?.map((r, i) => (
                                    <div key={i} className="rec-item">
                                        <div className="rec-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}><CheckCircle2 size={14} /></div>
                                        <div className="rec-text">{r}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'trust' && <TrustScore trustData={report.trustScore} />}
                    {activeTab === 'shap' && (
                        <div className="anim-fadeIn">
                            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>SHAP Feature Importance</h4>
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>Real SHAP values from TreeExplainer showing each symptom's contribution.</p>
                            <div className="waterfall-chart">
                                {report.factors?.map((f, i) => (
                                    <div key={i} className="waterfall-row anim-fadeInUp" style={{ animationDelay: `${i * 0.06}s` }}>
                                        <div className="waterfall-label">{f.name}</div>
                                        <div className="waterfall-bar-container">
                                            <div className={`waterfall-bar ${f.direction === 'negative' ? 'negative' : 'positive'}`}
                                                style={{ width: `${Math.min(f.weight, 100)}%` }} />
                                        </div>
                                        <div className="waterfall-value" style={{ color: f.direction === 'negative' ? '#dc2626' : 'var(--accent)' }}>
                                            {f.direction === 'negative' ? '-' : '+'}{f.weight}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'radar' && (
                        <div className="anim-fadeIn">
                            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Symptom Contribution Radar</h4>
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>Multi-dimensional view of symptom weights.</p>
                            <ExplainabilityChart factors={report.factors} confidence={report.confidence} />
                        </div>
                    )}
                    {activeTab === 'counterfactual' && (
                        <div className="anim-fadeIn">
                            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Counterfactual Explanations</h4>
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>The model was re-run with each symptom toggled to show diagnosis shifts.</p>
                            <div className="counterfactual-grid">
                                {report.counterfactuals?.map((c, i) => (
                                    <div key={i} className="counterfactual-card anim-fadeInUp" style={{ animationDelay: `${i * 0.08}s` }}>
                                        <div className="cf-label">What If</div>
                                        <div className="cf-question">{c.question}</div>
                                        <div className="cf-answer">{c.answer}</div>
                                        <div className="cf-impact" style={{ color: c.impactDirection === 'down' ? '#059669' : '#dc2626' }}>
                                            {c.impactDirection === 'down' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                                            → {c.newConfidence}% ({c.newPrediction})
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'interactions' && (
                        <div className="anim-fadeIn">
                            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Feature Interactions</h4>
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>Symptom pairs with synergistic or redundant effects.</p>
                            {report.featureInteractions?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {report.featureInteractions.map((int, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <span style={{ padding: '3px 8px', background: 'var(--accent-light)', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{int.symptom_a}</span>
                                                <span style={{ fontSize: 12, color: 'var(--gray-300)' }}>×</span>
                                                <span style={{ padding: '3px 8px', background: '#ecfdf5', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600, color: '#059669' }}>{int.symptom_b}</span>
                                            </div>
                                            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>
                                                {int.synergy === 'synergistic' ? '🔗 Synergistic' : '🔄 Redundant'} — Combined: {int.combined_impact}%
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: int.interaction_strength > 0 ? 'var(--accent)' : 'var(--orange)' }}>
                                                {int.interaction_strength > 0 ? '+' : ''}{int.interaction_strength}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Select more symptoms to detect interactions.</p>}
                        </div>
                    )}
                    {activeTab === 'risk' && (
                        <div className="anim-fadeIn">
                            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Risk Assessment</h4>
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>Potential complications for the diagnosed condition.</p>
                            <div className="risk-matrix">
                                {report.riskFactors?.map((r, i) => (
                                    <div key={i} className="risk-item anim-fadeInUp" style={{ animationDelay: `${i * 0.06}s` }}>
                                        <div className={`risk-level ${r.level}`}>
                                            {r.level === 'low' ? <CheckCircle2 size={16} /> : r.level === 'medium' ? <AlertTriangle size={16} /> : <XCircle size={16} />}
                                        </div>
                                        <div className="risk-name">{r.name}</div>
                                        <div className="risk-desc">{r.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="card anim-fadeInUp anim-delay-3" style={{ background: 'var(--gray-50)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ fontSize: 13, fontWeight: 600 }}>Help us improve</h4>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Was this AI diagnosis accurate based on your knowledge?</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => submitFeedback(true)} style={{ padding: '6px 12px', borderRadius: 16, border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>👍 Yes</button>
                        <button onClick={() => submitFeedback(false)} style={{ padding: '6px 12px', borderRadius: 16, border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>👎 No</button>
                    </div>
                </div>
            </div>

            <div className="disclaimer"><strong>⚠ Medical Disclaimer:</strong> {report.disclaimer || "AI-generated analysis for educational purposes only. Not medical advice. Consult a healthcare professional."}</div>
        </div>
    );
}

function submitFeedback(isAccurate) {
    fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_accurate: isAccurate, rating: isAccurate ? 5 : 2 })
    }).then(() => alert('Thank you for your feedback!'));
}
