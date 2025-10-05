"""
Enhanced HWO Scoring API Endpoints with Physics-Based ML
Integrates 46 astrophysics features for accurate habitability prediction
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import logging
from io import StringIO

from .physics_predictor import get_predictor

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/hwo-enhanced", tags=["HWO Physics-Enhanced Scoring"])


# Pydantic models
class PlanetInput(BaseModel):
    """Input model for planet parameters"""
    name: Optional[str] = Field("Unknown", description="Planet name")
    pl_radj: Optional[float] = Field(None, description="Planet radius (Jupiter radii)")
    pl_rade: Optional[float] = Field(None, description="Planet radius (Earth radii)")
    pl_bmassj: Optional[float] = Field(None, description="Planet mass (Jupiter masses)")
    pl_bmasse: Optional[float] = Field(None, description="Planet mass (Earth masses)")
    pl_orbper: Optional[float] = Field(None, description="Orbital period (days)")
    pl_orbsmax: Optional[float] = Field(None, description="Semi-major axis (AU)")
    st_teff: Optional[float] = Field(5778, description="Stellar temperature (K)")
    st_mass: Optional[float] = Field(1.0, description="Stellar mass (solar masses)")
    st_rad: Optional[float] = Field(1.0, description="Stellar radius (solar radii)")
    sy_dist: Optional[float] = Field(10.0, description="System distance (parsecs)")


class HabitabilityPrediction(BaseModel):
    """Output model for habitability prediction"""
    planet_name: str
    habitability_score: float = Field(..., description="Habitability score (0-100)")
    habitability_class: str = Field(..., description="Classification (Highly/Potentially/Marginally/Not Habitable)")
    habitable_binary: bool = Field(..., description="Binary habitable classification")
    confidence: float = Field(..., description="Prediction confidence (0-100)")
    detailed_scores: Dict[str, Any] = Field(..., description="Detailed physics-based scores")
    physics_features: Dict[str, Any] = Field(..., description="Sample of physics features")
    ml_model_info: Dict[str, Any] = Field(..., description="Model metadata")


class BatchPredictionRequest(BaseModel):
    """Request for batch prediction"""
    planets: List[PlanetInput]


class BatchPredictionResponse(BaseModel):
    """Response for batch prediction"""
    predictions: List[HabitabilityPrediction]
    summary: Dict[str, Any]


@router.post("/predict/single", response_model=HabitabilityPrediction)
async def predict_single_planet(planet: PlanetInput):
    """
    Predict habitability for a single planet using physics-enhanced ML.
    
    This endpoint uses 46 astrophysics-based features including:
    - Stellar physics (luminosity, habitable zone boundaries, stellar lifetimes)
    - Atmospheric physics (escape velocity, Jeans parameters, scale heights)
    - Orbital dynamics (tidal heating, tidal locking timescales)
    - Habitability metrics (Earth Similarity Index, composite scores)
    
    Returns comprehensive habitability assessment with confidence scores.
    """
    try:
        predictor = get_predictor()
        
        if not predictor.models_loaded:
            raise HTTPException(
                status_code=503,
                detail="Physics-enhanced models not loaded. Please ensure models are trained and exported."
            )
        
        # Convert Pydantic model to dict
        planet_data = planet.dict()
        
        # Convert Earth radii to Jupiter radii if needed
        if planet_data.get('pl_rade') and not planet_data.get('pl_radj'):
            planet_data['pl_radj'] = planet_data['pl_rade'] / 11.2
        
        # Convert Earth masses to Jupiter masses if needed
        if planet_data.get('pl_bmasse') and not planet_data.get('pl_bmassj'):
            planet_data['pl_bmassj'] = planet_data['pl_bmasse'] / 317.8
        
        # Make prediction
        result = predictor.predict_habitability(planet_data)
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        result['planet_name'] = planet.name or "Unknown"
        
        return HabitabilityPrediction(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in single planet prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch_planets(request: BatchPredictionRequest):
    """
    Predict habitability for multiple planets using physics-enhanced ML.
    
    Efficiently processes multiple planets in a single request.
    Returns predictions and summary statistics.
    """
    try:
        predictor = get_predictor()
        
        if not predictor.models_loaded:
            raise HTTPException(
                status_code=503,
                detail="Physics-enhanced models not loaded."
            )
        
        # Convert all planets to dicts
        planets_data = []
        for planet in request.planets:
            planet_data = planet.dict()
            
            # Unit conversions
            if planet_data.get('pl_rade') and not planet_data.get('pl_radj'):
                planet_data['pl_radj'] = planet_data['pl_rade'] / 11.2
            if planet_data.get('pl_bmasse') and not planet_data.get('pl_bmassj'):
                planet_data['pl_bmassj'] = planet_data['pl_bmasse'] / 317.8
            
            planets_data.append(planet_data)
        
        # Batch prediction
        results = predictor.batch_predict(planets_data)
        
        # Calculate summary statistics
        habitable_count = sum(1 for r in results if r.get('habitable_binary', False))
        avg_score = sum(r.get('habitability_score', 0) for r in results) / len(results)
        avg_confidence = sum(r.get('confidence', 0) for r in results) / len(results)
        
        summary = {
            "total_planets": len(results),
            "habitable_count": habitable_count,
            "habitable_percentage": (habitable_count / len(results) * 100) if results else 0,
            "average_habitability_score": avg_score,
            "average_confidence": avg_confidence,
            "physics_features_used": predictor.metadata.get('physics_features', {}).get('count', 46)
        }
        
        # Convert results to Pydantic models
        predictions = [HabitabilityPrediction(**r) for r in results]
        
        return BatchPredictionResponse(predictions=predictions, summary=summary)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")


@router.post("/predict/csv", response_model=BatchPredictionResponse)
async def predict_from_csv(file: UploadFile = File(...)):
    """
    Predict habitability from uploaded CSV file.
    
    Accepts CSV files with planet parameters in various formats.
    Automatically generates physics features and makes predictions.
    
    Required columns (flexible naming):
    - Planet name/identifier
    - Planet radius (Jupiter or Earth radii)
    - Planet mass (Jupiter or Earth masses)
    - Orbital period (days)
    - Stellar temperature (K)
    - Stellar mass (solar masses)
    
    Optional columns:
    - Semi-major axis (AU)
    - Stellar radius (solar radii)
    - System distance (parsecs)
    """
    try:
        # Read CSV file
        contents = await file.read()
        csv_string = contents.decode('utf-8')
        df = pd.read_csv(StringIO(csv_string))
        
        logger.info(f"CSV uploaded: {len(df)} rows, columns: {list(df.columns)}")
        
        # Normalize column names (convert to lowercase with underscores)
        df.columns = df.columns.str.lower().str.replace(' ', '_')
        
        # Map common column name variations
        column_mapping = {
            'planet_name': ['name', 'planet_name', 'pl_name', 'planet'],
            'pl_radj': ['pl_radj', 'radius_jupiter', 'radius_jup', 'r_jup'],
            'pl_rade': ['pl_rade', 'radius_earth', 'radius_e', 'r_earth'],
            'pl_bmassj': ['pl_bmassj', 'mass_jupiter', 'mass_jup', 'm_jup'],
            'pl_bmasse': ['pl_bmasse', 'mass_earth', 'mass_e', 'm_earth'],
            'pl_orbper': ['pl_orbper', 'orbital_period', 'period', 'p_orb'],
            'pl_orbsmax': ['pl_orbsmax', 'semi_major_axis', 'sma', 'a'],
            'st_teff': ['st_teff', 'stellar_temp', 'star_temp', 't_eff'],
            'st_mass': ['st_mass', 'stellar_mass', 'star_mass', 'm_star'],
            'st_rad': ['st_rad', 'stellar_radius', 'star_radius', 'r_star'],
            'sy_dist': ['sy_dist', 'distance', 'dist', 'system_distance']
        }
        
        # Apply column mapping
        for standard_name, variations in column_mapping.items():
            for var in variations:
                if var in df.columns and standard_name not in df.columns:
                    df.rename(columns={var: standard_name}, inplace=True)
                    break
        
        # Convert DataFrame rows to planet dictionaries
        planets_data = df.to_dict('records')
        
        # Get predictor
        predictor = get_predictor()
        
        if not predictor.models_loaded:
            raise HTTPException(
                status_code=503,
                detail="Physics-enhanced models not loaded."
            )
        
        # Process each planet
        results = []
        errors = []
        
        for idx, planet_data in enumerate(planets_data):
            try:
                # Unit conversions
                if 'pl_rade' in planet_data and pd.notna(planet_data['pl_rade']):
                    planet_data['pl_radj'] = planet_data['pl_rade'] / 11.2
                if 'pl_bmasse' in planet_data and pd.notna(planet_data['pl_bmasse']):
                    planet_data['pl_bmassj'] = planet_data['pl_bmasse'] / 317.8
                
                # Set default name if missing
                if 'name' not in planet_data or pd.isna(planet_data.get('name')):
                    planet_data['name'] = f"Planet_{idx+1}"
                
                # Make prediction
                result = predictor.predict_habitability(planet_data)
                
                if 'error' not in result:
                    results.append(result)
                else:
                    errors.append({
                        'row': idx + 1,
                        'name': planet_data.get('name', f'Row {idx+1}'),
                        'error': result['error']
                    })
                    
            except Exception as e:
                logger.warning(f"Error processing row {idx+1}: {e}")
                errors.append({
                    'row': idx + 1,
                    'name': planet_data.get('name', f'Row {idx+1}'),
                    'error': str(e)
                })
        
        if not results:
            raise HTTPException(
                status_code=400,
                detail=f"No valid predictions. Errors: {errors}"
            )
        
        # Calculate summary
        habitable_count = sum(1 for r in results if r.get('habitable_binary', False))
        avg_score = sum(r.get('habitability_score', 0) for r in results) / len(results)
        avg_confidence = sum(r.get('confidence', 0) for r in results) / len(results)
        
        summary = {
            "total_rows_uploaded": len(df),
            "successful_predictions": len(results),
            "failed_predictions": len(errors),
            "habitable_count": habitable_count,
            "habitable_percentage": (habitable_count / len(results) * 100) if results else 0,
            "average_habitability_score": avg_score,
            "average_confidence": avg_confidence,
            "physics_features_used": predictor.metadata.get('physics_features', {}).get('count', 46),
            "errors": errors if errors else None
        }
        
        # Convert results to Pydantic models
        predictions = [HabitabilityPrediction(**r) for r in results]
        
        return BatchPredictionResponse(predictions=predictions, summary=summary)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing CSV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"CSV processing error: {str(e)}")


@router.get("/model/info")
async def get_model_info():
    """
    Get information about the loaded physics-enhanced ML models.
    
    Returns details about:
    - Model version and type
    - Physics features used
    - Performance metrics
    - Feature list
    """
    try:
        predictor = get_predictor()
        model_info = predictor.get_model_info()
        
        return {
            "status": "loaded" if model_info['models_loaded'] else "not_loaded",
            "version": model_info.get('version', 'unknown'),
            "physics_available": model_info['physics_available'],
            "feature_count": model_info['feature_count'],
            "model_types": {
                "regression": model_info['metadata'].get('regression_model', {}).get('type', 'unknown'),
                "classification": model_info['metadata'].get('classification_model', {}).get('type', 'unknown')
            },
            "performance": {
                "regression_r2": model_info['metadata'].get('regression_model', {}).get('performance', {}).get('r2_score', 0),
                "classification_f1": model_info['metadata'].get('classification_model', {}).get('performance', {}).get('f1_score', 0)
            },
            "physics_features": model_info['metadata'].get('physics_features', {}),
            "top_features": model_info['feature_names'][:10] if model_info['feature_names'] else []
        }
        
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint for physics-enhanced API"""
    predictor = get_predictor()
    
    return {
        "status": "healthy" if predictor.models_loaded else "degraded",
        "models_loaded": predictor.models_loaded,
        "physics_available": predictor.models_loaded and predictor.engineer is not None,
        "version": predictor.metadata.get('version', 'unknown')
    }
