import os
import json
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Ensure the model is trained before launching the server
MODEL_PATH = 'models/card_model.joblib'
METRICS_PATH = 'models/metrics.json'
STATS_PATH = 'models/stats.json'

if not os.path.exists(MODEL_PATH) or not os.path.exists(METRICS_PATH) or not os.path.exists(STATS_PATH):
    print("Model, stats, or metrics not found! Initializing train.py pipeline...")
    from train import run_training_pipeline
    run_training_pipeline()

# Load serialized components
model = joblib.load('models/card_model.joblib')
scaler = joblib.load('models/scaler.joblib')
encoders = joblib.load('models/label_encoders.joblib')
feature_names = joblib.load('models/feature_names.joblib')

@app.route('/')
def home():
    """Render the main single-page application dashboard."""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """
    Accept user inputs as a JSON payload, run preprocessing steps, 
    and make an approval prediction with confidence and risk levels.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided.'}), 400

        # Validate required inputs
        required_fields = [
            'gender', 'age', 'income', 'education', 'family_status', 'children',
            'housing_type', 'occupation', 'years_employed', 'family_size',
            'own_car', 'own_realty', 'income_type', 'unemployed'
        ]
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            return jsonify({'error': f"Missing input fields: {', '.join(missing_fields)}"}), 400

        # Parse numerical variables
        age = int(data['age'])
        income = float(data['income'])
        children = int(data['children'])
        family_size = int(data['family_size'])
        years_employed = float(data['years_employed'])
        unemployed = int(data['unemployed'])

        # Compute engineered features
        income_per_member = income / family_size

        if income < 100000:
            income_cat = 'Low'
        elif income < 200000:
            income_cat = 'Medium'
        else:
            income_cat = 'High'

        if age < 30:
            age_cat = 'Young'
        elif age < 50:
            age_cat = 'Middle-Aged'
        else:
            age_cat = 'Senior'

        if years_employed == 0:
            employed_cat = 'Unemployed'
        elif years_employed < 5:
            employed_cat = 'Junior'
        elif years_employed < 15:
            employed_cat = 'Mid-level'
        else:
            employed_cat = 'Senior'

        # Preprocess categorical inputs
        encoded_data = {}
        try:
            encoded_data['CODE_GENDER'] = encoders['CODE_GENDER'].transform([data['gender']])[0]
            encoded_data['FLAG_OWN_CAR'] = encoders['FLAG_OWN_CAR'].transform([data['own_car']])[0]
            encoded_data['FLAG_OWN_REALTY'] = encoders['FLAG_OWN_REALTY'].transform([data['own_realty']])[0]
            encoded_data['NAME_INCOME_TYPE'] = encoders['NAME_INCOME_TYPE'].transform([data['income_type']])[0]
            encoded_data['NAME_EDUCATION_TYPE'] = encoders['NAME_EDUCATION_TYPE'].transform([data['education']])[0]
            encoded_data['NAME_FAMILY_STATUS'] = encoders['NAME_FAMILY_STATUS'].transform([data['family_status']])[0]
            encoded_data['NAME_HOUSING_TYPE'] = encoders['NAME_HOUSING_TYPE'].transform([data['housing_type']])[0]
            encoded_data['OCCUPATION_TYPE'] = encoders['OCCUPATION_TYPE'].transform([data['occupation']])[0]
            encoded_data['INCOME_CAT'] = encoders['INCOME_CAT'].transform([income_cat])[0]
            encoded_data['AGE_CAT'] = encoders['AGE_CAT'].transform([age_cat])[0]
            encoded_data['EMPLOYED_CAT'] = encoders['EMPLOYED_CAT'].transform([employed_cat])[0]
        except ValueError as val_err:
            return jsonify({'error': f"Encoding error: Unrecognized option selected. Details: {str(val_err)}"}), 400

        # Scale numerical features (using exact order as fitted, passing DataFrame to suppress warnings)
        num_values_df = pd.DataFrame(
            [[children, income, family_size, age, years_employed, income_per_member]], 
            columns=['CNT_CHILDREN', 'AMT_INCOME_TOTAL', 'CNT_FAM_MEMBERS', 'AGE', 'YEARS_EMPLOYED', 'INCOME_PER_MEMBER']
        )
        scaled_values = scaler.transform(num_values_df)[0]

        scaled_num_features = {
            'CNT_CHILDREN': scaled_values[0],
            'AMT_INCOME_TOTAL': scaled_values[1],
            'CNT_FAM_MEMBERS': scaled_values[2],
            'AGE': scaled_values[3],
            'YEARS_EMPLOYED': scaled_values[4],
            'INCOME_PER_MEMBER': scaled_values[5]
        }

        # Build feature vector dynamically in the exact order fitted
        features = []
        for col in feature_names:
            if col in encoded_data:
                features.append(encoded_data[col])
            elif col in scaled_num_features:
                features.append(scaled_num_features[col])
            elif col == 'UNEMPLOYED':
                features.append(unemployed)
            else:
                return jsonify({'error': f"Internal Error: Feature '{col}' missing from preprocessing configuration."}), 500

        features_array = np.array([features])

        # Predict target (1 = Approved, 0 = Rejected)
        prediction = model.predict(features_array)[0]
        approved = int(prediction) == 1

        # Probability and Confidence
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(features_array)[0]
            prob_approved = probs[1]
            prob_rejected = probs[0]
        else:
            prob_approved = 1.0 if approved else 0.0
            prob_rejected = 0.0 if approved else 1.0

        # Risk level determination based on probability
        if approved:
            confidence = float(prob_approved) * 100
            if prob_approved >= 0.85:
                risk_level = "Low"
            elif prob_approved >= 0.65:
                risk_level = "Medium"
            else:
                risk_level = "High"
        else:
            confidence = float(prob_rejected) * 100
            risk_level = "High"

        return jsonify({
            'approved': approved,
            'confidence': round(confidence, 2),
            'risk_level': risk_level
        })

    except Exception as e:
        return jsonify({'error': f"Prediction error: {str(e)}"}), 500

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Retrieve saved model comparison metrics and training dataset stats."""
    try:
        if not os.path.exists(METRICS_PATH) or not os.path.exists(STATS_PATH):
            return jsonify({'error': 'Metrics or stats files are missing.'}), 404

        with open(METRICS_PATH, 'r') as f:
            metrics_data = json.load(f)
            
        with open(STATS_PATH, 'r') as f:
            stats_data = json.load(f)

        return jsonify({
            'metrics': metrics_data,
            'stats': stats_data
        })
    except Exception as e:
        return jsonify({'error': f"Failed to load metrics: {str(e)}"}), 500

if __name__ == '__main__':
    # On Render, PORT is injected as an env variable and must bind to 0.0.0.0
    # Locally falls back to port 5000
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('RENDER') is None  # disable debug on Render
    app.run(host='0.0.0.0', port=port, debug=debug)
