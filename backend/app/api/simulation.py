from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.services.simulation_service import simulation_service

router = APIRouter(prefix="/simulation", tags=["Simulation Lab"])

class StartSimRequest(BaseModel):
    scenario: str = "SENSOR_DEGRADATION"
    target_aircraft_id: str = "A101"

class StepSimRequest(BaseModel):
    target_aircraft_id: str = "A101"

class ResetSimRequest(BaseModel):
    target_aircraft_id: str = "A101"

@router.get("/state")
def get_simulation_state(db: Session = Depends(get_db)):
    return simulation_service.get_status(db)

@router.post("/start")
def start_simulation(req: StartSimRequest, db: Session = Depends(get_db)):
    return simulation_service.start_simulation(db, req.scenario, req.target_aircraft_id)

@router.post("/step")
def step_simulation(req: StepSimRequest, db: Session = Depends(get_db)):
    return simulation_service.step_simulation(db, req.target_aircraft_id)

@router.post("/pause")
def pause_simulation(db: Session = Depends(get_db)):
    return simulation_service.pause_simulation(db)

@router.post("/reset")
def reset_simulation(req: ResetSimRequest, db: Session = Depends(get_db)):
    return simulation_service.reset_simulation(db, req.target_aircraft_id)
