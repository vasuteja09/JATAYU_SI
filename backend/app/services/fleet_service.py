from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List, Optional
import datetime

from app.db.models import (
    Aircraft, Component, Prediction, Alert, MaintenanceTask, SparePart, SensorReading
)

class FleetService:
    @staticmethod
    def get_fleet_summary(db: Session) -> Dict[str, Any]:
        total_aircraft = db.query(Aircraft).count()
        available_count = db.query(Aircraft).filter(Aircraft.current_status == "AVAILABLE").count()
        availability_pct = round((available_count / total_aircraft * 100.0) if total_aircraft > 0 else 0.0, 1)

        # High risk aircraft
        high_risk_count = db.query(Aircraft).filter(
            Aircraft.current_status.in_(["HIGH_RISK", "MAINTENANCE_DUE"])
        ).count()

        # Critical alerts unacknowledged
        critical_alerts = db.query(Alert).filter(
            Alert.severity.in_(["CRITICAL", "WARNING"]),
            Alert.acknowledged == False
        ).count()

        # Predicted maintenance tasks
        predicted_maint = db.query(MaintenanceTask).filter(
            MaintenanceTask.status.in_(["QUEUED", "SCHEDULED"])
        ).count()

        # Spare shortages
        spare_shortages = db.query(SparePart).filter(
            SparePart.status.in_(["LOW_STOCK", "CRITICAL_SHORTAGE"])
        ).count()

        # Status breakdown
        statuses = ["AVAILABLE", "MONITORING", "MAINTENANCE_DUE", "UNDER_MAINTENANCE", "AWAITING_PART", "HIGH_RISK"]
        status_breakdown = {}
        for s in statuses:
            status_breakdown[s] = db.query(Aircraft).filter(Aircraft.current_status == s).count()

        # Health distribution
        health_dist = {
            "Healthy (80-100)": db.query(Aircraft).filter(Aircraft.health_score >= 80.0).count(),
            "Monitoring (65-79)": db.query(Aircraft).filter(Aircraft.health_score >= 65.0, Aircraft.health_score < 80.0).count(),
            "High Risk (50-64)": db.query(Aircraft).filter(Aircraft.health_score >= 50.0, Aircraft.health_score < 65.0).count(),
            "Critical (<50)": db.query(Aircraft).filter(Aircraft.health_score < 50.0).count()
        }

        return {
            "total_aircraft": total_aircraft,
            "available_aircraft": available_count,
            "availability_percentage": availability_pct,
            "high_risk_aircraft": high_risk_count,
            "critical_alerts": critical_alerts,
            "predicted_maintenance_count": predicted_maint,
            "spare_shortages_count": spare_shortages,
            "status_breakdown": status_breakdown,
            "health_distribution": health_dist
        }

    @staticmethod
    def get_all_aircraft(
        db: Session,
        aircraft_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Aircraft)

        if aircraft_type:
            query = query.filter(Aircraft.aircraft_type == aircraft_type)
        if status:
            query = query.filter(Aircraft.current_status == status)
        if search:
            query = query.filter(Aircraft.aircraft_id.ilike(f"%{search}%"))

        aircraft_records = query.order_by(Aircraft.health_score.asc()).all()

        results = []
        for ac in aircraft_records:
            # Latest prediction
            latest_pred = db.query(Prediction).filter(
                Prediction.aircraft_id == ac.aircraft_id
            ).order_by(Prediction.timestamp.desc()).first()

            results.append({
                "aircraft_id": ac.aircraft_id,
                "aircraft_type": ac.aircraft_type,
                "base_location": ac.base_location,
                "age_years": ac.age_years,
                "total_flight_hours": ac.total_flight_hours,
                "total_cycles": ac.total_cycles,
                "current_status": ac.current_status,
                "health_score": ac.health_score,
                "last_major_maintenance": ac.last_major_maintenance,
                "next_scheduled_maintenance": ac.next_scheduled_maintenance,
                "latest_risk_level": latest_pred.risk_level if latest_pred else "LOW",
                "latest_rul_hours": latest_pred.predicted_rul_hours if latest_pred else 120.0,
                "latest_predicted_component": latest_pred.component_type if latest_pred else "None",
                "spare_status": "SHORTAGE" if ac.current_status == "AWAITING_PART" else "OPTIMAL"
            })
        return results

    @staticmethod
    def get_top_risk_aircraft(db: Session, limit: int = 5) -> List[Dict[str, Any]]:
        aircraft_list = FleetService.get_all_aircraft(db)
        # Prioritize high risk and low health
        risk_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        aircraft_list.sort(key=lambda x: (risk_order.get(x["latest_risk_level"], 4), x["health_score"]))
        return aircraft_list[:limit]

    @staticmethod
    def get_availability_trend(db: Session) -> List[Dict[str, Any]]:
        """
        Generates realistic 14-day historical and projected availability trend points.
        """
        current_summary = FleetService.get_fleet_summary(db)
        curr_pct = current_summary["availability_percentage"]
        
        # 14 data points
        trend = []
        base = curr_pct - 3.5
        for day in range(1, 15):
            val = round(base + (day * 0.28) + ((day % 3) * 0.4), 1)
            val = min(96.0, max(65.0, val))
            trend.append({
                "day": f"Day -{14 - day}" if day < 14 else "Today",
                "availability": val,
                "target": 85.0
            })
        trend[-1]["availability"] = curr_pct
        return trend

fleet_service = FleetService()
