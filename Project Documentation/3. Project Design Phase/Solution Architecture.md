# Solution Architecture
## CrediShield AI — Credit Card Approval Prediction System

---

## 1. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Browser (Chrome / Firefox / Edge)                 │  │
│  │  ┌──────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │
│  │  │ index.html   │  │ style.css   │  │ script.js           │  │  │
│  │  │ (Structure)  │  │ (Theme)     │  │ (Logic + Fetch API) │  │  │
│  │  └──────────────┘  └─────────────┘  └─────────────────────┘  │  │
│  │                     ┌─────────────┐                           │  │
│  │                     │ Chart.js    │  (CDN v4.x)               │  │
│  │                     └─────────────┘                           │  │
│  │                     ┌─────────────┐                           │  │
│  │                     │ Google Fonts│  (CDN)                    │  │
│  │                     └─────────────┘                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP/HTTPS (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SERVER LAYER                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                Gunicorn WSGI Server (v22.0.0)                 │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │              Flask Application (app.py)                 │   │  │
│  │  │                                                         │   │  │
│  │  │  Route: GET /           → render_template('index.html') │   │  │
│  │  │  Route: POST /predict   → preprocess → predict → JSON  │   │  │
│  │  │  Route: GET /metrics    → read JSON files → return      │   │  │
│  │  └───────────────────────────┬─────────────────────────────┘   │  │
│  │                               │                                 │  │
│  │  ┌───────────────────────────▼─────────────────────────────┐   │  │
│  │  │              ML Inference Engine                         │   │  │
│  │  │  ┌──────────────────┐  ┌────────────┐  ┌────────────┐  │   │  │
│  │  │  │ card_model.joblib│  │scaler.joblib│ │encoders    │  │   │  │
│  │  │  │ Gradient Boosting│  │StandardScale│ │.joblib     │  │   │  │
│  │  │  │ Classifier       │  │r            │ │(11 encoders│  │   │  │
│  │  │  │ (136 KB)         │  │(1 KB)       │ │ 3.5 KB)    │  │   │  │
│  │  │  └──────────────────┘  └────────────┘  └────────────┘  │   │  │
│  │  │  ┌──────────────────┐  ┌─────────────────────────────┐ │   │  │
│  │  │  │feature_names     │  │metrics.json + stats.json    │ │   │  │
│  │  │  │.joblib (0.3 KB)  │  │(evaluation data, 5 KB)      │ │   │  │
│  │  │  └──────────────────┘  └─────────────────────────────┘ │   │  │
│  │  └─────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DEPLOYMENT LAYER                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Render.com (Free Tier Web Service)                           │  │
│  │  • Auto-deploy via GitHub webhook (main branch)               │  │
│  │  • Python 3.12 runtime environment                            │  │
│  │  • 512 MB RAM allocation                                      │  │
│  │  • HTTPS endpoint with SSL certificate                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  GitHub Repository                                            │  │
│  │  • Source code version control                                │  │
│  │  • Webhook triggers Render rebuild on push                    │  │
│  │  • Model artifacts stored in models/ directory                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Interaction Matrix

| From | To | Protocol/Method | Data Exchanged | Frequency |
|------|----|-----------------|----------------|-----------|
| Browser | Flask (`/`) | HTTP GET | HTML page + CSS + JS | On page load |
| Browser | Flask (`/predict`) | HTTP POST (JSON) | 14 applicant fields → `{approved, confidence, risk_level}` | Per prediction |
| Browser | Flask (`/metrics`) | HTTP GET | → `{metrics: {...}, stats: {...}}` | On tab switch |
| Browser | Chart.js CDN | HTTPS GET | JavaScript library (245 KB) | On first page load |
| Browser | Google Fonts CDN | HTTPS GET | Font files (Plus Jakarta Sans) | On first page load |
| Flask | ML Engine | Python function call | 18-element numpy array → prediction + probability | Per prediction |
| Flask | JSON files | File I/O read | `metrics.json` + `stats.json` contents | Per `/metrics` call |
| GitHub | Render | Webhook (HTTPS) | Push notification → trigger rebuild | Per `git push` |
| Render | GitHub | Git clone (HTTPS) | Repository source code + model files | Per deployment |

---

## 3. Layer Descriptions

### 3.1 Client Layer (Presentation)

| Component | Technology | Size | Purpose |
|-----------|-----------|------|---------|
| `index.html` | HTML5 + Jinja2 | ~15 KB | Page structure: navbar, form, results, tabs, charts |
| `style.css` | CSS3 | ~12 KB | Glassmorphism theme, animations, responsive layouts |
| `script.js` | ES6 JavaScript | ~14 KB | Form handling, fetch API, SVG animation, localStorage, PDF generation |
| Chart.js | CDN (v4.x) | 245 KB (external) | Interactive bar, doughnut, and pie chart rendering |
| Plus Jakarta Sans | Google Fonts CDN | ~50 KB (external) | Premium typography |

### 3.2 Server Layer (Business Logic)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Gunicorn | v22.0.0 | Production WSGI HTTP server; handles concurrent requests |
| Flask | v3.0.3 | Route handling, request parsing, response formatting |
| Prediction Pipeline | Python | Input validation → feature engineering → encoding → scaling → inference |
| Error Handling | try-except blocks | Graceful JSON error responses for all failure modes |

### 3.3 ML Inference Engine (Data/Model Layer)

| Artifact | Format | Size | Content |
|----------|--------|------|---------|
| `card_model.joblib` | Binary (Pickle) | 136 KB | Fitted GradientBoostingClassifier |
| `scaler.joblib` | Binary (Pickle) | 1 KB | Fitted StandardScaler (mean + variance for 6 features) |
| `label_encoders.joblib` | Binary (Pickle) | 3.5 KB | Dictionary of 11 fitted LabelEncoder objects |
| `feature_names.joblib` | Binary (Pickle) | 0.3 KB | Ordered list: 18 feature column names |
| `metrics.json` | JSON | 3.8 KB | All 6 models' Accuracy, Precision, Recall, F1, ROC AUC |
| `stats.json` | JSON | 1.1 KB | Class counts, income categories, age categories |

### 3.4 Deployment Layer (Infrastructure)

| Service | Role | Configuration |
|---------|------|---------------|
| **Render.com** | Cloud hosting | Free Tier; auto-deploy from GitHub; Python 3.12 |
| **GitHub** | Source control | Repository: `dineshTech-creator/Credit-Card-Approval-Prediction` |
| **Procfile** | Process definition | `web: gunicorn app:app` |
| **requirements.txt** | Dependency management | 7 pinned production packages |
| **.python-version** | Runtime version | `3.12` |

---

## 4. Design Patterns Used

| Pattern | Where Applied | Benefit |
|---------|--------------|---------|
| **MVC (Model-View-Controller)** | Entire application | Separation of concerns: UI, logic, and data are independent |
| **Pre-trained Inference** | ML Engine | No training at runtime; fast startup; deterministic predictions |
| **Self-Healing Startup** | `app.py` lines 15–18 | Auto-triggers training if model files missing |
| **Configuration as Code** | `Procfile`, `vercel.json`, `.python-version` | Infrastructure defined in version-controlled files |
| **Client-Side Caching** | localStorage (history) | Reduces server calls; instant history retrieval |
| **Progressive Enhancement** | SVG gauge + Chart.js | Core prediction works even if animations fail |
| **API-First Design** | `/predict` and `/metrics` endpoints | Frontend and backend can evolve independently |

---

## 5. Security Considerations

| Aspect | Implementation |
|--------|---------------|
| **Input Validation** | All 14 required fields checked before processing |
| **Error Sanitization** | API error messages don't expose stack traces or internal paths |
| **No Database** | No SQL injection surface (localStorage is client-side only) |
| **HTTPS** | Render provides free SSL certificates for all deployed apps |
| **No Authentication** | Current version is a demo — future versions should add login |
| **CORS** | Not explicitly configured (same-origin requests only) |

---

> **Project Name:** CrediShield AI
> **Author:** Dinesh (dineshTech-creator)
> **Date:** July 2026
