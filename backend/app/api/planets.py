from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.utils.observability import ObservabilityParams, compute_observability

router = APIRouter()

class Planet(BaseModel):
    id: str
    name: str
    radius: float
    mass: Optional[float]
    temperature: float
    orbital_period: float
    distance: float
    habitability_score: float

# Mock data
mock_planets = [
    Planet(
        id="1",
        name="Kepler-442b",
        radius=1.34,
        mass=2.36,
        temperature=233,
        orbital_period=112.3,
        distance=1206,
        habitability_score=0.84
    ),
    Planet(
        id="2",
        name="Kepler-62f",
        radius=1.41,
        mass=2.57,
        temperature=208,
        orbital_period=267.3,
        distance=1200,
        habitability_score=0.67
    ),
    Planet(
        id="3",
        name="TRAPPIST-1e",
        radius=0.92,
        mass=0.77,
        temperature=251,
        orbital_period=6.1,
        distance=39.5,
        habitability_score=0.95
    )
]

@router.get("/", response_model=List[Planet])
async def get_planets():
    """Get all planets"""
    return mock_planets

@router.get("/{planet_id}", response_model=Planet)
async def get_planet(planet_id: str):
    """Get a specific planet by ID"""
    for planet in mock_planets:
        if planet.id == planet_id:
            return planet
    raise HTTPException(status_code=404, detail="Planet not found")


@router.get("/{planet_id}/hwo-details")
async def planet_hwo_details(planet_id: str, telescope_diameter_m: float = 6.0, wavelength_band: str = 'Visible', inner_working_angle_mas: float = 75.0, contrast_sensitivity: float = 1e-10):
    for planet in mock_planets:
        if planet.id == planet_id:
            params = ObservabilityParams(telescope_diameter_m=telescope_diameter_m, wavelength_band=wavelength_band, inner_working_angle_mas=inner_working_angle_mas, contrast_sensitivity=contrast_sensitivity)
            details = compute_observability(planet.dict(), params)
            return {**planet.dict(), 'hwo': details}
    raise HTTPException(status_code=404, detail='Planet not found')

@router.get("/search/", response_model=List[Planet])
async def search_planets(
    min_score: Optional[float] = None,
    max_distance: Optional[float] = None
):
    """Search planets by criteria"""
    results = mock_planets
    
    if min_score is not None:
        results = [p for p in results if p.habitability_score >= min_score]
    
    if max_distance is not None:
        results = [p for p in results if p.distance <= max_distance]
    
    return results
