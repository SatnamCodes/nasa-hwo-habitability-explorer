from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
import requests
import pandas as pd
import io
from app.config import settings

router = APIRouter()

class PlanetData(BaseModel):
    pl_name: str
    hostname: str
    pl_orbper: Optional[float]
    pl_orbsmax: Optional[float]
    pl_radj: Optional[float]
    pl_bmassj: Optional[float]
    st_teff: Optional[float]
    st_dist: Optional[float]
    ra: Optional[float]
    dec: Optional[float]
    pl_eqt: Optional[float]
    st_mass: Optional[float]
    st_rad: Optional[float]

@router.get("/live-data", response_model=List[PlanetData])
async def get_live_planet_data(limit: int = 1000):
    """
    Fetch live planet data from NASA Exoplanet Archive
    """
    try:
        # NASA Exoplanet Archive TAP service
        base_url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
        query = f"SELECT TOP {limit} pl_name, hostname, pl_orbper, pl_orbsmax, pl_radj, pl_bmassj, st_teff, st_dist, ra, dec, pl_eqt, st_mass, st_rad FROM ps WHERE pl_name IS NOT NULL"
        params = {
            'query': query,
            'format': 'csv',
            'api_key': settings.NASA_API_KEY
        }

        response = requests.get(base_url, params=params)
        response.raise_for_status()

        # Parse CSV data
        df = pd.read_csv(io.StringIO(response.text))

        # Convert to PlanetData objects
        planets = []
        for _, row in df.iterrows():
            planet = PlanetData(
                pl_name=str(row.get('pl_name', '')),
                hostname=str(row.get('hostname', '')),
                pl_orbper=float(row.get('pl_orbper', 0)) if pd.notna(row.get('pl_orbper')) else None,
                pl_orbsmax=float(row.get('pl_orbsmax', 0)) if pd.notna(row.get('pl_orbsmax')) else None,
                pl_radj=float(row.get('pl_radj', 0)) if pd.notna(row.get('pl_radj')) else None,
                pl_bmassj=float(row.get('pl_bmassj', 0)) if pd.notna(row.get('pl_bmassj')) else None,
                st_teff=float(row.get('st_teff', 0)) if pd.notna(row.get('st_teff')) else None,
                st_dist=float(row.get('st_dist', 0)) if pd.notna(row.get('st_dist')) else None,
                ra=float(row.get('ra', 0)) if pd.notna(row.get('ra')) else None,
                dec=float(row.get('dec', 0)) if pd.notna(row.get('dec')) else None,
                pl_eqt=float(row.get('pl_eqt', 0)) if pd.notna(row.get('pl_eqt')) else None,
                st_mass=float(row.get('st_mass', 0)) if pd.notna(row.get('st_mass')) else None,
                st_rad=float(row.get('st_rad', 0)) if pd.notna(row.get('st_rad')) else None,
            )
            planets.append(planet)

        return planets

    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch data from NASA API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing planet data: {str(e)}")

@router.post("/refresh-data")
async def refresh_planet_data(background_tasks: BackgroundTasks):
    """
    Trigger background refresh of planet data from NASA
    """
    background_tasks.add_task(fetch_and_update_data)
    return {"message": "Data refresh started in background"}

async def fetch_and_update_data():
    """
    Background task to fetch and update planet data
    """
    try:
        # This would update the local CSV file
        base_url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
        query = "SELECT * FROM ps WHERE pl_name IS NOT NULL"
        params = {
            'query': query,
            'format': 'csv',
            'api_key': settings.NASA_API_KEY
        }

        response = requests.get(base_url, params=params)
        response.raise_for_status()

        # Save to data directory
        data_path = "data_science/datasets/nasa_exoplanets_live.csv"
        with open(data_path, 'w', encoding='utf-8') as f:
            f.write(response.text)

        print("✅ Live planet data refreshed successfully")

    except Exception as e:
        print(f"❌ Error refreshing data: {str(e)}")
