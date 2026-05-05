"""
Advanced XAI (Explainable AI) Engine
Uses SHAP for real feature importance + counterfactual generation +
feature interaction analysis.
"""
import numpy as np

# We attempt to import shap; if not available, we provide fallback
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("⚠️ SHAP not installed. Using fallback feature importance.")

from model import SYMPTOMS, DISEASES


class XAIEngine:
    """Advanced Explainable AI engine for healthcare diagnostics."""

    def __init__(self, ml_model):
        self.ml_model = ml_model
        self.explainer = None
        if SHAP_AVAILABLE and ml_model.model is not None:
            try:
                # If VotingClassifier, extract the Random Forest sub-model for SHAP
                base_model = ml_model.model
                if hasattr(base_model, 'estimators_'):
                    from sklearn.ensemble import RandomForestClassifier
                    for name, est in getattr(base_model, 'named_estimators_', {}).items():
                        if isinstance(est, RandomForestClassifier):
                            base_model = est
                            break

                self.explainer = shap.TreeExplainer(base_model)
                print("✅ SHAP TreeExplainer initialized.")
            except Exception as e:
                print(f"⚠️ SHAP TreeExplainer failed: {e}")

    def compute_shap_values(self, symptom_vector):
        """Compute SHAP values for a single prediction."""
        X = np.array(symptom_vector).reshape(1, -1)

        if self.explainer is not None:
            shap_values = self.explainer.shap_values(X)
            pred_idx = np.argmax(self.ml_model.model.predict_proba(X)[0])

            # shap_values is (n_classes, 1, n_features) for tree models
            if isinstance(shap_values, list):
                values = shap_values[pred_idx][0]
            else:
                values = shap_values[0, :, pred_idx] if shap_values.ndim == 3 else shap_values[0]

            # Build factors list
            factors = []
            for i, symptom in enumerate(SYMPTOMS):
                val = float(values[i])
                factors.append({
                    "name": symptom.replace("_", " ").title(),
                    "weight": round(abs(val) * 100, 1),
                    "direction": "positive" if val > 0 else "negative",
                    "raw_shap": round(val, 4),
                    "present": bool(symptom_vector[i]),
                })

            # Sort by absolute weight
            factors.sort(key=lambda x: x["weight"], reverse=True)
            return factors
        else:
            return self._fallback_importance(symptom_vector)

    def _fallback_importance(self, symptom_vector):
        """Fallback: use model's feature_importances_ as approximation."""
        importances = self.ml_model.model.feature_importances_
        factors = []
        for i, symptom in enumerate(SYMPTOMS):
            if symptom_vector[i] == 1:
                factors.append({
                    "name": symptom.replace("_", " ").title(),
                    "weight": round(float(importances[i]) * 100, 1),
                    "direction": "positive",
                    "raw_shap": round(float(importances[i]), 4),
                    "present": True,
                })
        factors.sort(key=lambda x: x["weight"], reverse=True)
        return factors

    def generate_counterfactuals(self, symptom_vector, prediction_result):
        """
        Generate counterfactual explanations:
        'What if symptom X was absent/present?'
        """
        original_pred = prediction_result["predicted_disease"]
        original_conf = prediction_result["confidence"]
        counterfactuals = []

        # Test removing each present symptom
        for i, symptom in enumerate(SYMPTOMS):
            if symptom_vector[i] == 1:
                modified = symptom_vector.copy()
                modified[i] = 0
                new_result = self.ml_model.predict(modified)

                if new_result["predicted_disease"] != original_pred or abs(new_result["confidence"] - original_conf) > 5:
                    symptom_name = symptom.replace("_", " ").title()
                    conf_change = new_result["confidence"] - original_conf

                    if new_result["predicted_disease"] != original_pred:
                        answer = f"The diagnosis would shift from {original_pred} to {new_result['predicted_disease']} with {new_result['confidence']}% confidence."
                    else:
                        answer = f"The confidence would {'drop' if conf_change < 0 else 'increase'} from {original_conf}% to {new_result['confidence']}%."

                    counterfactuals.append({
                        "question": f"What if '{symptom_name}' was not present?",
                        "answer": answer,
                        "impactDirection": "down" if conf_change < 0 or new_result["predicted_disease"] != original_pred else "up",
                        "newConfidence": new_result["confidence"],
                        "newPrediction": new_result["predicted_disease"],
                        "removedSymptom": symptom_name,
                    })

        # Test adding important absent symptoms
        importances_dict = self.ml_model.get_feature_importances()
        absent_important = [
            (i, importances_dict.get(SYMPTOMS[i], 0)) for i in range(len(SYMPTOMS))
            if symptom_vector[i] == 0
        ]
        absent_important.sort(key=lambda x: x[1], reverse=True)

        for idx, imp in absent_important[:2]:
            modified = symptom_vector.copy()
            modified[idx] = 1
            new_result = self.ml_model.predict(modified)
            symptom_name = SYMPTOMS[idx].replace("_", " ").title()

            if new_result["predicted_disease"] != original_pred or abs(new_result["confidence"] - original_conf) > 3:
                counterfactuals.append({
                    "question": f"What if '{symptom_name}' was also present?",
                    "answer": f"Adding this symptom would change the prediction to {new_result['predicted_disease']} ({new_result['confidence']}% confidence).",
                    "impactDirection": "up",
                    "newConfidence": new_result["confidence"],
                    "newPrediction": new_result["predicted_disease"],
                    "addedSymptom": symptom_name,
                })

        return counterfactuals[:5]  # Cap at 5

    def compute_feature_interactions(self, symptom_vector):
        """
        Compute pairwise feature interactions —
        which symptom combinations are most impactful together.
        """
        interactions = []
        present_symptoms = [i for i in range(len(SYMPTOMS)) if symptom_vector[i] == 1]

        if len(present_symptoms) < 2:
            return interactions

        original_result = self.ml_model.predict(symptom_vector)
        original_conf = original_result["confidence"]

        for a_idx in range(len(present_symptoms)):
            for b_idx in range(a_idx + 1, len(present_symptoms)):
                i, j = present_symptoms[a_idx], present_symptoms[b_idx]

                # Remove both symptoms
                modified = symptom_vector.copy()
                modified[i] = 0
                modified[j] = 0
                both_removed = self.ml_model.predict(modified)

                # Remove only first
                mod_a = symptom_vector.copy()
                mod_a[i] = 0
                only_a_removed = self.ml_model.predict(mod_a)

                # Remove only second
                mod_b = symptom_vector.copy()
                mod_b[j] = 0
                only_b_removed = self.ml_model.predict(mod_b)

                # Interaction strength = synergy effect
                individual_effect = (original_conf - only_a_removed["confidence"]) + (original_conf - only_b_removed["confidence"])
                combined_effect = original_conf - both_removed["confidence"]
                interaction_strength = combined_effect - individual_effect

                if abs(interaction_strength) > 1:
                    interactions.append({
                        "symptom_a": SYMPTOMS[i].replace("_", " ").title(),
                        "symptom_b": SYMPTOMS[j].replace("_", " ").title(),
                        "interaction_strength": round(interaction_strength, 1),
                        "synergy": "synergistic" if interaction_strength > 0 else "redundant",
                        "combined_impact": round(combined_effect, 1),
                    })

        interactions.sort(key=lambda x: abs(x["interaction_strength"]), reverse=True)
        return interactions[:5]

    def generate_risk_assessment(self, predicted_disease, confidence):
        """Generate risk factors based on the predicted disease."""
        risk_map = {
            "Influenza": [
                {"name": "Dehydration", "level": "medium", "description": "Sustained fever increases fluid loss significantly"},
                {"name": "Secondary Bacterial Infection", "level": "medium", "description": "Weakened immunity may lead to pneumonia"},
                {"name": "Febrile Seizure", "level": "low", "description": "Rare, primarily in very young patients"},
                {"name": "Myocarditis", "level": "low", "description": "Rare cardiac inflammation from viral spread"},
            ],
            "Common Cold": [
                {"name": "Sinusitis", "level": "low", "description": "Nasal congestion may progress to sinus infection"},
                {"name": "Ear Infection", "level": "low", "description": "Eustachian tube inflammation possible"},
            ],
            "Acute Bronchitis": [
                {"name": "Pneumonia Progression", "level": "high", "description": "Lower respiratory infection may worsen"},
                {"name": "Hypoxemia", "level": "medium", "description": "Breathing difficulty may reduce blood oxygen"},
                {"name": "Chronic Bronchitis", "level": "medium", "description": "Repeated episodes can lead to chronic state"},
            ],
            "Pneumonia": [
                {"name": "Sepsis", "level": "high", "description": "Infection may enter bloodstream"},
                {"name": "Respiratory Failure", "level": "high", "description": "Severe lung involvement"},
                {"name": "Pleural Effusion", "level": "medium", "description": "Fluid accumulation around lungs"},
                {"name": "Lung Abscess", "level": "low", "description": "Localized pus collection in lung tissue"},
            ],
            "Gastroenteritis": [
                {"name": "Severe Dehydration", "level": "high", "description": "Rapid fluid and electrolyte loss"},
                {"name": "Electrolyte Imbalance", "level": "medium", "description": "Potassium and sodium depletion"},
                {"name": "Aspiration Risk", "level": "low", "description": "Vomiting while supine"},
            ],
            "Migraine": [
                {"name": "Chronic Migraine", "level": "medium", "description": "Recurring episodes may become chronic"},
                {"name": "Medication Overuse", "level": "low", "description": "Frequent analgesic use can worsen headaches"},
            ],
            "COVID-19": [
                {"name": "Long COVID", "level": "high", "description": "Persistent symptoms lasting weeks or months"},
                {"name": "Pneumonia", "level": "high", "description": "Viral pneumonia requiring hospitalization"},
                {"name": "Blood Clotting", "level": "medium", "description": "Increased risk of thrombosis"},
                {"name": "Myocarditis", "level": "medium", "description": "Heart muscle inflammation"},
            ],
            "Strep Throat": [
                {"name": "Rheumatic Fever", "level": "medium", "description": "Untreated strep can cause heart valve damage"},
                {"name": "Peritonsillar Abscess", "level": "medium", "description": "Pus collection near tonsils"},
                {"name": "Post-streptococcal GN", "level": "low", "description": "Kidney inflammation complication"},
            ],
        }
        return risk_map.get(predicted_disease, [
            {"name": "Unspecified Risk", "level": "low", "description": "Monitor symptoms closely"}
        ])

    def generate_recommendations(self, predicted_disease):
        """Generate actionable recommendations based on predicted disease."""
        rec_map = {
            "Influenza": [
                "Begin antiviral therapy (e.g., Oseltamivir) within 48 hours of symptom onset.",
                "Maintain aggressive hydration: at least 2-3 liters of fluids daily.",
                "Use acetaminophen or ibuprofen for fever and pain management.",
                "Self-isolate for at least 5 days to prevent community spread.",
                "Seek emergency care if experiencing difficulty breathing or persistent chest pain.",
            ],
            "Common Cold": [
                "Get ample rest and stay hydrated with warm fluids.",
                "Use saline nasal drops for congestion relief.",
                "Consider zinc supplements within the first 24 hours of symptom onset.",
                "Symptoms typically resolve within 7-10 days without medical intervention.",
            ],
            "Acute Bronchitis": [
                "Monitor blood oxygen with a pulse oximeter; seek care if SpO2 < 94%.",
                "Use a humidifier and steam inhalation to ease bronchial constriction.",
                "Avoid irritants: smoke, strong perfumes, and extreme temperatures.",
                "If bacterial cause is suspected, a physician may prescribe antibiotics.",
                "Seek emergency care if breathing worsens significantly.",
            ],
            "Pneumonia": [
                "URGENT: Seek immediate medical evaluation — pneumonia can be life-threatening.",
                "Chest X-ray and blood tests are recommended to confirm diagnosis.",
                "Antibiotic therapy will be determined based on the type of pneumonia.",
                "Monitor oxygen levels continuously; supplemental oxygen may be needed.",
                "Complete the full course of prescribed treatment even if feeling better.",
            ],
            "Gastroenteritis": [
                "Prioritize oral rehydration with electrolyte solutions (ORS).",
                "Follow the BRAT diet (bananas, rice, applesauce, toast) once tolerable.",
                "Avoid dairy, caffeine, alcohol, and spicy foods until recovery.",
                "Monitor for severe dehydration: minimal urination, dry mouth, rapid heartbeat.",
                "Consult a doctor if symptoms persist beyond 48 hours or contain blood.",
            ],
            "Migraine": [
                "Rest in a dark, quiet room and apply a cold compress to the forehead.",
                "Take prescribed migraine medication or OTC analgesics as early as possible.",
                "Identify and avoid known triggers (stress, certain foods, sleep changes).",
                "Consider preventive therapy if migraines occur frequently (4+ per month).",
                "Maintain regular sleep, hydration, and meal schedules.",
            ],
            "COVID-19": [
                "Self-isolate immediately and inform close contacts.",
                "Monitor oxygen levels with a pulse oximeter; seek care if SpO2 < 93%.",
                "Stay well-hydrated and take fever-reducing medication as needed.",
                "Seek emergency care for severe breathing difficulty, persistent chest pain, or confusion.",
                "Follow local health authority guidelines for testing and isolation duration.",
            ],
            "Strep Throat": [
                "Consult a doctor for a rapid strep test to confirm diagnosis.",
                "If confirmed, complete the full antibiotic course (typically 10 days).",
                "Gargle with warm salt water for throat pain relief.",
                "Avoid acidic or abrasive foods that may irritate the throat.",
                "Return for follow-up if symptoms don't improve within 48 hours of antibiotics.",
            ],
        }
        return rec_map.get(predicted_disease, [
            "Monitor symptoms and seek medical attention if they worsen.",
            "Stay hydrated and get adequate rest.",
            "Consider scheduling a primary care visit for evaluation.",
        ])
