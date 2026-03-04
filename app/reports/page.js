"use client";
import { useState, useEffect } from 'react';
import { FileText, Download, Clock } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function ReportsPage() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const data = JSON.parse(sessionStorage.getItem('diagnosisHistory') || '[]');
        setHistory(data);
    }, []);

    const downloadPDF = (item) => {
        const doc = new jsPDF();
        const w = doc.internal.pageSize.getWidth();
        let y = 20;

        // Header
        doc.setFillColor(0, 113, 227);
        doc.rect(0, 0, w, 38, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('MedAI Diagnostics', 14, 18);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Clinical Diagnostic Report', 14, 26);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 33);

        y = 50;
        doc.setTextColor(29, 29, 31);

        // Diagnosis
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Diagnosis', 14, y); y += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Condition: ${item.condition}`, 14, y); y += 7;
        doc.text(`Confidence: ${item.confidence}%`, 14, y); y += 7;
        doc.text(`Severity: ${item.severity}`, 14, y); y += 7;
        doc.text(`Date: ${new Date(item.timestamp).toLocaleString()}`, 14, y); y += 7;
        doc.text(`Symptoms: ${item.inputSymptoms}`, 14, y, { maxWidth: w - 28 }); y += 12;

        // Clinical Analysis
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Clinical Analysis', 14, y); y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(item.explanation || 'N/A', w - 28);
        doc.text(lines, 14, y); y += lines.length * 5 + 8;

        // SHAP Feature Importance
        if (item.factors?.length) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('SHAP Feature Importance', 14, y); y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            item.factors.forEach(f => {
                if (y > 270) { doc.addPage(); y = 20; }
                const sign = f.direction === 'negative' ? '-' : '+';
                doc.text(`${f.present ? '●' : '○'} ${f.name}: ${sign}${f.weight}%`, 18, y);
                y += 6;
            });
            y += 6;
        }

        // Differential Diagnoses
        if (item.differentialDiagnoses?.length) {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Differential Diagnoses', 14, y); y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            item.differentialDiagnoses.forEach(d => {
                doc.text(`• ${d.condition}: ${d.probability}%`, 18, y); y += 6;
            });
            y += 6;
        }

        // Trust Score
        if (item.trustScore) {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Trust Score', 14, y); y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Score: ${item.trustScore.score} (${item.trustScore.level})`, 18, y); y += 10;
        }

        // Recommendations
        if (item.recommendations?.length) {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Recommendations', 14, y); y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            item.recommendations.forEach((r, i) => {
                if (y > 270) { doc.addPage(); y = 20; }
                const rLines = doc.splitTextToSize(`${i + 1}. ${r}`, w - 32);
                doc.text(rLines, 18, y); y += rLines.length * 5 + 3;
            });
            y += 6;
        }

        // Disclaimer
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setDrawColor(220, 38, 38);
        doc.setLineWidth(0.5);
        doc.line(14, y, w - 14, y); y += 6;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('⚠ DISCLAIMER: This report is AI-generated for educational and demonstration purposes only.', 14, y); y += 5;
        doc.text('It does not constitute medical advice. Always consult a qualified healthcare professional.', 14, y);

        doc.save(`MedAI_Report_${item.condition.replace(/\s/g, '_')}_${new Date(item.timestamp).toISOString().split('T')[0]}.pdf`);
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

    return (
        <div className="anim-fadeInUp">
            <div className="page-header">
                <h2>Reports</h2>
                <p>{history.length > 0 ? `${history.length} report${history.length > 1 ? 's' : ''} available for download` : 'No reports available yet'}</p>
            </div>

            {history.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon"><FileText size={24} style={{ color: 'var(--accent)' }} /></div>
                        <h3 className="empty-title">No Reports</h3>
                        <p className="empty-desc">Complete a diagnosis to generate downloadable clinical reports.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {history.map((item, i) => (
                        <div key={i} className="history-card anim-fadeInUp" style={{ animationDelay: `${i * 0.06}s` }}>
                            <div className="history-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                                <FileText size={18} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>{item.condition} Report</h4>
                                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                                    {new Date(item.timestamp).toLocaleDateString()} • {item.confidence}% confidence • PDF
                                </p>
                            </div>
                            <button onClick={() => downloadPDF(item)} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', background: 'var(--accent)', color: 'white',
                                border: 'none', borderRadius: 'var(--radius-full)',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 250ms',
                            }}><Download size={14} /> Download PDF</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
