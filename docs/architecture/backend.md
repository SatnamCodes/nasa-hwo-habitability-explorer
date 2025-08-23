# Backend Architecture Documentation

## FastAPI/Python Backend Implementation

The backend of the NASA HWO Habitability Explorer is built using FastAPI, providing a high-performance, type-safe API service for exoplanet analysis and machine learning operations.

## Architecture Overview

```
Backend Application
├── FastAPI Application
│   ├── API Routers
│   ├── Middleware Stack
│   ├── Exception Handlers
│   └── OpenAPI Documentation
├── Business Logic Layer
│   ├── Service Classes
│   ├── Algorithm Implementations
│   ├── ML Model Integration
│   └── Data Processing
├── Data Access Layer
│   ├── Database Models
│   ├── Repository Pattern
│   ├── Query Builders
│   └── Connection Management
└── External Integrations
    ├── File Processing
    ├── ML Model Loading
    ├── NASA Data APIs (Future)
    └── Validation Services
```

## Module Structure

```python
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection and setup
│   ├── api/                 # API route handlers
│   │   ├── __init__.py
│   │   ├── health.py        # Health check endpoints
│   │   ├── planets.py       # Planet data endpoints
│   │   ├── habitability.py  # Habitability calculation
│   │   ├── upload.py        # File upload handling
│   │   └── ai_features.py   # Advanced AI endpoints
│   ├── models/              # Database models
│   │   ├── __init__.py
│   │   ├── base.py          # Base model class
│   │   ├── planet.py        # Planet model
│   │   └── user.py          # User model (future)
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── planet.py        # Planet request/response schemas
│   │   ├── habitability.py  # Habitability schemas
│   │   └── upload.py        # Upload schemas
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── planet_service.py     # Planet operations
│   │   ├── habitability_service.py # Scoring algorithms
│   │   ├── ml_service.py         # ML model operations
│   │   └── upload_service.py     # File processing
│   └── utils/               # Utility functions
│       ├── __init__.py
│       ├── validators.py    # Data validation
│       ├── converters.py    # Unit conversions
│       └── exceptions.py    # Custom exceptions
├── requirements.txt         # Python dependencies
└── tests/                   # Test suite
    ├── test_api.py
    ├── test_models.py
    └── test_services.py
```

## Core Components

### 1. FastAPI Application Setup

**main.py** - Application Entry Point
```python
from fastapi import FastAPI, middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn

from app.api import health, planets, habitability, upload, ai_features
from app.database import create_tables
from app.config import settings

# Create FastAPI instance
app = FastAPI(
    title="NASA HWO Habitability Explorer API",
    description="API for exoplanet habitability assessment and mission planning",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include API Routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(planets.router, prefix="/api/planets", tags=["planets"])
app.include_router(habitability.router, prefix="/api/habitability", tags=["habitability"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(ai_features.router, prefix="/api/ai", tags=["ai-features"])

# Application Events
@app.on_event("startup")
async def startup_event():
    """Initialize database and load ML models"""
    create_tables()
    # Load ML models and initialize services
    
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources"""
    # Close database connections and cleanup

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
```

### 2. Configuration Management

**config.py** - Environment Configuration
```python
from pydantic import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "NASA HWO Habitability Explorer"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite:///./exoplanets.db"
    DATABASE_ECHO: bool = False
    
    # API
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    UPLOAD_DIRECTORY: str = "./uploads"
    ALLOWED_EXTENSIONS: set = {".csv", ".txt"}
    
    # ML Models
    MODEL_DIRECTORY: str = "./data_science/models"
    XGBOOST_MODEL_PATH: str = "xgboost_habitability.pkl"
    SCALER_PATH: str = "feature_scaler.pkl"
    
    # External APIs
    NASA_EXOPLANET_API: Optional[str] = None
    ENABLE_EXTERNAL_APIS: bool = False
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### 3. Database Models

**models/base.py** - Base Model Class
```python
from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session

Base = declarative_base()

