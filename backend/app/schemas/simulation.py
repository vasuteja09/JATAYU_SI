from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class SimulationStepResult(BaseModel):
    step: int
    scenario: str
    target_aircraft_id: str
    sensor_updates: Dict[str, float]
    anomaly_status: str
    anomaly_score: float
    maintenance_probability: float
    risk_level: str
    estimated_rul: float
    health_score: float
    timeline_stage: str  # HEALTHY -> MONITORING -> WARNING -> HIGH_RISK
    alert_generated: Optional[str] = None
    spare_requirement: Optional[str] = None

class SimulationScenarioRequest(BaseModel):
    scenario_type: str  # HEALTHY, SENSOR_DEGRADATION, SPARE_SHORTAGE, RESOURCE_BOTTLENECK, HIGH_DEMAND
    target_aircraft_id: Optional[str] = "A101"
    deterioration_rate: Optional[float] = 1.0
    technician_availability_pct: Optional[float] = 100.0
    workshop_capacity_pct: Optional[float] = 100.0

class SimulationStatus(BaseModel):
    is_running: bool
    current_step: int
    active_scenario: str
    speed_multiplier: float
    last_tick_at: Optional[datetime] = None
