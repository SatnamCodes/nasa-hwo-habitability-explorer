# API Endpoints Reference

## Overview

The HWO Habitability Explorer provides a comprehensive RESTful API for accessing exoplanet data, habitability assessments, and machine learning predictions. Our API is designed to support both interactive research and automated data analysis workflows.

## Base Configuration

**Base URL:** `https://api.hwo-habitability-explorer.nasa.gov/v1`  
**Authentication:** Bearer token (see [Authentication Guide](authentication.md))  
**Rate Limiting:** 1000 requests/hour for authenticated users  
**Content Type:** `application/json`

## Exoplanet Data Endpoints

### Get Exoplanet Catalog

Retrieve comprehensive exoplanet data from integrated catalogs including NASA Exoplanet Archive, Kepler, and TESS surveys.

```http
GET /exoplanets
```

**Query Parameters:**
- `star_type` (string): Filter by stellar spectral type (G, K, M)
- `min_radius` (float): Minimum planetary radius in Earth radii
- `max_radius` (float): Maximum planetary radius in Earth radii
- `habitable_zone` (boolean): Filter for planets in habitable zone
- `confirmed` (boolean): Include only confirmed planets
- `limit` (integer): Number of results (default: 100, max: 1000)
- `offset` (integer): Pagination offset

**Response Example:**
```json
{
    "count": 4500,
    "results": [
        {
            "planet_name": "Kepler-442b",
            "host_star": "Kepler-442",
            "stellar_type": "K5V",
            "stellar_mass": 0.61,
            "stellar_radius": 0.60,
            "stellar_temperature": 4402,
            "planet_radius": 1.34,
            "planet_mass": 2.3,
            "orbital_period": 112.3,
            "semi_major_axis": 0.409,
            "equilibrium_temperature": 233,
            "habitable_zone_position": "conservative",
            "discovery_method": "Transit",
            "discovery_year": 2015,
            "coordinates": {
                "ra": 295.501,
                "dec": 39.866,
                "distance": 370.6
            }
        }
    ],
    "pagination": {
        "next": "/exoplanets?offset=100",
        "previous": null
    }
}
```

### Get Individual Exoplanet

Retrieve detailed information for a specific exoplanet.

```http
GET /exoplanets/{planet_id}
```

**Path Parameters:**
- `planet_id` (string): Unique planet identifier

**Response includes:**
- Complete planetary and stellar parameters
- Habitability assessment scores
- Observational history and data sources
- Atmospheric characterization data (if available)

## Habitability Assessment Endpoints

### Calculate Habitability Score

Generate comprehensive habitability assessment using CDHS algorithm and machine learning models.

```http
POST /habitability/score
```

**Request Body:**
```json
{
    "planetary_data": {
        "planet_radius": 1.1,
        "planet_mass": 1.3,
        "orbital_period": 245.5,
        "stellar_mass": 0.89,
        "stellar_radius": 0.84,
        "stellar_temperature": 5200,
        "stellar_age": 6.2,
        "metallicity": -0.1
    },
    "scoring_method": "cdhs",
    "include_ml_prediction": true,
    "uncertainty_analysis": true
}
```

**Response:**
```json
{
    "habitability_score": 0.78,
    "confidence_interval": [0.72, 0.84],
    "score_components": {
        "habitable_zone": 0.85,
        "planetary_size": 0.92,
        "atmospheric_retention": 0.67,
        "stellar_stability": 0.73
    },
    "ml_prediction": {
        "probability_habitable": 0.76,
        "feature_importance": {
            "equilibrium_temperature": 0.34,
            "planetary_mass": 0.28,
            "stellar_age": 0.19,
            "orbital_period": 0.19
        }
    },
    "recommendations": [
        "Prime candidate for atmospheric characterization",
        "Suitable for HWO direct imaging observations",
        "High priority for follow-up spectroscopy"
    ]
}
```

### Batch Habitability Analysis

Process multiple planetary systems for efficient large-scale analysis.

```http
POST /habitability/batch
```

**Request Body:**
```json
{
    "targets": [
        {
            "system_name": "TRAPPIST-1",
            "planets": ["b", "c", "d", "e", "f", "g", "h"]
        },
        {
            "system_name": "Kepler-186",
            "planets": ["f"]
        }
    ],
    "analysis_options": {
        "include_atmospheric_modeling": true,
        "stellar_evolution_effects": true,
        "tidal_locking_analysis": true
    }
}
```

## Machine Learning Endpoints

### Predict Planetary Properties

Use trained ML models to predict missing planetary parameters.

```http
POST /ml/predict
```

**Request Body:**
```json
{
    "input_features": {
        "stellar_mass": 0.95,
        "stellar_radius": 0.92,
        "stellar_temperature": 5778,
        "orbital_period": 365.25
    },
    "predict_parameters": ["planet_radius", "planet_mass", "equilibrium_temperature"],
    "model_version": "v2.1",
    "uncertainty_quantification": true
}
```

**Response:**
```json
{
    "predictions": {
        "planet_radius": {
            "value": 1.02,
            "uncertainty": 0.15,
            "confidence_interval": [0.87, 1.17]
        },
        "planet_mass": {
            "value": 1.08,
            "uncertainty": 0.22,
            "confidence_interval": [0.86, 1.30]
        },
        "equilibrium_temperature": {
            "value": 279,
            "uncertainty": 18,
            "confidence_interval": [261, 297]
        }
    },
    "model_metadata": {
        "training_date": "2025-03-15",
        "validation_accuracy": 0.89,
        "feature_importance_available": true
    }
}
```

### Model Performance Metrics

Access detailed performance statistics for deployed ML models.

```http
GET /ml/models/{model_id}/performance
```

