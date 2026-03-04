"use client";
import { ArrowRight, Brain, Shield, Zap, BarChart3, GitBranch, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
    return (
        <div>
            {/* Hero */}
            <section className="hero-section">
                <div className="hero-overtitle"><Zap size={13} /> Powered by Real Machine Learning</div>
                <h1 className="hero-title">
                    AI Healthcare<br /><span className="gradient-text">Diagnostics.</span>
                </h1>
                <p className="hero-subtitle">
                    Advanced diagnostic engine combining Random Forest ML, SHAP Explainability,
                    and Groq LLM — delivering transparent, evidence-based clinical assessments.
                </p>
                <div style={{ marginBottom: 40 }}>
                    <Link href="/diagnose">
                        <button className="hero-cta"><Brain size={18} /> Start Diagnosis <ArrowRight size={16} /></button>
                    </Link>
                    <Link href="/analytics">
                        <button className="hero-cta-secondary">View Model Metrics <ArrowRight size={14} /></button>
                    </Link>
                </div>
                <div className="hero-image-container">
                    <Image src="/images/hero-brain.png" alt="AI Healthcare Brain Visualization" width={480} height={480} priority style={{ borderRadius: 24, filter: 'drop-shadow(0 20px 40px rgba(0,113,227,0.15))' }} />
                </div>
            </section>

            {/* Trust Bar */}
            <div className="trust-bar anim-fadeInUp anim-delay-2">
                <div className="trust-item">
                    <div className="trust-item-value">8</div>
                    <div className="trust-item-label">Disease Classes</div>
                </div>
                <div className="trust-item">
                    <div className="trust-item-value">15</div>
                    <div className="trust-item-label">Symptom Features</div>
                </div>
                <div className="trust-item">
                    <div className="trust-item-value">ICD-11</div>
                    <div className="trust-item-label">Classification</div>
                </div>
                <div className="trust-item">
                    <div className="trust-item-value" style={{ color: '#30d158' }}>SHAP</div>
                    <div className="trust-item-label">Explainability</div>
                </div>
            </div>

            {/* Dark Feature Section — Apple Product Page Style */}
            <section className="dark-section">
                <div className="dark-section-inner">
                    <h2 className="dark-section-title">Explainable AI.</h2>
                    <p className="dark-section-subtitle">Every diagnosis comes with complete transparency — real SHAP values, counterfactual what-if scenarios, feature interaction analysis, and a multi-factor trust score.</p>
                    <div className="dark-feature-grid">
                        <FeatureCard icon={<Brain size={22} />} bg="#0a2540" accent="#0071e3" title="Random Forest ML" desc="200-tree ensemble classifier trained on clinically-accurate disease profiles from Harrison's Principles and WHO ICD-11." />
                        <FeatureCard icon={<BarChart3 size={22} />} bg="#042012" accent="#30d158" title="SHAP Explainability" desc="TreeExplainer computes real Shapley values for each prediction, showing exactly how each symptom influences the diagnosis." />
                        <FeatureCard icon={<GitBranch size={22} />} bg="#1a0a2e" accent="#af52de" title="Counterfactual Analysis" desc="The model is re-run with each symptom toggled to show exactly how the diagnosis would change." />
                        <FeatureCard icon={<Fingerprint size={22} />} bg="#2a1800" accent="#ff9f0a" title="Trust Score" desc="4-factor confidence composite combining model certainty, prediction margin, symptom specificity, and cross-validation reliability." />
                        <FeatureCard icon={<Shield size={22} />} bg="#2a0a14" accent="#ff6482" title="Risk Assessment" desc="Automated clinical risk factors, potential complications, and evidence-based recommendations for each diagnosis." />
                        <FeatureCard icon={<Zap size={22} />} bg="#0a1a2a" accent="#64d2ff" title="Groq LLM Narratives" desc="Llama 3.3 70B generates natural language clinical narratives and differential diagnoses via Groq's inference." />
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, bg, accent, title, desc }) {
    return (
        <div className="dark-feature-card" style={{ background: bg }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{icon}</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 8, letterSpacing: '-0.02em' }}>{title}</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{desc}</p>
        </div>
    );
}
