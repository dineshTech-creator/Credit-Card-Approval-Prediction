# Performance Testing & Results
## CrediShield AI — Credit Card Approval Prediction System

---

## 1. Test Environment

Testing was conducted across both local development environments and the live cloud production deployment to ensure consistency.

| Parameter | Specification |
|-----------|---------------|
| **Local OS** | Windows 11 |
| **Local Hardware** | Intel Core i5, 8GB RAM |
| **Python Runtime** | Version 3.12 |
| **Web Server** | Gunicorn v22.0.0 (Production) / Flask Dev Server (Local) |
| **Cloud Platform** | Render.com (Free Tier: 512MB RAM) |
| **Browsers Tested** | Microsoft Edge (v120+), Google Chrome (v120+) |

---

## 2. Machine Learning Model Performance

The core prediction engine was evaluated on a stratified 20% holdout test set comprising previously unseen application data.

### 2.1 Model Comparison Matrix

The training pipeline evaluated 6 distinct algorithms. Performance metrics are detailed below:

| Algorithm | Accuracy | Precision | Recall | F1-Score | ROC AUC |
|-----------|----------|-----------|--------|----------|---------|
| Logistic Regression | 91.45% | 96.12% | 94.95% | 95.53% | 93.11% |
| Decision Tree | 95.73% | 97.40% | 97.98% | 97.69% | 95.56% |
| Random Forest | 97.85% | 98.90% | 98.82% | 98.86% | 96.98% |
| **Gradient Boosting** | **98.29%** | **99.21%** | **99.07%** | **99.14%** | **97.53%** |
| XGBoost | 97.91% | 99.05% | 98.77% | 98.91% | 96.50% |
| Balanced Random Forest| 86.12% | 85.50% | 88.41% | 86.93% | 92.84% |

### 2.2 Performance Analysis
- **Winner**: Gradient Boosting Classifier.
- **Why F1-Score Matters**: Due to severe class imbalance (>98% safe clients), accuracy is misleading. The F1-score of 99.14% confirms the model achieves an outstanding balance between Precision (not approving risky clients) and Recall (not rejecting safe clients).

---

## 3. System Functional Testing

### Test Case 1: Safe Profile Validation (Approval Scenario)
| Parameter | Detail |
|-----------|--------|
| **Objective** | Verify the model correctly identifies a low-risk applicant. |
| **Input Vector** | Male, 30 yrs, $120k income, Higher Education, Married, 1 child, House/Apt, Manager, 5 yrs employed, Family size 3, Owns Car, Owns Realty, Working |
| **Expected Result** | Approved (True) with High Confidence |
| **Actual API Output** | `{"approved": true, "confidence": 98.76, "risk_level": "Low"}` |
| **Status** | ✅ **PASS** |

### Test Case 2: Risky Profile Validation (Rejection Scenario)
| Parameter | Detail |
|-----------|--------|
| **Objective** | Verify the model correctly identifies a high-risk/delinquent applicant. |
| **Input Vector** | Female, 22 yrs, $15k income, Lower Secondary, Single, 0 children, Renting, Laborer, 0 yrs employed (Unemployed), Family size 1, No Car, No Realty |
| **Expected Result** | Rejected (False) with High Risk |
| **Actual API Output** | `{"approved": false, "confidence": 87.34, "risk_level": "High"}` |
| **Status** | ✅ **PASS** |

### Test Case 3: Invalid Input Handling
| Parameter | Detail |
|-----------|--------|
| **Objective** | Ensure the API does not crash when required fields are missing. |
| **Input Vector** | JSON payload omitting the `gender` and `income` fields. |
| **Expected Result** | HTTP 400 Bad Request with a descriptive error. |
| **Actual API Output** | `{"error": "Missing input fields: gender, income"}` (HTTP 400) |
| **Status** | ✅ **PASS** |

---

## 4. Non-Functional Performance Testing

### 4.1 Latency and Response Time
| Metric | Threshold Target | Actual Measured | Status |
|--------|------------------|-----------------|--------|
| API Prediction Inference Time | < 500 ms | **~85 ms** (average) | ✅ PASS |
| UI Initial Load Time (Render) | < 3.0 seconds | **~1.2 seconds** | ✅ PASS |

*(Note: Response times were measured under standard load conditions. Render free-tier instances experience a known ~30-second "cold start" delay if inactive for 15 minutes, after which response times return to <100ms).*

### 4.2 Browser & UI Compatibility
The glassmorphism UI and Chart.js rendering were tested manually across viewport sizes:
- **Desktop (1080p)**: Rendered perfectly. Animations smooth.
- **Tablet (768px width)**: CSS Flexbox grids adjusted correctly. Navigation remained accessible.
- **Print Layout**: The hidden iframe triggered the PDF/Print dialog successfully, and the CSS `@media print` rules stripped unnecessary UI elements to generate a clean "Assessment Letter."

### 4.3 Deployment Stability
- **Gunicorn Port Binding**: Verified that the application binds correctly to `0.0.0.0` and utilizes the Render-injected `PORT` environment variable.
- **Dependency Deserialization**: Verified that pinning `scikit-learn==1.5.0` resolved the `_loss` module `ModuleNotFoundError` during cloud deployment model unpickling.

---

> **Project Name:** CrediShield AI
> **Author:** Dinesh (dineshTech-creator)
> **Date:** July 2026
