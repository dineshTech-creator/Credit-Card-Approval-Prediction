# Credit Card Approval Prediction System

A complete end-to-end, production-ready Credit Card Approval Prediction System. This project implements a machine learning classification pipeline to predict credit card application eligibility based on historical repayment records and applicant socio-demographic features. It features a beautiful, glassmorphism-styled dark dashboard for input evaluation, interactive visualizations, and model reporting.

---

## Folder Structure

```text
credit_card_project/
│
├── data/
│   ├── application_record.csv      # Applicant details (income, family size, assets)
│   └── credit_record.csv           # Payment history records over months
│
├── models/
│   ├── card_model.joblib           # Trained Best Machine Learning Model (winning pipeline)
│   ├── scaler.joblib               # StandardScaler fitted object for numerical columns
│   ├── label_encoders.joblib       # Dictionary of fitted LabelEncoder objects
│   ├── feature_names.joblib        # Ordered list of training feature names
│   ├── metrics.json                # Cached scores for model comparisons
│   └── stats.json                  # Aggregated training dataset statistics
│
├── templates/
│   └── index.html                  # HTML template for the single-page application dashboard
│
├── static/
│   ├── style.css                   # Glassmorphism dark-theme style sheet
│   └── script.js                   # Application logic (events, localStorage history, Chart.js, printing)
│
├── notebook.ipynb                  # Interactive EDA, cleaning, and modeling notebook
├── train.py                        # Automated training script to train and save the model
├── app.py                          # Flask backend web server
├── requirements.txt                # Required library packages
├── README.md                       # Comprehensive documentation
└── .gitignore                      # Git configuration file
```

---

## Features

- **End-to-End ML Pipeline**: Preprocesses raw tables, engineers features, trains 6 different machine learning models, handles class imbalance, automatically selects the best classifier, and serializes it.
- **Flask REST API**: Exposes endpoints for making predictions (`/predict`) and retrieving performance metrics (`/metrics`).
- **Tabbed Glassmorphism UI**: High-end dark theme design using frosted glass effects, modern fonts, SVG icons, and responsive layouts.
- **Interactive Dashboards**: Powered by Chart.js, rendering dynamic analytics charts for model features, delinquency rates, income levels, and age brackets.
- **Prediction History Log**: Caches previous predictions using `localStorage` for local retrieval.
- **Eligibility PDF Export**: Generates a high-quality printable document layout of eligibility letters and triggers print controls directly in the browser.

---

## Installation & Setup

### Prerequisites
- Python 3.8 or higher installed on your computer.

### Step 1: Clone the repository and navigate into it
```bash
git clone <repository-url>
cd credit_card_project
```

### Step 2: Install required packages
Run the following command in your terminal:
```bash
pip install -r requirements.txt
```

### Step 3: Run the Training Pipeline (Optional)
The system is self-initializing. If you run the Flask application immediately, it will automatically train the model if it detects missing files. However, you can run the pipeline manually to see the models' comparison:
```bash
python train.py
```
Expected output:
- It prints model evaluation grids (Accuracy, Precision, Recall, F1, ROC AUC).
- Automatically selects the winner (e.g., Gradient Boosting).
- Saves objects inside `models/`.

### Step 4: Run the Flask Web Application
```bash
python app.py
```
Open your browser and navigate to:
```text
http://127.0.0.1:5000
```

---

## Preprocessing & Label Engineering Details

### Target Variable (STATUS)
Raw datasets lack approval status labels. We construct labels from `credit_record.csv` based on monthly repayment records:
- Clients with payments overdue by **60 or more days** (represented by codes `2`, `3`, `4`, `5` in `STATUS`) are categorized as high-risk/delinquent and are **Rejected (0)**.
- Clients who pay off on time (codes `C`, `X`, `0`, `1`) are categorized as safe and are **Approved (1)**.

### Preprocessing Steps
- **Data Cleaning**: Rows with missing occupations are filled with `'Unknown'`. Duplicate applications are removed. Extreme income outliers are filtered using the Interquartile Range (IQR).
- **Feature Engineering**:
  - `AGE`: Converted from birth days offset to years.
  - `YEARS_EMPLOYED`: Converted from employment days offset (unemployed offsets mapped to 0).
  - `UNEMPLOYED`: Binary indicator flag derived from employment days.
  - `INCOME_PER_MEMBER`: Annual income divided by family size.
  - `INCOME_CAT`, `AGE_CAT`, `EMPLOYED_CAT`: Categorical buckets.
- **Encoding & Scaling**: Encoders transform text classes alphabetically, and numerical features are standardized to scale.

---

## Future Improvements

1. **Database Integration**: Migrate prediction logs from local browser storage to a permanent PostgreSQL database.
2. **SMOTE Upsampling**: Apply Synthetic Minority Over-sampling Technique (SMOTE) to synthetically balance class distributions during training.
3. **Hyperparameter Tuning**: Run RandomizedSearchCV to optimize tree depths and learning rates for Gradient Boosting and Random Forest algorithms.
4. **Real-time Pipeline Monitoring**: Deploy logging dashboards using tools like MLflow.