**Response includes:**
- Cross-validation scores and error metrics
- Feature importance rankings
- Model interpretation visualizations
- Comparison with baseline methods

## Search and Discovery Endpoints

### Advanced Search

Perform complex queries with multiple criteria and scientific constraints.

```http
POST /search
```

**Request Body:**
```json
{
    "criteria": {
        "stellar_constraints": {
            "spectral_type": ["G", "K"],
            "age_range": [1.0, 10.0],
            "metallicity_range": [-0.5, 0.3]
        },
        "planetary_constraints": {
            "radius_range": [0.8, 1.4],
            "temperature_range": [200, 350],
            "habitable_zone": true
        },
        "observational_constraints": {
            "transit_probability": "> 0.01",
            "snr_threshold": 10,
            "atmospheric_characterization": "feasible"
        }
    },
    "ranking": "habitability_score",
    "limit": 50
}
```

### Similar Planets

Find planets with similar characteristics to a reference planet.

```http
GET /search/similar/{reference_planet}
```

**Query Parameters:**
- `similarity_metric` (string): cosine, euclidean, mahalanobis
- `feature_weights` (object): Custom weighting for different parameters
- `max_results` (integer): Maximum number of similar planets to return

## Observational Data Endpoints

### Get Observation History

Retrieve observational data and measurement history for planets.

```http
GET /observations/{planet_id}
```

**Response includes:**
- Photometric time series data
- Spectroscopic measurements
- Transit and eclipse observations
- Data quality metrics and flags

### Submit New Observations

API endpoint for submitting new observational data (requires special authorization).

```http
POST /observations/submit
```

**Request Body:**
```json
{
    "target": "HD 40307g",
    "observation_type": "transit_photometry",
    "instrument": "HWO-Coronagraph",
    "observation_date": "2025-08-15T14:30:00Z",
    "data": {
        "wavelength_range": [0.5, 1.8],
        "spectral_resolution": 100,
        "snr": 45,
        "atmospheric_features": ["H2O", "O2", "CH4"]
    },
    "metadata": {
        "observer": "NASA HWO Team",
        "data_reduction_pipeline": "v3.2",
        "calibration_version": "2025.2"
    }
}
```

## Target Management Endpoints

### HWO Target Lists

Access official NASA HWO target prioritization lists.

```http
GET /hwo/targets
```

**Query Parameters:**
- `priority_tier` (integer): 1 (highest) to 3 (exploratory)
- `observing_window` (string): Optimal observation periods
- `instrument_requirements` (array): Required HWO instruments

**Response:**
```json
{
    "target_list": [
        {
            "target_name": "Proxima Centauri b",
            "priority_tier": 1,
            "observing_windows": [
                {
                    "start_date": "2035-03-15",
                    "end_date": "2035-09-15",
                    "optimal_conditions": true
                }
            ],
            "required_instruments": ["Direct Imager", "Spectrograph"],
            "expected_integration_time": 48.5,
            "scientific_justification": "Nearest potentially habitable exoplanet"
        }
    ]
}
```

### Create Custom Target List

Generate custom observation target lists based on specific criteria.

```http
POST /hwo/targets/custom
```

**Request Body:**
```json
{
    "selection_criteria": {
        "max_distance": 25,
        "min_habitability_score": 0.6,
        "stellar_types": ["G", "K"],
        "atmospheric_characterization": "high_priority"
    },
    "observing_constraints": {
        "total_mission_time": 5,
        "minimum_snr": 7,
        "seasonal_visibility": "required"
    },
    "optimization_goal": "maximize_scientific_return"
}
```

## Data Export Endpoints

### Export Datasets

Generate custom datasets for external analysis and research.

```http
POST /export/dataset
```

**Request Body:**
```json
{
    "query": {
        "planet_criteria": {
            "confirmed": true,
            "habitable_zone": true
        }
    },
    "export_format": "csv",
    "include_fields": [
        "planet_name", "host_star", "planet_radius", 
        "planet_mass", "orbital_period", "habitability_score"
    ],
    "data_quality_filter": "high_confidence"
}
```

**Response:**
```json
{
    "download_url": "https://api.hwo-habitability-explorer.nasa.gov/downloads/dataset_20250815_143052.csv",
    "expiration_date": "2025-08-22T14:30:52Z",
    "record_count": 1247,
    "file_size": "2.3 MB",
    "checksum": "sha256:a1b2c3d4e5f6..."
}
```

## System Status Endpoints

### API Health Check

Monitor API system status and performance.

```http
GET /health
```

**Response:**
```json
{
    "status": "healthy",
    "version": "1.0.0",
    "database_status": "connected",
    "ml_models_status": "loaded",
    "last_data_update": "2025-08-15T06:00:00Z",
    "response_time_ms": 45
}
```

### System Metrics

Access detailed system performance and usage statistics.

```http
GET /metrics
```

**Response includes:**
- Request volume and response times
- Database query performance
- ML model inference statistics
- Error rates and system uptime

## Error Handling

### Standard HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource successfully created
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: System maintenance

### Error Response Format

```json
{
    "error": {
        "code": "INVALID_PARAMETER",
        "message": "Planet radius must be positive",
        "details": {
            "parameter": "planet_radius",
            "provided_value": -0.5,
            "valid_range": "> 0"
        },
        "suggestion": "Please provide a positive value for planet radius"
    }
}
```

## Rate Limiting and Usage Policies

### Rate Limits

- **Free Tier**: 100 requests/hour
- **Research Tier**: 1,000 requests/hour  
- **Institutional Tier**: 10,000 requests/hour
- **NASA Partners**: Unlimited with fair use policy

### Usage Guidelines

- Batch requests for multiple operations when possible
- Cache frequently accessed data locally
- Use appropriate query limits to avoid unnecessary data transfer
- Respect rate limits to ensure fair access for all users