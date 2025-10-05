"""
Physics-Enhanced ML Prediction System
Integrates 46 astrophysics-based features for habitability prediction
"""

import sys
import os
import numpy as np
import pandas as pd
import joblib
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Add data_science/algorithms to path for physics modules
ALGORITHMS_PATH = Path(__file__).parent.parent.parent.parent / "data_science" / "algorithms"
if str(ALGORITHMS_PATH) not in sys.path:
    sys.path.insert(0, str(ALGORITHMS_PATH))

try:
    from habitability_features import HabitabilityFeatureEngineering, create_all_physics_features
    PHYSICS_AVAILABLE = True
    logger.info("✓ Physics feature engineering modules loaded successfully")
except ImportError as e:
    PHYSICS_AVAILABLE = False
    logger.warning(f"⚠️ Physics modules not available: {e}")

# Models directory
MODELS_DIR = Path(__file__).parent.parent / "models"


class PhysicsEnhancedPredictor:
    """
    ML predictor using physics-based features for habitability assessment.
    
    Features include:
    - Stellar physics (luminosity, HZ boundaries, lifetimes)
    - Atmospheric physics (escape velocity, Jeans parameters)
    - Orbital dynamics (tidal heating, tidal locking)
    - Habitability metrics (ESI, composite scores)
    """
    
    def __init__(self):
        """Initialize the physics-enhanced predictor"""
        self.regression_model = None
        self.classification_model = None
        self.scaler = None
        self.feature_names = []
        self.metadata = {}
        self.engineer = None
        self.models_loaded = False
        
        # Try to load models
        self._load_models()
    
    def _load_models(self):
        """Load trained models and preprocessing components"""
        try:
            # Load regression model
            reg_model_path = MODELS_DIR / "best_habitability_regressor_physics_v2.pkl"
            if reg_model_path.exists():
                self.regression_model = joblib.load(reg_model_path)
                logger.info(f"✓ Loaded regression model: {reg_model_path.name}")
            else:
                logger.warning(f"⚠️ Regression model not found: {reg_model_path}")
            
            # Load classification model
            clf_model_path = MODELS_DIR / "best_habitability_classifier_physics_v2.pkl"
            if clf_model_path.exists():
                self.classification_model = joblib.load(clf_model_path)
                logger.info(f"✓ Loaded classification model: {clf_model_path.name}")
            else:
                logger.warning(f"⚠️ Classification model not found: {clf_model_path}")
            
            # Load scaler
            scaler_path = MODELS_DIR / "feature_scaler_physics_v2.pkl"
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                logger.info(f"✓ Loaded feature scaler: {scaler_path.name}")
            else:
                logger.warning(f"⚠️ Scaler not found: {scaler_path}")
            
            # Load feature names
            feature_names_path = MODELS_DIR / "feature_names_physics_v2.json"
            if feature_names_path.exists():
                with open(feature_names_path, 'r') as f:
                    self.feature_names = json.load(f)
                logger.info(f"✓ Loaded feature names: {len(self.feature_names)} features")
            else:
                logger.warning(f"⚠️ Feature names not found: {feature_names_path}")
            
            # Load metadata
            metadata_path = MODELS_DIR / "model_metadata_physics_v2.json"
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                logger.info(f"✓ Loaded model metadata: version {self.metadata.get('version', 'unknown')}")
            else:
                logger.warning(f"⚠️ Metadata not found: {metadata_path}")
            
            # Initialize physics feature engineer if available
            if PHYSICS_AVAILABLE:
                self.engineer = HabitabilityFeatureEngineering()
                logger.info("✓ Physics feature engineer initialized")
            else:
                logger.warning("⚠️ Physics feature engineer not available")
            
            # Check if all components loaded
            if self.regression_model and self.scaler and self.feature_names and PHYSICS_AVAILABLE:
                self.models_loaded = True
                logger.info("✅ All model components loaded successfully")
            else:
                logger.warning("⚠️ Some model components missing")
                
        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            self.models_loaded = False
    
    def generate_physics_features(self, planet_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate 46 physics-based features from input planet parameters.
        
        Args:
            planet_data: Dictionary with planet parameters (radius, mass, period, etc.)
        
        Returns:
            Dictionary with all physics features
        """
        if not PHYSICS_AVAILABLE or not self.engineer:
            logger.error("Physics feature generation not available")
            return {}
        
        try:
            # Create a DataFrame with single row
            df = pd.DataFrame([planet_data])
            
            # Generate physics features
            physics_features = create_all_physics_features(df)
            
            # Convert to dictionary
            if len(physics_features) > 0:
                features_dict = physics_features.iloc[0].to_dict()
                return features_dict
            else:
                logger.warning("No physics features generated")
                return {}
                
        except Exception as e:
            logger.error(f"Error generating physics features: {e}")
            return {}
    
    def predict_habitability(self, planet_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict habitability score and classification for a planet.
        
        Args:
            planet_data: Dictionary with planet parameters
        
        Returns:
            Dictionary with predictions, confidence, and detailed scores
        """
        if not self.models_loaded:
            logger.error("Models not loaded properly")
            return {
                "error": "Models not loaded",
                "habitability_score": 0.0,
                "habitability_class": "Unknown",
                "confidence": 0.0
            }
        
        try:
            # Generate physics features
            logger.info(f"Generating physics features for: {planet_data.get('name', 'Unknown')}")
            physics_features = self.generate_physics_features(planet_data)
            
            if not physics_features:
                logger.error("Failed to generate physics features")
                return {
                    "error": "Physics feature generation failed",
                    "habitability_score": 0.0,
                    "habitability_class": "Unknown",
                    "confidence": 0.0
                }
            
            # Extract features in correct order
            feature_values = []
            missing_features = []
            
            for feat_name in self.feature_names:
                if feat_name in physics_features:
                    val = physics_features[feat_name]
                    # Handle boolean and categorical
                    if isinstance(val, bool):
                        val = int(val)
                    elif isinstance(val, str):
                        # Map planet type categories to ordinal
                        type_mapping = {
                            'Super-Earth': 3, 'Earth-like': 4,
                            'Sub-Earth': 2, 'Gas Giant': 0, 'Ice Giant': 1
                        }
                        val = type_mapping.get(val, 0)
                    feature_values.append(val)
                else:
                    missing_features.append(feat_name)
                    feature_values.append(0.0)  # Default value
            
            if missing_features:
                logger.warning(f"Missing features (filled with defaults): {missing_features[:5]}...")
            
            # Convert to numpy array and reshape
            X = np.array(feature_values).reshape(1, -1)
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Make predictions
            # Regression: continuous habitability score
            habitability_score = float(self.regression_model.predict(X_scaled)[0])
            habitability_score = np.clip(habitability_score, 0.0, 1.0)  # Ensure [0, 1]
            
            # Classification: habitable or not
            if self.classification_model:
                habitable_class = int(self.classification_model.predict(X_scaled)[0])
                try:
                    # Get probability if available
                    proba = self.classification_model.predict_proba(X_scaled)[0]
                    confidence = float(proba[habitable_class])
                except:
                    confidence = 0.75  # Default confidence
            else:
                habitable_class = 1 if habitability_score > 0.5 else 0
                confidence = abs(habitability_score - 0.5) * 2  # Distance from threshold
            
            # Classify habitability
            if habitability_score > 0.7:
                hab_classification = "Highly Habitable"
            elif habitability_score > 0.5:
                hab_classification = "Potentially Habitable"
            elif habitability_score > 0.3:
                hab_classification = "Marginally Habitable"
            else:
                hab_classification = "Not Habitable"
            
            # Build detailed scores from physics features
            detailed_scores = {
                "composite_habitability": physics_features.get('composite_habitability_score', habitability_score),
                "earth_similarity_index": physics_features.get('earth_similarity_index', 0.0),
                "hz_placement_score": physics_features.get('hz_placement_score', 0.0),
                "atmospheric_retention": physics_features.get('atmospheric_retention_score', 0.0),
                "in_habitable_zone": bool(physics_features.get('in_habitable_zone', False)),
                "likely_tidally_locked": bool(physics_features.get('likely_tidally_locked', False)),
                "planet_type": physics_features.get('planet_type_category', 'Unknown'),
                "equilibrium_temp_kelvin": physics_features.get('equilibrium_temp_kelvin', 0.0),
                "stellar_lifetime_gyr": physics_features.get('stellar_lifetime_gyr', 0.0)
            }
            
            result = {
                "habitability_score": float(habitability_score * 100),  # Scale to 0-100
                "habitability_class": hab_classification,
                "habitable_binary": bool(habitable_class),
                "confidence": float(confidence * 100),  # Scale to 0-100
                "detailed_scores": detailed_scores,
                "physics_features": {
                    k: float(v) if isinstance(v, (int, float, np.number)) else v
                    for k, v in physics_features.items()
                    if k in self.feature_names[:10]  # Top 10 features
                },
                "ml_model_info": {
                    "version": self.metadata.get('version', '2.0_physics_enhanced'),
                    "regression_model": self.metadata.get('regression_model', {}).get('type', 'XGBoost'),
                    "features_count": len(self.feature_names),
                    "physics_based": True
                }
            }
            
            logger.info(f"✓ Prediction completed: {hab_classification} ({habitability_score:.3f})")
            return result
            
        except Exception as e:
            logger.error(f"Error in prediction: {e}", exc_info=True)
            return {
                "error": str(e),
                "habitability_score": 0.0,
                "habitability_class": "Error",
                "confidence": 0.0
            }
    
    def batch_predict(self, planets_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Predict habitability for multiple planets.
        
        Args:
            planets_data: List of planet parameter dictionaries
        
        Returns:
            List of prediction results
        """
        results = []
        for planet_data in planets_data:
            result = self.predict_habitability(planet_data)
            result['planet_name'] = planet_data.get('name', planet_data.get('pl_name', 'Unknown'))
            results.append(result)
        
        return results
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models and features"""
        return {
            "models_loaded": self.models_loaded,
            "physics_available": PHYSICS_AVAILABLE,
            "feature_count": len(self.feature_names),
            "metadata": self.metadata,
            "feature_names": self.feature_names,
            "version": self.metadata.get('version', 'unknown')
        }


# Global predictor instance
_predictor = None


def get_predictor() -> PhysicsEnhancedPredictor:
    """Get or create the global predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = PhysicsEnhancedPredictor()
    return _predictor


# Example usage
if __name__ == "__main__":
    # Test the predictor
    predictor = PhysicsEnhancedPredictor()
    
    # Example planet data (Earth-like)
    test_planet = {
        "name": "Test Planet",
        "pl_radj": 0.091,  # Earth radius in Jupiter radii
        "pl_bmassj": 0.003,  # Earth mass in Jupiter masses
        "pl_orbper": 365.25,  # Earth orbital period
        "pl_orbsmax": 1.0,  # 1 AU
        "st_teff": 5778,  # Sun temperature
        "st_mass": 1.0,  # Solar mass
        "st_rad": 1.0,  # Solar radius
        "sy_dist": 10.0  # 10 parsecs
    }
    
    print("🧪 Testing Physics-Enhanced Predictor")
    print("=" * 60)
    
    result = predictor.predict_habitability(test_planet)
    
    print(f"\n✓ Prediction Result:")
    print(f"   • Habitability Score: {result['habitability_score']:.1f}/100")
    print(f"   • Classification: {result['habitability_class']}")
    print(f"   • Confidence: {result['confidence']:.1f}%")
    print(f"   • In HZ: {result['detailed_scores']['in_habitable_zone']}")
    print(f"   • ESI: {result['detailed_scores']['earth_similarity_index']:.3f}")
    print(f"\n✅ Test completed successfully!")
