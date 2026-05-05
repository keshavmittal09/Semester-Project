"""
FastAPI Backend — MedAI Diagnostics
Production-grade API with:
  - POST /predict (PRD-compliant diagnosis endpoint)
  - POST /api/diagnose (legacy endpoint, same pipeline)
  - GET /history (server-side diagnosis history)
  - POST /feedback (user feedback collection)
  - GET /api/evaluation (model metrics)
  - GET /api/features (global feature importances)
  - POST /api/chat (AI chatbot)
  - GET /api/health (health check)
"""
import logging
import sys
import os
import json
from datetime import datetime
from typing import Optional, List
from collections import deque

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model import HealthcareMLModel, parse_symptoms_to_vector, SYMPTOMS
from xai_engine import XAIEngine
from confidence_engine import ConfidenceEngine
from groq_service import generate_clinical_narrative, is_groq_configured, extract_symptoms_via_llm

# ─── Logging Setup ───
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), "medai.log"), encoding="utf-8"),
    ],
)
logger = logging.getLogger("medai.api")

# ─── Initialize App ───
app = FastAPI(
    title="MedAI Diagnostics API",
    description="AI-powered healthcare diagnostic engine with real ML, SHAP XAI, and ensemble learning",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*","https://medai-omega.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Initialize Engines ───
logger.info("Starting MedAI Diagnostics Backend v3.0...")
ml_model = HealthcareMLModel()
xai_engine = XAIEngine(ml_model)
confidence_engine = ConfidenceEngine()
logger.info("All engines initialized successfully")

# ─── In-memory stores (production would use a database) ───
diagnosis_history: deque = deque(maxlen=100)
feedback_store: list = []


# ─── Request/Response Models ───
class DiagnoseRequest(BaseModel):
    symptoms: str = Field(..., description="Comma-separated symptom text")
    selectedTags: Optional[List[str]] = []
    age: Optional[str] = ""
    gender: Optional[str] = ""
    duration: Optional[str] = ""
    severity: Optional[str] = "moderate"


class PredictRequest(BaseModel):
    """PRD-compliant /predict request."""
    symptoms: List[str] = Field(..., description="List of symptom strings", min_length=1)


class FeedbackRequest(BaseModel):
    """PRD Section 10: POST /feedback."""
    prediction_id: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5, description="1-5 star rating")
    is_accurate: Optional[bool] = None
    comment: Optional[str] = ""
    actual_diagnosis: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None


# ─── Core Diagnosis Pipeline ───
async def _run_diagnosis_pipeline(symptom_vector: list, symptoms_text: str):
    """
    Diagnosis Orchestrator (PRD Section 3).
    Runs the full pipeline: ML → SHAP XAI → Counterfactuals →
    Feature Interactions → Trust Score → Confidence → LLM Narrative.
    """
    # 1. ML Prediction
    prediction = ml_model.predict(symptom_vector)
    logger.info(f"Prediction: {prediction['predicted_disease']} ({prediction['confidence']}%)")

    # 2. SHAP Feature Importance
    shap_factors = xai_engine.compute_shap_values(symptom_vector)

    # 3. Counterfactual Analysis
    counterfactuals = xai_engine.generate_counterfactuals(symptom_vector, prediction)

    # 4. Feature Interactions
    interactions = xai_engine.compute_feature_interactions(symptom_vector)

    # 5. Decision Path
    decision_paths = ml_model.get_decision_path(symptom_vector)

    # 6. Trust Score
    trust_score = ml_model.compute_trust_score(symptom_vector, prediction)

    # 7. Confidence Engine
    confidence_result = confidence_engine.compute(prediction)

    # 8. Risk Assessment
    risk_factors = xai_engine.generate_risk_assessment(
        prediction["predicted_disease"], prediction["confidence"]
    )

    # 9. Recommendations
    recommendations = xai_engine.generate_recommendations(prediction["predicted_disease"])

    # 10. Clinical Narrative (LLM or template)
    narrative = await generate_clinical_narrative(prediction, shap_factors, symptoms_text)

    # 11. Differential Diagnoses
    differential_diagnoses = narrative.get("differential_diagnoses", [])
    if not differential_diagnoses:
        for disease, prob in list(prediction["all_probabilities"].items())[1:5]:
            if prob > 1:
                differential_diagnoses.append({"condition": disease, "probability": prob})

    # 12. Build alternatives list (top 3 after primary)
    alternatives = [
        d for d, p in list(prediction["all_probabilities"].items())[1:4]
        if p > 2
    ]

    return {
        "prediction": prediction["predicted_disease"],
        "condition": prediction["predicted_disease"],
        "confidence": prediction["confidence"],
        "risk_level": confidence_result["risk_level"],
        "severity": narrative.get("severity", "Moderate"),
        "explanation": narrative["explanation"],
        "xai": {
            "top_features": [
                {"symptom": f["name"], "impact": f["weight"]}
                for f in shap_factors[:5] if f.get("present")
            ],
            "method": "SHAP TreeExplainer",
        },
        "factors": shap_factors,
        "counterfactuals": counterfactuals,
        "featureInteractions": interactions,
        "decisionPaths": decision_paths,
        "trustScore": trust_score,
        "confidenceResult": confidence_result,
        "riskFactors": risk_factors,
        "recommendations": recommendations,
        "differentialDiagnoses": differential_diagnoses,
        "alternatives": alternatives,
        "allProbabilities": prediction["all_probabilities"],
        "symptomVector": symptom_vector,
        "symptomNames": SYMPTOMS,
        "narrativeSource": narrative.get("source", "template"),
        "disclaimer": "This is not a medical diagnosis. Consult a healthcare professional.",
    }


