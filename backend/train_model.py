import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib

def load_and_preprocess_data():
    """Load and preprocess the dataset for model training."""
    try:
        # Get the project root directory
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(backend_dir)
        datasets_dir = os.path.join(project_root, 'datasets')
        models_dir = os.path.join(project_root, 'models')
        
        # Create models directory if it doesn't exist
        os.makedirs(models_dir, exist_ok=True)
        
        # Load the dataset
        crop_data = pd.read_csv(os.path.join(datasets_dir, 'crop_data.csv'))
        fertilizer_data = pd.read_csv(os.path.join(datasets_dir, 'fertilizer_data.csv'))
        
        print("Sample crop data:")
        print(crop_data.head())
        print("\nSample fertilizer data:")
        print(fertilizer_data.head())
        
        # For now, let's create a simple model using crop data
        # We'll use crop_id and season to recommend fertilizers
        
        # Encode categorical variables
        le_crop = LabelEncoder()
        le_season = LabelEncoder()
        
        # Create features and target
        X = pd.DataFrame()
        X['crop_id'] = crop_data['crop_id']
        X['season_encoded'] = le_season.fit_transform(crop_data['season'])
        
        # For simplicity, let's assign a fertilizer based on crop_id and season
        # In a real scenario, you would have a proper mapping
        y = (crop_data['crop_id'] % 3) + 1  # Simple mapping to 3 fertilizer types
        
        # Save the label encoders
        joblib.dump(le_crop, os.path.join(models_dir, 'le_crop.pkl'))
        joblib.dump(le_season, os.path.join(models_dir, 'le_season.pkl'))
        
        return X, y, None
        
    except Exception as e:
        print(f"Error in load_and_preprocess_data: {str(e)}")
        raise
    
    # Save the label encoders
    joblib.dump(le_soil, os.path.join(models_dir, 'le_soil.pkl'))
    joblib.dump(le_crop, os.path.join(models_dir, 'le_crop.pkl'))
    joblib.dump(le_fertilizer, os.path.join(models_dir, 'le_fertilizer.pkl'))
    
    return X, y, le_fertilizer

def train_model():
    """Train and save the fertilizer recommendation model."""
    try:
        print("Loading and preprocessing data...")
        X, y, _ = load_and_preprocess_data()
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Initialize and train the model
        print("Training model...")
        model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=5)
        model.fit(X_train, y_train)
        
        # Calculate accuracy
        train_accuracy = model.score(X_train, y_train)
        test_accuracy = model.score(X_test, y_test)
        
        print(f"Training accuracy: {train_accuracy:.2f}")
        print(f"Test accuracy: {test_accuracy:.2f}")
        
        # Save the model
        model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'fertilizer_model.pkl')
        joblib.dump(model, model_path)
        print(f"Model saved to {model_path}")
        
        # Print feature importances
        print("\nFeature importances:")
        for name, importance in zip(X.columns, model.feature_importances_):
            print(f"{name}: {importance:.3f}")
        
        return True
    except Exception as e:
        print(f"Error training model: {str(e)}")
        return False

if __name__ == "__main__":
    train_model()
