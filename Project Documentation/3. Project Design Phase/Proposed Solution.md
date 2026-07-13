# Proposed Solution
## CrediShield AI — Credit Card Approval Prediction System

---

## 1. Solution Overview

**CrediShield AI** is an intelligent credit card approval prediction platform that combines machine learning classification with a premium web dashboard. The system ingests applicant profile data, processes it through a trained Gradient Boosting model, and returns an instant approve/reject decision with confidence scoring and risk grading.

### Core Value:
> Replace 7–14 day manual credit review with **sub-second ML predictions** achieving **98.29% accuracy** and **99.14% F1-score**, delivered through a stunning glassmorphism web interface.

---

## 2. Solution Components

### Component 1: ML Training Pipeline (`train.py`)

**Purpose**: Automates the entire machine learning lifecycle from raw data to serialized, production-ready model artifacts.

**Pipeline Steps**:

| Step | Action | Output |
|------|--------|--------|
| 1 | Load `application_record.csv` and `credit_record.csv` from `data/` | Raw DataFrames |
| 2 | Engineer binary target labels from payment status codes | `TARGET` column (0 = Rejected, 1 = Approved) |
| 3 | Merge datasets on `ID`; deduplicate applications | Combined DataFrame |
| 4 | Clean data: fill missing occupations with 'Unknown', remove income outliers (IQR) | Clean DataFrame |
| 5 | Create derived features: `AGE`, `YEARS_EMPLOYED`, `UNEMPLOYED`, `INCOME_PER_MEMBER`, `INCOME_CAT`, `AGE_CAT`, `EMPLOYED_CAT` | Enriched DataFrame |
| 6 | Encode 11 categorical columns using `LabelEncoder` | Integer-encoded DataFrame |
| 7 | Scale 6 numerical columns using `StandardScaler` | Normalized DataFrame |
| 8 | Stratified 80/20 train-test split | X_train, X_test, y_train, y_test |
| 9 | Train 6 models: Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, XGBoost, Balanced Random Forest | 6 fitted models |
| 10 | Evaluate all models on Accuracy, Precision, Recall, F1-Score, ROC AUC | Comparison metrics |
| 11 | Auto-select winner by highest F1-Score | Gradient Boosting (99.14% F1) |
| 12 | Serialize model, scaler, encoders, feature names, metrics, and stats to `models/` | 6 `.joblib` + 2 `.json` files |

---

### Component 2: Flask REST Backend (`app.py`)

**Purpose**: Serves as the API layer connecting the frontend dashboard to the ML inference engine.

**Endpoints**:

| Endpoint | Method | Input | Output | Description |
|----------|--------|-------|--------|-------------|
| `/` | GET | — | HTML page | Renders the single-page CrediShield AI dashboard |
| `/predict` | POST | JSON (14 fields) | `{approved, confidence, risk_level}` | Preprocesses inputs, runs inference, returns prediction |
| `/metrics` | GET | — | `{metrics: {...}, stats: {...}}` | Returns model comparison data and training statistics for charts |

**Key Architecture Decisions**:
- **Dynamic Feature Alignment**: Reads `feature_names.joblib` to assemble the feature vector in the exact order the model was trained on — prevents order mismatch errors.
- **DataFrame-based Scaling**: Passes a named Pandas DataFrame to `StandardScaler.transform()` instead of raw lists — suppresses scikit-learn's feature name warnings.
- **Auto-Training Fallback**: If model files are missing on startup (lines 15–18), automatically imports and runs `train.py` — self-healing deployment.
- **Graceful Error Handling**: All endpoints wrapped in try-except blocks with descriptive JSON error messages.

---

### Component 3: Web Dashboard (`index.html` + `style.css` + `script.js`)

**Purpose**: Provides a visually stunning, interactive interface for non-technical bank staff to submit applications and view results.

**UI Features**:

