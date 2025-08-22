"""
FastAPI backend service for HWO Habitability Explorer
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
from ..utils import model_loader
import pandas as pd
import io
import threading
import uuid
import time
import os

# Simple in-memory job store for background prediction jobs
_jobs = {}


def _run_predict_job(job_id: str):
    _jobs[job_id]['status'] = 'running'
    try:
        res = model_loader.predict_full_dataset()
        _jobs[job_id]['status'] = 'finished'
        _jobs[job_id]['result'] = res
        # store path if available
        _jobs[job_id]['output_file'] = res.get('predictions_saved_to')
    except Exception as e:
        _jobs[job_id]['status'] = 'failed'
        _jobs[job_id]['error'] = str(e)

router = APIRouter()

class Prediction(BaseModel):
    id: str
    planet_id: str
    habitability_score: float
    confidence: float
    algorithm: str
    features_used: List[str]
    prediction_date: str

# Mock data
mock_predictions = [
    Prediction(
        id="1",
        planet_id="1",
        habitability_score=0.84,
        confidence=0.92,
        algorithm="CDHS",
        features_used=["temperature", "radius", "stellar_flux", "orbital_stability"],
        prediction_date="2024-01-15"
    ),
    Prediction(
        id="2",
        planet_id="2",
        habitability_score=0.67,
        confidence=0.88,
        algorithm="CDHS",
        features_used=["temperature", "radius", "stellar_flux", "orbital_stability"],
        prediction_date="2024-01-15"
    )
]

@router.get("/", response_model=List[Prediction])
async def get_predictions():
    """Get all predictions"""
    return mock_predictions


@router.post('/load-models')
async def load_models():
    """Load ML models into server memory (from data_science/models)"""
    res = model_loader.load_models()
    return res


@router.post('/predict-full')
async def predict_full():
    """Start a background job to run predictions on the full dataset and return job id"""
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {'status': 'queued', 'created_at': time.time()}
    thread = threading.Thread(target=_run_predict_job, args=(job_id,))
    thread.start()
    return {'job_id': job_id}


@router.get('/job-status/{job_id}')
async def job_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return job


@router.get('/download/{job_id}')
async def download_job_output(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    if job.get('status') != 'finished':
        raise HTTPException(status_code=400, detail='Job not finished')
    path = job.get('output_file')
    if not path or not os.path.isfile(path):
        raise HTTPException(status_code=404, detail='Output not available')
    from fastapi.responses import FileResponse
    return FileResponse(path, media_type='text/csv', filename=os.path.basename(path))


@router.post('/predict-csv')
async def predict_csv(file: UploadFile = File(...)):
    """Upload CSV of planets and get predictions appended."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        df_out = model_loader.predict_dataframe(df)
        # return top 10 as summary
        top = df_out.sort_values('predicted_sephi', ascending=False).head(10)
        return {'count': len(df_out), 'top_10': top[['pl_name', 'predicted_sephi']].to_dict(orient='records')}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{prediction_id}", response_model=Prediction)
async def get_prediction(prediction_id: str):
    """Get a specific prediction by ID"""
    for prediction in mock_predictions:
        if prediction.id == prediction_id:
            return prediction
    raise HTTPException(status_code=404, detail="Prediction not found")

@router.get("/planet/{planet_id}", response_model=List[Prediction])
async def get_predictions_by_planet(planet_id: str):
    """Get predictions for a specific planet"""
    return [p for p in mock_predictions if p.planet_id == planet_id]
