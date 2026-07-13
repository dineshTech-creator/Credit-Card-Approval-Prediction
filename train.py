import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    roc_auc_score, confusion_matrix, classification_report
)

# Classifiers
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
from imblearn.ensemble import BalancedRandomForestClassifier

def run_training_pipeline():
    print("====================================================")
    # Step 1: Loading raw datasets
    # ====================================================
    print("STEP 1: Ingesting datasets...")
    app_df = pd.read_csv('data/application_record.csv')
    credit_df = pd.read_csv('data/credit_record.csv')
    print(f"Loaded {len(app_df)} application records and {len(credit_df)} credit history rows.")

    # ====================================================
    # Step 2: Merging and Target Creation
    # ====================================================
    print("STEP 2: Constructing target variable and merging...")
    # Target definition: status 2, 3, 4, 5 (60+ days past due) are risky (1)
    credit_df['is_risky'] = credit_df['STATUS'].isin(['2', '3', '4', '5']).astype(int)
    
    # Group by customer ID to check if they had a risky history at least once
    user_target = credit_df.groupby('ID')['is_risky'].max().reset_index()
    
    # Label customers: Approved (1) if they are safe (is_risky == 0), Rejected (0) if they are risky (is_risky == 1)
    user_target['target'] = 1 - user_target['is_risky']
    user_target.drop(columns=['is_risky'], inplace=True)
    
    # Inner join merged dataset by ID
    df = pd.merge(app_df, user_target, on='ID', how='inner')
    print(f"Merged dataset shape: {df.shape}")

    # ====================================================
    # Step 3 & 4 & 5: Data Cleaning & Feature Engineering
    # ====================================================
    print("STEP 3, 4 & 5: Cleaning and Feature Engineering...")
    
    # Fill missing occupation values with 'Unknown'
    df['OCCUPATION_TYPE'] = df['OCCUPATION_TYPE'].fillna('Unknown')
    
    # Remove duplicates
    duplicates_count = df.duplicated().sum()
    df.drop_duplicates(inplace=True)
    print(f"Removed {duplicates_count} duplicate rows.")

    # Convert birth offset to positive age in years
    df['AGE'] = (df['DAYS_BIRTH'] / -365.25).astype(int)
    
    # Convert employment offset to positive years, set unemployed (positive days) to 0
    df['YEARS_EMPLOYED'] = df['DAYS_EMPLOYED'].apply(lambda x: 0.0 if x > 0 else x / -365.25)
    df['UNEMPLOYED'] = (df['DAYS_EMPLOYED'] > 0).astype(int)

    # Remove extreme income outliers using IQR (keep up to Q3 + 3.0*IQR)
    Q1 = df['AMT_INCOME_TOTAL'].quantile(0.25)
    Q3 = df['AMT_INCOME_TOTAL'].quantile(0.75)
    IQR = Q3 - Q1
    upper_limit = Q3 + 3.0 * IQR
    df_clean = df[df['AMT_INCOME_TOTAL'] <= upper_limit].copy()
    print(f"Filtered outliers: shape changed from {df.shape} to {df_clean.shape}")

    # Feature Engineering
    # 1. Income per family member
    df_clean['INCOME_PER_MEMBER'] = df_clean['AMT_INCOME_TOTAL'] / df_clean['CNT_FAM_MEMBERS']
    
    # 2. Income Category
    def get_income_cat(inc):
        if inc < 100000: return 'Low'
        elif inc < 200000: return 'Medium'
        else: return 'High'
    df_clean['INCOME_CAT'] = df_clean['AMT_INCOME_TOTAL'].apply(get_income_cat)
    
    # 3. Age Category
    def get_age_cat(age):
        if age < 30: return 'Young'
        elif age < 50: return 'Middle-Aged'
        else: return 'Senior'
    df_clean['AGE_CAT'] = df_clean['AGE'].apply(get_age_cat)
    
    # 4. Employment duration Category
    def get_employed_cat(years):
        if years == 0: return 'Unemployed'
        elif years < 5: return 'Junior'
        elif years < 15: return 'Mid-level'
        else: return 'Senior'
    df_clean['EMPLOYED_CAT'] = df_clean['YEARS_EMPLOYED'].apply(get_employed_cat)

    # Drop raw ID and day offsets to avoid leakage, as well as contact flags not needed for classification
    df_clean.drop(columns=['ID', 'DAYS_BIRTH', 'DAYS_EMPLOYED', 'FLAG_MOBIL', 'FLAG_WORK_PHONE', 'FLAG_PHONE', 'FLAG_EMAIL'], inplace=True, errors='ignore')

    # Expose stats for the charts view (before encoding/scaling)
    stats = {
        'class_counts': df_clean['target'].value_counts().to_dict(),
        'gender_counts': df_clean['CODE_GENDER'].value_counts().to_dict(),
        'education_counts': df_clean['NAME_EDUCATION_TYPE'].value_counts().to_dict(),
        'family_status_counts': df_clean['NAME_FAMILY_STATUS'].value_counts().to_dict(),
        'housing_counts': df_clean['NAME_HOUSING_TYPE'].value_counts().to_dict(),
        'income_cat_counts': df_clean['INCOME_CAT'].value_counts().to_dict(),
        'age_cat_counts': df_clean['AGE_CAT'].value_counts().to_dict(),
        'employed_cat_counts': df_clean['EMPLOYED_CAT'].value_counts().to_dict()
    }
    
    # Encoding categorical columns
    cat_cols = ['CODE_GENDER', 'FLAG_OWN_CAR', 'FLAG_OWN_REALTY', 'NAME_INCOME_TYPE', 
                'NAME_EDUCATION_TYPE', 'NAME_FAMILY_STATUS', 'NAME_HOUSING_TYPE', 
                'OCCUPATION_TYPE', 'INCOME_CAT', 'AGE_CAT', 'EMPLOYED_CAT']
    
    label_encoders = {}
    for col in cat_cols:
        le = LabelEncoder()
        df_clean[col] = le.fit_transform(df_clean[col].astype(str))
        label_encoders[col] = le

    # Scaling numerical columns
    num_cols = ['CNT_CHILDREN', 'AMT_INCOME_TOTAL', 'CNT_FAM_MEMBERS', 'AGE', 'YEARS_EMPLOYED', 'INCOME_PER_MEMBER']
    scaler = StandardScaler()
    df_clean[num_cols] = scaler.fit_transform(df_clean[num_cols])

    # ====================================================
    # Step 6: Train/Test Split
    # ====================================================
    print("STEP 6: Splitting datasets (80/20)...")
    X = df_clean.drop(columns=['target'])
    y = df_clean['target']
    
    # Stratified split to ensure the minor class distribution is matched
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Training features size: {X_train.shape}, Test features size: {X_test.shape}")

    # ====================================================
    # Step 7: Model Comparison
    # ====================================================
    print("STEP 7: Training multiple models and comparing performance...")
    classifiers = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42, class_weight='balanced'),
        'Decision Tree': DecisionTreeClassifier(random_state=42, class_weight='balanced'),
        'Random Forest': RandomForestClassifier(random_state=42, class_weight='balanced'),
        'Gradient Boosting': GradientBoostingClassifier(random_state=42),
        'XGBoost': XGBClassifier(random_state=42, eval_metric='logloss'),
        'Balanced Random Forest': BalancedRandomForestClassifier(random_state=42)
    }

    results = {}
    best_model_name = None
    best_f1 = -1.0
    best_clf = None

    for name, clf in classifiers.items():
        print(f"-> Training {name}...")
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        
        # Check if predict_proba is available
        if hasattr(clf, "predict_proba"):
            y_prob = clf.predict_proba(X_test)[:, 1]
        else:
            y_prob = np.zeros(len(y_test))
            
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.5
        
        # Save metrics
        results[name] = {
            'Accuracy': float(acc),
            'Precision': float(prec),
            'Recall': float(rec),
            'F1 Score': float(f1),
            'ROC AUC': float(auc)
        }
        
        # Select the best model automatically based on F1 Score or Accuracy.
        # Given class imbalance (majority is Approved), F1 score of the minority class is important,
        # but let's check F1 score of predicting risk vs safe. Since 1 is Approved, F1 is dominated by Approved.
        # Let's optimize for F1 score to capture both classes balanced.
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_clf = clf

    print("\n--- Model Evaluation Matrix ---")
    results_df = pd.DataFrame(results).T
    print(results_df)
    
    print(f"\nWINNER: {best_model_name} (F1 Score: {best_f1*100:.2f}%)")
    
    # Best Model classification report & confusion matrix
    best_preds = best_clf.predict(X_test)
    report = classification_report(y_test, best_preds, output_dict=True)
    print("\nBest Model Classification Report:")
    print(classification_report(y_test, best_preds))
    
    cm = confusion_matrix(y_test, best_preds).tolist()
    print("Best Model Confusion Matrix:")
    print(confusion_matrix(y_test, best_preds))

    # Feature Importance of best model
    feature_importances = {}
    if hasattr(best_clf, 'feature_importances_'):
        importances = best_clf.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        for idx in sorted_indices:
            feature_importances[X.columns[idx]] = float(importances[idx])
        print("\nFeature Importances:")
        for k, v in list(feature_importances.items())[:10]:
            print(f"  {k}: {v:.4f}")

    # ====================================================
    # Step 8: Saving Best Model and Artifacts
    # ====================================================
    print("STEP 8: Saving winning model and preprocessors...")
    os.makedirs('models', exist_ok=True)
    
    # Save objects
    joblib.dump(best_clf, 'models/card_model.joblib')
    joblib.dump(scaler, 'models/scaler.joblib')
    joblib.dump(label_encoders, 'models/label_encoders.joblib')
    joblib.dump(list(X.columns), 'models/feature_names.joblib')
    
    # Write metrics to models/metrics.json
    metrics_data = {
        'comparison': results,
        'best_model': {
            'name': best_model_name,
            'accuracy': float(accuracy_score(y_test, best_preds)),
            'precision': float(precision_score(y_test, best_preds, zero_division=0)),
            'recall': float(recall_score(y_test, best_preds, zero_division=0)),
            'f1_score': float(best_f1),
            'confusion_matrix': cm,
            'classification_report': report
        },
        'feature_importances': feature_importances
    }
    
    with open('models/metrics.json', 'w') as f:
        json.dump(metrics_data, f, indent=4)
        
    with open('models/stats.json', 'w') as f:
        json.dump(stats, f, indent=4)

    print("Pipeline executed successfully. Files written to models/")
    print("====================================================")

if __name__ == '__main__':
    run_training_pipeline()
