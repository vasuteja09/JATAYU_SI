import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.db.base import Base

class Aircraft(Base):
    __tablename__ = "aircraft"
    
    aircraft_id = Column(String(50), primary_key=True, index=True)
    aircraft_type = Column(String(100), nullable=False)
    base_location = Column(String(100), nullable=False)
    age_years = Column(Float, default=5.0)
    total_flight_hours = Column(Float, default=1200.0)
    total_cycles = Column(Integer, default=650)
    current_status = Column(String(50), default="AVAILABLE", index=True)
    health_score = Column(Float, default=85.0)
    last_major_maintenance = Column(DateTime, default=datetime.datetime.utcnow)
    next_scheduled_maintenance = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    components = relationship("Component", back_populates="aircraft", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="aircraft", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="aircraft", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="aircraft", cascade="all, delete-orphan")


class Component(Base):
    __tablename__ = "components"
    
    component_id = Column(String(100), primary_key=True, index=True)
    aircraft_id = Column(String(50), ForeignKey("aircraft.aircraft_id", ondelete="CASCADE"), index=True)
    component_type = Column(String(50), nullable=False, index=True)  # ENGINE, HYDRAULIC, AVIONICS, FUEL, ELECTRICAL
    component_name = Column(String(150), nullable=False)
    installation_date = Column(DateTime, default=datetime.datetime.utcnow)
    total_operating_hours = Column(Float, default=500.0)
    previous_failures = Column(Integer, default=0)
    health_score = Column(Float, default=90.0)
    criticality = Column(String(50), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    current_status = Column(String(50), default="HEALTHY")
    compatible_part_id = Column(String(100), nullable=True)
    
    aircraft = relationship("Aircraft", back_populates="components")


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    aircraft_id = Column(String(50), ForeignKey("aircraft.aircraft_id", ondelete="CASCADE"), index=True)
    component_id = Column(String(100), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    temperature = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    rpm = Column(Float, nullable=False)
    fuel_flow = Column(Float, nullable=False)
    oil_pressure = Column(Float, nullable=False)
    hydraulic_pressure = Column(Float, nullable=False)
    electrical_voltage = Column(Float, nullable=False)
    operating_hours = Column(Float, nullable=False)
    flight_cycles = Column(Integer, nullable=False)
    scenario_tag = Column(String(50), default="NORMAL", index=True)
    
    aircraft = relationship("Aircraft", back_populates="sensor_readings")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    
    maintenance_id = Column(String(100), primary_key=True, index=True)
    aircraft_id = Column(String(50), ForeignKey("aircraft.aircraft_id", ondelete="CASCADE"), index=True)
    component_id = Column(String(100), nullable=True)
    maintenance_type = Column(String(50), nullable=False)  # PREVENTIVE, CORRECTIVE, INSPECTION, OVERHAUL
    fault_code = Column(String(50), nullable=True)
    fault_description = Column(String(255), nullable=True)
    maintenance_date = Column(DateTime, default=datetime.datetime.utcnow)
    duration_hours = Column(Float, default=4.0)
    action_taken = Column(Text, nullable=True)
    workshop_id = Column(String(100), nullable=True)
    technician_id = Column(String(100), nullable=True)
    status = Column(String(50), default="COMPLETED")
    
    aircraft = relationship("Aircraft", back_populates="maintenance_records")


class SparePart(Base):
    __tablename__ = "spare_parts"
    
    part_id = Column(String(100), primary_key=True, index=True)
    part_name = Column(String(150), nullable=False)
    compatible_component_type = Column(String(50), nullable=False, index=True)  # ENGINE, HYDRAULIC, etc.
    quantity = Column(Integer, default=5)
    reserved_quantity = Column(Integer, default=0)
    storage_location = Column(String(100), nullable=False)  # e.g., Base Alpha Depot, Central Depot B
    minimum_stock = Column(Integer, default=3)
    lead_time_days = Column(Integer, default=3)
    status = Column(String(50), default="AVAILABLE")  # AVAILABLE, LOW_STOCK, CRITICAL_SHORTAGE


class SpareTransaction(Base):
    __tablename__ = "spare_transactions"
    
    transaction_id = Column(String(100), primary_key=True, index=True)
    part_id = Column(String(100), ForeignKey("spare_parts.part_id"), index=True)
    aircraft_id = Column(String(50), nullable=True)
    transaction_type = Column(String(50), nullable=False)  # RESERVE, RELEASE, TRANSFER, RESTOCK
    quantity = Column(Integer, default=1)
    source_location = Column(String(100), nullable=False)
    dest_location = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="COMPLETED")


class Workshop(Base):
    __tablename__ = "workshops"
    
    workshop_id = Column(String(100), primary_key=True, index=True)
    workshop_name = Column(String(150), nullable=False)
    capabilities = Column(String(255), default="ENGINE,HYDRAULIC,AVIONICS,FUEL,ELECTRICAL")
    capacity = Column(Integer, default=4)
    current_load = Column(Integer, default=1)
    location = Column(String(100), nullable=False)
    average_turnaround_days = Column(Float, default=2.5)


class Technician(Base):
    __tablename__ = "technicians"
    
    technician_id = Column(String(100), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    skill = Column(String(50), nullable=False, index=True)  # ENGINE, HYDRAULIC, AVIONICS, FUEL, ELECTRICAL
    skill_level = Column(String(50), default="SPECIALIST")
    availability = Column(Boolean, default=True)
    current_assignment = Column(String(150), nullable=True)
    workshop_id = Column(String(100), ForeignKey("workshops.workshop_id"), nullable=True)


class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"
    
    task_id = Column(String(100), primary_key=True, index=True)
    aircraft_id = Column(String(50), ForeignKey("aircraft.aircraft_id", ondelete="CASCADE"), index=True)
    component_id = Column(String(100), nullable=False)
    task_name = Column(String(200), nullable=False)
    priority = Column(String(50), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    priority_score = Column(Float, default=75.0)
    duration_hours = Column(Integer, default=4)
    required_skill = Column(String(50), nullable=False)
    required_part_id = Column(String(100), nullable=True)
    
    # Schedule timing (slots in hours from baseline)
    start_time_slot = Column(Integer, default=0)
    end_time_slot = Column(Integer, default=4)
    technician_id = Column(String(100), nullable=True)
    workshop_id = Column(String(100), nullable=True)
    rul_deadline_hours = Column(Float, default=20.0)
    
    is_optimized = Column(Boolean, default=False)
    status = Column(String(50), default="QUEUED")  # QUEUED, SCHEDULED, IN_PROGRESS, COMPLETED


class Prediction(Base):
    __tablename__ = "predictions"
    
    prediction_id = Column(String(100), primary_key=True, index=True)
    aircraft_id = Column(String(50), ForeignKey("aircraft.aircraft_id", ondelete="CASCADE"), index=True)
    component_type = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    anomaly_score = Column(Float, default=0.0)
    anomaly_detected = Column(Boolean, default=False)
    anomaly_severity = Column(String(50), default="NORMAL")  # NORMAL, MEDIUM, HIGH
    
    maintenance_probability = Column(Float, default=0.15)
    risk_level = Column(String(50), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    
    predicted_rul_hours = Column(Float, default=120.0)
    rul_lower_bound = Column(Float, default=100.0)
    rul_upper_bound = Column(Float, default=140.0)
    confidence = Column(Float, default=0.85)
    
    top_contributing_factors = Column(Text, default="[]")  # JSON string of factors
    recommended_action = Column(String(255), default="Monitor routine telemetry")
    model_mode = Column(String(50), default="ML_INFERENCE")  # ML_INFERENCE or DEMO_FALLBACK
    
    aircraft = relationship("Aircraft", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"
    
    alert_id = Column(String(100), primary_key=True, index=True)
    aircraft_id = Column(String(50), nullable=False, index=True)
    component_type = Column(String(50), nullable=True)
    severity = Column(String(50), default="WARNING")  # CRITICAL, WARNING, LOGISTICS, SCHEDULING
    title = Column(String(200), nullable=False)
    reason = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    acknowledged = Column(Boolean, default=False)


class ModelMetric(Base):
    __tablename__ = "model_metrics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(100), unique=True, index=True)
    metrics_json = Column(Text, default="{}")
    feature_importance_json = Column(Text, default="[]")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class SimulationState(Base):
    __tablename__ = "simulation_state"
    
    id = Column(Integer, primary_key=True, default=1)
    is_running = Column(Boolean, default=False)
    current_step = Column(Integer, default=0)
    speed_multiplier = Column(Float, default=1.0)
    active_scenario = Column(String(50), default="HEALTHY")
    last_tick_at = Column(DateTime, default=datetime.datetime.utcnow)
