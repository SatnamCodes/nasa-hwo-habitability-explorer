"""
Machine Learning Model Development for Habitability Prediction

This module trains and validates ML models for predicting exoplanet habitability
using our SEPHI scores as ground truth.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import xgboost as xgb
import joblib
from datetime import datetime
import json

class HabitabilityPredictor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.xgb_model = xgb.XGBRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        
    def prepare_features(self, df: pd.DataFrame) -> tuple:
        """Prepare features for model training."""
        feature_columns = [
            'pl_rade',    # Planet radius
            'pl_masse',   # Planet mass
            'pl_eqt',     # Equilibrium temperature
            'st_teff',    # Stellar temperature
            'pl_orbper',  # Orbital period
            'sy_dist'     # Distance from Earth
        ]
        
        # Handle missing values
        df_clean = df[feature_columns].copy()
        df_clean['pl_masse'].fillna(df_clean['pl_rade'] ** 3, inplace=True)  # Rough mass estimate
        
        X = self.scaler.fit_transform(df_clean)
        y = df['sephi_score'].values
        
        return X, y, feature_columns
    
    def train_and_evaluate(self, X: np.ndarray, y: np.ndarray) -> dict:
        """Train and evaluate both models."""
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train Random Forest
        self.rf_model.fit(X_train, y_train)
        rf_pred = self.rf_model.predict(X_test)
        rf_cv_scores = cross_val_score(self.rf_model, X, y, cv=5)
        
        # Train XGBoost
        self.xgb_model.fit(X_train, y_train)
        xgb_pred = self.xgb_model.predict(X_test)
        xgb_cv_scores = cross_val_score(self.xgb_model, X, y, cv=5)
        
        # Evaluate models
        results = {
            'random_forest': {
                'mse': mean_squared_error(y_test, rf_pred),
                'r2': r2_score(y_test, rf_pred),
                'cv_mean': rf_cv_scores.mean(),
                'cv_std': rf_cv_scores.std()
            },
            'xgboost': {
                'mse': mean_squared_error(y_test, xgb_pred),
                'r2': r2_score(y_test, xgb_pred),
                'cv_mean': xgb_cv_scores.mean(),
                'cv_std': xgb_cv_scores.std()
            }
        }
        
        return results
    
    def save_models(self, base_path: str, feature_columns: list):
        """Save trained models and metadata."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save Random Forest model
        rf_path = f"{base_path}/rf_model_{timestamp}.pkl"
        joblib.dump(self.rf_model, rf_path)
        
        # Save XGBoost model
        xgb_path = f"{base_path}/xgb_model_{timestamp}.pkl"
        joblib.dump(self.xgb_model, xgb_path)
        
        # Save scaler
        scaler_path = f"{base_path}/scaler_{timestamp}.pkl"
        joblib.dump(self.scaler, scaler_path)
        
        # Save metadata
        metadata = {
            'timestamp': timestamp,
            'feature_columns': feature_columns,
            'rf_model_path': rf_path,
            'xgb_model_path': xgb_path,
            'scaler_path': scaler_path,
            'model_version': '1.0.0'
        }
        
        with open(f"{base_path}/model_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return metadata

def train_models():
    """Main function to train and save models."""
    # Load data
    try:
        df = pd.read_csv('data_science/datasets/nasa_clean.csv')
        print(f"Loaded {len(df)} planets for training")
        
        # Initialize predictor
        predictor = HabitabilityPredictor()
        
        # Prepare features
        X, y, feature_columns = predictor.prepare_features(df)
        print("Features prepared successfully")
        
        # Train and evaluate models
        results = predictor.train_and_evaluate(X, y)
        print("\nModel Performance:")
        print("Random Forest:")
        print(f"R² Score: {results['random_forest']['r2']:.3f}")
        print(f"Cross-validation Score: {results['random_forest']['cv_mean']:.3f} (±{results['random_forest']['cv_std']:.3f})")
        print("\nXGBoost:")
        print(f"R² Score: {results['xgboost']['r2']:.3f}")
        print(f"Cross-validation Score: {results['xgboost']['cv_mean']:.3f} (±{results['xgboost']['cv_std']:.3f})")
        
        # Save models
        metadata = predictor.save_models('data_science/models', feature_columns)
        print("\nModels saved successfully")
        print(f"Model metadata saved to: {metadata['rf_model_path']}")
        
        return results
        
    except Exception as e:
        print(f"Error during model training: {str(e)}")
        raise

if __name__ == "__main__":
    train_models()
