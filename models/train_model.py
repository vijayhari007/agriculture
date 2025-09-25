import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

def create_training_data():
    """Create synthetic training data for fertilizer recommendation"""
    
    # Load existing datasets
    soil_data = pd.read_csv('../datasets/soil_data.csv')
    crop_data = pd.read_csv('../datasets/crop_data.csv')
    fertilizer_data = pd.read_csv('../datasets/fertilizer_data.csv')
    
    # Create training dataset
    training_data = []
    
    # Define fertilizer recommendations based on crop and soil conditions
    fertilizer_mapping = {
        'rice': ['Urea', 'DAP', 'MOP', 'NPK 10-26-26'],
        'wheat': ['Urea', 'DAP', 'NPK 12-32-16', 'Zinc Sulphate'],
        'corn': ['Urea', 'DAP', 'MOP', 'NPK 19-19-19'],
        'soybean': ['DAP', 'MOP', 'NPK 14-35-14', 'Rhizobium'],
        'cotton': ['Urea', 'DAP', 'MOP', 'NPK 12-32-16'],
        'tomato': ['NPK 19-19-19', 'Calcium Nitrate', 'Magnesium Sulphate'],
        'potato': ['NPK 15-15-15', 'MOP', 'Sulphur', 'Magnesium Sulphate'],
        'sugarcane': ['Urea', 'SSP', 'MOP', 'Gypsum']
    }
    
    # Generate synthetic data
    crops = ['rice', 'wheat', 'corn', 'soybean', 'cotton', 'tomato', 'potato', 'sugarcane']
    
    for _ in range(5000):  # Generate 5000 samples
        crop = np.random.choice(crops)
        
        # Generate soil parameters with some correlation to crop requirements
        if crop in ['rice']:
            ph = np.random.normal(6.0, 0.5)
            nitrogen = np.random.normal(90, 20)
            phosphorus = np.random.normal(50, 15)
            potassium = np.random.normal(40, 10)
        elif crop in ['wheat']:
            ph = np.random.normal(6.8, 0.4)
            nitrogen = np.random.normal(120, 25)
            phosphorus = np.random.normal(70, 20)
            potassium = np.random.normal(55, 15)
        elif crop in ['corn']:
            ph = np.random.normal(6.5, 0.3)
            nitrogen = np.random.normal(150, 30)
            phosphorus = np.random.normal(80, 20)
            potassium = np.random.normal(70, 15)
        elif crop in ['soybean']:
            ph = np.random.normal(6.5, 0.4)
            nitrogen = np.random.normal(40, 15)
            phosphorus = np.random.normal(60, 20)
            potassium = np.random.normal(90, 20)
        elif crop in ['cotton']:
            ph = np.random.normal(7.0, 0.5)
            nitrogen = np.random.normal(100, 25)
            phosphorus = np.random.normal(55, 15)
            potassium = np.random.normal(75, 20)
        elif crop in ['tomato']:
            ph = np.random.normal(6.5, 0.3)
            nitrogen = np.random.normal(180, 40)
            phosphorus = np.random.normal(90, 25)
            potassium = np.random.normal(140, 30)
        elif crop in ['potato']:
            ph = np.random.normal(5.8, 0.4)
            nitrogen = np.random.normal(130, 30)
            phosphorus = np.random.normal(70, 20)
            potassium = np.random.normal(180, 40)
        else:  # sugarcane
            ph = np.random.normal(6.8, 0.4)
            nitrogen = np.random.normal(200, 50)
            phosphorus = np.random.normal(65, 20)
            potassium = np.random.normal(90, 25)
        
        # Ensure values are within reasonable ranges
        ph = np.clip(ph, 4.5, 8.5)
        nitrogen = np.clip(nitrogen, 10, 300)
        phosphorus = np.clip(phosphorus, 5, 150)
        potassium = np.clip(potassium, 10, 250)
        
        organic_matter = np.random.normal(2.5, 0.8)
        organic_matter = np.clip(organic_matter, 0.5, 5.0)
        
        moisture = np.random.normal(40, 10)
        moisture = np.clip(moisture, 20, 70)
        
        temperature = np.random.normal(26, 4)
        temperature = np.clip(temperature, 15, 40)
        
        # Select fertilizer based on crop and nutrient deficiencies
        available_fertilizers = fertilizer_mapping[crop]
        
        # Simple rule-based selection
        if nitrogen < 80:
            fertilizer = 'Urea'
        elif phosphorus < 40:
            fertilizer = 'DAP'
        elif potassium < 60:
            fertilizer = 'MOP'
        elif ph < 6.0:
            fertilizer = 'Lime'
        elif organic_matter < 2.0:
            fertilizer = 'Vermicompost'
        else:
            fertilizer = np.random.choice(available_fertilizers)
        
        training_data.append({
            'crop_type': crop,
            'soil_ph': round(ph, 2),
            'nitrogen': round(nitrogen, 1),
            'phosphorus': round(phosphorus, 1),
            'potassium': round(potassium, 1),
            'organic_matter': round(organic_matter, 2),
            'moisture': round(moisture, 1),
            'temperature': round(temperature, 1),
            'recommended_fertilizer': fertilizer
        })
    
    return pd.DataFrame(training_data)

