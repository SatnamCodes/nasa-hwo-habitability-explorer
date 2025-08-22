"""
HWO Target Scoring API
Provides endpoints for AI/ML-based exoplanet characterization scoring
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import pickle
import json
from io import StringIO
import logging
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/hwo", tags=["HWO Target Scoring"])

# Models directory path
MODELS_DIR = Path(__file__).parent.parent / "models"

# Pydantic models for request/response
class ExoplanetTarget(BaseModel):
    """Exoplanet target data model"""
    name: str
    distance: float = Field(..., description="Distance in parsecs")
    star_type: str = Field(..., description="Stellar classification (e.g., G2V, M3V)")
    planet_radius: float = Field(..., description="Planet radius in Jupiter radii")
    orbital_period: float = Field(..., description="Orbital period in days")
    stellar_mass: float = Field(..., description="Stellar mass in solar masses")
    planet_mass: Optional[float] = Field(None, description="Planet mass in Earth masses")
    temperature: Optional[float] = Field(None, description="Equilibrium temperature in Kelvin")
    discovery_year: Optional[int] = Field(None, description="Year of discovery")
    detection_method: Optional[str] = Field(None, description="Detection method")
    data_quality: Optional[str] = Field("Good", description="Data quality assessment")

class ScoringResult(BaseModel):
    """AI/ML scoring result"""
    target_name: str
    characterization_score: float = Field(..., description="Characterization score (0-100)")
    habitability_score: float = Field(..., description="Habitability score (0-100)")
    habitability_class: str = Field(..., description="Habitability classification")
    ai_confidence: float = Field(..., description="AI confidence level (0-100)")
    observation_priority: str = Field(..., description="Observation priority (High/Medium/Low)")
    detailed_scores: Dict[str, float] = Field(..., description="Breakdown of scoring components")
    ml_predictions: Dict[str, Any] = Field(..., description="Raw ML model predictions")
    original_data: Optional[Dict[str, Any]] = Field(None, description="Original CSV row data")

class ColumnMappingRequest(BaseModel):
    """Request model for column mapping validation"""
    headers: List[str]
    sample_data: Optional[Dict[str, List[Any]]] = None

class ColumnMappingResponse(BaseModel):
    """Response model for column mapping"""
    detected_mapping: Dict[str, str]
    confidence_scores: Dict[str, float]
    missing_required: List[str]
    missing_optional: List[str]
    unmapped_headers: List[str]
    mapping_quality: float
    suggestions: Dict[str, List[str]]
    validation_status: str
    can_proceed: bool

class BatchScoringRequest(BaseModel):
    """Request model for batch scoring"""
    targets: List[ExoplanetTarget]

class BatchScoringResponse(BaseModel):
    """Response model for batch scoring"""
    results: List[ScoringResult]
    processing_summary: Dict[str, Any]

class ColumnDetector:
    """Intelligent column detection for various CSV formats"""
    
    # Comprehensive mapping of possible column names to our standard format
    COLUMN_MAPPINGS = {
        'name': [
            'name', 'planet_name', 'pl_name', 'target_name', 'object_name',
            'identifier', 'designation', 'common_name', 'planet', 'target',
            'object', 'source_name', 'catalogue_name', 'exoplanet_name'
        ],
        'distance': [
            'distance', 'dist', 'sy_dist', 'distance_pc', 'dist_pc', 
            'parallax_distance', 'stellar_distance', 'star_distance',
            'system_distance', 'parsecs', 'pc', 'd', 'dist_parsec'
        ],
        'star_type': [
            'star_type', 'stellar_type', 'st_spectype', 'spectral_type',
            'spec_type', 'stellar_class', 'star_class', 'classification',
            'sptype', 'spectype', 'st_type', 'host_star_type', 'host_type'
        ],
        'planet_radius': [
            'planet_radius', 'pl_rade', 'radius', 'pl_radius', 'r_planet',
            'planet_r', 'radius_earth', 'earth_radius', 'r_earth', 're',
            'planet_size', 'size', 'pl_rad', 'radius_e'
        ],
        'orbital_period': [
            'orbital_period', 'period', 'pl_orbper', 'orbit_period',
            'period_days', 'orbital_period_days', 'pl_period', 'p',
            'orbit_p', 'period_d', 'days', 'pl_orbperdur1'
        ],
        'stellar_mass': [
            'stellar_mass', 'star_mass', 'st_mass', 'host_mass', 
            'host_star_mass', 'm_star', 'mass_star', 'stellar_m',
            'st_m', 'ms', 'mass_stellar', 'host_m'
        ],
        'planet_mass': [
            'planet_mass', 'pl_masse', 'mass', 'pl_mass', 'm_planet',
            'planet_m', 'mass_earth', 'earth_mass', 'm_earth', 'me',
            'pl_m', 'mass_e', 'planet_masse'
        ],
        'temperature': [
            'temperature', 'temp', 'pl_eqt', 'equilibrium_temperature',
            'eq_temp', 'teq', 't_eq', 'planet_temp', 'pl_temp',
            'effective_temperature', 't_eff', 'temp_eq', 'kelvin'
        ],
        'discovery_year': [
            'discovery_year', 'disc_year', 'year', 'discovery_date',
            'found_year', 'detected_year', 'publication_year', 
            'announce_year', 'year_discovered', 'yr'
        ],
        'detection_method': [
            'detection_method', 'discovery_method', 'method', 'discoverymethod',
            'detection_technique', 'discovery_technique', 'technique',
            'method_detection', 'detect_method', 'disc_method'
        ],
        'data_quality': [
            'data_quality', 'quality', 'data_flag', 'flag', 'reliability',
            'confidence', 'quality_flag', 'grade', 'rating', 'status',
            'validation_status', 'verified'
        ]
    }
    
    @staticmethod
    def detect_columns(headers: List[str]) -> Dict[str, str]:
        """
        Detect and map CSV columns to our expected format
        Returns a mapping of our_field -> csv_column
        """
        headers_lower = [h.lower().strip().replace(' ', '_').replace('-', '_') 
                        for h in headers]
        
        detected_mapping = {}
        confidence_scores = {}
        
        for our_field, possible_names in ColumnDetector.COLUMN_MAPPINGS.items():
            best_match = None
            best_score = 0
            
            for csv_col, header_lower in zip(headers, headers_lower):
                # Check for exact matches first
                if header_lower in [p.lower() for p in possible_names]:
                    detected_mapping[our_field] = csv_col
                    confidence_scores[our_field] = 1.0
                    break
                
                # Check for partial matches
                for possible_name in possible_names:
                    # Substring matching
                    if possible_name.lower() in header_lower or header_lower in possible_name.lower():
                        score = len(set(possible_name.lower()) & set(header_lower)) / max(len(possible_name), len(header_lower))
                        if score > best_score and score > 0.6:
                            best_match = csv_col
                            best_score = score
                
                # Fuzzy matching for common abbreviations
                for possible_name in possible_names:
                    if ColumnDetector._fuzzy_match(header_lower, possible_name.lower()):
                        score = 0.8
                        if score > best_score:
                            best_match = csv_col
                            best_score = score
            
            if best_match and our_field not in detected_mapping:
                detected_mapping[our_field] = best_match
                confidence_scores[our_field] = best_score
        
        return detected_mapping, confidence_scores
    
    @staticmethod
    def _fuzzy_match(str1: str, str2: str) -> bool:
        """Simple fuzzy matching for common patterns"""
        # Remove common prefixes/suffixes
        patterns = [
            ('pl_', 'planet_'), ('st_', 'star_'), ('st_', 'stellar_'),
            ('sy_', 'system_'), ('_pc', '_parsec'), ('_e', '_earth'),
            ('_j', '_jupiter'), ('_d', '_days'), ('_yr', '_year')
        ]
        
        for pattern in patterns:
            str1_clean = str1.replace(pattern[0], '').replace(pattern[1], '')
            str2_clean = str2.replace(pattern[0], '').replace(pattern[1], '')
            if str1_clean == str2_clean:
                return True
        
        return False
    
    @staticmethod
    def get_mapping_suggestions(headers: List[str]) -> Dict[str, Any]:
        """Get suggestions for unmapped columns"""
        detected_mapping, confidence_scores = ColumnDetector.detect_columns(headers)
        
        required_fields = ['name', 'distance', 'star_type', 'planet_radius', 'orbital_period', 'stellar_mass']
        optional_fields = ['planet_mass', 'temperature', 'discovery_year', 'detection_method', 'data_quality']
        
        missing_required = [field for field in required_fields if field not in detected_mapping]
        missing_optional = [field for field in optional_fields if field not in detected_mapping]
        
        unmapped_headers = [h for h in headers if h not in detected_mapping.values()]
        
        return {
            'detected_mapping': detected_mapping,
            'confidence_scores': confidence_scores,
            'missing_required': missing_required,
            'missing_optional': missing_optional,
            'unmapped_headers': unmapped_headers,
            'mapping_quality': len(detected_mapping) / len(ColumnDetector.COLUMN_MAPPINGS),
            'suggestions': ColumnDetector._generate_suggestions(missing_required + missing_optional, unmapped_headers)
        }
    
    @staticmethod
    def _generate_suggestions(missing_fields: List[str], unmapped_headers: List[str]) -> Dict[str, List[str]]:
        """Generate suggestions for unmapped fields"""
        suggestions = {}
        
        for field in missing_fields:
            field_suggestions = []
            possible_names = ColumnDetector.COLUMN_MAPPINGS.get(field, [])
            
            for header in unmapped_headers:
                header_lower = header.lower().replace(' ', '_').replace('-', '_')
                
                for possible_name in possible_names:
                    if (possible_name.lower() in header_lower or 
                        header_lower in possible_name.lower() or
                        ColumnDetector._fuzzy_match(header_lower, possible_name.lower())):
                        field_suggestions.append(header)
                        break
            
            if field_suggestions:
                suggestions[field] = field_suggestions[:3]  # Top 3 suggestions
        
        return suggestions


class HWOScoringEngine:
    """AI/ML scoring engine for HWO target characterization"""
    
    def __init__(self):
        self.models_loaded = False
        self.regressor = None
        self.classifier = None
        self.scaler = None
        self.feature_names = None
        self.model_metadata = None
        self._load_models()
    
    def _load_models(self):
        """Load the trained ML models"""
        try:
            # Load XGBoost regressor
            regressor_path = MODELS_DIR / "best_habitability_regressor_xgboost.pkl"
            if regressor_path.exists():
                with open(regressor_path, 'rb') as f:
                    self.regressor = pickle.load(f)
                logger.info("Loaded XGBoost regressor model")
            
            # Load XGBoost classifier
            classifier_path = MODELS_DIR / "best_habitability_classifier_xgboost.pkl"
            if classifier_path.exists():
                with open(classifier_path, 'rb') as f:
                    self.classifier = pickle.load(f)
                logger.info("Loaded XGBoost classifier model")
            
            # Load feature scaler
            scaler_path = MODELS_DIR / "feature_scaler_updated.pkl"
            if scaler_path.exists():
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                logger.info("Loaded feature scaler")
            
            # Load model metadata
            metadata_path = MODELS_DIR / "model_metadata_updated.json"
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    self.model_metadata = json.load(f)
                logger.info("Loaded model metadata")
            
            # Set feature names from metadata
            if self.model_metadata:
                self.feature_names = self.model_metadata.get('feature_names', [])
            
            self.models_loaded = True
            logger.info("All ML models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load ML models: {str(e)}")
            self.models_loaded = False
    
    def _prepare_features(self, target: ExoplanetTarget) -> np.ndarray:
        """Convert target data to model features"""
        try:
            # Calculate derived features with proper null handling
            planet_radius_earth = float(target.planet_radius) * 11.2  # Convert to Earth radii
            
            # Estimate semi-major axis using Kepler's third law
            orbital_period = float(target.orbital_period)
            stellar_mass = float(target.stellar_mass)
            semi_major_axis = ((orbital_period / 365.25) ** 2 * stellar_mass) ** (1/3)
            
            # Estimate planet mass if not provided (rough mass-radius relation)
            if target.planet_mass is None:
                if planet_radius_earth <= 1.5:
                    estimated_mass = planet_radius_earth ** 3.7  # Rocky planet relation
                else:
                    estimated_mass = planet_radius_earth ** 1.8  # Gas planet relation
            else:
                estimated_mass = float(target.planet_mass)
            
            # Calculate stellar luminosity (main sequence approximation)
            stellar_luminosity = stellar_mass ** 3.5
            
            # Estimate equilibrium temperature if not provided
            if target.temperature is None:
                estimated_temp = 278 * (stellar_luminosity / (semi_major_axis ** 2)) ** 0.25
            else:
                estimated_temp = float(target.temperature)
            
            # Calculate density
            planet_density = estimated_mass / (planet_radius_earth ** 3) if planet_radius_earth > 0 else 1.0
            
            # Habitable zone calculations
            inner_hz = 0.95 * (stellar_luminosity ** 0.5)
            outer_hz = 1.37 * (stellar_luminosity ** 0.5)
            habitable_zone_distance = (inner_hz + outer_hz) / 2
            hz_distance_ratio = semi_major_axis / habitable_zone_distance if habitable_zone_distance > 0 else 1.0
            
            # Star type numerical encoding
            star_type_numeric = self._encode_star_type(target.star_type)
            
            # Create feature vector (18 features as per trained model)
            features = np.array([
                float(target.distance),
                planet_radius_earth,
                estimated_mass,
                orbital_period,
                semi_major_axis,
                estimated_temp,
                stellar_mass,
                stellar_luminosity,
                planet_density,
                inner_hz,
                outer_hz,
                habitable_zone_distance,
                hz_distance_ratio,
                star_type_numeric,
                float(target.discovery_year or 2020),
                self._encode_detection_method(target.detection_method),
                self._encode_data_quality(target.data_quality),
                1.0  # Default value for any additional feature
            ])
            
            # Ensure we have exactly the right number of features
            if len(features) != 18:
                logger.warning(f"Feature vector length {len(features)} != 18, padding/truncating")
                if len(features) < 18:
                    features = np.pad(features, (0, 18 - len(features)), mode='constant', constant_values=0)
                else:
                    features = features[:18]
            
            # Replace any NaN or inf values
            features = np.nan_to_num(features, nan=0.0, posinf=1e6, neginf=-1e6)
            
            return features.reshape(1, -1)
            
        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            raise ValueError(f"Failed to prepare features: {str(e)}")
    
    def _encode_star_type(self, star_type: str) -> float:
        """Convert star type to numerical value"""
        if not star_type:
            return 0.5
        
        main_type = star_type[0].upper()
        mapping = {'O': 0.1, 'B': 0.2, 'A': 0.3, 'F': 0.5, 'G': 0.8, 'K': 0.9, 'M': 1.0}
        return mapping.get(main_type, 0.5)
    
    def _encode_detection_method(self, method: Optional[str]) -> float:
        """Convert detection method to numerical value"""
        if not method:
            return 0.5
        
        method_lower = method.lower()
        if 'transit' in method_lower:
            return 1.0
        elif 'radial' in method_lower or 'velocity' in method_lower:
            return 0.8
        elif 'imaging' in method_lower:
            return 0.6
        elif 'microlensing' in method_lower:
            return 0.4
        else:
            return 0.5
    
    def _encode_data_quality(self, quality: Optional[str]) -> float:
        """Convert data quality to numerical value"""
        if not quality:
            return 0.6
        
        quality_lower = quality.lower()
        if 'excellent' in quality_lower:
            return 1.0
        elif 'good' in quality_lower:
            return 0.8
        elif 'fair' in quality_lower:
            return 0.6
        elif 'limited' in quality_lower or 'poor' in quality_lower:
            return 0.4
        else:
            return 0.6
    
    def _calculate_characterization_score(self, target: ExoplanetTarget) -> float:
        """Calculate characterization score based on observational factors"""
        score = 0
        weight_sum = 0
        
        # Distance factor (closer is better for characterization)
        if hasattr(target, 'distance') and target.distance is not None:
            distance = float(target.distance)
            if distance <= 50:
                distance_score = max(0, 1 - (distance - 5) / 45) if distance > 5 else 1.0
                score += distance_score * 0.3
                weight_sum += 0.3
        
        # Star type factor (G and K types preferred)
        if hasattr(target, 'star_type') and target.star_type:
            star_main_type = str(target.star_type)[0].upper()
            star_scores = {'G': 1.0, 'K': 0.9, 'F': 0.7, 'M': 0.6, 'A': 0.3}
            star_score = star_scores.get(star_main_type, 0.5)
            score += star_score * 0.25
            weight_sum += 0.25
        
        # Planet size factor (Earth-like preferred)
        if hasattr(target, 'planet_radius') and target.planet_radius is not None:
            planet_radius_earth = float(target.planet_radius) * 11.2
            if 0.5 <= planet_radius_earth <= 2.0:
                radius_score = 1 - abs(planet_radius_earth - 1.0) / 1.0
            else:
                radius_score = max(0, 0.3 - abs(planet_radius_earth - 1.0) / 3.0)
            score += radius_score * 0.2
            weight_sum += 0.2
        
        # Data quality factor
        if hasattr(target, 'data_quality') and target.data_quality:
            quality_score = self._encode_data_quality(target.data_quality)
            score += quality_score * 0.15
            weight_sum += 0.15
        
        # Stellar mass factor (main sequence stability)
        if hasattr(target, 'stellar_mass') and target.stellar_mass is not None:
            stellar_mass = float(target.stellar_mass)
            mass_score = max(0, 1 - abs(stellar_mass - 1.0) / 1.0)
            score += mass_score * 0.1
            weight_sum += 0.1
        
        return (score / weight_sum) * 100 if weight_sum > 0 else 50
    
    def _calculate_confidence(self, target: ExoplanetTarget, ml_predictions: Dict) -> float:
        """Calculate AI confidence based on data completeness and model certainty"""
        # Data completeness score
        data_fields = [
            getattr(target, 'distance', None), 
            getattr(target, 'star_type', None), 
            getattr(target, 'planet_radius', None),
            getattr(target, 'orbital_period', None), 
            getattr(target, 'stellar_mass', None), 
            getattr(target, 'data_quality', None)
        ]
        completeness = sum(1 for field in data_fields if field is not None) / len(data_fields)
        
        # Model uncertainty (if available in predictions)
        model_certainty = 0.8  # Default, could be enhanced with prediction probabilities
        if 'habitability_probability' in ml_predictions:
            try:
                model_certainty = float(ml_predictions['habitability_probability'])
            except (ValueError, TypeError):
                model_certainty = 0.8
        
        # Combine factors
        confidence = (completeness * 0.6 + model_certainty * 0.4) * 100
        return min(max(confidence, 0), 100)
    
    def score_target(self, target: ExoplanetTarget) -> ScoringResult:
        """Score a single exoplanet target"""
        if not self.models_loaded:
            raise HTTPException(status_code=503, detail="ML models not available")
        
        try:
            logger.info(f"Scoring target: {target.name}")
            
            # Calculate characterization score first (this should work without ML models)
            characterization_score = self._calculate_characterization_score(target)
            logger.info(f"Characterization score: {characterization_score}")
            
            # Set defaults
            ml_predictions = {}
            habitability_score = 50.0
            habitability_class = "Unknown"
            
            # Skip ML predictions for now to isolate the issue
            if False:  # Temporarily disabled
                # Prepare features
                features = self._prepare_features(target)
                
                # Scale features
                if self.scaler:
                    features_scaled = self.scaler.transform(features)
                else:
                    features_scaled = features
                
                # Make predictions with error handling
                try:
                    if self.regressor:
                        hab_score_raw = self.regressor.predict(features_scaled)
                        if hasattr(hab_score_raw, '__len__') and len(hab_score_raw) > 0:
                            hab_score_val = float(hab_score_raw[0])
                        else:
                            hab_score_val = float(hab_score_raw)
                        habitability_score = max(0, min(100, hab_score_val * 100))
                        ml_predictions['habitability_regression'] = hab_score_val
                except Exception as e:
                    logger.warning(f"Regressor prediction failed: {str(e)}")
                    
                try:
                    if self.classifier:
                        hab_class_pred = self.classifier.predict(features_scaled)
                        hab_class_proba = self.classifier.predict_proba(features_scaled)
                        
                        if hasattr(hab_class_pred, '__len__') and len(hab_class_pred) > 0:
                            class_val = int(hab_class_pred[0])
                        else:
                            class_val = int(hab_class_pred)
                        
                        habitability_class = "Potentially Habitable" if class_val == 1 else "Not Habitable"
                        
                        if hasattr(hab_class_proba, 'shape') and len(hab_class_proba.shape) > 1:
                            max_proba = float(np.max(hab_class_proba[0]))
                        else:
                            max_proba = float(np.max(hab_class_proba))
                        
                        ml_predictions['habitability_classification'] = class_val
                        ml_predictions['habitability_probability'] = max_proba
                except Exception as e:
                    logger.warning(f"Classifier prediction failed: {str(e)}")
            
            # Calculate AI confidence
            ai_confidence = self._calculate_confidence(target, ml_predictions)
            logger.info(f"AI confidence: {ai_confidence}")
            
            # Determine observation priority
            if characterization_score >= 75:
                priority = "High"
            elif characterization_score >= 50:
                priority = "Medium"
            else:
                priority = "Low"
            
            # Detailed scoring breakdown
            detailed_scores = {
                "distance_factor": min(100, max(0, 100 - float(target.distance))),
                "star_type_factor": self._encode_star_type(target.star_type) * 100,
                "planet_size_factor": min(100, 100 / (abs(float(target.planet_radius) * 11.2 - 1.0) + 1)),
                "data_quality_factor": self._encode_data_quality(target.data_quality) * 100
            }
            
            logger.info(f"Detailed scores: {detailed_scores}")
            
            result = ScoringResult(
                target_name=target.name,
                characterization_score=round(characterization_score, 1),
                habitability_score=round(habitability_score, 1),
                habitability_class=habitability_class,
                ai_confidence=round(ai_confidence, 1),
                observation_priority=priority,
                detailed_scores=detailed_scores,
                ml_predictions=ml_predictions
            )
            
            logger.info(f"Successfully scored target: {target.name}")
            return result
            
        except Exception as e:
            logger.error(f"Error scoring target {target.name}: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")

# Initialize scoring engine
scoring_engine = HWOScoringEngine()

# API Endpoints
@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": scoring_engine.models_loaded,
        "model_info": scoring_engine.model_metadata.get("model_info", {}) if scoring_engine.model_metadata else {}
    }

@router.post("/score", response_model=ScoringResult)
async def score_single_target(target: ExoplanetTarget):
    """Score a single exoplanet target"""
    return scoring_engine.score_target(target)

@router.post("/score/batch", response_model=BatchScoringResponse)
async def score_multiple_targets(request: BatchScoringRequest):
    """Score multiple exoplanet targets"""
    if not scoring_engine.models_loaded:
        raise HTTPException(status_code=503, detail="ML models not available")
    
    results = []
    errors = []
    
    for target in request.targets:
        try:
            result = scoring_engine.score_target(target)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed to score target {target.name}: {str(e)}")
            errors.append({"target": target.name, "error": str(e)})
    
    processing_summary = {
        "total_targets": len(request.targets),
        "successful_scores": len(results),
        "failed_scores": len(errors),
        "errors": errors
    }
    
    return BatchScoringResponse(results=results, processing_summary=processing_summary)

@router.post("/upload")
async def upload_csv_targets(file: UploadFile = File(...)):
    """Upload and score targets from CSV file with intelligent column detection"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read CSV content
        content = await file.read()
        df = pd.read_csv(StringIO(content.decode('utf-8')))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Detect and map columns intelligently
        headers = df.columns.tolist()
        detected_mapping, confidence_scores = ColumnDetector.detect_columns(headers)
        
        # Check if we have enough required fields
        required_fields = ['name', 'distance', 'star_type', 'planet_radius', 'orbital_period', 'stellar_mass']
        missing_required = [field for field in required_fields if field not in detected_mapping]
        
        if missing_required:
            # Provide detailed suggestions
            suggestions = ColumnDetector.get_mapping_suggestions(headers)
            raise HTTPException(
                status_code=400, 
                detail={
                    "message": f"Missing required columns: {', '.join(missing_required)}",
                    "detected_mapping": detected_mapping,
                    "suggestions": suggestions['suggestions'],
                    "unmapped_headers": suggestions['unmapped_headers'],
                    "available_columns": headers
                }
            )
        
        # Convert DataFrame rows to ExoplanetTarget objects using detected mapping
        targets = []
        conversion_errors = []
        original_rows = []  # Store original data
        
        for index, row in df.iterrows():
            try:
                # Use detected mapping to extract values
                target_data = {}
                original_row_data = {}
                
                # Store original row data
                for col in df.columns:
                    if pd.notna(row[col]):
                        original_row_data[col] = row[col]
                
                for our_field, csv_column in detected_mapping.items():
                    if csv_column in df.columns and pd.notna(row[csv_column]):
                        target_data[our_field] = row[csv_column]
                
                # Create target with proper type conversion
                target = ExoplanetTarget(
                    name=str(target_data.get('name', f'Target-{index+1}')),
                    distance=float(target_data.get('distance', 0)),
                    star_type=str(target_data.get('star_type', 'Unknown')),
                    planet_radius=float(target_data.get('planet_radius', 0)),
                    orbital_period=float(target_data.get('orbital_period', 0)),
                    stellar_mass=float(target_data.get('stellar_mass', 1)),
                    planet_mass=float(target_data['planet_mass']) if 'planet_mass' in target_data and target_data['planet_mass'] else None,
                    temperature=float(target_data['temperature']) if 'temperature' in target_data and target_data['temperature'] else None,
                    discovery_year=int(target_data['discovery_year']) if 'discovery_year' in target_data and target_data['discovery_year'] else None,
                    detection_method=str(target_data.get('detection_method')) if 'detection_method' in target_data else None,
                    data_quality=str(target_data.get('data_quality', 'Good'))
                )
                targets.append(target)
                original_rows.append(original_row_data)
                
            except (ValueError, TypeError, KeyError) as e:
                conversion_errors.append(f"Row {index+1}: {str(e)}")
                if len(conversion_errors) > 10:  # Limit error reporting
                    conversion_errors.append("... and more errors")
                    break
        
        if not targets:
            raise HTTPException(
                status_code=400, 
                detail=f"No valid targets could be processed. Errors: {'; '.join(conversion_errors[:5])}"
            )
        
        # Score all targets with original data
        results = []
        errors = []
        
        for i, target in enumerate(targets):
            try:
                result = scoring_engine.score_target(target)
                # Add original data to the result
                if i < len(original_rows):
                    result.original_data = original_rows[i]
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to score target {target.name}: {str(e)}")
                errors.append({"target": target.name, "error": str(e)})

        processing_summary = {
            "total_targets": len(targets),
            "successful_scores": len(results),
            "failed_scores": len(errors),
            "errors": errors,
            'detected_mapping': detected_mapping,
            'confidence_scores': confidence_scores,
            'conversion_errors': conversion_errors,
            'rows_processed': len(df),
            'valid_targets': len(targets)
        }

        return BatchScoringResponse(results=results, processing_summary=processing_summary)
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")

