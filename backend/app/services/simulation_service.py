import datetime
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.db.models import (
    SimulationState, Aircraft, Component, SensorReading,
    Prediction, Alert, MaintenanceTask, SparePart
)
from app.services.prediction_service import prediction_service

class SimulationService:
    @staticmethod
    def get_status(db: Session) -> Dict[str, Any]:
        state = db.query(SimulationState).first()
        if not state:
            state = SimulationState(id=1, is_running=False, current_step=0, active_scenario="HEALTHY")
            db.add(state)
            db.commit()
        return {
            "is_running": state.is_running,
            "current_step": state.current_step,
            "active_scenario": state.active_scenario,
            "speed_multiplier": state.speed_multiplier,
            "last_tick_at": state.last_tick_at.isoformat() if state.last_tick_at else None
        }

    @staticmethod
    def start_simulation(db: Session, scenario: str = "SENSOR_DEGRADATION", target_aircraft_id: str = "A101") -> Dict[str, Any]:
        state = db.query(SimulationState).first()
        if not state:
            state = SimulationState(id=1)
            db.add(state)

        state.is_running = True
        state.active_scenario = scenario
        state.last_tick_at = datetime.datetime.utcnow()
        db.commit()

        return {
            "message": f"Simulation started for scenario '{scenario}' on target '{target_aircraft_id}'.",
            "is_running": True,
            "current_step": state.current_step,
            "active_scenario": scenario
        }

    @staticmethod
    def pause_simulation(db: Session) -> Dict[str, Any]:
        state = db.query(SimulationState).first()
        if state:
            state.is_running = False
            db.commit()
        return {"message": "Simulation paused.", "is_running": False}

    @staticmethod
    def step_simulation(db: Session, target_aircraft_id: str = "A101") -> Dict[str, Any]:
        state = db.query(SimulationState).first()
        if not state:
            state = SimulationState(id=1, is_running=False, current_step=0)
            db.add(state)

        state.current_step += 1
        step = state.current_step
        now = datetime.datetime.utcnow()
        state.last_tick_at = now

        # Compute progressive deteriorating telemetry for target aircraft
        step_factor = min(8, step)  # Cap at stage 8
        temp = 80.0 + (step_factor * 2.8)
        vib = 0.18 + (step_factor * 0.038)
        press = 3000.0 - (step_factor * 60.0)
        hyd = 3000.0 - (step_factor * 75.0)
        rpm = 10000.0 - (step_factor * 25.0)

        # Append new reading
        new_reading = SensorReading(
            aircraft_id=target_aircraft_id,
            component_id=f"COMP-{target_aircraft_id}-HYD",
            timestamp=now,
            temperature=round(temp, 2),
            vibration=round(vib, 4),
            pressure=round(press, 2),
            rpm=round(rpm, 1),
            fuel_flow=505.0,
            oil_pressure=51.0,
            hydraulic_pressure=round(hyd, 2),
            electrical_voltage=28.0,
            operating_hours=1450.0 + (step * 2.0),
            flight_cycles=725 + step,
            scenario_tag="LIVE_SIMULATION"
        )
        db.add(new_reading)
        db.commit()

        # Run inference pipeline
        pred = prediction_service.run_prediction_for_aircraft(
            db, target_aircraft_id, component_type="HYDRAULIC"
        )

        # Timeline stage mapping
        if step <= 2:
            stage = "HEALTHY"
        elif step <= 4:
            stage = "MONITORING"
        elif step <= 6:
            stage = "WARNING"
        else:
            stage = "HIGH_RISK"

        # Check for spare alert condition
        spare_req = None
        if pred["risk_level"] in ["HIGH", "CRITICAL"]:
            spare_req = "Hydraulic Pump X-200 (Local Stock: 0, Central Depot B: 3 units)"

        # Ensure maintenance task is queued if high risk reached
        if pred["risk_level"] in ["HIGH", "CRITICAL"]:
            task = db.query(MaintenanceTask).filter(MaintenanceTask.aircraft_id == target_aircraft_id).first()
            if not task:
                task = MaintenanceTask(
                    task_id=f"TASK-SIM-{target_aircraft_id}",
                    aircraft_id=target_aircraft_id,
                    component_id=f"COMP-{target_aircraft_id}-HYD",
                    task_name="Hydraulic Actuator Overhaul & Line Bleed",
                    priority="CRITICAL",
                    priority_score=92.5,
                    duration_hours=4,
                    required_skill="HYDRAULIC",
                    required_part_id="SP-HYD-01",
                    start_time_slot=0,
                    end_time_slot=4,
                    rul_deadline_hours=pred["predicted_rul_hours"],
                    is_optimized=False,
                    status="QUEUED"
                )
                db.add(task)
                db.commit()

        db.commit()

        return {
            "step": step,
            "scenario": state.active_scenario,
            "target_aircraft_id": target_aircraft_id,
            "sensor_updates": {
                "temperature": round(temp, 1),
                "vibration": round(vib, 4),
                "pressure": round(press, 1),
                "hydraulic_pressure": round(hyd, 1)
            },
            "anomaly_status": pred["anomaly_severity"],
            "anomaly_score": pred["anomaly_score"],
            "maintenance_probability": pred["maintenance_probability"],
            "risk_level": pred["risk_level"],
            "estimated_rul": pred["predicted_rul_hours"],
            "health_score": pred["updated_health_score"],
            "timeline_stage": stage,
            "alert_generated": pred["recommended_action"] if pred["risk_level"] in ["HIGH", "CRITICAL"] else None,
            "spare_requirement": spare_req
        }

    @staticmethod
    def reset_simulation(db: Session, target_aircraft_id: str = "A101") -> Dict[str, Any]:
        """
        Restores target aircraft and state to clean baseline.
        """
        state = db.query(SimulationState).first()
        if state:
            state.is_running = False
            state.current_step = 0
            state.active_scenario = "HEALTHY"
            state.last_tick_at = datetime.datetime.utcnow()

        # Delete live simulation sensor readings
        db.query(SensorReading).filter(
            SensorReading.aircraft_id == target_aircraft_id,
            SensorReading.scenario_tag == "LIVE_SIMULATION"
        ).delete()

        # Reset A101 Aircraft record
        ac = db.query(Aircraft).filter(Aircraft.aircraft_id == target_aircraft_id).first()
        if ac:
            ac.current_status = "AVAILABLE"
            ac.health_score = 92.5

        # Reset Prediction
        pred = db.query(Prediction).filter(Prediction.aircraft_id == target_aircraft_id).first()
        if pred:
            pred.anomaly_score = -0.12
            pred.anomaly_detected = False
            pred.anomaly_severity = "NORMAL"
            pred.maintenance_probability = 0.18
            pred.risk_level = "LOW"
            pred.predicted_rul_hours = 110.0
            pred.recommended_action = "Routine telemetry nominal; proceed with standard operational flight schedule."

        # Remove simulation generated alerts
        db.query(Alert).filter(
            Alert.aircraft_id == target_aircraft_id,
            Alert.alert_id.like("ALT-A101-%")
        ).delete()

        # Remove simulation task
        db.query(MaintenanceTask).filter(MaintenanceTask.task_id == f"TASK-SIM-{target_aircraft_id}").delete()

        db.commit()

        return {
            "message": f"Simulation reset. Aircraft {target_aircraft_id} restored to healthy baseline.",
            "status": "RESET_SUCCESSFUL",
            "current_step": 0,
            "active_scenario": "HEALTHY"
        }

simulation_service = SimulationService()
