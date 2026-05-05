# MedAI — PRD Upgrade Implementation Plan

## 📊 Current State vs. PRD Requirements

### ✅ Already Implemented (No Changes Needed)
| PRD Requirement | Current State |
|---|---|
| FastAPI backend | ✅ `main.py` with FastAPI |
| ML Engine (Random Forest) | ✅ 200-tree RF classifier |
| SHAP XAI Engine | ✅ TreeExplainer in `xai_engine.py` |
| Counterfactual analysis | ✅ Toggle-based what-if |
| Feature interactions | ✅ Pairwise synergy detection |
| Trust Score (multi-factor) | ✅ 4-factor composite |
| LLM Engine (structured JSON) | ✅ Groq + template fallback |
| Risk Assessment | ✅ Per-disease risk maps |
| Recommendations | ✅ Evidence-based per disease |
| PDF report generation | ✅ jsPDF in reports page |
| Dark/Light mode | ✅ ThemeProvider |
| Symptom input UI | ✅ Tags + textarea + NLP parsing |
| XAI visualization (7 tabs) | ✅ Overview, Trust, SHAP, Radar, What-If, Interactions, Risk |
| Pydantic validation | ✅ Request models |
| Medical disclaimer | ✅ On every diagnosis |
| Evaluation metrics | ✅ Accuracy, precision, recall, F1, confusion matrix |
| Cross-validation | ✅ 5-fold CV |
| History tracking | ✅ Session-based |
| AI chatbot | ✅ Context-aware Groq chat |

---

### 🔴 Gaps to Fix (Changes Required)

| # | PRD Requirement | Gap | Priority |
|---|---|---|---|
| 1 | **Real Kaggle dataset** (no synthetic) | Model uses synthetic data from hardcoded probability profiles | 🔴 Critical |
| 2 | **POST `/predict` endpoint** | Current endpoint is `/api/diagnose` — PRD specifies `/predict` | 🟡 Medium |
| 3 | **GET `/history` endpoint** | History is client-side only (sessionStorage) — no server API | 🟡 Medium |
| 4 | **POST `/feedback` endpoint** | Not implemented at all | 🟡 Medium |
| 5 | **Confidence Engine (dedicated)** | Confidence is computed inline in `model.py` — not a separate engine | 🟢 Low |
| 6 | **Multi-model ensemble (XGBoost + RF)** | Only Random Forest | 🟡 Medium |
| 7 | **Symptom normalization dictionary** | Basic keyword map exists but not structured normalization | 🟢 Low |
| 8 | **Logging system** | Only `print()` statements — no structured logging | 🟡 Medium |
| 9 | **Docker deployment** | No Dockerfile or docker-compose | 🟡 Medium |
| 10 | **Redis caching** | Not implemented | 🟢 Low (Phase 3) |
| 11 | **Response format mismatch** | Current response doesn't match PRD `/predict` output schema | 🟡 Medium |

---

## 🔧 Implementation Plan

### Phase 1: Core Backend Upgrades

#### 1.1 Real Kaggle Dataset Integration
> **This is the #1 critical change — the PRD explicitly forbids synthetic data.**

- Download the **"Disease Symptom Prediction" dataset** from Kaggle
- Replace `generate_training_dataset()` with real CSV loading
- Implement the data cleaning pipeline:
  - Remove duplicates
  - Handle missing values  
  - Standardize disease names
  - Symptom normalization mapping
  - Multi-hot encoding
- Update `SYMPTOMS` and `DISEASES` lists to match real dataset
- Retrain model and regenerate evaluation metrics

**Question for you:** Do you have a Kaggle account / can you download the dataset, or should I use a publicly available alternative that doesn't require authentication?

#### 1.2 Add XGBoost + Ensemble (Voting Classifier)
- Add `xgboost` to requirements
- Implement `VotingClassifier` with RF + XGBoost
- Soft voting for probability-based ensemble
- Update evaluation metrics for ensemble

#### 1.3 Dedicated Confidence Engine
- Create `confidence_engine.py`
- Compute prediction confidence + risk level
- Output: `{ confidence_score, risk_level }`

#### 1.4 PRD-Compliant API Endpoints
- Add `POST /predict` (alias or replace `/api/diagnose`)
- Add `GET /history` (server-side, SQLite-backed)
- Add `POST /feedback` (store user feedback)
- Ensure response matches PRD schema exactly

#### 1.5 Structured Logging
- Replace all `print()` with Python `logging` module
- Log levels: INFO, WARNING, ERROR
- Log to file + console

#### 1.6 Docker Deployment
- Create `Dockerfile` for backend
- Create `docker-compose.yml` (backend + frontend)
- Add `.dockerignore`

---

### Phase 2: Frontend Updates

#### 2.1 Update API calls to match new endpoints
- Update `SymptomForm.js` to call `/predict`
- Map new response schema to existing components

#### 2.2 Add Feedback UI
- Add feedback button on diagnosis report (thumbs up/down + text)
- Submit to `POST /feedback`

#### 2.3 Server-backed History
- Update history page to pull from `GET /history`
- Keep sessionStorage as fallback

---

### Phase 3: Polish & Advanced

#### 3.1 Redis Caching (optional)
#### 3.2 Multilingual support (optional)
#### 3.3 Doctor vs User mode (optional)

---

## ❓ Questions Before I Start

1. **Dataset**: The PRD requires a real Kaggle dataset. The most common one is [this Disease Symptom Dataset](https://www.kaggle.com/datasets/itachi9604/disease-symptom-knowledge-database). Should I download and integrate it, or do you have a specific dataset in mind?

2. **Scope**: Should I implement everything (Phases 1-3), or start with Phase 1 + 2 (core upgrades) first?

3. **Existing model**: Replacing synthetic data with real data will change the diseases and symptoms entirely (real dataset has 40+ diseases, 130+ symptoms). This will require significant frontend updates. Are you okay with that?

4. **Docker**: Do you need Docker support right now, or can that be Phase 3?

5. **Redis**: Same question — real Redis or skip for now?
