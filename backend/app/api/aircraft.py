import re
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Aircraft, Component, SensorReading, MaintenanceRecord, Prediction

router = APIRouter(prefix="/aircraft", tags=["Aircraft Digital Twin"])

_AIRCRAFT_ID_PATTERN = re.compile(r"^[A-Za-z0-9]{1,20}$")


def _validate_aircraft_id(aircraft_id: str) -> str:
    """Validates aircraft_id is alphanumeric and within safe length bounds."""
    if not _AIRCRAFT_ID_PATTERN.match(aircraft_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid aircraft_id format. Must be 1–20 alphanumeric characters."
        )
    return aircraft_id


@router.get("")
def list_all_aircraft(db: Session = Depends(get_db)):
    aircraft = db.query(Aircraft).all()
    return [{
        "aircraft_id": a.aircraft_id,
        "aircraft_type": a.aircraft_type,
        "base_location": a.base_location,
        "current_status": a.current_status,
        "health_score": a.health_score,
        "total_flight_hours": a.total_flight_hours,
        "total_cycles": a.total_cycles
    } for a in aircraft]


@router.get("/{aircraft_id}")
def get_aircraft_detail(aircraft_id: str, db: Session = Depends(get_db)):
    aircraft_id = _validate_aircraft_id(aircraft_id)
    ac = db.query(Aircraft).filter(Aircraft.aircraft_id == aircraft_id).first()
    if not ac:
        raise HTTPException(status_code=404, detail=f"Aircraft {aircraft_id} not found")

    components = db.query(Component).filter(Component.aircraft_id == aircraft_id).all()
    latest_pred = db.query(Prediction).filter(
        Prediction.aircraft_id == aircraft_id
    ).order_by(Prediction.timestamp.desc()).first()

    factors = []
    if latest_pred and latest_pred.top_contributing_factors:
        try:
            factors = json.loads(latest_pred.top_contributing_factors)
        except Exception:
            factors = []

    return {
        "aircraft_id": ac.aircraft_id,
        "aircraft_type": ac.aircraft_type,
        "base_location": ac.base_location,
        "age_years": ac.age_years,
        "total_flight_hours": ac.total_flight_hours,
        "total_cycles": ac.total_cycles,
        "current_status": ac.current_status,
        "health_score": ac.health_score,
        "last_major_maintenance": ac.last_major_maintenance.isoformat() if ac.last_major_maintenance else None,
        "next_scheduled_maintenance": ac.next_scheduled_maintenance.isoformat() if ac.next_scheduled_maintenance else None,
        "components": [{
            "component_id": c.component_id,
            "component_type": c.component_type,
            "component_name": c.component_name,
            "health_score": c.health_score,
            "criticality": c.criticality,
            "current_status": c.current_status,
            "total_operating_hours": c.total_operating_hours,
            "previous_failures": c.previous_failures,
            "compatible_part_id": c.compatible_part_id
        } for c in components],
        "latest_prediction": {
            "prediction_id": latest_pred.prediction_id if latest_pred else None,
            "component_type": latest_pred.component_type if latest_pred else "HYDRAULIC",
            "anomaly_score": latest_pred.anomaly_score if latest_pred else 0.0,
            "anomaly_detected": latest_pred.anomaly_detected if latest_pred else False,
            "anomaly_severity": latest_pred.anomaly_severity if latest_pred else "NORMAL",
            "maintenance_probability": latest_pred.maintenance_probability if latest_pred else 0.15,
            "risk_level": latest_pred.risk_level if latest_pred else "LOW",
            "predicted_rul_hours": latest_pred.predicted_rul_hours if latest_pred else 115.0,
            "rul_lower_bound": latest_pred.rul_lower_bound if latest_pred else 95.0,
            "rul_upper_bound": latest_pred.rul_upper_bound if latest_pred else 135.0,
            "confidence": latest_pred.confidence if latest_pred else 0.90,
            "top_contributing_factors": factors,
            "recommended_action": latest_pred.recommended_action if latest_pred else "Routine monitoring",
            "model_mode": latest_pred.model_mode if latest_pred else "ML_INFERENCE"
        } if latest_pred else None
    }


@router.get("/{aircraft_id}/sensors")
def get_aircraft_sensors(
    aircraft_id: str,
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db)
):
    aircraft_id = _validate_aircraft_id(aircraft_id)
    readings = db.query(SensorReading).filter(
        SensorReading.aircraft_id == aircraft_id
    ).order_by(SensorReading.timestamp.desc()).limit(limit).all()

    readings.reverse()  # Chronological order for charts

    return [{
        "id": r.id,
        "timestamp": r.timestamp.strftime("%H:%M:%S"),
        "temperature": r.temperature,
        "vibration": r.vibration,
        "pressure": r.pressure,
        "hydraulic_pressure": r.hydraulic_pressure,
        "rpm": r.rpm,
        "oil_pressure": r.oil_pressure,
        "fuel_flow": r.fuel_flow,
        "electrical_voltage": r.electrical_voltage,
        "operating_hours": r.operating_hours,
        "flight_cycles": r.flight_cycles
    } for r in readings]


@router.get("/{aircraft_id}/maintenance")
def get_aircraft_maintenance_history(aircraft_id: str, db: Session = Depends(get_db)):
    aircraft_id = _validate_aircraft_id(aircraft_id)
    records = db.query(MaintenanceRecord).filter(
        MaintenanceRecord.aircraft_id == aircraft_id
    ).order_by(MaintenanceRecord.maintenance_date.desc()).all()

    return [{
        "maintenance_id": m.maintenance_id,
        "maintenance_type": m.maintenance_type,
        "fault_code": m.fault_code,
        "fault_description": m.fault_description,
        "maintenance_date": m.maintenance_date.strftime("%Y-%m-%d"),
        "duration_hours": m.duration_hours,
        "action_taken": m.action_taken,
        "status": m.status
    } for m in records]


@router.get("/{aircraft_id}/components")
def get_aircraft_components(aircraft_id: str, db: Session = Depends(get_db)):
    aircraft_id = _validate_aircraft_id(aircraft_id)
    components = db.query(Component).filter(Component.aircraft_id == aircraft_id).all()
    return [{
        "component_id": c.component_id,
        "component_type": c.component_type,
        "component_name": c.component_name,
        "health_score": c.health_score,
        "criticality": c.criticality,
        "current_status": c.current_status,
        "total_operating_hours": c.total_operating_hours,
        "previous_failures": c.previous_failures,
        "compatible_part_id": c.compatible_part_id
    } for c in components]
