"use client";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const COLORS = ['#0071e3', '#30d158', '#af52de', '#ff9f0a', '#ff6482', '#64d2ff', '#5856d6'];

const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'white', border: '0.5px solid #e8e8ed', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{label}</p>
            {payload.map((i, idx) => <p key={idx} style={{ color: i.color, fontSize: 12 }}>{i.name}: <strong>{i.value}%</strong></p>)}
        </div>
    );
};

export default function ExplainabilityChart({ factors, confidence }) {
    if (!factors?.length) return <p style={{ color: 'var(--text-tertiary)' }}>No data.</p>;
    const present = factors.filter(f => f.weight > 0);
    const radar = present.map(f => ({ subject: f.name, weight: Math.min(f.weight, 100), fullMark: 100 }));
    const bar = present.map(f => ({ name: f.name.length > 14 ? f.name.slice(0, 14) + '…' : f.name, weight: Math.min(f.weight, 100) }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {radar.length >= 3 && (
                <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                        <RadarChart data={radar} cx="50%" cy="50%" outerRadius="70%">
                            <PolarGrid stroke="rgba(0,0,0,0.05)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#86868b', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#d2d2d7', fontSize: 9 }} />
                            <Radar name="Contribution" dataKey="weight" stroke="#0071e3" fill="#0071e3" fillOpacity={0.15} strokeWidth={2} />
                            <Tooltip content={<Tip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}
            <div>
                <h5 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>Feature Weights</h5>
                <div style={{ width: '100%', height: Math.max(180, bar.length * 28) }}>
                    <ResponsiveContainer>
                        <BarChart data={bar} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#86868b', fontSize: 10 }} />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#6e6e73', fontSize: 10 }} />
                            <Tooltip content={<Tip />} />
                            <Bar dataKey="weight" name="Contribution" radius={[0, 4, 4, 0]} barSize={12}>
                                {bar.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <h5 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>Confidence</h5>
                <svg width="160" height="90" viewBox="0 0 160 90" overflow="visible">
                    <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="#e8e8ed" strokeWidth="8" strokeLinecap="round" />
                    <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none"
                        stroke={confidence >= 80 ? '#30d158' : confidence >= 60 ? '#ff9f0a' : '#ff6482'}
                        strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(confidence / 100) * 204} 204`} />
                    <text x="80" y="72" textAnchor="middle" style={{ fontSize: 24, fontWeight: 800, fill: '#1d1d1f' }}>{confidence}%</text>
                </svg>
            </div>
        </div>
    );
}
