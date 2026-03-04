import { NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────
// AI HEALTHCARE DIAGNOSTIC API
// This is a MOCK implementation for the hackathon MVP.
// To connect to real Gemini API, uncomment the SDK lines below.
// ─────────────────────────────────────────────────────────────
// import { GoogleGenerativeAI } from "@google/genai";
// const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const { symptoms, age, gender, duration, severity } = await req.json();

        if (!symptoms) {
            return NextResponse.json({ error: "Symptoms are required" }, { status: 400 });
        }

        // Simulate AI processing latency (the multi-stage loader needs ~3.5s)
        await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 1000));

        const lowerSymptoms = symptoms.toLowerCase();

        // ─── CONDITION DETECTION ───
        let mockResponse;

        if (lowerSymptoms.includes('headache') || lowerSymptoms.includes('fever') || lowerSymptoms.includes('body ache') || lowerSymptoms.includes('sore throat')) {
            mockResponse = {
                condition: "Influenza (Seasonal Flu)",
                confidence: 87,
                severity: "Moderate",
                explanation: "The patient presents with a classic triad of influenza symptoms: high-grade fever, severe headache, and generalized body aches. The sudden onset pattern and the combination of upper respiratory and systemic symptoms strongly aligns with influenza virus infection patterns in the current ICD-11 classification (1E30). The AI model's Bayesian inference network assigned the highest posterior probability to influenza over competing hypotheses such as common cold (lower systemic symptoms) and COVID-19 (typically includes anosmia). The confidence score of 87% reflects high alignment with the training data distribution for confirmed influenza cases.",
                factors: [
                    { name: "Fever Pattern", weight: 92 },
                    { name: "Headache Severity", weight: 78 },
                    { name: "Body Aches", weight: 72 },
                    { name: "Sore Throat", weight: 55 },
                    { name: "Fatigue Level", weight: 48 },
                    { name: "Onset Rapidity", weight: 40 },
                ],
                differentialDiagnoses: [
                    { condition: "Common Cold (Rhinovirus)", probability: 22 },
                    { condition: "COVID-19", probability: 18 },
                    { condition: "Strep Pharyngitis", probability: 12 },
                    { condition: "Mononucleosis", probability: 5 },
                ],
                counterfactuals: [
                    {
                        question: "What if the patient had no fever?",
                        answer: "Without fever, the model would shift its primary prediction to Tension Headache or Chronic Fatigue Syndrome, as fever is the strongest indicator of systemic infection.",
                        impactDirection: "down",
                        newConfidence: 42
                    },
                    {
                        question: "What if chest pain was also present?",
                        answer: "Adding chest pain would increase concern for pneumonia or myocarditis as secondary complications, escalating the severity to High.",
                        impactDirection: "up",
                        newConfidence: 91
                    },
                    {
                        question: "What if symptoms started over 2 weeks ago?",
                        answer: "A 2+ week duration would make acute influenza less likely and shift the diagnosis toward post-viral fatigue syndrome or a secondary bacterial infection.",
                        impactDirection: "down",
                        newConfidence: 35
                    },
                ],
                riskFactors: [
                    { name: "Dehydration", level: "medium", description: "Sustained fever increases fluid loss" },
                    { name: "Secondary Infection", level: "medium", description: "Can lead to bacterial pneumonia" },
                    { name: "Febrile Seizure", level: "low", description: "Risk increases with very high temperatures" },
                    { name: "Myocarditis", level: "low", description: "Rare cardiac complication of viral illness" },
                ],
                recommendations: [
                    "Begin antiviral therapy (e.g., Oseltamivir) within 48 hours of symptom onset for maximum efficacy.",
                    "Maintain aggressive hydration: at least 2-3 liters of fluids daily.",
                    "Use acetaminophen or ibuprofen for fever and pain management as directed.",
                    "Self-isolate for at least 5 days to prevent community spread.",
                    "Seek emergency care immediately if experiencing difficulty breathing, persistent chest pain, or confusion.",
                ],
            };
        } else if (lowerSymptoms.includes('cough') || lowerSymptoms.includes('chest') || lowerSymptoms.includes('breath') || lowerSymptoms.includes('wheez')) {
            mockResponse = {
                condition: "Acute Bronchitis with Respiratory Compromise",
                confidence: 79,
                severity: "High",
                explanation: "The symptom profile — persistent cough with chest discomfort and potential respiratory difficulty — is highly indicative of acute bronchitis, likely of viral etiology. The AI model's attention mechanism focused heavily on the respiratory symptom cluster, particularly the co-occurrence of cough and chest involvement which in combination has a strong predictive signal (AUC 0.89) for lower respiratory tract infections. Shortness of breath elevates the severity classification as it may indicate bronchospasm or early pneumonia development. The model has flagged this case for priority clinical review.",
                factors: [
                    { name: "Cough Persistence", weight: 95 },
                    { name: "Chest Involvement", weight: 82 },
                    { name: "Breathing Difficulty", weight: 78 },
                    { name: "Wheezing", weight: 65 },
                    { name: "Duration Pattern", weight: 38 },
                ],
                differentialDiagnoses: [
                    { condition: "Pneumonia", probability: 28 },
                    { condition: "Asthma Exacerbation", probability: 20 },
                    { condition: "COPD Flare", probability: 10 },
                    { condition: "Pulmonary Embolism", probability: 5 },
                ],
                counterfactuals: [
                    {
                        question: "What if there was no shortness of breath?",
                        answer: "Removing dyspnea would reduce the severity from High to Moderate and lower the probability of pneumonia from the differential.",
                        impactDirection: "down",
                        newConfidence: 65
                    },
                    {
                        question: "What if the patient also had hemoptysis?",
                        answer: "Coughing blood would urgently elevate the differential for pulmonary embolism and tuberculosis, requiring immediate imaging.",
                        impactDirection: "up",
                        newConfidence: 92
                    },
                    {
                        question: "What if the patient was a long-term smoker?",
                        answer: "Smoking history would shift the model's weighting toward COPD exacerbation and increases lung cancer screening priority.",
                        impactDirection: "up",
                        newConfidence: 83
                    },
                ],
                riskFactors: [
                    { name: "Pneumonia Progression", level: "high", description: "Lower respiratory infections can escalate" },
                    { name: "Hypoxemia", level: "medium", description: "Breathing difficulty may indicate low oxygen" },
                    { name: "Chronic Bronchitis", level: "medium", description: "Repeated episodes can lead to chronic state" },
                    { name: "Pleural Effusion", level: "low", description: "Rare but possible complication" },
                ],
                recommendations: [
                    "Use a pulse oximeter to monitor blood oxygen saturation. Seek care if SpO2 drops below 94%.",
                    "Employ a humidifier and steam inhalation to ease bronchial constriction.",
                    "Avoid irritants such as smoke, strong perfumes, and cold air exposure.",
                    "If bacterial infection is suspected, a healthcare provider may prescribe antibiotics.",
                    "If breathing worsens, develops into blue-tinged lips or fingers, or you experience chest pain, proceed to the nearest emergency department immediately.",
                ],
            };
        } else if (lowerSymptoms.includes('nausea') || lowerSymptoms.includes('vomit') || lowerSymptoms.includes('diarrhea') || lowerSymptoms.includes('stomach')) {
            mockResponse = {
                condition: "Acute Gastroenteritis",
                confidence: 81,
                severity: "Moderate",
                explanation: "The gastrointestinal symptom cluster — nausea, vomiting, and/or diarrhea — is consistent with acute gastroenteritis, most commonly caused by norovirus or rotavirus. The model's feature extraction pipeline identified strong GI-tract-specific signals with minimal respiratory involvement, which helps exclude food poisoning-mimicking conditions. The temporal pattern of acute onset adds weight to viral gastroenteritis over chronic conditions like IBS or IBD.",
                factors: [
                    { name: "Nausea/Vomiting", weight: 88 },
                    { name: "Diarrhea", weight: 75 },
                    { name: "Abdominal Pain", weight: 62 },
                    { name: "Onset Acuity", weight: 50 },
                    { name: "Dehydration Signs", weight: 42 },
                ],
                differentialDiagnoses: [
                    { condition: "Food Poisoning", probability: 25 },
                    { condition: "Appendicitis", probability: 8 },
                    { condition: "Irritable Bowel Syndrome", probability: 7 },
                    { condition: "Pancreatitis", probability: 3 },
                ],
                counterfactuals: [
                    {
                        question: "What if pain was localized to the lower right abdomen?",
                        answer: "Localized right-lower-quadrant pain would dramatically increase appendicitis probability, requiring urgent surgical evaluation.",
                        impactDirection: "up",
                        newConfidence: 55
                    },
                    {
                        question: "What if stools contained blood?",
                        answer: "Bloody diarrhea would shift the model toward bacterial dysentery or inflammatory bowel disease, increasing severity to High.",
                        impactDirection: "up",
                        newConfidence: 70
                    },
                    {
                        question: "What if symptoms resolved within 6 hours?",
                        answer: "Rapid resolution strongly favors food poisoning over viral gastroenteritis, with much lower clinical concern.",
                        impactDirection: "down",
                        newConfidence: 45
                    },
                ],
                riskFactors: [
                    { name: "Dehydration", level: "high", description: "Vomiting and diarrhea cause rapid fluid loss" },
                    { name: "Electrolyte Imbalance", level: "medium", description: "Potassium and sodium depletion" },
                    { name: "Aspiration Risk", level: "low", description: "Vomiting while lying down" },
                ],
                recommendations: [
                    "Prioritize oral rehydration with electrolyte solutions (ORS). Small, frequent sips are best.",
                    "Follow the BRAT diet (bananas, rice, applesauce, toast) once able to tolerate food.",
                    "Avoid dairy, caffeine, alcohol, and spicy foods until fully recovered.",
                    "Monitor for signs of severe dehydration: minimal urination, dry mouth, rapid heartbeat.",
                    "Consult a doctor if symptoms persist beyond 48 hours or if there is blood in vomit or stool.",
                ],
            };
        } else {
            // Generic fallback — still very detailed
            mockResponse = {
                condition: "Undifferentiated Symptom Presentation",
                confidence: 52,
                severity: "Low",
                explanation: "The symptoms described are relatively non-specific and do not form a strongly recognizable clinical pattern in the AI model's diagnostic ontology. The model's maximum attention signal was distributed broadly across multiple possible conditions without converging on a single high-confidence diagnosis. This is a common outcome when the symptom description lacks specificity regarding onset timing, location, or associated features. Additional clinical information — such as vital signs, physical examination findings, or laboratory results — would significantly improve the model's diagnostic precision.",
                factors: [
                    { name: "Symptom Specificity", weight: 45 },
                    { name: "Pattern Recognition", weight: 35 },
                    { name: "Temporal Context", weight: 28 },
                    { name: "Severity Signal", weight: 22 },
                ],
                differentialDiagnoses: [
                    { condition: "Fatigue Syndrome", probability: 20 },
                    { condition: "Stress/Anxiety Disorder", probability: 18 },
                    { condition: "Mild Viral Illness", probability: 15 },
                    { condition: "Nutritional Deficiency", probability: 10 },
                ],
                counterfactuals: [
                    {
                        question: "What if you provided more specific symptom details?",
                        answer: "Adding location, severity, duration, and associated features would allow the model to activate specialized diagnostic pathways, potentially doubling the confidence score.",
                        impactDirection: "up",
                        newConfidence: 78
                    },
                    {
                        question: "What if lab results were available?",
                        answer: "Basic blood work (CBC, CMP) would provide objective biomarkers that dramatically narrow the differential diagnosis space.",
                        impactDirection: "up",
                        newConfidence: 85
                    },
                ],
                riskFactors: [
                    { name: "Missed Diagnosis", level: "medium", description: "Non-specific symptoms may mask serious conditions" },
                    { name: "Delayed Treatment", level: "low", description: "Vague presentation can delay appropriate care" },
                ],
                recommendations: [
                    "Document your symptoms in more detail: exact location, character (sharp/dull/burning), timing, and any triggers.",
                    "Track symptoms over 24-48 hours to identify any patterns or progression.",
                    "Consider scheduling a primary care visit for a comprehensive evaluation.",
                    "If any alarming symptoms develop (severe pain, high fever, difficulty breathing), seek immediate medical attention.",
                ],
            };
        }

        return NextResponse.json(mockResponse);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
