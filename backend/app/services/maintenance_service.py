from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import datetime

from app.db.models import (
    MaintenanceTask, Aircraft, Component, Prediction, SparePart, Technician, Workshop
)

class MaintenanceService:
    @staticmethod
    def calculate_priority_score(
        failure_prob: float,
        rul_hours: float,
        health_score: float,
        criticality: str,
        spare_available: bool
    ) -> tuple[float, str, str]:
        """
        Deterministic priority score from 0 to 100:
        - 40% Failure Risk Probability
        - 30% RUL Urgency (max score when RUL < 20h)
        - 15% Inverted Aircraft Health (lower health -> higher priority)
        - 15% Component Criticality (CRITICAL=1.0, HIGH=0.8, MEDIUM=0.5, LOW=0.2)
        """
        prob_part = failure_prob * 40.0
        rul_part = max(0.0, min(30.0, (1.0 - (rul_hours / 100.0)) * 30.0))
        health_part = ((100.0 - health_score) / 100.0) * 15.0
        
        crit_weight = {"CRITICAL": 1.0, "HIGH": 0.8, "MEDIUM": 0.5, "LOW": 0.2}.get(criticality, 0.5)
        crit_part = crit_weight * 15.0

        total_score = round(prob_part + rul_part + health_part + crit_part, 1)

        if total_score >= 80.0 or failure_prob >= 0.80 or rul_hours <= 18.0:
            priority = "CRITICAL"
            reason = f"High predicted risk ({int(failure_prob*100)}%), short estimated RUL ({rul_hours}h), and mission-critical subsystem."
        elif total_score >= 60.0:
            priority = "HIGH"
            reason = f"Elevated failure probability ({int(failure_prob*100)}%) with RUL {rul_hours}h approaching maintenance interval."
        elif total_score >= 40.0:
            priority = "MEDIUM"
            reason = f"Moderate telemetry drift observed. Preventive inspection recommended during next turnaround."
        else:
            priority = "LOW"
            reason = "Nominal operating envelope; routine scheduled servicing."

        return total_score, priority, reason

    @staticmethod
    def get_maintenance_queue(db: Session) -> List[Dict[str, Any]]:
        tasks = db.query(MaintenanceTask).all()
        results = []
        for t in tasks:
            # Check spare status
            part = db.query(SparePart).filter(SparePart.part_id == t.required_part_id).first() if t.required_part_id else None
            spare_ok = (part.quantity > 0) if part else True

            results.append({
                "task_id": t.task_id,
                "aircraft_id": t.aircraft_id,
                "component_id": t.component_id,
                "task_name": t.task_name,
                "priority": t.priority,
                "priority_score": t.priority_score,
                "duration_hours": t.duration_hours,
                "required_skill": t.required_skill,
                "required_part_id": t.required_part_id,
                "start_time_slot": t.start_time_slot,
                "end_time_slot": t.end_time_slot,
                "technician_id": t.technician_id,
                "workshop_id": t.workshop_id,
                "rul_deadline_hours": t.rul_deadline_hours,
                "is_optimized": t.is_optimized,
                "status": t.status,
                "spare_available": spare_ok
            })
        
        # Sort queue by priority score descending
        results.sort(key=lambda x: x["priority_score"], reverse=True)
        return results

    @staticmethod
    def get_recommendations(db: Session) -> List[Dict[str, Any]]:
        predictions = db.query(Prediction).filter(
            Prediction.risk_level.in_(["HIGH", "CRITICAL", "MEDIUM"])
        ).all()

        recs = []
        for p in predictions:
            ac = db.query(Aircraft).filter(Aircraft.aircraft_id == p.aircraft_id).first()
            if not ac:
                continue

            # Check spare
            spare = db.query(SparePart).filter(
                SparePart.compatible_component_type == p.component_type,
                SparePart.quantity > 0
            ).first()

            duration = 4 if p.component_type in ["HYDRAULIC", "FUEL"] else 6
            score, prio, reason = MaintenanceService.calculate_priority_score(
                failure_prob=p.maintenance_probability,
                rul_hours=p.predicted_rul_hours,
                health_score=ac.health_score,
                criticality="CRITICAL" if p.component_type in ["ENGINE", "HYDRAULIC"] else "HIGH",
                spare_available=spare is not None
            )

            recs.append({
                "aircraft_id": ac.aircraft_id,
                "component_type": p.component_type,
                "component_id": f"COMP-{ac.aircraft_id}-{p.component_type[:3]}",
                "priority": prio,
                "priority_score": score,
                "reason": reason,
                "suggested_timeframe": f"Within next {int(p.predicted_rul_hours)} flight hours",
                "required_spare": f"{p.component_type.title()} Service Replacement Pack",
                "required_skill": p.component_type,
                "estimated_duration_hours": duration,
                "spare_available_locally": spare is not None and spare.quantity > 0,
                "disclaimer": "Prototype decision support only. Final maintenance actions must follow authorized technical procedures and human review."
            })
        
        recs.sort(key=lambda x: x["priority_score"], reverse=True)
        return recs

maintenance_service = MaintenanceService()