class BaseModel(Base):
    """Base model class with common fields"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
    
    @classmethod
    def create(cls, db: Session, **kwargs):
        """Create new instance"""
        instance = cls(**kwargs)
        db.add(instance)
        db.commit()
        db.refresh(instance)
        return instance
    
    def update(self, db: Session, **kwargs):
        """Update instance"""
        for key, value in kwargs.items():
            setattr(self, key, value)
        db.commit()
        db.refresh(self)
        return self
```

**models/planet.py** - Planet Data Model
```python
from sqlalchemy import Column, String, Float, Integer, Boolean, Text
from sqlalchemy.dialects.sqlite import JSON
from typing import Optional, Dict, Any

from .base import BaseModel

class Planet(BaseModel):
    """Exoplanet data model"""
    __tablename__ = "planets"
    
    # Basic Identification
    pl_name = Column(String(100), unique=True, index=True, nullable=False)
    pl_hostname = Column(String(100), index=True)
    
    # Discovery Information
    pl_disc = Column(Integer)  # Discovery year
    pl_facility = Column(String(50))  # Discovery facility
    pl_telescope = Column(String(50))  # Discovery telescope
    
    # Planetary Parameters
    pl_rade = Column(Float)  # Planet radius (Earth radii)
    pl_radeerr1 = Column(Float)  # Radius upper error
    pl_radeerr2 = Column(Float)  # Radius lower error
    
    pl_bmasse = Column(Float)  # Planet mass (Earth masses)
    pl_bmasseerr1 = Column(Float)  # Mass upper error
    pl_bmasseerr2 = Column(Float)  # Mass lower error
    
    pl_dens = Column(Float)  # Planet density (g/cm³)
    pl_orbper = Column(Float)  # Orbital period (days)
    pl_orbsmax = Column(Float)  # Semi-major axis (AU)
    pl_orbeccen = Column(Float)  # Orbital eccentricity
    pl_orbincl = Column(Float)  # Orbital inclination (degrees)
    
    # Stellar Parameters
    st_teff = Column(Float)  # Stellar temperature (K)
    st_rad = Column(Float)  # Stellar radius (Solar radii)
    st_mass = Column(Float)  # Stellar mass (Solar masses)
    st_dist = Column(Float)  # Distance (parsecs)
    st_spstr = Column(String(10))  # Stellar spectral type
    
    # Calculated Scores
    habitability_score = Column(Float)  # Overall habitability (0-1)
    cdhs_score = Column(Float)  # CDHS algorithm score
    ml_prediction = Column(Float)  # ML model prediction
    confidence_score = Column(Float)  # Prediction confidence
    
    # HWO Mission Specific
    hwo_priority = Column(String(10))  # low/medium/high
    observability_score = Column(Float)
    characterizability_score = Column(Float)
    
    # Metadata
    data_source = Column(String(50))  # NASA, Kepler, TESS, etc.
    data_quality = Column(String(10))  # A, B, C rating
    last_updated = Column(String(20))  # ISO date string
    
    # Additional data as JSON
    metadata = Column(JSON)
    
    def __repr__(self):
        return f"<Planet(name='{self.pl_name}', habitability={self.habitability_score})>"
    
    @property
    def is_habitable(self) -> bool:
        """Check if planet is considered habitable"""
        return self.habitability_score and self.habitability_score > 0.5
    
    @property
    def temperature_estimate(self) -> Optional[float]:
        """Estimate planet temperature based on stellar parameters"""
        if not all([self.st_teff, self.st_rad, self.pl_orbsmax]):
            return None
        
        # Simplified temperature calculation
        # T_planet = T_star * sqrt(R_star / (2 * a))
        import math
        return self.st_teff * math.sqrt(self.st_rad / (2 * self.pl_orbsmax))
```

### 4. Pydantic Schemas

**schemas/planet.py** - Request/Response Schemas
```python
from pydantic import BaseModel, validator, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class PlanetBase(BaseModel):
    """Base planet schema"""
    pl_name: str = Field(..., description="Planet name")
    pl_rade: Optional[float] = Field(None, ge=0, description="Planet radius in Earth radii")
    pl_bmasse: Optional[float] = Field(None, ge=0, description="Planet mass in Earth masses")
    pl_orbper: Optional[float] = Field(None, gt=0, description="Orbital period in days")
    pl_orbsmax: Optional[float] = Field(None, gt=0, description="Semi-major axis in AU")
    
    st_teff: Optional[float] = Field(None, ge=0, description="Stellar temperature in K")
    st_rad: Optional[float] = Field(None, ge=0, description="Stellar radius in Solar radii")
    st_mass: Optional[float] = Field(None, ge=0, description="Stellar mass in Solar masses")
    st_dist: Optional[float] = Field(None, ge=0, description="Distance in parsecs")

class PlanetCreate(PlanetBase):
    """Schema for creating a planet"""
    data_source: Optional[str] = Field(None, description="Data source identifier")

class PlanetUpdate(BaseModel):
    """Schema for updating a planet"""
    pl_rade: Optional[float] = None
    pl_bmasse: Optional[float] = None
    habitability_score: Optional[float] = Field(None, ge=0, le=1)
    cdhs_score: Optional[float] = Field(None, ge=0, le=1)
    ml_prediction: Optional[float] = Field(None, ge=0, le=1)
    hwo_priority: Optional[str] = Field(None, regex="^(low|medium|high)$")

class PlanetResponse(PlanetBase):
    """Schema for planet responses"""
    id: int
    habitability_score: Optional[float] = Field(None, description="Habitability score 0-1")
    cdhs_score: Optional[float] = Field(None, description="CDHS algorithm score")
    ml_prediction: Optional[float] = Field(None, description="ML model prediction")
    hwo_priority: Optional[str] = Field(None, description="HWO priority level")
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True

class PlanetListResponse(BaseModel):
    """Schema for paginated planet lists"""
    planets: List[PlanetResponse]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool

class PlanetFilters(BaseModel):
    """Schema for planet filtering"""
    min_habitability: Optional[float] = Field(None, ge=0, le=1)
    max_habitability: Optional[float] = Field(None, ge=0, le=1)
    min_distance: Optional[float] = Field(None, ge=0)
    max_distance: Optional[float] = Field(None, ge=0)
    stellar_type: Optional[str] = None
    hwo_priority: Optional[str] = Field(None, regex="^(low|medium|high)$")
    discovery_year_min: Optional[int] = Field(None, ge=1990)
    discovery_year_max: Optional[int] = Field(None, le=2030)
    
    @validator('max_habitability')
    def validate_habitability_range(cls, v, values):
        if v is not None and 'min_habitability' in values:
            min_hab = values['min_habitability']
            if min_hab is not None and v < min_hab:
                raise ValueError('max_habitability must be >= min_habitability')
        return v
```

### 5. Service Layer

**services/habitability_service.py** - Habitability Calculations
```python
from typing import List, Dict, Optional
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.models.planet import Planet
from app.schemas.planet import PlanetResponse
from app.utils.validators import validate_planet_data

class HabitabilityService:
    """Service for habitability score calculations"""
    
    @staticmethod
    def calculate_cdhs_score(planet_data: Dict) -> float:
        """
        Calculate Comprehensive Distance Habitability Score (CDHS)
        
        Factors:
        - Temperature zone compatibility
        - Planet size suitability
        - Orbital stability
        - Stellar characteristics
        """
        score_components = {}
        
        # Temperature Score (0-1)
        if planet_data.get('st_teff') and planet_data.get('pl_orbsmax'):
            temp_score = HabitabilityService._calculate_temperature_score(
                planet_data['st_teff'], 
                planet_data['pl_orbsmax']
            )
            score_components['temperature'] = temp_score
        else:
            score_components['temperature'] = 0.0
        
        # Size Score (0-1)
        if planet_data.get('pl_rade'):
            size_score = HabitabilityService._calculate_size_score(
                planet_data['pl_rade']
            )
            score_components['size'] = size_score
        else:
            score_components['size'] = 0.0
        
        # Orbital Score (0-1)
        if planet_data.get('pl_orbeccen'):
            orbital_score = HabitabilityService._calculate_orbital_score(
                planet_data['pl_orbeccen']
            )
            score_components['orbital'] = orbital_score
        else:
            score_components['orbital'] = 0.5  # Assume circular orbit
        
        # Stellar Score (0-1)
        if planet_data.get('st_teff') and planet_data.get('st_mass'):
            stellar_score = HabitabilityService._calculate_stellar_score(
                planet_data['st_teff'], 
                planet_data['st_mass']
            )
            score_components['stellar'] = stellar_score
        else:
            score_components['stellar'] = 0.0
        
        # Weighted average
        weights = {
            'temperature': 0.4,
            'size': 0.3,
            'orbital': 0.15,
            'stellar': 0.15
        }
        
        cdhs_score = sum(
            score_components[factor] * weights[factor]
            for factor in weights.keys()
        )
        
        return min(max(cdhs_score, 0.0), 1.0)
    
    @staticmethod
    def _calculate_temperature_score(stellar_temp: float, semi_major_axis: float) -> float:
        """Calculate temperature-based habitability score"""
        # Simplified habitable zone calculation
        # Based on stellar temperature and distance
        
        # Habitable zone inner and outer bounds (AU)
        hz_inner = 0.95 * (stellar_temp / 5778) ** 0.5
        hz_outer = 1.37 * (stellar_temp / 5778) ** 0.5
        
        if hz_inner <= semi_major_axis <= hz_outer:
            # Planet is in habitable zone
            hz_center = (hz_inner + hz_outer) / 2
            distance_from_center = abs(semi_major_axis - hz_center)
            hz_width = hz_outer - hz_inner
            
            # Score decreases with distance from center
            return 1.0 - (distance_from_center / (hz_width / 2)) * 0.3
        elif semi_major_axis < hz_inner:
            # Too hot - exponential decay
            ratio = semi_major_axis / hz_inner
            return max(0.0, 0.7 * ratio ** 2)
        else:
            # Too cold - exponential decay
            ratio = hz_outer / semi_major_axis
            return max(0.0, 0.5 * ratio ** 1.5)
    
    @staticmethod
    def _calculate_size_score(planet_radius: float) -> float:
        """Calculate size-based habitability score"""
        # Optimal range for rocky planets: 0.5-2.0 Earth radii
        if 0.5 <= planet_radius <= 2.0:
            # Highest score for Earth-like sizes
            if 0.8 <= planet_radius <= 1.25:
                return 1.0
            elif planet_radius < 0.8:
                return 0.7 + 0.3 * (planet_radius - 0.5) / 0.3
            else:
                return 1.0 - 0.4 * (planet_radius - 1.25) / 0.75
        elif planet_radius < 0.5:
            # Too small - likely can't retain atmosphere
            return 0.2 * (planet_radius / 0.5)
        else:
            # Too large - likely gas giant
            return max(0.0, 0.3 * (3.0 - planet_radius) / 1.0)
    
    @staticmethod
    def _calculate_orbital_score(eccentricity: float) -> float:
        """Calculate orbital stability score"""
        # Lower eccentricity = more stable orbit = higher score
        if eccentricity <= 0.1:
            return 1.0
        elif eccentricity <= 0.3:
            return 1.0 - 0.3 * (eccentricity - 0.1) / 0.2
        else:
            return max(0.0, 0.7 - 0.7 * (eccentricity - 0.3) / 0.7)
    
    @staticmethod
    def _calculate_stellar_score(stellar_temp: float, stellar_mass: float) -> float:
        """Calculate stellar characteristics score"""
        # Main sequence stars are preferred
        # Sun-like stars (G-type) get highest scores
        
        temp_score = 1.0
        if 3500 <= stellar_temp <= 6500:  # K and G type stars
            if 5000 <= stellar_temp <= 6000:  # G-type (Sun-like)
                temp_score = 1.0
            else:
                temp_score = 0.8
        elif 6500 < stellar_temp <= 7500:  # F-type
            temp_score = 0.6
        else:
            temp_score = 0.3
        
        mass_score = 1.0
        if 0.5 <= stellar_mass <= 1.5:  # Suitable mass range
            if 0.8 <= stellar_mass <= 1.2:  # Sun-like
                mass_score = 1.0
            else:
                mass_score = 0.8
        else:
            mass_score = 0.4
        
        return (temp_score + mass_score) / 2

    @staticmethod
    def calculate_hwo_priority(planet: Planet) -> str:
        """Calculate HWO mission priority based on multiple factors"""
        score = 0
        
        # Habitability score contribution (40%)
        if planet.habitability_score:
            score += planet.habitability_score * 0.4
        
        # Distance factor (30%) - closer is better
        if planet.st_dist:
            distance_score = max(0, 1 - (planet.st_dist - 5) / 45)  # Optimal < 50 pc
            score += distance_score * 0.3
        
        # Stellar brightness (20%) - brighter stars are easier to observe
        if planet.st_mass and planet.st_rad:
            brightness_score = min(1.0, (planet.st_mass * planet.st_rad ** 2) / 2)
            score += brightness_score * 0.2
        
        # Size factor (10%) - Earth-like sizes preferred
        if planet.pl_rade:
            size_score = HabitabilityService._calculate_size_score(planet.pl_rade)
            score += size_score * 0.1
        
        # Classify priority
        if score >= 0.75:
            return "high"
        elif score >= 0.5:
            return "medium"
        else:
            return "low"
```

### 6. API Endpoints

**api/planets.py** - Planet Data Endpoints
```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.planet import Planet
from app.schemas.planet import PlanetResponse, PlanetListResponse, PlanetFilters
from app.services.planet_service import PlanetService

router = APIRouter()

@router.get("/", response_model=PlanetListResponse)
async def get_planets(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(100, ge=1, le=1000, description="Items per page"),
    min_habitability: Optional[float] = Query(None, ge=0, le=1),
    max_distance: Optional[float] = Query(None, ge=0),
    stellar_type: Optional[str] = Query(None),
    hwo_priority: Optional[str] = Query(None, regex="^(low|medium|high)$"),
    search: Optional[str] = Query(None, description="Search planet names"),
    db: Session = Depends(get_db)
):
    """
    Retrieve paginated list of exoplanets with optional filtering
    
    - **page**: Page number (1-based)
    - **limit**: Number of items per page (max 1000)
    - **min_habitability**: Minimum habitability score
    - **max_distance**: Maximum distance in parsecs
    - **stellar_type**: Stellar spectral type filter
    - **hwo_priority**: Priority level filter
    - **search**: Text search in planet names
    """
    
    filters = PlanetFilters(
        min_habitability=min_habitability,
        max_distance=max_distance,
        stellar_type=stellar_type,
        hwo_priority=hwo_priority
    )
    
    try:
        result = PlanetService.get_planets_paginated(
            db=db,
            page=page,
            limit=limit,
            filters=filters,
            search=search
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{planet_name}", response_model=PlanetResponse)
async def get_planet_by_name(
    planet_name: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific exoplanet
    
    - **planet_name**: Name of the exoplanet
    """
    planet = db.query(Planet).filter(Planet.pl_name == planet_name).first()
    
    if not planet:
        raise HTTPException(
            status_code=404, 
            detail=f"Planet '{planet_name}' not found"
        )
    
    return planet

@router.get("/statistics/summary")
async def get_planet_statistics(db: Session = Depends(get_db)):
    """Get summary statistics for the planet database"""
    
    try:
        stats = PlanetService.get_statistics(db)
        return {
            "total_planets": stats["total"],
            "high_priority": stats["high_priority"],
            "average_habitability": stats["avg_habitability"],
            "distance_range": {
                "min": stats["min_distance"],
                "max": stats["max_distance"]
            },
            "discovery_years": {
                "earliest": stats["earliest_discovery"],
                "latest": stats["latest_discovery"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

This backend architecture provides a robust, scalable foundation for the NASA HWO Habitability Explorer with proper separation of concerns, comprehensive error handling, and type safety throughout the application stack.
