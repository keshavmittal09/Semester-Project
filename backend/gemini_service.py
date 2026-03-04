"""
Gemini AI Service — Generates natural language clinical narratives
using Google Gemini API. Falls back to template-based generation
if no API key is configured.
"""
import os
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Try to import Gemini SDK
try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("⚠️ google-genai not installed. Using template-based narratives.")


def is_gemini_configured():
    """Check if Gemini API is available and configured."""
    return GENAI_AVAILABLE and GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here"


async def generate_clinical_narrative(prediction, shap_factors, symptoms_text):
    """Generate a clinical narrative using Gemini API or fallback."""
    if is_gemini_configured():
        return await _gemini_narrative(prediction, shap_factors, symptoms_text)
    else:
        return _template_narrative(prediction, shap_factors)


async def _gemini_narrative(prediction, shap_factors, symptoms_text):
    """Call Gemini API for narrative generation."""
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        # Build the top factors summary
        top_factors = [f"{f['name']} ({f['weight']}%)" for f in shap_factors[:5]]

        prompt = f"""You are a medical AI diagnostics system generating a clinical analysis report.

Patient symptoms: {symptoms_text}
ML Model Prediction: {prediction['predicted_disease']} (Confidence: {prediction['confidence']}%)
Key contributing factors (SHAP analysis): {', '.join(top_factors)}

Generate a JSON response with these EXACT keys:
1. "explanation": A detailed 3-4 sentence clinical analysis explaining why this diagnosis was made, mentioning the key symptoms and their clinical significance. Write professionally as a medical AI.
2. "differential_diagnoses": Array of objects with "condition" and "probability" keys — list 3-4 alternative diagnoses with probabilities that sum to less than {100 - prediction['confidence']}%.
3. "severity": Either "Low", "Moderate", or "High" based on the symptoms.

Return ONLY valid JSON, no markdown or extra text."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )

        # Parse JSON from response
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        return {
            "explanation": data.get("explanation", _template_explanation(prediction, shap_factors)),
            "differential_diagnoses": data.get("differential_diagnoses", _template_differentials(prediction)),
            "severity": data.get("severity", "Moderate"),
            "source": "gemini",
        }

    except Exception as e:
        print(f"⚠️ Gemini API error: {e}")
        return _template_narrative(prediction, shap_factors)


def _template_narrative(prediction, shap_factors):
    """Fallback template-based narrative when Gemini is unavailable."""
    return {
        "explanation": _template_explanation(prediction, shap_factors),
        "differential_diagnoses": _template_differentials(prediction),
        "severity": _assess_severity(prediction),
        "source": "template",
    }


def _template_explanation(prediction, shap_factors):
    """Generate a detailed explanation from ML results."""
    disease = prediction["predicted_disease"]
    conf = prediction["confidence"]
    top = [f["name"] for f in shap_factors[:3] if f["present"]]

    if not top:
        return (
            f"The ML model predicted {disease} with {conf}% confidence. "
            f"The symptom profile provided shows patterns consistent with this condition. "
            f"Additional symptoms or clinical data would improve diagnostic accuracy."
        )

    top_str = ", ".join(top[:-1]) + f" and {top[-1]}" if len(top) > 1 else top[0]
    return (
        f"The Random Forest classifier predicted {disease} with {conf}% confidence. "
        f"SHAP analysis reveals that {top_str} were the strongest contributing factors, "
        f"aligning with established clinical patterns for this condition. "
        f"The model cross-referenced {len(shap_factors)} symptom features against training data "
        f"from {8} disease categories to arrive at this assessment."
    )


def _template_differentials(prediction):
    """Generate differential diagnoses from model probabilities."""
    probs = prediction["all_probabilities"]
    diffs = []
    for disease, prob in list(probs.items())[1:5]:
        if prob > 1:
            diffs.append({"condition": disease, "probability": prob})
    return diffs


def _assess_severity(prediction):
    """Assess severity based on the predicted disease."""
    high_severity = {"Pneumonia", "COVID-19"}
    moderate_severity = {"Influenza", "Acute Bronchitis", "Gastroenteritis", "Strep Throat"}
    disease = prediction["predicted_disease"]
    if disease in high_severity:
        return "High"
    elif disease in moderate_severity:
        return "Moderate"
    return "Low"
