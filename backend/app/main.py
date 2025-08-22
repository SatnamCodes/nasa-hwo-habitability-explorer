from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import planets, predictions, hwo_targets
from app.api import observability
from app.api import hwo_scoring
from app.config import settings
from app.utils import model_loader

app = FastAPI(
    title="HWO Habitability Explorer API",
    description="Comprehensive exoplanet habitability and observability analysis platform for NASA's Habitable Worlds Observatory with AI/ML scoring",
    version="1.2.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(planets.router, prefix="/api/v1/planets", tags=["planets"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["predictions"])
app.include_router(hwo_targets.router, prefix="/api/v1/hwo-targets", tags=["hwo-targets"])
app.include_router(observability.router, prefix="/api/v1/observability", tags=["observability"])
app.include_router(hwo_scoring.router, tags=["HWO AI/ML Scoring"])


@app.on_event('startup')
async def load_models_on_startup():
    # Load models proactively to avoid per-request overhead
    try:
        model_loader.load_models()
    except Exception:
        # don't block startup if loading fails; diagnostics via /api/v1/predictions/load-models
        pass

@app.get("/")
async def root():
    return {"message": "HWO Habitability Explorer API with AI/ML Scoring", "version": "1.2.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "hwo-habitability-explorer", "features": ["AI/ML Scoring", "CSV Upload", "Target Filtering"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
