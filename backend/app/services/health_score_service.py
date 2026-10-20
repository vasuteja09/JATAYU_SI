from typing import Dict, Any, List
from app.config import settings

class HealthScoreService:
    @staticmethod
    def calculate_health_score(
        sensor_health: float,
        component_health: float,
        maintenance_health: float,
        failure_probability: float
    ) -> float:
        """
        Documented prototype health score formula:
        Health Score = 100 * (
            0.30 * sensor_health +
            0.30 * component_health +
            0.20 * maintenance_health +
            0.20 * (1.0 - failure_probability)
        )
        Clamped to [5.0, 99.0]. Not an official aviation airworthiness certificate.
        """
        w_s = settings.WEIGHT_SENSOR_HEALTH
        w_c = settings.WEIGHT_COMPONENT_HEALTH
        w_m = settings.WEIGHT_MAINTENANCE_HEALTH
        w_r = settings.WEIGHT_RISK_HEALTH

        # Normalize health components to [0, 1]
        s_norm = max(0.0, min(1.0, sensor_health / 100.0))
        c_norm = max(0.0, min(1.0, component_health / 100.0))
        m_norm = max(0.0, min(1.0, maintenance_health / 100.0))
        r_norm = max(0.0, min(1.0, 1.0 - failure_probability))

        score = 100.0 * (w_s * s_norm + w_c * c_norm + w_m * m_norm + w_r * r_norm)
        return round(float(max(5.0, min(99.0, score))), 1)

    @staticmethod
    def get_methodology() -> Dict[str, Any]:
        return {
            "title": "Prototype Health Score Methodology",
            "disclaimer": "Prototype decision-support indicator only. Not an official military airworthiness certificate.",
            "formula": "Score = 100 * (0.30*Sensor + 0.30*Component + 0.20*Maintenance + 0.20*(1 - FailureProbability))",
            "weights": {
                "sensor_health": settings.WEIGHT_SENSOR_HEALTH,
                "component_health": settings.WEIGHT_COMPONENT_HEALTH,
                "maintenance_health": settings.WEIGHT_MAINTENANCE_HEALTH,
                "failure_risk_inversion": settings.WEIGHT_RISK_HEALTH
            }
        }

health_score_service = HealthScoreService()
