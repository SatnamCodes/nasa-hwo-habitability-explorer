# API Documentation - NASA HWO Habitability Explorer

This document provides comprehensive API reference for the NASA HWO Habitability Explorer backend services.

## Base URL

**Local Development:**
```
http://localhost:8000
```

**Production:**
```
https://your-domain.com
```

## API Overview

The HWO Habitability Explorer API provides endpoints for:
- Exoplanet data retrieval and analysis
- Habitability scoring calculations
- Machine learning predictions
- Target prioritization
- CSV data processing

## Authentication

Currently, the API operates in open mode for NASA evaluation. No authentication is required for basic operations.

### Future Authentication (Post-Evaluation)
```http
Authorization: Bearer <token>
```

## Core Endpoints

### 1. Health Check

**GET** `/health`

Check API availability and status.

**Response:**
```json
{
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2025-08-23T10:00:00Z",
    "database": "connected",
    "ml_models": "loaded"
}
```

### 2. Planet Data

**GET** `/api/planets`

Retrieve exoplanet database with filtering and pagination.

**Query Parameters:**
- `limit` (int, optional): Number of results (default: 100, max: 1000)
- `offset` (int, optional): Pagination offset (default: 0)
- `min_habitability` (float, optional): Minimum habitability score (0-1)
- `max_distance` (float, optional): Maximum distance in parsecs
- `stellar_type` (string, optional): Stellar classification filter
- `search` (string, optional): Text search across planet names

**Example Request:**
```http
GET /api/planets?limit=50&min_habitability=0.7&max_distance=50
```

**Response:**
```json
{
    "planets": [
        {
            "pl_name": "Kepler-452b",
            "pl_orbper": 384.843,
            "pl_rade": 1.63,
            "pl_bmasse": 5.0,
            "st_dist": 430.0,
            "st_teff": 5757.0,
            "habitability_score": 0.85,
            "cdhs_score": 0.78,
            "ml_prediction": 0.92,
            "hwo_priority": "high"
        }
    ],
    "pagination": {
        "total": 4500,
        "limit": 50,
        "offset": 0,
        "has_next": true,
        "has_prev": false
    },
    "filters_applied": {
        "min_habitability": 0.7,
        "max_distance": 50
    }
}
```

### 3. Individual Planet Details

**GET** `/api/planets/{planet_name}`

Get detailed information for a specific exoplanet.

**Path Parameters:**
- `planet_name` (string): Planet identifier

**Response:**
```json
{
    "planet": {
        "pl_name": "Kepler-452b",
        "discovery_info": {
            "pl_disc": 2015,
            "pl_facility": "Kepler",
            "pl_telescope": "Kepler"
        },
        "orbital_parameters": {
            "pl_orbper": 384.843,
            "pl_orbsmax": 1.046,
            "pl_orbeccen": null,
            "pl_orbincl": 89.806
        },
        "physical_parameters": {
            "pl_rade": 1.63,
            "pl_bmasse": 5.0,
            "pl_dens": null
        },
        "stellar_parameters": {
            "st_teff": 5757.0,
            "st_rad": 1.11,
            "st_mass": 1.037,
            "st_dist": 430.0,
            "st_spstr": "G2"
        },
        "habitability_analysis": {
            "habitability_score": 0.85,
            "cdhs_score": 0.78,
            "ml_prediction": 0.92,
            "hwo_priority": "high",
            "factors": {
                "temperature_score": 0.89,
                "size_score": 0.76,
                "orbit_score": 0.88,
                "stellar_score": 0.82
            }
        }
    }
}
```

### 4. Habitability Calculation

**POST** `/api/calculate-habitability`

Calculate habitability scores for custom planet parameters.

**Request Body:**
```json
{
    "planets": [
        {
            "pl_name": "Custom Planet 1",
            "pl_rade": 1.2,
            "pl_bmasse": 1.8,
            "pl_orbper": 365.25,
            "st_teff": 5778.0,
            "st_rad": 1.0,
            "st_mass": 1.0,
            "st_dist": 25.0
        }
    ]
}
```

**Response:**
```json
{
    "results": [
        {
            "pl_name": "Custom Planet 1",
            "habitability_score": 0.82,
            "cdhs_score": 0.75,
            "ml_prediction": 0.88,
            "hwo_priority": "medium",
            "calculation_details": {
                "temperature_zone": "habitable",
                "size_category": "super_earth",
                "orbit_stability": "stable",
                "stellar_activity": "low"
            }
        }
    ],
    "calculation_time": 0.045
}
```

### 5. CSV Upload and Processing

**POST** `/api/upload-csv`

Upload and process CSV files with exoplanet data.

**Request:**
- Content-Type: `multipart/form-data`
- File field: `file`

**Additional Form Data:**
```json
{
    "column_mapping": {
        "planet_name": "Name",
        "radius": "Planet Radius",
        "mass": "Planet Mass",
        "period": "Orbital Period",
        "stellar_temp": "Star Temperature"
    },
    "calculate_habitability": true
}
```

**Response:**
```json
{
    "upload_id": "upload_12345",
    "status": "processing",
    "total_rows": 150,
    "processed_rows": 150,
    "valid_rows": 142,
    "errors": [
        {
            "row": 15,
            "error": "Invalid radius value",
            "value": "N/A"
        }
    ],
    "results": {
        "high_priority": 25,
        "medium_priority": 67,
        "low_priority": 50,
        "average_habitability": 0.45
    },
    "download_url": "/api/download-results/upload_12345"
}
```

