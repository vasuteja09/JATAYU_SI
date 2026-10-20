from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MaintenanceRecordBase(BaseModel):
    maintenance_id: str
    aircraft_id: str
    component_id: Optional[str] = None
    maintenance_type: str
    fault_code: Optional[str] = None
    fault_description: Optional[str] = None
    maintenance_date: datetime
    duration_hours: float
    action_taken: Optional[str] = None
    workshop_id: Optional[str] = None
    technician_id: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class MaintenanceRecommendation(BaseModel):
    aircraft_id: str
    component_type: str
    component_id: str
    priority: str
    priority_score: float
    reason: str
    suggested_timeframe: str
    required_spare: str
    required_skill: str
    estimated_duration_hours: int
    spare_available_locally: bool
    disclaimer: str = (
        "Prototype decision support only. Final maintenance actions must follow "
        "authorized technical procedures and human review."
    )

class MaintenanceTaskItem(BaseModel):
    task_id: str
    aircraft_id: str
    component_id: str
    task_name: str
    priority: str
    priority_score: float
    duration_hours: int
    required_skill: str
    required_part_id: Optional[str] = None
    start_time_slot: int
    end_time_slot: int
    technician_id: Optional[str] = None
    workshop_id: Optional[str] = None
    rul_deadline_hours: float
    is_optimized: bool
    status: str

    class Config:
        from_attributes = True

class ScheduleOptimizationResult(BaseModel):
    status: str
    conflicts_resolved: int
    baseline_downtime_hours: float
    optimized_downtime_hours: float
    downtime_reduction_hours: float
    baseline_fleet_availability: float
    projected_fleet_availability: float
    availability_improvement_percent: float
    schedule: List[MaintenanceTaskItem]
    optimization_message: str