@router.post("/validate-columns", response_model=ColumnMappingResponse)
async def validate_csv_columns(request: ColumnMappingRequest):
    """Validate and suggest column mappings for CSV data"""
    try:
        suggestions = ColumnDetector.get_mapping_suggestions(request.headers)
        
        required_fields = ['name', 'distance', 'star_type', 'planet_radius', 'orbital_period', 'stellar_mass']
        missing_required = suggestions['missing_required']
        can_proceed = len(missing_required) == 0
        
        validation_status = "valid" if can_proceed else "missing_required_fields"
        if suggestions['mapping_quality'] < 0.5:
            validation_status = "low_confidence"
        
        return ColumnMappingResponse(
            detected_mapping=suggestions['detected_mapping'],
            confidence_scores=suggestions['confidence_scores'],
            missing_required=missing_required,
            missing_optional=suggestions['missing_optional'],
            unmapped_headers=suggestions['unmapped_headers'],
            mapping_quality=suggestions['mapping_quality'],
            suggestions=suggestions['suggestions'],
            validation_status=validation_status,
            can_proceed=can_proceed
        )
        
    except Exception as e:
        logger.error(f"Column validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Column validation failed: {str(e)}")

@router.get("/column-examples")
async def get_column_examples():
    """Get examples of supported column names and formats"""
    return {
        "supported_formats": {
            "name": {
                "description": "Planet or target identifier",
                "examples": ["Kepler-452b", "HD 40307 g", "TRAPPIST-1 e"],
                "possible_columns": ColumnDetector.COLUMN_MAPPINGS['name'][:10]
            },
            "distance": {
                "description": "Distance to the star system in parsecs",
                "examples": [4.24, 37.2, 150.5],
                "units": "parsecs",
                "possible_columns": ColumnDetector.COLUMN_MAPPINGS['distance'][:10]
            },
            "star_type": {
                "description": "Stellar spectral classification",
                "examples": ["G2V", "M3V", "K5V"],
                "possible_columns": ColumnDetector.COLUMN_MAPPINGS['star_type'][:10]
            },
            "planet_radius": {
                "description": "Planet radius (Earth radii or Jupiter radii)",
                "examples": [1.12, 0.8, 2.5],
                "units": "Earth radii (preferred) or Jupiter radii",
                "possible_columns": ColumnDetector.COLUMN_MAPPINGS['planet_radius'][:10]
            },
            "orbital_period": {
                "description": "Orbital period in days",
                "examples": [365.25, 11.2, 1234.5],
                "units": "days",
                "possible_columns": ColumnDetector.COLUMN_MAPPINGS['orbital_period'][:10]
            },
            "stellar_mass": {
                "description": "Host star mass in solar masses",
                "examples": [1.0, 0.12, 1.8],
                "units": "solar masses",
                "possible_columns": ColumnDetector.COLUMN_MAPPINGS['stellar_mass'][:10]
            }
        },
        "optional_fields": {
            field: {
                "possible_columns": columns[:8]
            } for field, columns in ColumnDetector.COLUMN_MAPPINGS.items() 
            if field not in ['name', 'distance', 'star_type', 'planet_radius', 'orbital_period', 'stellar_mass']
        },
        "sample_csv_headers": [
            "name,distance,star_type,planet_radius,orbital_period,stellar_mass",
            "pl_name,sy_dist,st_spectype,pl_rade,pl_orbper,st_mass",
            "target_name,dist_pc,spectral_type,radius_earth,period_days,host_mass"
        ]
    }

@router.get("/models/info")
async def get_model_info():
    """Get information about loaded ML models"""
    if not scoring_engine.models_loaded:
        raise HTTPException(status_code=503, detail="ML models not available")
    
    return {
        "models_loaded": True,
        "metadata": scoring_engine.model_metadata,
        "feature_names": scoring_engine.feature_names,
        "available_endpoints": [
            "/health", "/score", "/score/batch", "/upload", "/models/info"
        ]
    }