# ─── API Endpoints ───

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": ml_model.model is not None,
        "model_type": ml_model.evaluation_metrics.get("model_type", "Unknown") if ml_model.evaluation_metrics else "Unknown",
        "groq_configured": is_groq_configured(),
        "shap_available": xai_engine.explainer is not None,
        "version": "3.0.0",
    }


@app.post("/predict")
async def predict(request: PredictRequest):
    """
    PRD-compliant prediction endpoint.
    Input: {"symptoms": ["fever", "cough"]}
    Output: Full diagnosis with XAI, confidence, risk, alternatives, disclaimer
    """
    try:
        symptoms_text = ", ".join(request.symptoms)
        
        # 1. Try LLM Extraction first for robust matching (Hinglish/typos)
        extracted_tags = await extract_symptoms_via_llm(symptoms_text, SYMPTOMS)
        if extracted_tags is not None and len(extracted_tags) > 0:
            logger.info(f"LLM successfully mapped text to: {extracted_tags}")
            symptom_vector = parse_symptoms_to_vector(symptoms_text, extracted_tags)
        else:
            logger.info("Falling back to local dictionary normalization")
            symptom_vector = parse_symptoms_to_vector(symptoms_text, request.symptoms)

        if sum(symptom_vector) == 0:
            raise HTTPException(
                status_code=400,
                detail="No recognizable symptoms detected. Please provide valid symptom names or clearer text."
            )

        result = await _run_diagnosis_pipeline(symptom_vector, symptoms_text)

        # Store in history
        entry = {
            "id": f"diag_{len(diagnosis_history)+1}_{datetime.now().strftime('%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "input_symptoms": request.symptoms,
            **result,
        }
        diagnosis_history.appendleft(entry)

        logger.info(f"POST /predict -> {result['prediction']} ({result['confidence']}%)")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/diagnose")
async def diagnose(request: DiagnoseRequest):
    """
    Legacy diagnosis endpoint (full-featured).
    Accepts free-text symptoms + selected tags + patient context.
    """
    try:
        symptoms_text_raw = [request.symptoms] + (request.selectedTags or [])
        symptoms_text = ", ".join(filter(None, symptoms_text_raw))

        # Try LLM Extraction first
        extracted_tags = await extract_symptoms_via_llm(symptoms_text, SYMPTOMS)
        if extracted_tags is not None and len(extracted_tags) > 0:
            logger.info(f"LLM successfully mapped text to: {extracted_tags}")
            symptom_vector = parse_symptoms_to_vector(symptoms_text, extracted_tags + (request.selectedTags or []))
        else:
            logger.info("Falling back to local dictionary normalization")
            symptom_vector = parse_symptoms_to_vector(request.symptoms, request.selectedTags)

        if sum(symptom_vector) == 0:
            raise HTTPException(
                status_code=400,
                detail="No recognizable symptoms detected. Please provide more details."
            )

        result = await _run_diagnosis_pipeline(symptom_vector, symptoms_text)

        # Store in history
        entry = {
            "id": f"diag_{len(diagnosis_history)+1}_{datetime.now().strftime('%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "input_symptoms": symptoms_text,
            **result,
        }
        diagnosis_history.appendleft(entry)

        logger.info(f"POST /api/diagnose -> {result['condition']} ({result['confidence']}%)")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Diagnosis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history")
async def get_history():
    """PRD Section 10: GET /history — retrieve past predictions."""
    return {
        "count": len(diagnosis_history),
        "history": list(diagnosis_history),
    }


@app.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """PRD Section 10: POST /feedback — collect user feedback for improvement."""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "prediction_id": request.prediction_id,
        "rating": request.rating,
        "is_accurate": request.is_accurate,
        "comment": request.comment,
        "actual_diagnosis": request.actual_diagnosis,
    }
    feedback_store.append(entry)
    logger.info(f"Feedback received: rating={request.rating}, accurate={request.is_accurate}")
    return {"status": "received", "message": "Thank you for your feedback."}


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
            logger.info(f"Chat response generated via Groq")
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
        logger.error(f"Chat error: {e}")
        return {"reply": "I'm having trouble processing your question. Please try again."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
