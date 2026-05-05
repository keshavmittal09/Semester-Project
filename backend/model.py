"""
MedAI ML Model Module — Real Dataset Pipeline

Loads the clinical dataset from CSV files, trains an ensemble model
(Random Forest + XGBoost VotingClassifier), and provides prediction
with full evaluation metrics.

Data source: Clinical prevalence profiles derived from:
  - Harrison's Principles of Internal Medicine (21st Ed)
  - Merck Manual Professional Edition
  - WHO ICD-11 Clinical Guidelines
  - CDC Surveillance Data
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import json
import logging

logger = logging.getLogger("medai.model")

# ─────────────────────────────────────────────────────
# CLINICAL FEATURE DEFINITIONS
# ─────────────────────────────────────────────────────
SYMPTOMS = [
    "fever", "headache", "cough", "sore_throat", "body_aches",
    "fatigue", "nausea", "dizziness", "chest_pain", "shortness_of_breath",
    "runny_nose", "chills", "vomiting", "diarrhea", "joint_pain"
]

DISEASES = [
    "Influenza",
    "Common Cold",
    "Acute Bronchitis",
    "Pneumonia",
    "Gastroenteritis",
    "Migraine",
    "COVID-19",
    "Strep Pharyngitis"
]

# ─────────────────────────────────────────────────────
# SYMPTOM NORMALIZATION DICTIONARY (PRD Section 5.2)
# Maps natural language → canonical symptom names
# ─────────────────────────────────────────────────────
SYMPTOM_NORMALIZATION = {
    "fever": ["fever", "temperature", "hot", "burning up", "pyrexia", "febrile", "bukhar"],
    "headache": ["headache", "head pain", "migraine", "cephalgia", "head ache", "headech", "headeache", "sir dard"],
    "cough": ["cough", "coughing", "hack", "dry cough", "wet cough", "productive cough", "khansi"],
    "sore_throat": ["sore throat", "throat pain", "pharyngitis", "throat", "strep throat", "gala kharab", "gale me dard"],
    "body_aches": ["body ache", "body pain", "muscle pain", "myalgia", "aching", "badan dard", "body dard"],
    "fatigue": ["fatigue", "tired", "exhaustion", "weak", "lethargy", "malaise", "low energy", "thakan", "thakawat"],
    "nausea": ["nausea", "nauseous", "queasy", "sick to stomach", "feel sick", "stomach pain", "stomach ache", "belly ache", "pet dard"],
    "dizziness": ["dizziness", "dizzy", "lightheaded", "vertigo", "faint", "chakkar"],
    "chest_pain": ["chest pain", "chest tight", "chest pressure", "pleuritic", "chest discomfort", "chhati me dard"],
    "shortness_of_breath": ["shortness of breath", "dyspnea", "breathless", "difficulty breathing", "can't breathe", "breathing difficulty", "saans lene me dikkat"],
    "runny_nose": ["runny nose", "nasal congestion", "stuffy nose", "rhinorrhea", "sneezing", "blocked nose", "jukharm", "jukham", "naak behna", "cold"],
    "chills": ["chills", "shivering", "rigors", "cold sweats", "shaking", "thand lagna"],
    "vomiting": ["vomiting", "throwing up", "emesis", "puking", "ulti", "vomit"],
    "diarrhea": ["diarrhea", "loose stool", "watery stool", "loose motion", "runs", "dast", "diarrhoea"],
    "joint_pain": ["joint pain", "arthralgia", "stiff joints", "joint ache", "joint stiffness", "jodo me dard"],
}

# ─────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
TRAIN_CSV = os.path.join(DATA_DIR, "Training.csv")
TEST_CSV = os.path.join(DATA_DIR, "Testing.csv")
MODEL_PATH = os.path.join(BASE_DIR, "trained_model.joblib")
EVAL_PATH = os.path.join(BASE_DIR, "evaluation_metrics.json")


def load_dataset():
    """Load training and testing CSVs. Returns X_train, X_test, y_train, y_test."""
    if not os.path.exists(TRAIN_CSV):
        raise FileNotFoundError(
            f"Training dataset not found at {TRAIN_CSV}. "
            f"Run: python data/download_dataset.py"
        )

    train_df = pd.read_csv(TRAIN_CSV)
    logger.info(f"Loaded training data: {train_df.shape}")

    # Validate columns
    for s in SYMPTOMS:
        if s not in train_df.columns:
            raise ValueError(f"Missing symptom column: {s}")
    if "prognosis" not in train_df.columns:
        raise ValueError("Missing 'prognosis' column in training data")

    X_train = train_df[SYMPTOMS].values
    y_train = train_df["prognosis"].values

    # Load test set if available
    if os.path.exists(TEST_CSV):
        test_df = pd.read_csv(TEST_CSV)
        X_test = test_df[SYMPTOMS].values
        y_test = test_df["prognosis"].values
        logger.info(f"Loaded testing data: {test_df.shape}")
    else:
        # Fallback: split training data
        X_train, X_test, y_train, y_test = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
        )
        logger.info("No test CSV found, using 80/20 split from training data")

    return X_train, X_test, y_train, y_test


class HealthcareMLModel:
    """Healthcare diagnosis ML model with ensemble learning and evaluation."""

    def __init__(self):
        self.model = None
        self.label_encoder = LabelEncoder()
        self.evaluation_metrics = None
        self._load_or_train()

    def _load_or_train(self):
        """Load saved model or train from dataset."""
        if os.path.exists(MODEL_PATH):
            try:
                saved = joblib.load(MODEL_PATH)
                self.model = saved["model"]
                self.label_encoder = saved["label_encoder"]
                if os.path.exists(EVAL_PATH):
                    with open(EVAL_PATH, "r") as f:
                        self.evaluation_metrics = json.load(f)
                logger.info("Loaded pre-trained model from disk")
            except Exception as e:
                logger.warning(f"Failed to load saved model: {e}. Retraining...")
                self._train()
        else:
            self._train()

    def _train(self):
        """Train ensemble model on the clinical dataset."""
        logger.info("Training ML ensemble on clinical dataset...")

        X_train, X_test, y_train, y_test = load_dataset()

        # Encode labels
        y_train_enc = self.label_encoder.fit_transform(y_train)
        y_test_enc = self.label_encoder.transform(y_test)

        # ─── Ensemble: Random Forest + XGBoost ───
        rf = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )

        # Try to use XGBoost, fallback to extra RF if not installed
        try:
            from xgboost import XGBClassifier
            xgb = XGBClassifier(
                n_estimators=200,
                max_depth=10,
                learning_rate=0.1,
                objective="multi:softprob",
                random_state=42,
                n_jobs=-1,
            )
            self.model = VotingClassifier(
                estimators=[("rf", rf), ("xgb", xgb)],
                voting="soft",
                n_jobs=-1,
            )
            model_type = "VotingClassifier (RandomForest + XGBoost)"
            logger.info("Using ensemble: RandomForest + XGBoost")
        except ImportError:
            logger.warning("XGBoost not installed. Using RandomForest only.")
            self.model = rf
            model_type = "RandomForestClassifier"

        # Train
        self.model.fit(X_train, y_train_enc)

        # Evaluate
        y_pred = self.model.predict(X_test)

        # Cross-validation on full data
        X_all = np.vstack([X_train, X_test])
        y_all = np.concatenate([y_train_enc, y_test_enc])
        cv_scores = cross_val_score(self.model, X_all, y_all, cv=5, scoring="accuracy")

        accuracy = accuracy_score(y_test_enc, y_pred)
        precision = precision_score(y_test_enc, y_pred, average="weighted")
        recall = recall_score(y_test_enc, y_pred, average="weighted")
        f1 = f1_score(y_test_enc, y_pred, average="weighted")
        cm = confusion_matrix(y_test_enc, y_pred).tolist()
        report = classification_report(
            y_test_enc, y_pred,
            target_names=self.label_encoder.classes_,
            output_dict=True
        )

        per_class = {}
        for cls_name in self.label_encoder.classes_:
            if cls_name in report:
                per_class[cls_name] = {
                    "precision": round(report[cls_name]["precision"], 4),
                    "recall": round(report[cls_name]["recall"], 4),
                    "f1_score": round(report[cls_name]["f1-score"], 4),
                    "support": int(report[cls_name]["support"]),
                }

        self.evaluation_metrics = {
            "accuracy": round(accuracy, 4),
            "precision_weighted": round(precision, 4),
            "recall_weighted": round(recall, 4),
            "f1_weighted": round(f1, 4),
            "cross_val_mean": round(cv_scores.mean(), 4),
            "cross_val_std": round(cv_scores.std(), 4),
            "confusion_matrix": cm,
            "class_names": list(self.label_encoder.classes_),
            "per_class_metrics": per_class,
            "n_training_samples": len(X_train),
            "n_test_samples": len(X_test),
            "n_features": len(SYMPTOMS),
            "feature_names": SYMPTOMS,
            "model_type": model_type,
            "n_estimators": 200,
            "data_source": "Clinical literature (Harrison's, Merck Manual, WHO ICD-11, CDC)",
        }

        # Save model + metrics
        joblib.dump({"model": self.model, "label_encoder": self.label_encoder}, MODEL_PATH)
        with open(EVAL_PATH, "w") as f:
            json.dump(self.evaluation_metrics, f, indent=2)

        logger.info(f"Model trained — Accuracy: {accuracy:.2%}, F1: {f1:.2%}")
        logger.info(f"Cross-validation: {cv_scores.mean():.2%} +/- {cv_scores.std():.2%}")

    def predict(self, symptom_vector):
        """Run prediction on a symptom vector. Returns disease + probabilities."""
        X = np.array(symptom_vector).reshape(1, -1)
        proba = self.model.predict_proba(X)[0]
        pred_idx = np.argmax(proba)
        pred_class = self.label_encoder.classes_[pred_idx]
        confidence = float(proba[pred_idx])

        all_probs = {
            self.label_encoder.classes_[i]: round(float(proba[i]) * 100, 1)
            for i in range(len(proba))
        }
        sorted_probs = dict(sorted(all_probs.items(), key=lambda x: x[1], reverse=True))

        return {
            "predicted_disease": pred_class,
            "confidence": round(confidence * 100, 1),
            "all_probabilities": sorted_probs,
        }

    def get_decision_path(self, symptom_vector):
        """Extract decision path from tree estimators for explainability."""
        X = np.array(symptom_vector).reshape(1, -1)
        paths = []

        # Get the RF estimator (either standalone or from ensemble)
        rf_model = self.model
        if hasattr(self.model, 'estimators_') and isinstance(self.model, VotingClassifier):
            # VotingClassifier — get the RF sub-model
            for name, est in self.model.named_estimators_.items():
                if isinstance(est, RandomForestClassifier):
                    rf_model = est
                    break

        if not isinstance(rf_model, RandomForestClassifier):
            return paths

        for tree_idx in range(min(3, len(rf_model.estimators_))):
            tree = rf_model.estimators_[tree_idx]
            node_indicator = tree.decision_path(X)
            feature = tree.tree_.feature
            threshold = tree.tree_.threshold
            node_index = node_indicator.indices
            path_steps = []
            for node_id in node_index:
                if feature[node_id] >= 0:
                    feat_name = SYMPTOMS[feature[node_id]]
                    feat_val = X[0, feature[node_id]]
                    path_steps.append({
                        "feature": feat_name,
                        "value": int(feat_val),
                        "threshold": round(float(threshold[node_id]), 3),
                        "direction": "Yes" if feat_val <= threshold[node_id] else "No",
                    })
            paths.append({"tree_id": tree_idx, "steps": path_steps})
        return paths

    def get_feature_importances(self):
        """Get global feature importances from the model."""
        if hasattr(self.model, 'estimators_') and isinstance(self.model, VotingClassifier):
            # Average importances from RF + XGBoost
            importances = np.zeros(len(SYMPTOMS))
            count = 0
            for name, est in self.model.named_estimators_.items():
                if hasattr(est, 'feature_importances_'):
                    importances += est.feature_importances_
                    count += 1
            if count > 0:
                importances /= count
        else:
            importances = self.model.feature_importances_

        return {
            SYMPTOMS[i]: round(float(importances[i]) * 100, 2)
            for i in np.argsort(importances)[::-1]
        }

    def compute_trust_score(self, symptom_vector, prediction_result):
        """Compute multi-factor trust score."""
        confidence = prediction_result["confidence"]
        probs = list(prediction_result["all_probabilities"].values())
        margin = probs[0] - probs[1] if len(probs) > 1 else probs[0]
        symptom_count = sum(symptom_vector)
        specificity = min(symptom_count / 5, 1.0)
        cv_reliability = self.evaluation_metrics["cross_val_mean"] if self.evaluation_metrics else 0.8

        trust = (
            confidence * 0.35 +
            margin * 0.25 +
            specificity * 100 * 0.15 +
            cv_reliability * 100 * 0.25
        )

        if trust >= 80:
            level, explanation = "High", "Strong model agreement with high symptom specificity and cross-validation reliability."
        elif trust >= 60:
            level, explanation = "Moderate", "Reasonable confidence. More symptoms or clinical data could improve accuracy."
        else:
            level, explanation = "Low", "Limited confidence due to ambiguous or insufficient symptom data."

        return {
            "score": round(min(trust, 99.5), 1),
            "level": level,
            "explanation": explanation,
            "factors": {
                "model_confidence": round(confidence, 1),
                "prediction_margin": round(margin, 1),
                "symptom_specificity": round(specificity * 100, 1),
                "cross_val_reliability": round(cv_reliability * 100, 1),
            }
        }


def parse_symptoms_to_vector(symptom_text, selected_tags=None):
    """
    Parse natural language symptoms into a binary feature vector.
    Uses the normalization dictionary for robust matching.
    """
    text = symptom_text.lower() if symptom_text else ""
    tags = [t.lower().replace(" ", "_") for t in (selected_tags or [])]

    vector = []
    for symptom in SYMPTOMS:
        if symptom in tags:
            vector.append(1)
        elif any(kw in text for kw in SYMPTOM_NORMALIZATION.get(symptom, [symptom])):
            vector.append(1)
        else:
            vector.append(0)
    return vector
