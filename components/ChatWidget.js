"use client";
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState([
        { role: 'bot', text: 'Hello! I\'m MedAI Assistant. Ask me about your diagnosis results, symptoms, or how the AI model works.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

    const send = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMsgs(p => [...p, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Get diagnosis context from session
            const history = JSON.parse(sessionStorage.getItem('diagnosisHistory') || '[]');
            const lastDiag = history.length > 0 ? history[history.length - 1] : null;

            const res = await fetch(`${API}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    context: lastDiag ? {
                        condition: lastDiag.condition,
                        confidence: lastDiag.confidence,
                        symptoms: lastDiag.inputSymptoms,
                        explanation: lastDiag.explanation,
                    } : null,
                }),
            });
            const data = await res.json();
            setMsgs(p => [...p, { role: 'bot', text: data.reply }]);
        } catch {
            setMsgs(p => [...p, { role: 'bot', text: 'Sorry, I couldn\'t connect to the server. Please ensure the backend is running.' }]);
        }
        setLoading(false);
    };

    return (
        <>
            {/* Floating Button */}
            <button className="chat-fab" onClick={() => setOpen(o => !o)} title="AI Chat Assistant">
                {open ? <X size={22} /> : <MessageCircle size={22} />}
            </button>

            {/* Chat Panel */}
            {open && (
                <div className="chat-panel">
                    <div className="chat-header">
                        <Sparkles size={16} />
                        <span>MedAI Assistant</span>
                        <span className="chat-badge">Groq AI</span>
                    </div>
                    <div className="chat-messages">
                        {msgs.map((m, i) => (
                            <div key={i} className={`chat-msg ${m.role}`}>
                                <div className="chat-msg-icon">
                                    {m.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                                </div>
                                <div className="chat-msg-text">{m.text}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-msg bot">
                                <div className="chat-msg-icon"><Bot size={14} /></div>
                                <div className="chat-msg-text chat-typing">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>
                    <div className="chat-input-bar">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send()}
                            placeholder="Ask about your diagnosis..."
                            className="chat-input"
                        />
                        <button onClick={send} disabled={loading || !input.trim()} className="chat-send">
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
