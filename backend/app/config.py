"""
Configuration settings for the HWO Habitability Explorer
"""

import os
from typing import List
from pydantic import BaseModel, Field

class Settings(BaseModel):
    # CORS settings
    ALLOWED_ORIGINS: List[str] = Field(
    default=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
        description="Allowed CORS origins"
    )
    
    # Database settings
    DATABASE_URL: str = Field(
        default="postgresql://user:password@localhost/hwo_db",
        description="Database connection string"
    )
    
    # Security settings
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production",
        description="Secret key for JWT tokens"
    )
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Token expiry time")
    
    # External API URLs
    NASA_EXOPLANET_URL: str = Field(
        default="https://exoplanetarchive.ipac.caltech.edu/TAP/sync",
        description="NASA Exoplanet Archive API URL"
    )
    GAIA_URL: str = Field(
        default="https://gea.esac.esa.int/tap-server/tap",
        description="GAIA catalog API URL"
    )
    
    # Model settings
    MODEL_PATH: str = Field(
        default="./models/xgboost_habitability.pkl",
        description="Path to trained ML model"
    )
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False
    }

# Create settings instance
settings = Settings()

# Load from environment variables if they exist
if os.path.exists(".env"):
    from dotenv import load_dotenv
    load_dotenv()
    
    # Override with environment variables
    origins = os.getenv("ALLOWED_ORIGINS")
    if origins:
        settings.ALLOWED_ORIGINS = origins.split(",")
    
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        settings.DATABASE_URL = database_url
        
    secret_key = os.getenv("SECRET_KEY")
    if secret_key:
        settings.SECRET_KEY = secret_key
        
    nasa_url = os.getenv("NASA_EXOPLANET_URL")
    if nasa_url:
        settings.NASA_EXOPLANET_URL = nasa_url
        
    gaia_url = os.getenv("GAIA_URL")
    if gaia_url:
        settings.GAIA_URL = gaia_url
        
    model_path = os.getenv("MODEL_PATH")
    if model_path:
        settings.MODEL_PATH = model_path