def train_fertilizer_model():
    """Train machine learning model for fertilizer recommendation"""
    
    print("Creating training data...")
    df = create_training_data()
    
    # Save training data
    df.to_csv('../datasets/training_data.csv', index=False)
    print(f"Training data saved with {len(df)} samples")
    
    # Prepare features and target
    feature_columns = ['soil_ph', 'nitrogen', 'phosphorus', 'potassium', 
                      'organic_matter', 'moisture', 'temperature']
    
    # Encode categorical variables
    crop_encoder = LabelEncoder()
    fertilizer_encoder = LabelEncoder()
    
    df['crop_encoded'] = crop_encoder.fit_transform(df['crop_type'])
    df['fertilizer_encoded'] = fertilizer_encoder.fit_transform(df['recommended_fertilizer'])
    
    # Features include soil parameters and crop type
    X = df[feature_columns + ['crop_encoded']]
    y = df['fertilizer_encoded']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest model
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"Model Accuracy: {accuracy:.3f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, 
                              target_names=fertilizer_encoder.classes_))
    
    # Feature importance
    feature_names = feature_columns + ['crop_type']
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nFeature Importance:")
    print(importance_df)
    
    # Save model and encoders
    os.makedirs('../models', exist_ok=True)
    
    joblib.dump(model, '../models/fertilizer_model.pkl')
    joblib.dump(crop_encoder, '../models/crop_encoder.pkl')
    joblib.dump(fertilizer_encoder, '../models/fertilizer_encoder.pkl')
    
    print("\nModel and encoders saved successfully!")
    
    return model, crop_encoder, fertilizer_encoder

def predict_fertilizer(model, crop_encoder, fertilizer_encoder, 
                      crop_type, soil_ph, nitrogen, phosphorus, potassium, 
                      organic_matter, moisture, temperature):
    """Make fertilizer prediction using trained model"""
    
    try:
        # Encode crop type
        crop_encoded = crop_encoder.transform([crop_type])[0]
        
        # Prepare features
        features = np.array([[soil_ph, nitrogen, phosphorus, potassium, 
                            organic_matter, moisture, temperature, crop_encoded]])
        
        # Make prediction
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        
        # Get fertilizer name
        fertilizer_name = fertilizer_encoder.inverse_transform([prediction])[0]
        
        # Get top 3 recommendations with probabilities
        top_indices = np.argsort(probabilities)[-3:][::-1]
        recommendations = []
        
        for idx in top_indices:
            fert_name = fertilizer_encoder.inverse_transform([idx])[0]
            confidence = probabilities[idx]
            recommendations.append({
                'fertilizer': fert_name,
                'confidence': round(confidence * 100, 2)
            })
        
        return recommendations
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return None

if __name__ == "__main__":
    # Train the model
    model, crop_encoder, fertilizer_encoder = train_fertilizer_model()
    
    # Test prediction
    print("\n" + "="*50)
    print("Testing Model Prediction")
    print("="*50)
    
    test_predictions = predict_fertilizer(
        model, crop_encoder, fertilizer_encoder,
        crop_type='rice',
        soil_ph=6.2,
        nitrogen=70,
        phosphorus=35,
        potassium=45,
        organic_matter=2.1,
        moisture=42,
        temperature=28
    )
    
    if test_predictions:
        print("Top 3 Fertilizer Recommendations:")
        for i, pred in enumerate(test_predictions, 1):
            print(f"{i}. {pred['fertilizer']} (Confidence: {pred['confidence']}%)")
