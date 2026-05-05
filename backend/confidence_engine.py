"""
MedAI Confidence Engine (PRD Section 8)

Dedicated module for computing prediction confidence scores
and risk levels. Separates confidence logic from the ML model
for cleaner architecture.
"""
import logging

logger = logging.getLogger("medai.confidence")


class ConfidenceEngine:
    """Computes confidence scores and risk levels for predictions."""

    # Risk thresholds
    HIGH_CONFIDENCE = 75.0
    MEDIUM_CONFIDENCE = 50.0

    # Disease severity mapping (for risk level computation)
    HIGH_RISK_DISEASES = {"Pneumonia", "COVID-19"}
    MEDIUM_RISK_DISEASES = {"Influenza", "Acute Bronchitis", "Gastroenteritis", "Strep Pharyngitis"}
    LOW_RISK_DISEASES = {"Common Cold", "Migraine"}

    def compute(self, prediction_result):
        """
        Compute confidence score and risk level.

        Args:
            prediction_result: dict with 'predicted_disease', 'confidence', 'all_probabilities'

        Returns:
            dict with 'confidence_score', 'risk_level', 'risk_explanation'
        """
        confidence = prediction_result["confidence"]
        disease = prediction_result["predicted_disease"]
        probs = list(prediction_result["all_probabilities"].values())

        # Prediction margin (how much the top prediction stands out)
        margin = probs[0] - probs[1] if len(probs) > 1 else probs[0]

        # Determine risk level based on disease + confidence
        disease_risk = self._get_disease_risk(disease)
        confidence_risk = self._get_confidence_risk(confidence)

        # Combined risk: disease severity x confidence
        risk_level = self._combine_risk(disease_risk, confidence_risk)

        # Generate explanation
        explanation = self._generate_explanation(disease, confidence, margin, risk_level)

        logger.info(f"Confidence computed: {confidence}%, risk: {risk_level}")

        return {
            "confidence_score": round(confidence, 1),
            "risk_level": risk_level,
            "risk_explanation": explanation,
            "prediction_margin": round(margin, 1),
            "alternatives_count": sum(1 for p in probs if p > 5.0),
        }

    def _get_disease_risk(self, disease):
        """Get inherent risk level of a disease."""
        if disease in self.HIGH_RISK_DISEASES:
            return "high"
        elif disease in self.MEDIUM_RISK_DISEASES:
            return "medium"
        return "low"

    def _get_confidence_risk(self, confidence):
        """Get risk level based on prediction confidence."""
        if confidence >= self.HIGH_CONFIDENCE:
            return "low"  # High confidence = low risk of misdiagnosis
        elif confidence >= self.MEDIUM_CONFIDENCE:
            return "medium"
        return "high"  # Low confidence = high risk of misdiagnosis

    def _combine_risk(self, disease_risk, confidence_risk):
        """Combine disease severity risk with prediction confidence risk."""
        risk_matrix = {
            ("high", "high"): "high",
            ("high", "medium"): "high",
            ("high", "low"): "medium",
            ("medium", "high"): "high",
            ("medium", "medium"): "medium",
            ("medium", "low"): "medium",
            ("low", "high"): "medium",
            ("low", "medium"): "low",
            ("low", "low"): "low",
        }
        return risk_matrix.get((disease_risk, confidence_risk), "medium")

    def _generate_explanation(self, disease, confidence, margin, risk_level):
        """Generate human-readable risk explanation."""
        if risk_level == "high":
            return (
                f"High risk assessment for {disease}. "
                f"Model confidence is {confidence:.0f}% with a margin of {margin:.0f}%. "
                f"Immediate medical consultation is strongly recommended."
            )
        elif risk_level == "medium":
            return (
                f"Moderate risk assessment for {disease}. "
                f"Model shows {confidence:.0f}% confidence. "
                f"Schedule a medical consultation for proper evaluation."
            )
        return (
            f"Low risk assessment for {disease}. "
            f"Model shows {confidence:.0f}% confidence with clear prediction margin. "
            f"Monitor symptoms and consult if they worsen."
        )
