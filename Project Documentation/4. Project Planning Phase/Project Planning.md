# Project Planning
## CrediShield AI — Credit Card Approval Prediction System

---

## 1. Project Timeline (Gantt Summary)

The project follows a rapid 12-day development lifecycle, structured into distinct phases from ideation to deployment.

| Phase | Task Description | Duration | Start Day | End Day | Status |
|-------|------------------|----------|-----------|---------|--------|
| **Phase 1** | Brainstorming, Ideation & Problem Definition | 1 day | Day 1 | Day 1 | ✅ Completed |
| **Phase 2** | Requirement Analysis & Empathy Mapping | 1 day | Day 2 | Day 2 | ✅ Completed |
| **Phase 3** | Solution Design & Architecture Planning | 1 day | Day 3 | Day 3 | ✅ Completed |
| **Phase 4** | Dataset Collection & Exploratory Data Analysis | 1 day | Day 4 | Day 4 | ✅ Completed |
| **Phase 5** | Data Preprocessing & Feature Engineering | 1 day | Day 5 | Day 5 | ✅ Completed |
| **Phase 6** | Model Training, Evaluation & Selection | 1 day | Day 6 | Day 6 | ✅ Completed |
| **Phase 7** | Flask Backend Development (`app.py`) | 1 day | Day 7 | Day 7 | ✅ Completed |
| **Phase 8** | Frontend UI Development (Glassmorphism & Logic) | 2 days | Day 8 | Day 9 | ✅ Completed |
| **Phase 9** | System Integration & End-to-End Testing | 1 day | Day 10 | Day 10 | ✅ Completed |
| **Phase 10** | Cloud Deployment (Render.com) & Troubleshooting | 1 day | Day 11 | Day 11 | ✅ Completed |
| **Phase 11** | Comprehensive Documentation & Submission Prep | 1 day | Day 12 | Day 12 | ✅ Completed |

---

## 2. Resource Allocation

### 2.1 Software & Tools
| Resource | Category | Purpose |
|----------|----------|---------|
| Python 3.12 | Language Runtime | Core programming language for ML and Backend |
| VS Code / Cursor | IDE | Code writing, debugging, and terminal access |
| Git | Version Control | Local versioning and commit management |
| Jupyter Notebook | Data Science Tool | Interactive EDA, visualizations, and prototyping |

### 2.2 External Platforms & Services
| Resource | Category | Purpose | Cost |
|----------|----------|---------|------|
| Kaggle | Data Source | Downloading `application_record.csv` and `credit_record.csv` | Free |
| GitHub | Code Repository | Hosting source code; CI/CD trigger mechanism | Free |
| Render.com | Cloud Hosting | Hosting the Flask web application in production | Free Tier |
| Chart.js (CDN) | Frontend Library | Rendering interactive dashboards | Free |
| Google Fonts | Typography | Supplying 'Plus Jakarta Sans' font | Free |

### 2.3 Human Resources
- **Team Size**: 1 Developer (Solo Project)
- **Roles Assumed**: Product Manager, Data Scientist, Backend Engineer, Frontend Developer, QA Tester, DevOps Engineer, Technical Writer.

---

## 3. Risk Management Plan

### 3.1 Anticipated Risks & Mitigations

| Risk Description | Category | Probability | Impact | Mitigation Strategy |
|------------------|----------|-------------|--------|---------------------|
| **Class Imbalance**: Model predicts "Approved" for everyone due to 98% safe cases. | Machine Learning | High | High | Use stratified train-test splits; evaluate models using F1-score rather than just accuracy; test Balanced Random Forest. |
| **Library Version Conflicts**: Deserialization errors (`_loss` module missing) on deployment due to `scikit-learn` version mismatch. | DevOps | Medium | High | Pin exact package versions in `requirements.txt` to match the local training environment. |
| **Bundle Size Limits**: Cloud provider rejects deployment because ML libraries exceed size quotas (e.g., Vercel's 500MB limit). | DevOps | High | High | Exclude training-only libraries (matplotlib, seaborn) from production `requirements.txt`; switch from Vercel to Render. |
| **Gunicorn Compatibility**: `pkg_resources` error on Python 3.12. | Deployment | Low | Medium | Upgrade Gunicorn to v22.0.0 which drops the deprecated `setuptools` dependency. |
| **Large File Commits**: GitHub rejects push due to files > 100MB. | Version Control | Medium | Medium | Configure `.gitignore` early to exclude datasets (`data/`) and large media files (`demo_video.mov`). |

---

## 4. Milestones & Deliverables

| Milestone | Deliverable | Acceptance Criteria | Status |
|-----------|-------------|---------------------|--------|
| **M1: Data Readiness** | Merged & Cleaned Dataset | Binary labels engineered; missing values handled; outliers removed. | ✅ Achieved |
| **M2: ML Pipeline Complete** | Serialized ML Artifacts | 6 models trained; Gradient Boosting selected (≥95% accuracy); artifacts saved to `models/`. | ✅ Achieved |
| **M3: API Functional** | Flask Backend (`app.py`) | `/predict` and `/metrics` endpoints return valid JSON responses for test payloads. | ✅ Achieved |
| **M4: UI Integrated** | Web Dashboard | Glassmorphism design applied; form submission triggers animated SVG gauge and charts. | ✅ Achieved |
| **M5: System Deployed** | Live Web Service | Application accessible globally via Render URL; HTTPS enabled; port bound correctly. | ✅ Achieved |
| **M6: Project Documented** | Documentation Suite | 8-phase documentation PDFs created; `README.md` complete. | ✅ Achieved |

---

## 5. Development Methodology

The project utilized an **Iterative Prototyping** approach within an Agile framework:
1. **Prototype Phase**: Used Jupyter Notebooks to rapidly explore data, test feature engineering ideas, and prove that a high-accuracy model could be built.
2. **Refactoring Phase**: Migrated notebook code into a modular Python script (`train.py`) to automate training and artifact generation.
3. **API Phase**: Built the Flask application to wrap the serialized model.
4. **Frontend Phase**: Built the UI iteratively, starting with basic HTML/JS, then adding CSS styling, and finally incorporating animations and charts.
5. **Deployment Iterations**: Pushed code to the cloud, encountered expected infrastructure limitations (e.g., bundle sizes, port bindings), fixed them in code, and redeployed until stable.

---

> **Project Name:** CrediShield AI
> **Author:** Dinesh (dineshTech-creator)
> **Date:** July 2026
