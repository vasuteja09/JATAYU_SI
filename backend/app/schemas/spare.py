from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SparePartBase(BaseModel):
    part_id: str
    part_name: str
    compatible_component_type: str
    quantity: int
    reserved_quantity: int
    storage_location: str
    minimum_stock: int
    lead_time_days: int
    status: str

    class Config:
        from_attributes = True

class SpareShortageAlert(BaseModel):
    part_id: str
    part_name: str
    compatible_component_type: str
    affected_aircraft_id: Optional[str] = None
    local_stock: int
    depot_stock: int
    alternative_location: Optional[str] = None
    lead_time_days: int
    shortage_level: str  # WARNING, CRITICAL
    recommendation: str

class SpareReservationRequest(BaseModel):
    part_id: str
    aircraft_id: str
    quantity: int = 1
