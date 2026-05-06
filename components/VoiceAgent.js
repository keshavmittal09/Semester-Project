"use client";
import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Loader2, Bot } from 'lucide-react';
import Vapi from '@vapi-ai/web';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const VAPI_KEY = process.env.NEXT_PUBLIC_VAPI_KEY;

const vapi = new Vapi(VAPI_KEY);

export default function VoiceAgent() {
    const [callStatus, setCallStatus] = useState('inactive'); // inactive, loading, active
    const [volumeLevel, setVolumeLevel] = useState(0);

    useEffect(() => {
        vapi.on('call-start', () => {
            setCallStatus('active');
        });

        vapi.on('call-end', () => {
            setCallStatus('inactive');
        });

        vapi.on('volume-level', (volume) => {
            setVolumeLevel(volume);
        });

        vapi.on('message', async (message) => {
            if (message.type === 'tool-calls' && message.toolCallList[0].function.name === 'diagnoseSymptoms') {
                const symptoms = JSON.parse(message.toolCallList[0].function.arguments).symptoms;

                try {
                    const res = await fetch(`${API}/api/diagnose`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            symptoms: symptoms,
                            age: 30, // generic fallback
                            gender: "Other",
                            duration: "1 day",
                            severity: "Moderate"
                        })
                    });
                    const data = await res.json();

                    vapi.send({
                        type: "tool-call-result",
                        toolCallList: [
                            {
                                toolCallId: message.toolCallList[0].id,
                                result: `Diagnosis Result: ${data.diagnosis.condition}. Confidence: ${data.diagnosis.confidence}%. Risk: ${data.diagnosis.risk_level}. Top Symptoms matching: ${data.explanation.top_symptoms.map(s => s.symptom).join(", ")}. Please explain this to the user safely.`
                            }
                        ]
                    });
                } catch (e) {
                    vapi.send({
                        type: "tool-call-result",
                        toolCallList: [
                            {
                                toolCallId: message.toolCallList[0].id,
                                result: "Failed to reach diagnostic model. Tell user to try again later."
                            }
                        ]
                    });
                }
            }
        });

        vapi.on('error', (e) => {
            console.error("Vapi Error:", e);
            setCallStatus('inactive');
        });

        return () => {
            vapi.stop();
        };
    }, []);

    const toggleCall = async () => {
        if (callStatus === 'active' || callStatus === 'loading') {
            vapi.stop();
            setCallStatus('inactive');
        } else {
            setCallStatus('loading');

            await vapi.start({
                name: "MedAI Voice Assistant",
                firstMessage: "Hello, I am the MedAI Voice Assistant. How are you feeling today?",
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    // model: "nova-2",
                    language: "hi"
                },
                model: {
                    provider: "groq",
                    model: "llama3-70b-8192",
                    tools: [
                        {
                            type: "function",
                            messages: [
                                { type: "request-start", content: "Let me check our AI diagnostic model with those symptoms..." },
                                { type: "request-complete", content: "I've received the analysis from the diagnostic model." }
                            ],
                            function: {
                                name: "diagnoseSymptoms",
                                description: "Calls the MedAI diagnostic ML model to predict the disease based on the patient's symptoms. Only call this when the user has provided enough symptoms.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        symptoms: {
                                            type: "string",
                                            description: "A comma separated list of symptoms the user described (e.g. 'fever, headache, chills')"
                                        }
                                    },
                                    required: ["symptoms"]
                                }
                            }
                        }
                    ],
                    systemPrompt: `You are MedAI Voice Assistant, an empathetic and intelligent healthcare AI.
Your goal is to make the user feel heard and understood, while safely collecting symptoms and providing explainable insights.

PERSONALITY:
- Warm, calm, and patient
- Speak like a supportive human assistant, not a robot
- Keep responses natural but concise

CONVERSATION STYLE:
- Acknowledge user feelings ("I understand", "That sounds uncomfortable")
- Ask one question at a time
- Actively listen and follow up
- Avoid long monologues

TASK FLOW:
1. Greet user warmly
2. Ask: "Can you tell me what symptoms you're experiencing?"
3. Extract symptoms from speech
4. Ask relevant follow-up questions
5. Confirm understanding
6. Call the 'diagnoseSymptoms' tool with structured symptoms! Do not skip this!
7. Explain results clearly based on the tool result:
   - predicted condition
   - confidence level
   - key contributing symptoms (XAI)
8. Always include:
   "This is not a medical diagnosis"

SAFETY RULES:
- Never give prescriptions
- Never act like a real doctor
- If confidence is low, clearly say uncertainty
- If symptoms are serious (chest pain, breathing issues), advise immediate medical help`
                },
                voice: {
                    provider: "openai",
                    voiceId: "nova", 
                }
            });
        }
    };

    return (
        <div className="voice-agent-container">
            {callStatus === 'active' && (
                <div className="vapi-active-call">
                    <div className="vapi-orb" style={{ transform: `scale(${1 + volumeLevel * 1.5})` }}></div>
                    <div className="vapi-orb-core"><Bot size={32} color="white" /></div>
                    <p>Listening...</p>
                </div>
            )}

            <button
                className={`voice-fab ${callStatus === 'active' ? 'active-call-btn' : ''}`}
                onClick={toggleCall}
                title={callStatus === 'active' ? "End Call" : "Call AI Doctor"}
            >
                {callStatus === 'loading' ? <Loader2 size={22} className="spinner" /> :
                    callStatus === 'active' ? <PhoneOff size={22} /> : <Phone size={22} />}
                <span className="fab-text">{callStatus === 'active' ? 'End Call' : 'Call AI Doctor'}</span>
            </button>
        </div>
    );
}
