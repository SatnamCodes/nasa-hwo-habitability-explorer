# API Reference - NASA HWO Habitability Explorer

## Overview

This document provides a comprehensive reference for all API endpoints available in the NASA HWO Habitability Explorer backend service. The API follows RESTful principles and returns JSON responses.

**Base URL:** `https://hwo-explorer.nasa.gov/api`  
**Version:** v1  
**Authentication:** JWT Bearer Token (where required)

## Table of Contents

1. [Authentication](#authentication)
2. [Planet Endpoints](#planet-endpoints)
3. [Habitability Scoring](#habitability-scoring)
4. [AI Features](#ai-features)
5. [Data Upload](#data-upload)
6. [Statistics](#statistics)
7. [Health & Monitoring](#health--monitoring)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

## Authentication

### POST /auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "username": "scientist@nasa.gov",
    "role": "researcher"
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Invalid credentials
- `422` - Validation error

---

### POST /auth/refresh

Refresh JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

## Planet Endpoints

### GET /planets

Retrieve paginated list of exoplanets with filtering options.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 100, max: 1000) - Items per page
- `min_habitability` (float, 0-1) - Minimum habitability score filter
- `max_habitability` (float, 0-1) - Maximum habitability score filter
- `min_distance` (float) - Minimum distance in parsecs
- `max_distance` (float) - Maximum distance in parsecs
- `hwo_priority` (string) - Filter by HWO priority: "high", "medium", "low"
- `search` (string) - Search planet names
- `sort_by` (string) - Sort field: "name", "distance", "habitability", "discovery_year"
- `sort_order` (string) - Sort order: "asc", "desc"

**Example Request:**
```
GET /planets?min_habitability=0.6&max_distance=50&hwo_priority=high&page=1&limit=20
```

**Response:**
```json
{
  "planets": [
    {
      "id": 1001,
      "pl_name": "Proxima Cen b",
      "hostname": "Proxima Cen",
      "pl_letter": "b",
      "pl_rade": 1.17,
      "pl_bmasse": 1.27,
      "pl_orbper": 11.186,
      "pl_orbsmax": 0.04856,
      "pl_ecc": 0.35,
      "st_teff": 3042.0,
      "st_rad": 0.154,
      "st_mass": 0.123,
      "st_dist": 1.295,
      "sy_dist": 1.295,
      "disc_year": 2016,
      "disc_facility": "ESO 3.6 m",
      "habitability_score": 0.85,
      "cdhs_score": 0.82,
      "ml_prediction": 0.88,
      "hwo_priority": "high",
      "is_habitable": true,
      "temperature_estimate": 234.0,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "filters_applied": {
    "min_habitability": 0.6,
    "max_distance": 50.0,
    "hwo_priority": "high"
  }
}
```

---

### GET /planets/{planet_name}

Get detailed information for a specific planet.

**Path Parameters:**
- `planet_name` (string) - Name of the planet (URL encoded)

**Example Request:**
```
GET /planets/Proxima%20Cen%20b
```

**Response:**
```json
{
  "id": 1001,
  "pl_name": "Proxima Cen b",
  "hostname": "Proxima Cen",
  "pl_letter": "b",
  "pl_rade": 1.17,
  "pl_bmasse": 1.27,
  "pl_orbper": 11.186,
  "pl_orbsmax": 0.04856,
  "pl_ecc": 0.35,
  "st_teff": 3042.0,
  "st_rad": 0.154,
  "st_mass": 0.123,
  "st_dist": 1.295,
  "sy_dist": 1.295,
  "disc_year": 2016,
  "disc_facility": "ESO 3.6 m",
  "habitability_score": 0.85,
  "cdhs_score": 0.82,
  "ml_prediction": 0.88,
  "hwo_priority": "high",
  "is_habitable": true,
  "temperature_estimate": 234.0,
  "additional_data": {
    "atmospheric_composition": "Unknown",
    "magnetic_field": "Unknown",
    "surface_gravity": 1.08
  },
  "observations": [
    {
      "facility": "James Webb Space Telescope",
      "observation_date": "2024-01-15",
      "wavelength": "infrared",
      "exposure_time": 3600
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200` - Success
- `404` - Planet not found

---

### GET /planets/{planet_id}/similar

Find planets similar to the specified planet based on habitability characteristics.

**Path Parameters:**
- `planet_id` (integer) - ID of the reference planet

**Query Parameters:**
- `limit` (integer, default: 10, max: 50) - Number of similar planets to return
- `threshold` (float, default: 0.8) - Similarity threshold (0-1)

**Response:**
```json
{
  "reference_planet": {
    "id": 1001,
    "pl_name": "Proxima Cen b",
    "habitability_score": 0.85
  },
  "similar_planets": [
    {
      "id": 1205,
      "pl_name": "TRAPPIST-1 e",
      "habitability_score": 0.83,
      "similarity_score": 0.92,
      "common_characteristics": ["similar_size", "habitable_zone", "rocky"]
    },
    {
      "id": 1087,
      "pl_name": "Kepler-452b",
      "habitability_score": 0.81,
      "similarity_score": 0.87,
      "common_characteristics": ["habitable_zone", "similar_period"]
    }
  ],
  "similarity_metrics": {
    "size_weight": 0.3,
    "distance_weight": 0.2,
    "temperature_weight": 0.25,
    "stellar_properties_weight": 0.25
  }
}
```

## Habitability Scoring

### POST /habitability/calculate

Calculate habitability scores for one or more planets using various algorithms.

**Request:**
```json
{
  "planets": [
    {
      "pl_name": "Custom Planet 1",
      "pl_rade": 1.2,
      "pl_bmasse": 1.8,
      "pl_orbper": 365.25,
      "pl_orbsmax": 1.0,
      "pl_ecc": 0.05,
      "st_teff": 5778.0,
      "st_rad": 1.0,
      "st_mass": 1.0,
      "st_dist": 25.0
    }
  ],
  "algorithms": ["cdhs", "ml_model", "sephi"],
  "include_details": true
}
```

**Response:**
```json
{
  "results": [
    {
      "pl_name": "Custom Planet 1",
      "scores": {
        "cdhs_score": 0.78,
        "ml_prediction": 0.82,
        "sephi_score": 0.75,
        "combined_score": 0.78
      },
      "score_details": {
        "cdhs": {
          "temperature_score": 0.85,
          "size_score": 0.90,
          "orbital_score": 0.75,
          "stellar_score": 0.80
        },
        "ml_model": {
          "confidence": 0.91,
          "feature_importance": {
            "pl_rade": 0.25,
            "st_teff": 0.23,
            "pl_orbsmax": 0.22,
            "pl_bmasse": 0.18,
            "st_mass": 0.12
          }
        }
      },
      "habitability_class": "potentially_habitable",
      "risk_factors": [
        "moderate_eccentricity",
        "stellar_distance_uncertainty"
      ],
      "recommendations": [
        "High priority for atmospheric characterization",
        "Suitable for HWO follow-up observations"
      ]
    }
  ],
  "algorithm_metadata": {
    "cdhs_version": "2.1",
    "ml_model_version": "1.3.2",
    "ml_model_training_date": "2024-01-10",
    "sephi_version": "1.0"
  },
  "processing_time": 0.245
}
```

**Status Codes:**
- `200` - Success
- `422` - Invalid planet data
- `400` - Invalid algorithm specified

---

### POST /habitability/batch

Process large batches of planets for habitability scoring (async processing).

**Request:**
```json
{
  "job_name": "HWO Target List Analysis",
  "planets": [...], // Array of planet objects (up to 10,000)
  "algorithms": ["cdhs", "ml_model"],
  "output_format": "csv",
  "notification_email": "scientist@nasa.gov"
}
```

**Response:**
```json
{
  "job_id": "hab_batch_20240115_142530",
  "status": "queued",
  "estimated_completion": "2024-01-15T15:30:00Z",
  "planet_count": 5420,
  "progress_url": "/habitability/batch/hab_batch_20240115_142530/status"
}
```

---

### GET /habitability/batch/{job_id}/status

Check status of batch habitability calculation job.

**Response:**
```json
{
  "job_id": "hab_batch_20240115_142530",
  "status": "processing",
  "progress": {
    "completed": 2341,
    "total": 5420,
    "percentage": 43.2
  },
  "estimated_completion": "2024-01-15T15:15:00Z",
  "results_url": null,
  "error": null,
  "created_at": "2024-01-15T14:25:30Z",
  "updated_at": "2024-01-15T14:45:12Z"
}
```

## AI Features

### POST /ai/characterizability-score

Calculate characterizability score using machine learning model.

**Request:**
```json
{
  "planet": {
    "pl_name": "Test Planet",
    "pl_rade": 1.1,
    "pl_bmasse": 1.3,
    "st_teff": 5500,
    "st_rad": 0.95,
    "st_dist": 15.2
  },
  "telescope_parameters": {
    "aperture_diameter": 6.0,
    "wavelength_range": [0.4, 2.5],
    "coronagraph_efficiency": 0.85
  }
}
```

**Response:**
```json
{
  "planet_name": "Test Planet",
  "characterizability_score": 0.82,
  "detection_probability": 0.75,
  "signal_to_noise_ratio": 8.4,
  "recommended_exposure_time": 3600,
  "optimal_wavelengths": [0.76, 1.27, 1.65],
  "atmospheric_features": [
    {
      "molecule": "H2O",
      "detection_confidence": 0.78,
      "required_snr": 5.0
    },
    {
      "molecule": "CO2",
      "detection_confidence": 0.65,
      "required_snr": 7.0
    }
  ],
  "observational_constraints": {
    "minimum_separation": 0.045,
    "maximum_separation": 0.12,
    "optimal_phase_angle": 90.0
  }
}
```

---

### POST /ai/smart-filter

Get intelligent filtering suggestions based on scientific criteria.

**Request:**
```json
{
  "research_goal": "biosignature_detection",
  "available_resources": {
    "telescope_time": 100,
    "budget": 1000000
  },
  "constraints": {
    "max_distance": 50,
    "min_planet_radius": 0.5,
    "max_planet_radius": 2.0
  }
}
```

**Response:**
```json
{
  "recommended_filters": {
    "min_habitability_score": 0.65,
    "max_distance": 25.0,
    "preferred_stellar_types": ["G", "K", "M"],
    "min_equilibrium_temperature": 200,
    "max_equilibrium_temperature": 320
  },
  "rationale": {
    "habitability_threshold": "Based on biosignature detectability models",
    "distance_limit": "Optimized for current telescope sensitivity",
    "stellar_type_preference": "Stable, long-lived stars with lower activity"
  },
  "expected_targets": 23,
  "observation_strategy": {
    "priority_order": "habitability_score_desc",
    "recommended_exposure_times": {
      "high_priority": 7200,
      "medium_priority": 3600,
      "low_priority": 1800
    }
  }
}
```

---

### POST /ai/hwo-parameter-tuner

Optimize HWO telescope parameters for specific targets.

**Request:**
```json
{
  "target_planets": ["Proxima Cen b", "TRAPPIST-1 e", "TOI-715 b"],
  "science_objectives": ["atmospheric_composition", "biosignature_detection"],
  "constraints": {
    "coronagraph_type": "vortex",
    "max_observation_time": 10800
  }
}
```

**Response:**
```json
{
  "optimized_parameters": {
    "coronagraph_configuration": "4-vortex",
    "wavelength_bands": [
      {"center": 0.76, "width": 0.1, "purpose": "O2 detection"},
      {"center": 1.27, "width": 0.15, "purpose": "H2O detection"},
      {"center": 1.65, "width": 0.2, "purpose": "CH4/CO2 detection"}
    ],
    "integration_time": 7200,
    "observation_cadence": "monthly"
  },
  "performance_metrics": {
    "expected_snr": {
      "Proxima Cen b": 12.4,
      "TRAPPIST-1 e": 8.7,
      "TOI-715 b": 6.2
    },
    "biosignature_detectability": {
      "O2": 0.85,
      "H2O": 0.92,
      "CH4": 0.67
    }
  },
  "observing_schedule": [
    {
      "target": "Proxima Cen b",
      "start_time": "2024-03-15T02:00:00Z",
      "duration": 7200,
      "conditions": "optimal_separation"
    }
  ]
}
```

---

### POST /ai/target-pathing

Calculate optimal observation sequence and scheduling.

**Request:**
```json
{
  "targets": [
    {"name": "Proxima Cen b", "priority": 1, "required_time": 7200},
    {"name": "TRAPPIST-1 e", "priority": 2, "required_time": 5400},
    {"name": "LHS 1140 b", "priority": 1, "required_time": 3600}
  ],
  "constraints": {
    "total_time_budget": 86400,
    "start_date": "2024-03-01",
    "end_date": "2024-03-31"
  },
  "optimization_criteria": "maximize_science_return"
}
```

**Response:**
```json
{
  "optimal_sequence": [
    {
      "target": "Proxima Cen b",
      "observation_window": {
        "start": "2024-03-05T04:30:00Z",
        "end": "2024-03-05T06:30:00Z"
      },
      "duration": 7200,
      "conditions": {
        "stellar_separation": 0.085,
        "phase_angle": 87.0,
        "quality_score": 0.94
      }
    },
    {
      "target": "LHS 1140 b",
      "observation_window": {
        "start": "2024-03-12T03:15:00Z",
        "end": "2024-03-12T04:15:00Z"
      },
      "duration": 3600,
      "conditions": {
        "stellar_separation": 0.047,
        "phase_angle": 92.0,
        "quality_score": 0.89
      }
    }
  ],
  "schedule_efficiency": 0.87,
  "total_science_return": 245.6,
  "unused_time": 1800,
  "scheduling_constraints": [
    "Earth occultation periods avoided",
    "Optimal quadrature phases prioritized"
  ]
}
```

---

### GET /ai/priority-list

Generate observational priority list based on multiple criteria.

**Query Parameters:**
- `max_targets` (integer, default: 50) - Maximum number of targets to return
- `criteria_weights` (object) - Custom weighting for prioritization criteria

**Example Request:**
```
GET /ai/priority-list?max_targets=25&criteria_weights={"habitability":0.4,"characterizability":0.3,"feasibility":0.3}
```

**Response:**
```json
{
  "priority_targets": [
    {
      "rank": 1,
      "planet_name": "Proxima Cen b",
      "overall_score": 0.89,
      "component_scores": {
        "habitability": 0.85,
        "characterizability": 0.92,
        "observational_feasibility": 0.91
      },
      "justification": "Closest habitable planet with excellent characterization potential",
      "recommended_observation_time": 7200,
      "optimal_observation_dates": ["2024-04-15", "2024-07-18", "2024-10-12"]
    },
    {
      "rank": 2,
      "planet_name": "TRAPPIST-1 e",
      "overall_score": 0.84,
      "component_scores": {
        "habitability": 0.78,
        "characterizability": 0.88,
        "observational_feasibility": 0.86
      },
      "justification": "Part of multi-planet system, high atmospheric detection probability"
    }
  ],
  "criteria_weights_applied": {
    "habitability": 0.4,
    "characterizability": 0.3,
    "observational_feasibility": 0.3
  },
  "total_observation_time": 156000,
  "generation_timestamp": "2024-01-15T14:30:00Z"
}
```

## Data Upload

### POST /upload/csv

Upload CSV file with exoplanet data for processing.

**Request:** `multipart/form-data`
- `file` (file) - CSV file to upload
- `auto_map_columns` (boolean, default: true) - Enable automatic column mapping
- `validate_data` (boolean, default: true) - Enable data validation
- `calculate_habitability` (boolean, default: false) - Calculate habitability scores for uploaded data

**Response:**
```json
{
  "upload_id": "upload_20240115_143022",
  "filename": "new_exoplanets.csv",
  "file_size": 2048576,
  "status": "processing",
  "column_mapping": {
    "detected_columns": [
      {"csv_column": "Planet Name", "mapped_to": "pl_name", "confidence": 0.95},
      {"csv_column": "Radius (R_earth)", "mapped_to": "pl_rade", "confidence": 0.92},
      {"csv_column": "Star Temp (K)", "mapped_to": "st_teff", "confidence": 0.98}
    ],
    "unmapped_columns": ["Discovery Method", "Publication Year"],
    "missing_columns": ["pl_bmasse", "st_dist"]
  },
  "preview_data": [
    {
      "pl_name": "TOI-123 b",
      "pl_rade": 1.15,
      "st_teff": 5200.0,
      "validation_status": "valid"
    }
  ],
  "validation_summary": {
    "total_rows": 1247,
    "valid_rows": 1203,
    "invalid_rows": 44,
    "warnings": 12
  },
  "processing_url": "/upload/csv/upload_20240115_143022/status"
}
```

---

### GET /upload/csv/{upload_id}/status

Check processing status of uploaded CSV file.

**Response:**
```json
{
  "upload_id": "upload_20240115_143022",
  "status": "completed",
  "progress": {
    "processed_rows": 1247,
    "total_rows": 1247,
    "percentage": 100.0
  },
  "results": {
    "successfully_imported": 1203,
    "failed_imports": 44,
    "updated_existing": 156,
    "created_new": 1047
  },
  "habitability_scores": {
    "calculated": 1203,
    "high_habitability": 89,
    "medium_habitability": 234,
    "low_habitability": 880
  },
  "validation_errors": [
    {
      "row": 45,
      "column": "pl_rade",
      "error": "Value must be positive",
      "value": -0.5
    }
  ],
  "download_urls": {
    "processed_data": "/upload/csv/upload_20240115_143022/download/processed",
    "error_report": "/upload/csv/upload_20240115_143022/download/errors",
    "validation_report": "/upload/csv/upload_20240115_143022/download/validation"
  }
}
```

---

### POST /upload/csv/{upload_id}/confirm

Confirm column mapping and data validation for uploaded CSV.

**Request:**
```json
{
  "column_mapping": {
    "Planet Name": "pl_name",
    "Radius": "pl_rade",
    "Star Temperature": "st_teff"
  },
  "data_transformations": {
    "pl_rade": "multiply_by_earth_radius",
    "st_teff": "convert_to_kelvin"
  },
  "import_options": {
    "skip_duplicates": true,
    "update_existing": false,
    "calculate_habitability": true
  }
}
```

**Response:**
```json
{
  "confirmation_id": "confirm_20240115_143530",
  "status": "confirmed",
  "import_job_id": "import_20240115_143530",
  "estimated_processing_time": 300,
  "progress_url": "/upload/csv/confirm_20240115_143530/status"
}
```

## Statistics

### GET /statistics/overview

Get overview statistics for the entire dataset.

**Response:**
```json
{
  "dataset_overview": {
    "total_planets": 5247,
    "total_systems": 3891,
    "confirmed_planets": 4102,
    "candidate_planets": 1145,
    "habitable_planets": 234,
    "hwo_targets": {
      "high_priority": 67,
      "medium_priority": 189,
      "low_priority": 412
    }
  },
  "discovery_statistics": {
    "by_year": {
      "2023": 156,
      "2022": 201,
      "2021": 189
    },
    "by_method": {
      "Transit": 3421,
      "Radial Velocity": 891,
      "Direct Imaging": 52,
      "Microlensing": 123
    },
    "by_facility": {
      "Kepler": 2341,
      "TESS": 1567,
      "Ground-based": 891
    }
  },
  "habitability_distribution": {
    "score_ranges": {
      "0.8-1.0": 34,
      "0.6-0.8": 123,
      "0.4-0.6": 456,
      "0.2-0.4": 1234,
      "0.0-0.2": 3400
    },
    "average_score": 0.287,
    "median_score": 0.234
  },
  "stellar_characteristics": {
    "host_star_types": {
      "M": 2341,
      "K": 1456,
      "G": 978,
      "F": 345,
      "Other": 127
    },
    "average_stellar_distance": 287.4,
    "nearest_habitable": {
      "name": "Proxima Cen b",
      "distance": 1.295
    }
  },
  "last_updated": "2024-01-15T14:30:00Z"
}
```

---

### GET /statistics/habitability-trends

Analyze habitability score trends and distributions.

**Query Parameters:**
- `time_period` (string) - Time period for trend analysis: "1y", "5y", "all"
- `group_by` (string) - Grouping criteria: "discovery_year", "stellar_type", "distance_range"

**Response:**
```json
{
  "trends": {
    "score_evolution": [
      {"year": 2020, "average_score": 0.23, "count": 234},
      {"year": 2021, "average_score": 0.28, "count": 189},
      {"year": 2022, "average_score": 0.31, "count": 201}
    ],
    "correlation_analysis": {
      "distance_vs_habitability": -0.15,
      "stellar_mass_vs_habitability": 0.32,
      "planet_radius_vs_habitability": -0.08
    }
  },
  "distributions": {
    "by_stellar_type": {
      "M": {"average": 0.31, "median": 0.28, "std_dev": 0.18},
      "K": {"average": 0.29, "median": 0.26, "std_dev": 0.16},
      "G": {"average": 0.25, "median": 0.22, "std_dev": 0.14}
    },
    "by_distance_range": {
      "0-10_pc": {"average": 0.34, "count": 23},
      "10-25_pc": {"average": 0.31, "count": 89},
      "25-50_pc": {"average": 0.28, "count": 156}
    }
  },
  "predictive_insights": {
    "optimal_search_regions": [
      {
        "stellar_type": "K",
        "distance_range": "10-25_pc",
        "expected_habitability": 0.35,
        "discovery_probability": 0.67
      }
    ]
  }
}
```

## Health & Monitoring

### GET /health

Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T14:30:00Z",
  "version": "1.3.2",
  "environment": "production"
}
```

---

### GET /health/detailed

Detailed health check including database and dependencies.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T14:30:00Z",
  "version": "1.3.2",
  "environment": "production",
  "components": {
    "database": {
      "status": "healthy",
      "connection_pool": {
        "active": 5,
        "idle": 15,
        "max": 20
      },
      "response_time_ms": 12
    },
    "redis": {
      "status": "healthy",
      "memory_usage": "45.2MB",
      "connected_clients": 8,
      "response_time_ms": 3
    },
    "ml_models": {
      "status": "loaded",
      "models": {
        "habitability_xgboost": "v1.3.2",
        "characterizability_nn": "v2.1.0"
      },
      "cache_hit_rate": 0.87
    }
  },
  "metrics": {
    "requests_per_minute": 145,
    "average_response_time": 234,
    "error_rate": 0.02,
    "uptime_seconds": 2847392
  }
}
```

---

### GET /metrics

Prometheus-compatible metrics endpoint.

**Response:**
```
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{method="GET",endpoint="/planets",status="200"} 15234

# HELP api_request_duration_seconds API request duration
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_bucket{method="GET",endpoint="/planets",le="0.1"} 8932
api_request_duration_seconds_bucket{method="GET",endpoint="/planets",le="0.5"} 14567

# HELP habitability_calculations_total Total habitability calculations performed
# TYPE habitability_calculations_total counter
habitability_calculations_total{algorithm="cdhs"} 45231
habitability_calculations_total{algorithm="ml_model"} 38291

# HELP database_connections_active Active database connections
# TYPE database_connections_active gauge
database_connections_active 8
```

## Error Handling

### Standard Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid planet radius value",
    "details": {
      "field": "pl_rade",
      "value": -1.5,
      "constraint": "must_be_positive"
    },
    "error_code": "INVALID_PLANET_RADIUS",
    "timestamp": "2024-01-15T14:30:00Z",
    "request_id": "req_abc123def456"
  }
}
```

### Common HTTP Status Codes

- **200 OK** - Successful request
- **201 Created** - Resource successfully created
- **400 Bad Request** - Invalid request format or parameters
- **401 Unauthorized** - Authentication required or invalid
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **422 Unprocessable Entity** - Invalid data provided
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - Service temporarily unavailable

### Error Codes

| Code | Description |
|------|-------------|
| `PLANET_NOT_FOUND` | Specified planet does not exist |
| `INVALID_PLANET_DATA` | Planet data validation failed |
| `HABITABILITY_CALCULATION_FAILED` | Error during habitability calculation |
| `FILE_UPLOAD_ERROR` | CSV file upload or processing error |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `AUTHENTICATION_FAILED` | Invalid or expired authentication |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `DATABASE_ERROR` | Database connectivity or query error |
| `ML_MODEL_ERROR` | Machine learning model prediction error |

## Rate Limiting

### Rate Limits

- **General API endpoints**: 100 requests per minute per IP
- **File upload endpoints**: 10 requests per minute per IP
- **Habitability calculation**: 50 requests per minute per user
- **AI feature endpoints**: 20 requests per minute per user

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642254600
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "type": "RateLimitError",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "reset_time": "2024-01-15T14:31:00Z"
    },
    "error_code": "RATE_LIMIT_EXCEEDED"
  }
}
```

This API reference provides comprehensive documentation for integrating with the NASA HWO Habitability Explorer backend service.
