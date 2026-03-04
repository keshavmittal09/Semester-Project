"""
FastAPI Backend — AI Healthcare Diagnostics
Real ML model + SHAP XAI + Gemini API + Evaluation Metrics
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os

from model import HealthcareMLModel, parse_symptoms_to_vector, SYMPTOMS
from xai_engine import XAIEngine
from groq_service import generate_clinical_narrative, is_groq_configured

# ─── Initialize App ───
app = FastAPI(
    title="MedAI Diagnostics API",
    description="AI-powered healthcare diagnostic engine with real ML and Explainable AI",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Initialize ML Model & XAI Engine ───
print("🚀 Starting MedAI Diagnostics Backend...")
ml_model = HealthcareMLModel()
xai_engine = XAIEngine(ml_model)
print("✅ Backend ready.\n")


# ─── Request/Response Models ───
class DiagnoseRequest(BaseModel):
    symptoms: str
    selectedTags: Optional[List[str]] = []
    age: Optional[str] = ""
    gender: Optional[str] = ""
    duration: Optional[str] = ""
    severity: Optional[str] = "moderate"


# ─── API Endpoints ───

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": ml_model.model is not None,
        "groq_configured": is_groq_configured(),
        "shap_available": xai_engine.explainer is not None,
    }


@app.post("/api/diagnose")
async def diagnose(request: DiagnoseRequest):
    """
    Main diagnosis endpoint.
    Runs the full pipeline: ML prediction → SHAP XAI → Counterfactuals →
    Feature Interactions → Trust Score → Gemini Narrative.
    """
    try:
        # 1. Parse symptoms to feature vector
        symptom_vector = parse_symptoms_to_vector(
            request.symptoms, request.selectedTags
        )

        if sum(symptom_vector) == 0:
            raise HTTPException(
                status_code=400,
                detail="No recognizable symptoms detected. Please provide more details."
            )

        # 2. ML Prediction
        prediction = ml_model.predict(symptom_vector)

        # 3. SHAP Feature Importance
        shap_factors = xai_engine.compute_shap_values(symptom_vector)

        # 4. Counterfactual Analysis
        counterfactuals = xai_engine.generate_counterfactuals(symptom_vector, prediction)

        # 5. Feature Interactions
        interactions = xai_engine.compute_feature_interactions(symptom_vector)

        # 6. Decision Path
        decision_paths = ml_model.get_decision_path(symptom_vector)

        # 7. Trust Score
        trust_score = ml_model.compute_trust_score(symptom_vector, prediction)

        # 8. Risk Assessment
        risk_factors = xai_engine.generate_risk_assessment(
            prediction["predicted_disease"], prediction["confidence"]
        )

        # 9. Recommendations
        recommendations = xai_engine.generate_recommendations(prediction["predicted_disease"])

        # 10. Clinical Narrative (Gemini or template)
        narrative = await generate_clinical_narrative(
            prediction, shap_factors, request.symptoms
        )

        # 11. Differential Diagnoses
        differential_diagnoses = narrative.get("differential_diagnoses", [])
        if not differential_diagnoses:
            # Build from prediction probabilities
            for disease, prob in list(prediction["all_probabilities"].items())[1:5]:
                if prob > 1:
                    differential_diagnoses.append({"condition": disease, "probability": prob})

        # ─── Build Response ───
        response = {
            "condition": prediction["predicted_disease"],
            "confidence": prediction["confidence"],
            "severity": narrative.get("severity", "Moderate"),
            "explanation": narrative["explanation"],
            "factors": shap_factors,
            "counterfactuals": counterfactuals,
            "featureInteractions": interactions,
            "decisionPaths": decision_paths,
            "trustScore": trust_score,
            "riskFactors": risk_factors,
            "recommendations": recommendations,
            "differentialDiagnoses": differential_diagnoses,
            "allProbabilities": prediction["all_probabilities"],
            "symptomVector": symptom_vector,
            "symptomNames": SYMPTOMS,
            "narrativeSource": narrative.get("source", "template"),
        }

        return response

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Diagnosis error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/evaluation")
async def get_evaluation_metrics():
    """Return model evaluation metrics (accuracy, precision, recall, F1, confusion matrix)."""
    if ml_model.evaluation_metrics is None:
        raise HTTPException(status_code=404, detail="Evaluation metrics not available")
    return ml_model.evaluation_metrics


@app.get("/api/features")
async def get_feature_importances():
    """Return global feature importances from the model."""
    return {
        "importances": ml_model.get_feature_importances(),
        "feature_names": SYMPTOMS,
    }


# ─── Chat Endpoint ───

class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """AI chatbot — answers questions about diagnosis using Groq LLM."""
    try:
        if is_groq_configured():
            from groq import Groq
            client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

            ctx = ""
            if request.context:
                ctx = f"""
The patient's last diagnosis:
- Condition: {request.context.get('condition', 'N/A')}
- Confidence: {request.context.get('confidence', 'N/A')}%
- Symptoms: {request.context.get('symptoms', 'N/A')}
- Analysis: {request.context.get('explanation', 'N/A')}
"""
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": f"""You are MedAI Assistant, an AI healthcare chatbot. You help users understand their AI-generated diagnosis results, explain medical terms, and answer health-related questions. Be professional, concise (2-4 sentences), and always remind users this is AI-generated educational information, not medical advice.
{ctx}"""},
                    {"role": "user", "content": request.message}
                ],
                temperature=0.4,
                max_tokens=300,
            )
            reply = response.choices[0].message.content.strip()
        else:
            # Fallback without Groq
            if request.context:
                reply = (f"Based on the AI analysis, your symptoms are most consistent with "
                         f"{request.context.get('condition', 'the predicted condition')} "
                         f"({request.context.get('confidence', '?')}% confidence). "
                         f"Please consult a healthcare professional for proper evaluation. "
                         f"This is AI-generated information for educational purposes only.")
            else:
                reply = ("I can help you understand your diagnosis results. "
                         "Please run a diagnosis first, then ask me about the results. "
                         "Remember, this is an AI tool for educational purposes only.")

        return {"reply": reply}

    except Exception as e:
        print(f"❌ Chat error: {e}")
        return {"reply": "I'm having trouble processing your question. Please try again."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)

