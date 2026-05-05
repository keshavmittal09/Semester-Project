"""
Groq LLM Service — Generates clinical narratives using Groq API
with Llama 3.3 70B. Falls back to template-based generation
if no API key is configured.
"""
import os
import json
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("⚠️ groq package not installed. Using template-based narratives.")


def is_groq_configured():
    return GROQ_AVAILABLE and GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here"


async def generate_clinical_narrative(prediction, shap_factors, symptoms_text):
    if is_groq_configured():
        return await _groq_narrative(prediction, shap_factors, symptoms_text)
    return _template_narrative(prediction, shap_factors)


async def _groq_narrative(prediction, shap_factors, symptoms_text):
    try:
        client = Groq(api_key=GROQ_API_KEY)
        top_factors = [f"{f['name']} (SHAP: {f['weight']}%)" for f in shap_factors[:5] if f.get("present")]

        prompt = f"""You are a medical AI diagnostics system. Analyze the following and return a JSON response.

Patient symptoms: {symptoms_text}
ML Model Prediction: {prediction['predicted_disease']} (Confidence: {prediction['confidence']}%)
Contributing factors (SHAP): {', '.join(top_factors) if top_factors else 'None identified'}

Return ONLY valid JSON with these keys:
{{
  "explanation": "3-4 sentence clinical analysis explaining the diagnosis, mentioning key symptoms and their clinical significance. Be professional and evidence-based.",
  "differential_diagnoses": [{{"condition": "name", "probability": number}}],
  "severity": "Low" or "Moderate" or "High"
}}

Rules:
- differential_diagnoses should list 3-4 alternatives with probabilities summing to less than {100 - prediction['confidence']}%
- Base severity on the actual clinical risk of the predicted condition
- Be medically accurate and cite relevant clinical patterns"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a medical AI that returns only valid JSON. No markdown, no extra text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=800,
        )

        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        return {
            "explanation": data.get("explanation", _template_explanation(prediction, shap_factors)),
            "differential_diagnoses": data.get("differential_diagnoses", _template_differentials(prediction)),
            "severity": data.get("severity", _assess_severity(prediction)),
            "source": "groq",
        }
    except Exception as e:
        print(f"⚠️ Groq API error: {e}")
        return _template_narrative(prediction, shap_factors)


def _template_narrative(prediction, shap_factors):
    return {
        "explanation": _template_explanation(prediction, shap_factors),
        "differential_diagnoses": _template_differentials(prediction),
        "severity": _assess_severity(prediction),
        "source": "template",
    }


def _template_explanation(prediction, shap_factors):
    disease = prediction["predicted_disease"]
    conf = prediction["confidence"]
    top = [f["name"] for f in shap_factors[:3] if f.get("present")]
    if not top:
        return (
            f"The Random Forest classifier predicted {disease} with {conf}% confidence. "
            f"The symptom profile aligns with clinical patterns for this condition. "
            f"Additional clinical data would improve diagnostic accuracy."
        )
    top_str = ", ".join(top[:-1]) + f" and {top[-1]}" if len(top) > 1 else top[0]
    return (
        f"The Random Forest classifier predicted {disease} with {conf}% confidence. "
        f"SHAP analysis identifies {top_str} as the strongest contributing factors, "
        f"consistent with established clinical presentations documented in ICD-11. "
        f"The model evaluated {len(shap_factors)} symptom features across 8 disease categories."
    )


def _template_differentials(prediction):
    probs = prediction["all_probabilities"]
    return [{"condition": d, "probability": p} for d, p in list(probs.items())[1:5] if p > 1]


def _assess_severity(prediction):
    high = {"Pneumonia", "COVID-19", "Acute Bronchitis"}
    moderate = {"Influenza", "Gastroenteritis", "Strep Throat"}
    return "High" if prediction["predicted_disease"] in high else "Moderate" if prediction["predicted_disease"] in moderate else "Low"

async def extract_symptoms_via_llm(symptoms_text, valid_symptoms_list):
    """Uses Groq LLM to extract standard clinical symptoms from raw user input (Hinglish, typos, etc.)."""
    if not is_groq_configured():
        return None
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        prompt = f"""You are a clinical NLP engine. Extract all the medical symptoms from the following raw user text (which may contain Hindi, English, Hinglish, or typos).
        
Raw text: "{symptoms_text}"

You MUST map the user's symptoms ONLY to the following exact list of allowed symptoms:
{valid_symptoms_list}

Return ONLY a JSON object with a single key 'symptoms' containing an array of strings of the matched symptoms from the allowed list. Do not include any symptoms outside this list. If none match, return {{"symptoms": []}}.
Example output: {{"symptoms": ["headache", "nausea"]}}
"""
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a JSON-only API. Output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=150,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content.strip()
        data = json.loads(content)
        return data.get("symptoms", [])
    except Exception as e:
        print(f"⚠️ Groq NLP Extraction failed: {e}")
        return None
