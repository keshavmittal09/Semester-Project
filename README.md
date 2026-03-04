# MedAI Diagnostics

An AI-powered healthcare diagnostic platform that combines machine learning with explainable AI (XAI) to provide transparent, evidence-based clinical assessments.

Built as a semester project to explore how ML models can be made interpretable in a healthcare context.

---

## What it does

- Takes patient symptoms as input and runs them through a Random Forest classifier trained on clinically-accurate disease profiles
- Uses SHAP (SHapley Additive exPlanations) to break down exactly *why* the model made a particular prediction
- Generates natural language clinical narratives using Groq's Llama 3.3 70B
- Provides counterfactual analysis ("what if this symptom was absent?"), feature interaction heatmaps, and a multi-factor trust score
- Includes a chatbot that can answer follow-up questions about diagnosis results

## Tech Stack

**Frontend**: Next.js 15, React 19, Recharts (for data viz)

**Backend**: FastAPI, scikit-learn, SHAP, Groq API

**Design**: Custom CSS inspired by Apple's design language — clean typography, generous whitespace, dark mode support

## Screenshots

### Light Mode
![Home page with hero section and feature overview](public/images/hero-brain.png)

### Key Features
- 8 disease classes (Influenza, Pneumonia, COVID-19, etc.)
- 15 symptom features with real clinical weighting
- 7 XAI tabs: Overview, Trust Score, SHAP, Radar, What-If, Interactions, Risk
- PDF report generation
- Session-based diagnosis history
- AI chatbot (Groq-powered)
- Dark/Light mode toggle

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Setup

1. **Clone the repo**
```bash
git clone https://github.com/keshavmittal09/Semester-Project.git
cd Semester-Project
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
pip install -r requirements.txt
```

4. **Add your Groq API key**

Create `backend/.env`:
```
GROQ_API_KEY=your_key_here
```

5. **Start the backend**
```bash
cd backend
python main.py
```
Backend runs on `http://localhost:8000`

6. **Start the frontend** (in a new terminal)
```bash
npm run dev
```
Frontend runs on `http://localhost:3000`

## Project Structure

```
├── app/                    # Next.js pages
│   ├── page.js             # Home
│   ├── diagnose/           # Diagnosis page
│   ├── analytics/          # Model metrics & evaluation
│   ├── history/            # Past diagnoses (session)
│   ├── reports/            # PDF report downloads
│   ├── profile/            # User profile
│   ├── settings/           # App settings
│   ├── layout.js           # Root layout
│   └── globals.css         # Design system
├── components/             # React components
│   ├── Sidebar.js
│   ├── Topbar.js
│   ├── DiagnosisReport.js  # 7-tab XAI dashboard
│   ├── ChatWidget.js       # AI chatbot
│   ├── ThemeProvider.js    # Dark mode context
│   └── ...
├── backend/                # Python FastAPI
│   ├── main.py             # API endpoints
│   ├── model.py            # Random Forest ML model
│   ├── xai_engine.py       # SHAP, counterfactuals, interactions
│   ├── groq_service.py     # LLM narrative generation
│   └── requirements.txt
└── public/                 # Static assets
```

## How the ML Model Works

The model is a Random Forest classifier (200 trees) trained on synthetic but clinically-weighted data derived from:

- **Harrison's Principles of Internal Medicine** — symptom-disease associations
- **Merck Manual** — clinical presentation profiles
- **WHO ICD-11** — disease classification standards

Each disease class has a carefully defined symptom probability profile. For example, Influenza has high probability for fever (0.95), body aches (0.85), and chills (0.80), matching real clinical presentations.

### Explainability Pipeline

1. **SHAP TreeExplainer** — computes exact Shapley values for each symptom's contribution
2. **Counterfactual Analysis** — re-runs the model with each symptom toggled to show impact
3. **Feature Interactions** — pairwise interaction matrix between all symptoms
4. **Trust Score** — composite of model certainty, prediction margin, symptom specificity, and cross-validation reliability

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check + config status |
| `/api/diagnose` | POST | Full diagnosis pipeline |
| `/api/evaluation` | GET | Model accuracy, F1, confusion matrix |
| `/api/features` | GET | Global feature importances |
| `/api/chat` | POST | AI chatbot (context-aware) |

## Evaluation Metrics

The model achieves ~75% accuracy across 8 disease classes, which is reasonable given the synthetic training data. In a production setting, this would be trained on real patient records.

| Metric | Score |
|---|---|
| Accuracy | ~75.8% |
| F1 Score | ~75.2% |
| Disease Classes | 8 |

## Notes

- This is a **semester project** — the model uses synthetic (but clinically-weighted) training data, not real patient records
- All diagnoses include a disclaimer that this is for educational purposes only
- The Groq API key is required for AI chat and clinical narratives; without it the app falls back to template-based text
- Model `.pkl` files are auto-generated on first run, so they're excluded from the repo

## License

MIT