### 6. Machine Learning Predictions

**POST** `/api/predict-habitability`

Get ML model predictions for planet habitability.

**Request Body:**
```json
{
    "features": {
        "pl_rade": 1.2,
        "pl_bmasse": 1.8,
        "pl_orbper": 365.25,
        "st_teff": 5778.0,
        "st_rad": 1.0,
        "st_mass": 1.0
    },
    "model_type": "xgboost"
}
```

**Response:**
```json
{
    "prediction": 0.88,
    "confidence": 0.92,
    "feature_importance": {
        "pl_rade": 0.25,
        "st_teff": 0.22,
        "pl_orbper": 0.20,
        "pl_bmasse": 0.18,
        "st_rad": 0.08,
        "st_mass": 0.07
    },
    "model_info": {
        "model_type": "XGBoost",
        "version": "1.7.0",
        "training_accuracy": 0.856,
        "features_used": 12
    }
}
```

### 7. HWO Target Analysis

**GET** `/api/hwo-targets`

Get prioritized targets for HWO mission planning.

**Query Parameters:**
- `min_priority` (string): Minimum priority level (low/medium/high)
- `max_distance` (float): Maximum distance constraint
- `observable_hemisphere` (string): north/south/both
- `limit` (int): Number of results

**Response:**
```json
{
    "targets": [
        {
            "pl_name": "Proxima Cen b",
            "priority_score": 0.95,
            "observability_score": 0.88,
            "characterizability_score": 0.82,
            "reasons": [
                "Nearby target (4.24 pc)",
                "High habitability potential",
                "Optimal for direct imaging"
            ],
            "observation_windows": [
                {
                    "start": "2030-03-15",
                    "end": "2030-09-15",
                    "optimal": true
                }
            ]
        }
    ],
    "summary": {
        "total_targets": 127,
        "high_priority": 15,
        "observable_this_year": 89,
        "recommended_first_targets": 5
    }
}
```

### 8. Advanced AI Features

**POST** `/api/ai/characterizability-score`

Calculate detailed characterizability scores.

**POST** `/api/ai/smart-filter`

AI-powered intelligent filtering.

**POST** `/api/ai/hwo-parameter-tuner`

Optimize HWO parameters for target selection.

**POST** `/api/ai/target-to-target-pathing`

Calculate optimal observation sequences.

**POST** `/api/ai/observational-priority-list`

Generate prioritized observation lists.

## Error Handling

### Error Response Format
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid parameter value",
        "details": {
            "field": "pl_rade",
            "value": "-1.5",
            "constraint": "must be positive"
        },
        "timestamp": "2025-08-23T10:00:00Z"
    }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `MODEL_ERROR` | 502 | ML model unavailable |

## Rate Limiting

**Current Limits (Development):**
- 1000 requests per hour per IP
- 100 requests per minute per IP
- 10 concurrent requests per IP

**Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1692792000
```

## Data Models

### Planet Model
```python
{
    "pl_name": str,           # Planet name
    "pl_rade": float,         # Radius (Earth radii)
    "pl_bmasse": float,       # Mass (Earth masses)
    "pl_orbper": float,       # Orbital period (days)
    "pl_orbsmax": float,      # Semi-major axis (AU)
    "st_teff": float,         # Stellar temperature (K)
    "st_rad": float,          # Stellar radius (Solar radii)
    "st_mass": float,         # Stellar mass (Solar masses)
    "st_dist": float,         # Distance (parsecs)
    "habitability_score": float,  # Overall score (0-1)
    "cdhs_score": float,      # CDHS algorithm score
    "ml_prediction": float    # ML model prediction
}
```

## SDK Examples

### Python
```python
import requests

# Initialize client
api_base = "http://localhost:8000"

# Get planets
response = requests.get(f"{api_base}/api/planets", params={
    "min_habitability": 0.7,
    "limit": 50
})
planets = response.json()

# Calculate habitability
planet_data = {
    "planets": [{
        "pl_name": "Test Planet",
        "pl_rade": 1.2,
        "pl_bmasse": 1.8,
        "pl_orbper": 365.25,
        "st_teff": 5778.0
    }]
}
response = requests.post(f"{api_base}/api/calculate-habitability", 
                        json=planet_data)
results = response.json()
```

### JavaScript
```javascript
// Fetch planets
const fetchPlanets = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/planets?${params}`);
    return response.json();
};

// Calculate habitability
const calculateHabitability = async (planetData) => {
    const response = await fetch('/api/calculate-habitability', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(planetData)
    });
    return response.json();
};
```

## Testing

### Health Check
```bash
curl -X GET http://localhost:8000/health
```

### Get Planets
```bash
curl -X GET "http://localhost:8000/api/planets?limit=10&min_habitability=0.5"
```

### Calculate Habitability
```bash
curl -X POST http://localhost:8000/api/calculate-habitability \
  -H "Content-Type: application/json" \
  -d '{"planets": [{"pl_name": "Test", "pl_rade": 1.2, "pl_bmasse": 1.8}]}'
```

## Support

**Technical Issues:**
- [GitHub Issues](https://github.com/SatnamCodes/nasa-hwo-habitability-explorer/issues)

**Documentation:**
- [API Endpoints](endpoints.md) - Detailed endpoint reference
- [Authentication](authentication.md) - Security documentation

---

*This API documentation is automatically updated with each release. For the most current information, refer to the interactive API documentation at `/docs` when the server is running.*

**Last Updated:** August 23, 2025  
**API Version:** 1.0.0
