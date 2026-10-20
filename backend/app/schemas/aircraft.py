from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ComponentBase(BaseModel):
    component_id: str
    aircraft_id: str
    component_type: str
    component_name: str
    total_operating_hours: float
    previous_failures: int
    health_score: float
    criticality: str
    current_status: str
    compatible_part_id: Optional[str] = None

    class Config:
        from_attributes = True

class AircraftBase(BaseModel):
    aircraft_id: str
    aircraft_type: str
    base_location: str
    age_years: float
    total_flight_hours: float
    total_cycles: int
    current_status: str
    health_score: float
    last_major_maintenance: datetime
    next_scheduled_maintenance: datetime

    class Config:
        from_attributes = True

class AircraftDetail(AircraftBase):
    components: List[ComponentBase] = []
    latest_risk_level: Optional[str] = "LOW"
    latest_rul_hours: Optional[float] = 120.0
    latest_predicted_component: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class FleetSummary(BaseModel):
    total_aircraft: int
    available_aircraft: int
    availability_percentage: float
    high_risk_aircraft: int
    critical_alerts: int
    predicted_maintenance_count: int
    spare_shortages_count: int
    status_breakdown: dict[str, int]
    health_distribution: dict[str, int]
