from app.schemas.common import ApiResponse, DataProvenance
from app.schemas.aircraft import AircraftBase, AircraftDetail, FleetSummary, ComponentBase
from app.schemas.sensor import SensorReadingBase, SensorStats
from app.schemas.prediction import PredictionBase, PredictionSummary, FactorContribution
from app.schemas.maintenance import (
    MaintenanceRecordBase, MaintenanceRecommendation, MaintenanceTaskItem,
    ScheduleOptimizationResult
)
from app.schemas.spare import SparePartBase, SpareShortageAlert, SpareReservationRequest
from app.schemas.alert import AlertBase, AlertAcknowledgeRequest
from app.schemas.simulation import (
    SimulationStepResult, SimulationScenarioRequest, SimulationStatus
)

__all__ = [
    "ApiResponse", "DataProvenance",
    "AircraftBase", "AircraftDetail", "FleetSummary", "ComponentBase",
    "SensorReadingBase", "SensorStats",
    "PredictionBase", "PredictionSummary", "FactorContribution",
    "MaintenanceRecordBase", "MaintenanceRecommendation", "MaintenanceTaskItem",
    "ScheduleOptimizationResult",
    "SparePartBase", "SpareShortageAlert", "SpareReservationRequest",
    "AlertBase", "AlertAcknowledgeRequest",
    "SimulationStepResult", "SimulationScenarioRequest", "SimulationStatus"
]
