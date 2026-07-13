# Customer Journey Map
## CrediShield AI — Credit Card Approval Prediction System

---

## Overview

This document maps the end-to-end customer journey for processing a credit card application, comparing the **traditional manual process** (Before) with the **CrediShield AI-powered process** (After).

---

## Journey Participants

| Role | Description |
|------|-------------|
| **Customer/Applicant** | Individual applying for a credit card |
| **Credit Analyst** | Bank employee who evaluates applications (primary user of CrediShield AI) |
| **Senior Analyst** | Experienced officer consulted on borderline cases |
| **System (CrediShield AI)** | The ML-powered prediction platform |

---

## Stage 1: Application Submission

| Aspect | Before (Manual) | After (CrediShield AI) |
|--------|-----------------|----------------------|
| **Action** | Customer fills paper form at branch or uploads documents on bank portal | Analyst enters applicant details directly into CrediShield AI web form |
| **Duration** | 15–30 minutes (form filling + document collection) | 3–5 minutes (14-field digital form) |
| **Touchpoint** | Bank branch counter / online portal | CrediShield AI web dashboard |
| **Data Collected** | 30+ fields including documents | 14 essential predictive fields |
| **Emotion (Analyst)** | 😐 Routine data entry task | 😊 Quick structured input |
| **Emotion (Customer)** | 😩 Long forms, document hassle | 😊 Faster process |

---

## Stage 2: Data Entry & Verification

| Aspect | Before (Manual) | After (CrediShield AI) |
|--------|-----------------|----------------------|
| **Action** | Analyst manually enters data into Excel spreadsheet; cross-references identity documents; verifies employment details via phone calls | Analyst fills dropdown menus and number fields in the prediction form; system validates inputs automatically |
| **Duration** | 30–45 minutes per application | 2 minutes |
| **Touchpoint** | Excel spreadsheet, paper files, phone calls | CrediShield AI form with pre-built dropdowns and validation |
| **Error Rate** | High — manual data entry prone to typos | Low — structured dropdowns prevent invalid entries |
| **Emotion (Analyst)** | 😩 Tedious and error-prone | 😊 Quick and reliable |

---

## Stage 3: Risk Assessment & Decision Making

| Aspect | Before (Manual) | After (CrediShield AI) |
|--------|-----------------|----------------------|
| **Action** | Analyst manually reviews credit bureau report; calculates debt-to-income ratio on calculator; compares with historical patterns; consults senior analyst for borderline cases | System runs ML model in <100ms; generates confidence score (0–100%) and risk level (Low/Medium/High) automatically |
| **Duration** | 1–3 business days | < 1 second |
| **Touchpoint** | Credit bureau reports, calculator, senior analyst consultation | Automated ML prediction engine (Gradient Boosting) |
| **Consistency** | ❌ Varies by analyst — subjective judgment | ✅ Same model applied to every application identically |
| **Accuracy** | ~85% (estimated based on industry averages) | 98.29% (measured on test data) |
| **Emotion (Analyst)** | 😰 Uncertain, second-guessing decisions | 😎 Confident, data-driven recommendation |

---

## Stage 4: Decision Communication

| Aspect | Before (Manual) | After (CrediShield AI) |
|--------|-----------------|----------------------|
| **Action** | Analyst drafts approval/rejection letter; sends via email or postal mail; customer waits 3–7 days for communication | System instantly displays APPROVED/REJECTED badge with animated confidence gauge; analyst can download a branded PDF assessment letter immediately |
| **Duration** | 1–7 days for letter dispatch | Instant (on-screen + PDF download) |
| **Touchpoint** | Email / postal letter / SMS | On-screen result card + downloadable PDF report |
| **Format** | Generic template letter | Branded "CrediShield AI Credit Assessment Letter" with confidence %, risk level, and full applicant metadata |
| **Emotion (Customer)** | 😐 Anxious waiting | 😃 Instant clarity |
| **Emotion (Analyst)** | 😐 Administrative letter drafting | 😊 One-click PDF generation |

---

## Stage 5: Record Keeping & Audit Trail

| Aspect | Before (Manual) | After (CrediShield AI) |
|--------|-----------------|----------------------|
| **Action** | Analyst files physical application in cabinet; updates Excel tracker with decision; sends monthly summary to manager | Prediction auto-saved to browser history table with transaction ID and timestamp; analytics charts update dynamically |
| **Duration** | 10–15 minutes per application | Automatic (zero manual effort) |
| **Touchpoint** | Filing cabinet, Excel tracker, email | LocalStorage prediction history + Chart.js analytics dashboard |
| **Searchability** | ❌ Difficult — must dig through physical files | ✅ Instant — searchable history table |
| **Analytics** | ❌ Manual — create pivot tables in Excel monthly | ✅ Real-time — 4 interactive charts (feature importance, approval ratio, income, age) |
| **Emotion (Analyst)** | 😫 Administrative overhead | 🎉 Zero effort, automatic tracking |

---

## Stage 6: Portfolio Monitoring & Review

| Aspect | Before (Manual) | After (CrediShield AI) |
|--------|-----------------|----------------------|
| **Action** | Manager manually compiles monthly approval/rejection stats from Excel files; identifies patterns retrospectively | Manager views Model Metrics tab showing 6-model comparison; Visual Analytics tab shows demographic distributions |
| **Duration** | 2–3 days per month | Real-time access |
| **Touchpoint** | Excel pivot tables, PowerPoint presentations | CrediShield AI Metrics & Analytics tabs |
| **Insight Quality** | Limited — aggregated numbers only | Rich — feature importances, risk distributions, confidence trends |

---

## Journey Timeline Comparison

```
BEFORE (Manual Process):
Day 1          Day 2-3         Day 4-7          Day 8-14
[Submit] ----→ [Enter Data] --→ [Assess Risk] --→ [Communicate] --→ [File Records]
 30 min         45 min          1-3 days          1-7 days           15 min

AFTER (CrediShield AI):
Minute 1       Minute 2        Minute 3          Minute 3          Automatic
[Submit] ----→ [Enter Data] --→ [AI Predicts] --→ [View Result] --→ [Auto-Saved]
 3 min          2 min           <1 second         Instant            0 effort
```

### Total Time Savings: From **7–14 days** → **Under 5 minutes** (99.9% reduction)

---

## Customer Satisfaction Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Application-to-decision time | 7–14 days | < 5 minutes | 99.9% faster |
| Decision consistency | ~70% agreement between analysts | 100% consistent (same model) | 30% improvement |
| Analyst workload per application | 45+ minutes | 5 minutes | 89% reduction |
| Error rate (data entry) | ~5% | < 1% (dropdown validation) | 80% reduction |
| Customer satisfaction score | 3.2/5 (estimated) | 4.5/5 (projected) | 40% increase |

---

> **Project Name:** CrediShield AI
> **Author:** Dinesh (dineshTech-creator)
> **Date:** July 2026