| Feature | Technology | Description |
|---------|-----------|-------------|
| **Obsidian Glassmorphism Theme** | CSS3 `backdrop-filter` | Deep-space dark panels with `blur(25px)` frosted glass effect and light refraction borders |
| **Ambient Background Glows** | CSS animations | Three floating neon gradient blobs with slow translation animations creating depth |
| **Tabbed Navigation** | JavaScript | 4-tab layout: Predict, Model Metrics, Visual Analytics, Prediction History |
| **SVG Confidence Gauge** | SVG + JS animation | Circular progress ring using `stroke-dashoffset` transitions with green (approved) / red (rejected) gradients |
| **Numeric Count-Up** | JavaScript `setInterval` | Confidence percentage animates from 0% to final value in sync with the ring |
| **Interactive Charts** | Chart.js 4.x (CDN) | 4 chart types: feature importance (bar), approval ratio (doughnut), income distribution (bar), age groups (pie) |
| **Prediction History** | localStorage | Persistent table with transaction IDs, timestamps, decisions, and per-entry PDF downloads |
| **PDF Report Generator** | iframe + `window.print()` | Branded "CrediShield AI Credit Assessment Letter" with full applicant metadata |
| **Theme Toggle** | localStorage + CSS variables | Dark/light switch with sun/moon SVG icons; preference persisted across sessions |
| **Custom Scrollbar** | CSS `::-webkit-scrollbar` | Themed scrollbar matching the obsidian design |

---

## 3. Solution Workflow Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                    CrediShield AI — End to End                     │
│                                                                   │
│   [Applicant Data Entry]                                         │
│          │                                                        │
│          ▼                                                        │
│   [Input Validation] ──── Missing Fields? ──▶ [400 Error]        │
│          │                                                        │
│          ▼                                                        │
│   [Feature Engineering]                                          │
│     • income_per_member                                          │
│     • income_cat (Low/Medium/High)                               │
│     • age_cat (Young/Middle-Aged/Senior)                         │
│     • employed_cat (Unemployed/Junior/Mid/Senior)                │
│          │                                                        │
│          ▼                                                        │
│   [Label Encoding] ──── Unknown Category? ──▶ [400 Error]       │
│     • 11 categorical features                                    │
│          │                                                        │
│          ▼                                                        │
│   [Standard Scaling]                                             │
│     • 6 numerical features                                       │
│          │                                                        │
│          ▼                                                        │
│   [Feature Assembly]                                             │
│     • 18 features in exact training order                        │
│          │                                                        │
│          ▼                                                        │
│   [Model Prediction]                                             │
│     • Gradient Boosting Classifier                               │
│     • predict() → 0 or 1                                        │
│     • predict_proba() → [p_reject, p_approve]                   │
│          │                                                        │
│          ▼                                                        │
│   [Risk Classification]                                          │
│     • ≥85% confidence → Low Risk                                 │
│     • 65–84% → Medium Risk                                       │
│     • <65% → High Risk                                           │
│          │                                                        │
│          ▼                                                        │
│   [Result Display]                                               │
│     • APPROVED/REJECTED badge                                    │
│     • Animated SVG confidence gauge                              │
│     • Risk level indicator                                       │
│     • PDF download button                                        │
│          │                                                        │
│          ▼                                                        │
│   [History Logging] → localStorage                               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 4. Models Compared

| # | Algorithm | Type | Accuracy | F1 Score | ROC AUC | Selected? |
|---|-----------|------|----------|----------|---------|-----------|
| 1 | Logistic Regression | Linear | 91.45% | 95.53% | 93.11% | ❌ |
| 2 | Decision Tree | Tree-based | 95.73% | 97.69% | 95.56% | ❌ |
| 3 | Random Forest | Ensemble (Bagging) | 97.85% | 98.86% | 96.98% | ❌ |
| 4 | **Gradient Boosting** | **Ensemble (Boosting)** | **98.29%** | **99.14%** | **97.53%** | **✅ Winner** |
| 5 | XGBoost | Ensemble (Boosting) | 97.91% | 98.91% | 96.50% | ❌ |
| 6 | Balanced Random Forest | Ensemble (Balanced) | 86.12% | 86.93% | 92.84% | ❌ |

**Selection Criterion**: Highest F1-Score (balances precision and recall, critical for imbalanced datasets)

---

## 5. Deployment Strategy

| Aspect | Details |
|--------|---------|
| **Platform** | Render.com (Free Tier Web Service) |
| **Server** | Gunicorn 22.0.0 (WSGI HTTP server) |
| **Start Command** | `gunicorn app:app` (defined in Procfile) |
| **Auto-Deploy** | GitHub webhook triggers rebuild on every push to `main` branch |
| **Python Version** | 3.12 (pinned in `.python-version`) |
| **Dependencies** | Pinned in `requirements.txt` to prevent version mismatch deserialization errors |
| **Cold Start** | Free-tier apps sleep after 15 min inactivity; ~30 second wake-up time on first request |
| **URL** | `https://credishield-ai.onrender.com` (or as assigned) |

---

> **Project Name:** CrediShield AI
> **Author:** Dinesh (dineshTech-creator)
> **Date:** July 2026
