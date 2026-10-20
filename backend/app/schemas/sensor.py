from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SensorReadingBase(BaseModel):
    id: Optional[int] = None
    aircraft_id: str
    component_id: Optional[str] = None
    timestamp: datetime
    temperature: float
    vibration: float
    pressure: float
    rpm: float
    fuel_flow: float
    oil_pressure: float
    hydraulic_pressure: float
    electrical_voltage: float
    operating_hours: float
    flight_cycles: int
    scenario_tag: Optional[str] = "NORMAL"

    class Config:
        from_attributes = True

class SensorStats(BaseModel):
    sensor_name: str
    current_value: float
    unit: str
    baseline_min: float
    baseline_max: float
    status: str  # NORMAL, WARNING, CRITICAL
    trend_slope: float
