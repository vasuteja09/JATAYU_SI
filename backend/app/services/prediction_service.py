import json
import datetime
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.db.models import (
    Aircraft, Component, SensorReading, Prediction, Alert, MaintenanceTask
)
from app.ml.model_manager import model_manager
from app.ml.feature_engineering.features import (
    extract_sensor_features, get_feature_column_names, SENSOR_COLUMNS
)
from app.services.health_score_service import health_score_service

class PredictionService:
    @staticmethod
    def run_prediction_for_aircraft(
        db: Session,
        aircraft_id: str,
        component_type: str = "HYDRAULIC"
    ) -> Dict[str, Any]:
        ac = db.query(Aircraft).filter(Aircraft.aircraft_id == aircraft_id).first()
        if not ac:
            raise ValueError(f"Aircraft {aircraft_id} not found")

        # Fetch recent readings
        readings = db.query(SensorReading).filter(
            SensorReading.aircraft_id == aircraft_id
        ).order_by(SensorReading.timestamp.asc()).all()

        if not readings:
            # Fallback reading
            raw_dict = {c: 80.0 for c in SENSOR_COLUMNS}
            raw_dict["vibration"] = 0.18
            raw_dict["hydraulic_pressure"] = 3000.0
            feature_vec = np.zeros(len(get_feature_column_names()))
        else:
            df_s = pd.DataFrame([{
                "id": r.id, "aircraft_id": r.aircraft_id, "component_id": r.component_id,
                "timestamp": r.timestamp, "temperature": r.temperature, "vibration": r.vibration,
                "pressure": r.pressure, "rpm": r.rpm, "fuel_flow": r.fuel_flow,
                "oil_pressure": r.oil_pressure, "hydraulic_pressure": r.hydraulic_pressure,
                "electrical_voltage": r.electrical_voltage, "operating_hours": r.operating_hours,
                "flight_cycles": r.flight_cycles, "scenario_tag": r.scenario_tag
            } for r in readings])

            df_feat = extract_sensor_features(df_s)
            latest_row = df_feat.iloc[-1].copy()

            # Add airframe metadata
            latest_row["age_years"] = ac.age_years
            latest_row["total_flight_hours"] = ac.total_flight_hours
            latest_row["total_cycles"] = ac.total_cycles
            latest_row["hours_since_last_maint"] = 120.0
            latest_row["total_past_maintenance_events"] = 3

            feature_cols = get_feature_column_names()
            vec = []
            for col in feature_cols:
                vec.append(float(latest_row.get(col, 0.0)))
            feature_vec = np.array(vec, dtype=float)

        # Run inference via singleton ModelManager
        inference_res = model_manager.run_all_inference(
            feature_vec, aircraft_id=aircraft_id, component_type=component_type
        )

        now = datetime.datetime.utcnow()

        # Update or create Prediction record
        pred_record = db.query(Prediction).filter(
            Prediction.aircraft_id == aircraft_id
        ).first()

        factors_json = json.dumps(inference_res["top_contributing_factors"])

        if pred_record:
            pred_record.timestamp = now
            pred_record.component_type = component_type
            pred_record.anomaly_score = inference_res["anomaly_score"]
            pred_record.anomaly_detected = inference_res["anomaly_detected"]
            pred_record.anomaly_severity = inference_res["anomaly_severity"]
            pred_record.maintenance_probability = inference_res["maintenance_probability"]
            pred_record.risk_level = inference_res["risk_level"]
            pred_record.predicted_rul_hours = inference_res["predicted_rul_hours"]
            pred_record.rul_lower_bound = inference_res["rul_lower_bound"]
            pred_record.rul_upper_bound = inference_res["rul_upper_bound"]
            pred_record.confidence = inference_res["confidence"]
            pred_record.top_contributing_factors = factors_json
            pred_record.recommended_action = inference_res["recommended_action"]
            pred_record.model_mode = inference_res["model_mode"]
        else:
            pred_record = Prediction(
                prediction_id=f"PRED-{aircraft_id}-{int(now.timestamp())}",
                aircraft_id=aircraft_id,
                component_type=component_type,
                timestamp=now,
                anomaly_score=inference_res["anomaly_score"],
                anomaly_detected=inference_res["anomaly_detected"],
                anomaly_severity=inference_res["anomaly_severity"],
                maintenance_probability=inference_res["maintenance_probability"],
                risk_level=inference_res["risk_level"],
                predicted_rul_hours=inference_res["predicted_rul_hours"],
                rul_lower_bound=inference_res["rul_lower_bound"],
                rul_upper_bound=inference_res["rul_upper_bound"],
                confidence=inference_res["confidence"],
                top_contributing_factors=factors_json,
                recommended_action=inference_res["recommended_action"],
                model_mode=inference_res["model_mode"]
            )
            db.add(pred_record)

        # Recalculate aircraft health score
        sensor_health = 90.0 if not inference_res["anomaly_detected"] else (55.0 if inference_res["anomaly_severity"] == "HIGH" else 70.0)
        comp_health = 60.0 if inference_res["risk_level"] in ["HIGH", "CRITICAL"] else 88.0
        maint_health = 80.0
        new_health = health_score_service.calculate_health_score(
            sensor_health=sensor_health,
            component_health=comp_health,
            maintenance_health=maint_health,
            failure_probability=inference_res["maintenance_probability"]
        )

        ac.health_score = new_health
        if inference_res["risk_level"] == "CRITICAL":
            ac.current_status = "HIGH_RISK"
        elif inference_res["risk_level"] == "HIGH":
            ac.current_status = "MAINTENANCE_DUE"
        elif inference_res["risk_level"] == "MEDIUM":
            ac.current_status = "MONITORING"
        elif ac.current_status not in ["AWAITING_PART", "UNDER_MAINTENANCE"]:
            ac.current_status = "AVAILABLE"

        # Check if alert should be created
        if inference_res["risk_level"] in ["HIGH", "CRITICAL"]:
            existing_alert = db.query(Alert).filter(
                Alert.aircraft_id == aircraft_id,
                Alert.severity == "CRITICAL",
                Alert.acknowledged == False
            ).first()

            if not existing_alert:
                alert = Alert(
                    alert_id=f"ALT-{aircraft_id}-{int(now.timestamp())}",
                    aircraft_id=aircraft_id,
                    component_type=component_type,
                    severity="CRITICAL",
                    title=f"High Maintenance Risk Detected on {aircraft_id}",
                    reason=f"Model predicted {int(inference_res['maintenance_probability']*100)}% failure risk on {component_type}. Estimated RUL: {inference_res['predicted_rul_hours']}h.",
                    recommended_action=inference_res["recommended_action"],
                    timestamp=now,
                    acknowledged=False
                )
                db.add(alert)

        db.commit()

        # Format output
        return {
            "prediction_id": pred_record.prediction_id,
            "aircraft_id": aircraft_id,
            "component_type": component_type,
            "timestamp": now.isoformat(),
            "anomaly_score": inference_res["anomaly_score"],
            "anomaly_detected": inference_res["anomaly_detected"],
            "anomaly_severity": inference_res["anomaly_severity"],
            "maintenance_probability": inference_res["maintenance_probability"],
            "risk_level": inference_res["risk_level"],
            "predicted_rul_hours": inference_res["predicted_rul_hours"],
            "rul_lower_bound": inference_res["rul_lower_bound"],
            "rul_upper_bound": inference_res["rul_upper_bound"],
            "confidence": inference_res["confidence"],
            "top_contributing_factors": inference_res["top_contributing_factors"],
            "recommended_action": inference_res["recommended_action"],
            "model_mode": inference_res["model_mode"],
            "updated_health_score": new_health,
            "updated_status": ac.current_status
        }

    @staticmethod
    def get_all_predictions(db: Session, risk_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(Prediction).order_by(Prediction.maintenance_probability.desc())
        if risk_filter:
            query = query.filter(Prediction.risk_level == risk_filter)
        records = query.all()

        results = []
        for p in records:
            try:
                factors = json.loads(p.top_contributing_factors)
            except Exception:
                factors = []

            results.append({
                "prediction_id": p.prediction_id,
                "aircraft_id": p.aircraft_id,
                "component_type": p.component_type,
                "timestamp": p.timestamp.isoformat(),
                "anomaly_score": p.anomaly_score,
                "anomaly_detected": p.anomaly_detected,
                "anomaly_severity": p.anomaly_severity,
                "maintenance_probability": p.maintenance_probability,
                "risk_level": p.risk_level,
                "predicted_rul_hours": p.predicted_rul_hours,
                "rul_lower_bound": p.rul_lower_bound,
                "rul_upper_bound": p.rul_upper_bound,
                "confidence": p.confidence,
                "top_contributing_factors": factors,
                "recommended_action": p.recommended_action,
                "model_mode": p.model_mode
            })
        return results

prediction_service = PredictionService()
