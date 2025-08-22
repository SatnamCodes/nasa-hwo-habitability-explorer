from fastapi import APIRouter, UploadFile, File, HTTPException, Query, WebSocket, WebSocketDisconnect
from typing import List, Optional
import csv
import io
import asyncio
from app.api.planets import mock_planets as backend_planets

from app.utils.observability import (
    ObservabilityParams,
    compute_observability,
    score_batch,
)

router = APIRouter()

# simple in-memory websocket subscriber list for real-time param broadcasts
_connected_webs: List[WebSocket] = []

async def _broadcast(message: dict):
    dead = []
    for ws in list(_connected_webs):
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for d in dead:
        try:
            _connected_webs.remove(d)
        except ValueError:
            pass


def parse_csv(file_bytes: bytes) -> List[dict]:
    try:
        text = file_bytes.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(text))
        return [row for row in reader]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")


@router.post("/score-csv")
async def score_csv(
    file: UploadFile = File(...),
    telescope_diameter_m: float = Query(6.0, ge=4.0, le=8.0),
    wavelength_band: str = Query("Visible"),
    inner_working_angle_mas: float = Query(75.0, ge=50.0, le=100.0),
    contrast_sensitivity: float = Query(1e-10, ge=1e-12, le=1e-8),
):
    content = await file.read()
    planets = parse_csv(content)
    params = ObservabilityParams(
        telescope_diameter_m=telescope_diameter_m,
        wavelength_band=wavelength_band,
        inner_working_angle_mas=inner_working_angle_mas,
        contrast_sensitivity=contrast_sensitivity,
    )
    scores = score_batch(planets, params)
    # merge with basic identifiers if present
    out = []
    for row, s in zip(planets, scores):
        out.append({
            "pl_name": row.get("pl_name", row.get("name", "unknown")),
            **s,
        })
    return {"count": len(out), "results": out}


@router.get('/count')
async def observable_count(
    telescope_diameter_m: float = Query(6.0, ge=1.0, le=50.0),
    wavelength_band: str = Query("Visible"),
    inner_working_angle_mas: float = Query(75.0),
    contrast_sensitivity: float = Query(1e-10),
    threshold: float = Query(0.5),
):
    """Return number of observable planets given telescope params"""
    params = ObservabilityParams(
        telescope_diameter_m=telescope_diameter_m,
        wavelength_band=wavelength_band,
        inner_working_angle_mas=inner_working_angle_mas,
        contrast_sensitivity=contrast_sensitivity,
    )
    count = 0
    total = 0
    for p in backend_planets:
        total += 1
        pd = p.dict() if hasattr(p, 'dict') else dict(p)
        res = compute_observability(pd, params)
        if res.get('observability_score', 0) >= threshold:
            count += 1
    return {"count": count, "total": total}


@router.post('/publish-params')
async def publish_params(params: dict):
    """Receive param updates and broadcast to connected websocket clients"""
    asyncio.create_task(_broadcast({'type': 'params_update', 'params': params}))
    return {"published": True}


@router.websocket('/ws/params')
async def websocket_params(ws: WebSocket):
    await ws.accept()
    _connected_webs.append(ws)
    try:
        # keep connection open; server pushes updates when publish_params is called
        while True:
            # keepalive ping from client optional
            await ws.receive_text()
    except WebSocketDisconnect:
        try:
            _connected_webs.remove(ws)
        except ValueError:
            pass


@router.post("/score")
async def score_single(
    planet: dict,
    telescope_diameter_m: float = Query(6.0, ge=4.0, le=8.0),
    wavelength_band: str = Query("Visible"),
    inner_working_angle_mas: float = Query(75.0, ge=50.0, le=100.0),
    contrast_sensitivity: float = Query(1e-10, ge=1e-12, le=1e-8),
):
    params = ObservabilityParams(
        telescope_diameter_m=telescope_diameter_m,
        wavelength_band=wavelength_band,
        inner_working_angle_mas=inner_working_angle_mas,
        contrast_sensitivity=contrast_sensitivity,
    )
    return compute_observability(planet, params)


@router.post("/export-csv")
async def export_csv(
    file: UploadFile = File(...),
    telescope_diameter_m: float = Query(6.0, ge=4.0, le=8.0),
    wavelength_band: str = Query("Visible"),
    inner_working_angle_mas: float = Query(75.0, ge=50.0, le=100.0),
    contrast_sensitivity: float = Query(1e-10, ge=1e-12, le=1e-8),
):
    content = await file.read()
    planets = parse_csv(content)
    params = ObservabilityParams(
        telescope_diameter_m=telescope_diameter_m,
        wavelength_band=wavelength_band,
        inner_working_angle_mas=inner_working_angle_mas,
        contrast_sensitivity=contrast_sensitivity,
    )
    scores = score_batch(planets, params)

    output = io.StringIO()
    fieldnames = [
        "pl_name",
        "separation_mas",
        "contrast_ratio",
        "required_diameter_m",
        "spectroscopic_score",
        "iwa_score",
        "observability_score",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row, s in zip(planets, scores):
        writer.writerow({
            "pl_name": row.get("pl_name", row.get("name", "unknown")),
            **s,
        })
    return {"filename": "hwo_scores.csv", "content": output.getvalue()}
