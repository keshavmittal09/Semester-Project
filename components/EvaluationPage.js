"use client";
import { useState, useEffect } from 'react';
import { BarChart3, Target, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function EvaluationPage() {
    const [metrics, setMetrics] = useState(null);
    const [features, setFeatures] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`${API_URL}/api/evaluation`).then(r => r.json()).catch(() => null),
            fetch(`${API_URL}/api/features`).then(r => r.json()).catch(() => null),
        ]).then(([evalData, featData]) => {
            setMetrics(evalData);
            setFeatures(featData);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <div className="loader-orb" style={{ width: 50, height: 50, margin: '0 auto 1rem' }}><div className="loader-orb-inner"></div></div>
                Loading evaluation metrics...
            </div>
        );
    }

    if (!metrics) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <p>⚠️ Could not load metrics. Make sure the Python backend is running.</p>
                <code style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>python main.py</code>
            </div>
        );
    }

    const featureData = features?.importances
        ? Object.entries(features.importances).map(([name, value]) => ({
            name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            importance: value,
        }))
        : [];

    const perClassData = metrics.per_class_metrics
        ? Object.entries(metrics.per_class_metrics).map(([cls, m]) => ({
            name: cls.length > 12 ? cls.slice(0, 12) + '…' : cls,
            fullName: cls,
            precision: Math.round(m.precision * 100),
            recall: Math.round(m.recall * 100),
            f1: Math.round(m.f1_score * 100),
        }))
        : [];

    return (
        <div className="anim-fadeInUp">
            <div className="page-header">
                <h2>Model Evaluation</h2>
                <p>Performance metrics from the Random Forest classifier trained on {metrics.n_training_samples} samples.</p>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon green"><Target size={18} /></div>
                    <div className="stat-info"><h4>Accuracy</h4><div className="stat-value">{(metrics.accuracy * 100).toFixed(1)}%</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><BarChart3 size={18} /></div>
                    <div className="stat-info"><h4>Precision</h4><div className="stat-value">{(metrics.precision_weighted * 100).toFixed(1)}%</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan"><CheckCircle2 size={18} /></div>
                    <div className="stat-info"><h4>Recall</h4><div className="stat-value">{(metrics.recall_weighted * 100).toFixed(1)}%</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><TrendingUp size={18} /></div>
                    <div className="stat-info"><h4>F1 Score</h4><div className="stat-value">{(metrics.f1_weighted * 100).toFixed(1)}%</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon pink"><AlertTriangle size={18} /></div>
                    <div className="stat-info"><h4>Cross-Val</h4><div className="stat-value">{(metrics.cross_val_mean * 100).toFixed(1)}%</div></div>
                </div>
            </div>

            <div className="metrics-grid">
                {/* Per-Class Metrics */}
                <div className="metric-card">
                    <h4>Per-Class Performance</h4>
                    <div style={{ width: '100%', height: Math.max(220, perClassData.length * 30) }}>
                        <ResponsiveContainer>
                            <BarChart data={perClassData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.06)" />
                                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8b83b0', fontSize: 10 }} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#4c4478', fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="f1" name="F1 Score" fill="#7c3aed" radius={[0, 3, 3, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Feature Importances */}
                <div className="metric-card">
                    <h4>Global Feature Importances</h4>
                    <div style={{ width: '100%', height: Math.max(220, featureData.length * 25) }}>
                        <ResponsiveContainer>
                            <BarChart data={featureData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.06)" />
                                <XAxis type="number" tick={{ fill: '#8b83b0', fontSize: 10 }} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#4c4478', fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="importance" name="Importance %" radius={[0, 3, 3, 0]} barSize={10}>
                                    {featureData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Confusion Matrix */}
                <div className="metric-card" style={{ gridColumn: '1 / -1' }}>
                    <h4>Confusion Matrix</h4>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="cm-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left' }}>Actual ↓ / Predicted →</th>
                                    {metrics.class_names.map((c, i) => (
                                        <th key={i}>{c.length > 10 ? c.slice(0, 10) + '…' : c}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.confusion_matrix.map((row, i) => (
                                    <tr key={i}>
                                        <td style={{ textAlign: 'left', fontWeight: 600, fontSize: '0.7rem' }}>{metrics.class_names[i]}</td>
                                        {row.map((val, j) => (
                                            <td key={j} style={{
                                                background: i === j ? `rgba(16, 185, 129, ${Math.min(val / 100, 0.3)})` : val > 0 ? `rgba(239, 68, 68, ${Math.min(val / 50, 0.15)})` : 'transparent',
                                                fontWeight: i === j ? 700 : 400,
                                                color: i === j ? 'var(--success)' : 'var(--text-body)',
                                                fontSize: '0.75rem',
                                            }}>{val}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Model Info */}
                <div className="metric-card">
                    <h4>Model Configuration</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Model Type</span>
                            <span style={{ fontWeight: 600 }}>{metrics.model_type}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Estimators</span>
                            <span style={{ fontWeight: 600 }}>{metrics.n_estimators}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Features</span>
                            <span style={{ fontWeight: 600 }}>{metrics.n_features}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Training Samples</span>
                            <span style={{ fontWeight: 600 }}>{metrics.n_training_samples}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Test Samples</span>
                            <span style={{ fontWeight: 600 }}>{metrics.n_test_samples}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Cross-Val σ</span>
                            <span style={{ fontWeight: 600 }}>±{(metrics.cross_val_std * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
