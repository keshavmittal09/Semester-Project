"use client";
import { useState, useEffect, useCallback } from 'react';
import { Activity, Brain, Cpu, Search, Sparkles, Stethoscope, Zap } from 'lucide-react';
import DiagnosisReport from './DiagnosisReport';

const SYMPTOMS = [
    'Headache', 'Fever', 'Cough', 'Sore Throat', 'Body Aches',
    'Fatigue', 'Nausea', 'Dizziness', 'Chest Pain', 'Shortness of Breath',
    'Runny Nose', 'Chills', 'Vomiting', 'Diarrhea', 'Joint Pain',
];

const STAGES = [
    { text: 'Parsing clinical input...', sub: 'NLP Engine', progress: 15 },
    { text: 'Building feature vector...', sub: 'Feature Engineering', progress: 30 },
    { text: 'Running Random Forest...', sub: 'ML Inference', progress: 45 },
    { text: 'Computing SHAP values...', sub: 'TreeExplainer', progress: 60 },
    { text: 'Generating counterfactuals...', sub: 'Counterfactual Engine', progress: 75 },
    { text: 'Analyzing interactions...', sub: 'Synergy Detection', progress: 88 },
    { text: 'Compiling report...', sub: 'Quality Assurance', progress: 100 },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SymptomForm() {
    const [symptoms, setSymptoms] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [duration, setDuration] = useState('');
    const [severity, setSeverity] = useState('moderate');
    const [isLoading, setIsLoading] = useState(false);
    const [stage, setStage] = useState(0);
    const [result, setResult] = useState(null);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/api/health`).then(r => r.json()).then(setStatus).catch(() => setStatus(null));
    }, []);

    const toggleTag = useCallback(t => {
        setSelectedTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
    }, []);

    useEffect(() => {
        if (!isLoading) return;
        const i = setInterval(() => setStage(p => p >= STAGES.length - 1 ? (clearInterval(i), p) : p + 1), 400);
        return () => clearInterval(i);
    }, [isLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!symptoms.trim() && !selectedTags.length) return;
        setIsLoading(true); setStage(0); setResult(null);

        try {
            const r = await fetch(`${API_URL}/api/diagnose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms: [symptoms, ...selectedTags].filter(Boolean).join(', '), selectedTags, age, gender, duration, severity })
            });
            if (!r.ok) throw new Error((await r.json()).detail || 'Diagnosis failed');
            const data = await r.json();
            await new Promise(r => setTimeout(r, 400));
            setResult(data);
            // Save to session history
            const history = JSON.parse(sessionStorage.getItem('diagnosisHistory') || '[]');
            history.unshift({ ...data, timestamp: new Date().toISOString(), inputSymptoms: [symptoms, ...selectedTags].filter(Boolean).join(', ') });
            sessionStorage.setItem('diagnosisHistory', JSON.stringify(history.slice(0, 20)));
        } catch (err) {
            alert(err.message || 'Failed. Is the Python backend running? Run: python main.py');
        } finally { setIsLoading(false); }
    };

    const s = STAGES[stage] || STAGES[0];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: status ? '#30d158' : '#dc2626', boxShadow: status ? '0 0 6px #30d158' : '0 0 6px #dc2626' }} />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {status ? `ML Engine Active • SHAP: ✓ • Groq: ${status.groq_configured ? '✓' : 'Not configured'}` : 'Backend Offline — Run: python main.py'}
                </span>
            </div>

            <div className="diagnosis-layout">
                <div className="input-panel">
                    <div className="card anim-fadeInUp">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <Stethoscope size={18} style={{ color: 'var(--accent)' }} />
                            <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Symptom Analysis</h3>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <div className="form-section-title"><Sparkles size={11} /> Quick Select</div>
                                <div className="symptom-tags">
                                    {SYMPTOMS.map(t => (
                                        <span key={t} className={`symptom-tag ${selectedTags.includes(t) ? 'selected' : ''}`}
                                            onClick={() => !isLoading && toggleTag(t)}>{t}</span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <div className="form-section-title"><Brain size={11} /> Description</div>
                                <textarea className="symptom-textarea" placeholder="Describe symptoms in detail..."
                                    value={symptoms} onChange={e => setSymptoms(e.target.value)} disabled={isLoading} />
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <div className="form-section-title"><Activity size={11} /> Patient Context</div>
                                <div className="context-grid">
                                    <div className="context-field"><label>Age</label><input type="number" className="context-input" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} disabled={isLoading} /></div>
                                    <div className="context-field"><label>Gender</label><select className="context-select" value={gender} onChange={e => setGender(e.target.value)} disabled={isLoading}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                                    <div className="context-field"><label>Duration</label><select className="context-select" value={duration} onChange={e => setDuration(e.target.value)} disabled={isLoading}><option value="">Select</option><option value="today">Today</option><option value="2-3days">2-3 days</option><option value="week">~1 week</option><option value="2weeks+">2+ weeks</option></select></div>
                                    <div className="context-field"><label>Severity</label><select className="context-select" value={severity} onChange={e => setSeverity(e.target.value)} disabled={isLoading}><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></div>
                                </div>
                            </div>

                            <button type="submit" className="btn-analyze" disabled={isLoading || (!symptoms.trim() && !selectedTags.length)}>
                                {isLoading ? (<><Cpu size={16} /> Analyzing...</>) : (<><Zap size={16} /> Run AI Diagnosis</>)}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="results-panel">
                    {isLoading ? (
                        <div className="card anim-fadeIn">
                            <div className="analysis-loader">
                                <div className="loader-orb"><div className="loader-orb-inner"></div></div>
                                <div className="loader-stage">{s.text}</div>
                                <div className="loader-sub">{s.sub}</div>
                                <div className="loader-progress"><div className="loader-progress-bar" style={{ width: `${s.progress}%` }}></div></div>
                            </div>
                        </div>
                    ) : result ? (
                        <div className="anim-fadeInUp"><DiagnosisReport report={result} /></div>
                    ) : (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-icon"><Search size={24} style={{ color: 'var(--accent)' }} /></div>
                                <h3 className="empty-title">Ready for Analysis</h3>
                                <p className="empty-desc">Select symptoms or describe them in natural language, then run the AI diagnostic engine.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
