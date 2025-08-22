from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class HWOTarget(BaseModel):
    id: str
    planet_id: str
    priority: int
    observability_score: float
    habitability_score: float
    distance: float
    observation_time: int
    status: str

# Mock data
mock_targets = [
    HWOTarget(
        id="1",
        planet_id="1",
        priority=1,
        observability_score=0.92,
        habitability_score=0.84,
        distance=1206,
        observation_time=120,
        status="scheduled"
    ),
    HWOTarget(
        id="2",
        planet_id="2",
        priority=2,
        observability_score=0.88,
        habitability_score=0.67,
        distance=1200,
        observation_time=180,
        status="pending"
    ),
    HWOTarget(
        id="3",
        planet_id="3",
        priority=3,
        observability_score=0.95,
        habitability_score=0.95,
        distance=39.5,
        observation_time=90,
        status="completed"
    )
]

@router.get("/", response_model=List[HWOTarget])
async def get_hwo_targets():
    """Get all HWO targets"""
    return mock_targets

@router.get("/{target_id}", response_model=HWOTarget)
async def get_hwo_target(target_id: str):
    """Get a specific HWO target by ID"""
    for target in mock_targets:
        if target.id == target_id:
            return target
    raise HTTPException(status_code=404, detail="HWO target not found")

@router.get("/priority/{priority_level}", response_model=List[HWOTarget])
async def get_targets_by_priority(priority_level: int):
    """Get targets by priority level"""
    return [t for t in mock_targets if t.priority == priority_level]

@router.get("/status/{status}", response_model=List[HWOTarget])
async def get_targets_by_status(status: str):
    """Get targets by status"""
    return [t for t in mock_targets if t.status == status]


class PrioritizeRequest(BaseModel):
    targets: List[dict]
    strategy: Optional[str] = 'default'


@router.post('/prioritize')
async def prioritize_targets(req: PrioritizeRequest):
    """Simple prioritization example: sort by observability_score * habitability_score desc"""
    targets = req.targets
    # compute a simple score
    scored = []
    for t in targets:
        obs = t.get('observability_score') or t.get('observability', 0) or 0
        hab = t.get('habitability_score') or t.get('sephi_score') or t.get('sephi', 0) or 0
        score = obs * hab
        scored.append((score, t))
    scored.sort(key=lambda x: x[0], reverse=True)
    schedule = []
    priority = 1
    for s, t in scored:
        schedule.append({
            'id': str(priority),
            'planet_id': t.get('id') or t.get('pl_name') or t.get('name'),
            'priority': priority,
            'observability_score': t.get('observability_score', obs),
            'habitability_score': t.get('habitability_score', hab),
            'distance': t.get('distance') or t.get('sy_dist') or 0,
            'observation_time': int((1.0 - s) * 120) if s < 1 else 30,
            'status': 'scheduled' if priority == 1 else 'pending'
        })
        priority += 1
    return {'count': len(schedule), 'schedule': schedule}
