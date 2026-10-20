from app.services.fleet_service import fleet_service
from app.services.prediction_service import prediction_service
from app.services.health_score_service import health_score_service
from app.services.logistics_service import logistics_service
from app.services.maintenance_service import maintenance_service
from app.services.optimization_service import optimization_service
from app.services.simulation_service import simulation_service
from app.services.alert_service import alert_service

__all__ = [
    "fleet_service",
    "prediction_service",
    "health_score_service",
    "logistics_service",
    "maintenance_service",
    "optimization_service",
    "simulation_service",
    "alert_service"
]
