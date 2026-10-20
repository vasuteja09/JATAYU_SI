import os
import sys
import random
import datetime
import numpy as np

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.db.models import (
    Aircraft, Component, SensorReading, MaintenanceRecord,
    SparePart, SpareTransaction, Workshop, Technician,
    MaintenanceTask, Prediction, Alert, ModelMetric, SimulationState
)

RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

AIRCRAFT_TYPES = [
    "Tactical Transport",
    "Heavy Transport",
    "Rotary Utility",
    "Maritime Patrol",
    "Advanced Jet Trainer",
    "Light Utility"
]

BASES = [
    "AFS Ambala (Haryana)",
    "AFS Hindon (Ghaziabad)",
    "4 BRD Kanpur (Uttar Pradesh)",
    "INS Hansa (Goa)",
    "AFS Pune (Maharashtra)"
]

COMPONENT_TYPES = ["ENGINE", "HYDRAULIC", "AVIONICS", "FUEL", "ELECTRICAL"]

COMPONENT_NAMES = {
    "ENGINE": "Turbofan Core & Compressor Module",
    "HYDRAULIC": "Primary Hydraulic Actuator & Pump X-200",
    "AVIONICS": "Integrated Flight Control Computer",
    "FUEL": "Dual High-Pressure Fuel Booster",
    "ELECTRICAL": "Main Starter Generator & Bus Unit"
}

def seed_database():
    print("=" * 60)
    print("Initializing Jatayu AI Database & Seed Dataset...")
    print(f"Random seed: {RANDOM_SEED}")
    print("=" * 60)

    # Recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    now = datetime.datetime.utcnow()

    # 1. Workshops
    print("Seeding Workshops...")
    workshops_data = [
        {"id": "WS-ALPHA-1", "name": "AFS Ambala Primary Maintenance Hangar", "cap": 5, "load": 2, "loc": BASES[0]},
        {"id": "WS-BRAVO-1", "name": "AFS Hindon Quick-Turn Line Bay", "cap": 4, "load": 1, "loc": BASES[1]},
        {"id": "WS-CENTRAL-1", "name": "4 BRD Kanpur Heavy Maintenance Hub", "cap": 8, "load": 4, "loc": BASES[2]},
        {"id": "WS-MARITIME-1", "name": "INS Hansa Goa Naval Aviation Bay", "cap": 3, "load": 1, "loc": BASES[3]},
    ]
    for w in workshops_data:
        workshop = Workshop(
            workshop_id=w["id"],
            workshop_name=w["name"],
            capabilities="ENGINE,HYDRAULIC,AVIONICS,FUEL,ELECTRICAL",
            capacity=w["cap"],
            current_load=w["load"],
            location=w["loc"],
            average_turnaround_days=2.5
        )
        db.add(workshop)
    db.commit()

    # 2. Technicians
    print("Seeding Technicians...")
    technicians_data = [
        {"id": "TECH-ENG-01", "name": "Chief Tech Sharma", "skill": "ENGINE", "level": "MASTER", "ws": "WS-ALPHA-1"},
        {"id": "TECH-ENG-02", "name": "Tech Specialist Rao", "skill": "ENGINE", "level": "SENIOR", "ws": "WS-CENTRAL-1"},
        {"id": "TECH-HYD-01", "name": "Master Tech Nair", "skill": "HYDRAULIC", "level": "MASTER", "ws": "WS-ALPHA-1"},
        {"id": "TECH-HYD-02", "name": "Tech Specialist Khan", "skill": "HYDRAULIC", "level": "SPECIALIST", "ws": "WS-BRAVO-1"},
        {"id": "TECH-AVN-01", "name": "Senior Tech Patel", "skill": "AVIONICS", "level": "MASTER", "ws": "WS-CENTRAL-1"},
        {"id": "TECH-AVN-02", "name": "Tech Officer Verma", "skill": "AVIONICS", "level": "SPECIALIST", "ws": "WS-ALPHA-1"},
        {"id": "TECH-FUEL-01", "name": "Tech Lead Roy", "skill": "FUEL", "level": "SENIOR", "ws": "WS-BRAVO-1"},
        {"id": "TECH-ELEC-01", "name": "Tech Specialist Das", "skill": "ELECTRICAL", "level": "SPECIALIST", "ws": "WS-MARITIME-1"},
        {"id": "TECH-ELEC-02", "name": "Senior Tech Joshi", "skill": "ELECTRICAL", "level": "MASTER", "ws": "WS-CENTRAL-1"},
        {"id": "TECH-HYD-03", "name": "Tech Apprentice Singh", "skill": "HYDRAULIC", "level": "SPECIALIST", "ws": "WS-CENTRAL-1"},
    ]
    for t in technicians_data:
        technician = Technician(
            technician_id=t["id"],
            name=t["name"],
            skill=t["skill"],
            skill_level=t["level"],
            availability=True,
            workshop_id=t["ws"]
        )
        db.add(technician)
    db.commit()

    # 3. Spare Parts & Logistics
    print("Seeding Spare Parts & Logistics...")
    spares_data = [
        # Hydraulic
        {"id": "SP-HYD-01", "name": "Hydraulic Pump X-200", "type": "HYDRAULIC", "qty": 0, "res": 0, "loc": BASES[0], "min": 2, "lead": 4, "status": "CRITICAL_SHORTAGE"},
        {"id": "SP-HYD-02", "name": "Hydraulic Pump X-200", "type": "HYDRAULIC", "qty": 3, "res": 1, "loc": BASES[2], "min": 2, "lead": 2, "status": "AVAILABLE"},
        {"id": "SP-HYD-03", "name": "High-Pressure Hydraulic Seal Kit", "type": "HYDRAULIC", "qty": 14, "res": 2, "loc": BASES[0], "min": 5, "lead": 1, "status": "AVAILABLE"},
        # Engine
        {"id": "SP-ENG-01", "name": "Turbofan Stage-1 Turbine Blade Set", "type": "ENGINE", "qty": 2, "res": 1, "loc": BASES[2], "min": 2, "lead": 7, "status": "LOW_STOCK"},
        {"id": "SP-ENG-02", "name": "Engine Oil Filter & Scavenge Core", "type": "ENGINE", "qty": 18, "res": 0, "loc": BASES[0], "min": 4, "lead": 2, "status": "AVAILABLE"},
        {"id": "SP-ENG-03", "name": "FADEC Electronic Controller", "type": "ENGINE", "qty": 1, "res": 0, "loc": BASES[1], "min": 2, "lead": 5, "status": "LOW_STOCK"},
        # Avionics
        {"id": "SP-AVN-01", "name": "Mission Avionics Central Processor", "type": "AVIONICS", "qty": 4, "res": 0, "loc": BASES[2], "min": 2, "lead": 3, "status": "AVAILABLE"},
        {"id": "SP-AVN-02", "name": "Multi-Function Radar Transceiver", "type": "AVIONICS", "qty": 1, "res": 1, "loc": BASES[0], "min": 2, "lead": 6, "status": "LOW_STOCK"},
        # Fuel
        {"id": "SP-FUEL-01", "name": "Dual Fuel Boost Pump Unit", "type": "FUEL", "qty": 5, "res": 1, "loc": BASES[1], "min": 3, "lead": 3, "status": "AVAILABLE"},
        {"id": "SP-FUEL-02", "name": "Fuel Metering & Distribution Valve", "type": "FUEL", "qty": 8, "res": 0, "loc": BASES[0], "min": 3, "lead": 2, "status": "AVAILABLE"},
        # Electrical
        {"id": "SP-ELEC-01", "name": "Primary 28V AC Generator", "type": "ELECTRICAL", "qty": 3, "res": 0, "loc": BASES[0], "min": 2, "lead": 4, "status": "AVAILABLE"},
        {"id": "SP-ELEC-02", "name": "Emergency Battery & Inverter Pack", "type": "ELECTRICAL", "qty": 6, "res": 0, "loc": BASES[3], "min": 2, "lead": 2, "status": "AVAILABLE"}
    ]
    for sp in spares_data:
        spare = SparePart(
            part_id=sp["id"],
            part_name=sp["name"],
            compatible_component_type=sp["type"],
            quantity=sp["qty"],
            reserved_quantity=sp["res"],
            storage_location=sp["loc"],
            minimum_stock=sp["min"],
            lead_time_days=sp["lead"],
            status=sp["status"]
        )
        db.add(spare)
    db.commit()

    # 4. 15 Aircraft & Components
    print("Seeding 15 Aircraft across 5 Operational Scenarios...")
    aircraft_list = []

    for i in range(1, 16):
        ac_num = 100 + i
        ac_id = f"A{ac_num}"
        ac_type = AIRCRAFT_TYPES[(i - 1) % len(AIRCRAFT_TYPES)]
        base = BASES[(i - 1) % len(BASES)]
        
        # Scenario allocation for 15 aircraft
        if ac_id == "A101":
            # Primary live demo target: starts Healthy, ready to degrade
            status = "AVAILABLE"
            health = 92.5
            scenario = "HEALTHY"
        elif 102 <= ac_num <= 106:
            # Scenario A: Healthy / Available aircraft
            status = "AVAILABLE"
            health = round(random.uniform(86.0, 96.0), 1)
            scenario = "HEALTHY"
        elif 107 <= ac_num <= 108:
            # Scenario B: Gradual Degradation & High Risk
            status = "MONITORING" if ac_num == 107 else "HIGH_RISK"
            health = round(random.uniform(55.0, 68.0), 1)
            scenario = "DEGRADING"
        elif 109 <= ac_num <= 110:
            # Scenario C: Spare Shortage
            status = "AWAITING_PART"
            health = round(random.uniform(60.0, 72.0), 1)
            scenario = "SPARE_SHORTAGE"
        elif 111 <= ac_num <= 113:
            # Scenario D: Resource Bottleneck (Maintenance Due / Under Maintenance)
            status = "MAINTENANCE_DUE" if ac_num % 2 == 1 else "UNDER_MAINTENANCE"
            health = round(random.uniform(62.0, 74.0), 1)
            scenario = "BOTTLENECK"
        else:
            # Scenario E (114 - 115): Recently completed maintenance
            status = "AVAILABLE"
            health = round(random.uniform(91.0, 97.0), 1)
            scenario = "POST_MAINTENANCE"

        total_hours = round(random.uniform(400.0, 3200.0), 1)
        total_cycles = int(total_hours * random.uniform(0.4, 0.7))
        age = round(total_hours / 350.0, 1)

        last_maint = now - datetime.timedelta(days=random.randint(10, 180))
        next_maint = now + datetime.timedelta(days=random.randint(15, 90))

        ac = Aircraft(
            aircraft_id=ac_id,
            aircraft_type=ac_type,
            base_location=base,
            age_years=age,
            total_flight_hours=total_hours,
            total_cycles=total_cycles,
            current_status=status,
            health_score=health,
            last_major_maintenance=last_maint,
            next_scheduled_maintenance=next_maint,
            created_at=now,
            updated_at=now
        )
        db.add(ac)
        aircraft_list.append((ac, scenario))

    db.commit()

    # 5. Components for each Aircraft
    print("Seeding Components...")
    for ac, scenario in aircraft_list:
        for ctype in COMPONENT_TYPES:
            comp_id = f"COMP-{ac.aircraft_id}-{ctype[:3]}"
            comp_name = COMPONENT_NAMES[ctype]
            op_hours = round(ac.total_flight_hours * random.uniform(0.6, 0.95), 1)
            prev_fails = random.choice([0, 0, 0, 1, 2])
            
            # Determine component health based on scenario
            if scenario == "DEGRADING" and ctype == "HYDRAULIC":
                c_health = round(random.uniform(50.0, 65.0), 1)
                c_status = "WARNING"
            elif scenario == "SPARE_SHORTAGE" and ctype == "HYDRAULIC":
                c_health = round(random.uniform(54.0, 68.0), 1)
                c_status = "DEGRADED"
            elif scenario == "HEALTHY":
                c_health = round(random.uniform(88.0, 98.0), 1)
                c_status = "HEALTHY"
            else:
                c_health = round(random.uniform(75.0, 92.0), 1)
                c_status = "HEALTHY"

            crit = "CRITICAL" if ctype in ["ENGINE", "HYDRAULIC"] else "HIGH"

            # Match spare part
            matching_part = f"SP-{ctype[:3]}-01" if ctype in ["HYDRAULIC", "ENGINE", "AVIONICS", "FUEL", "ELECTRICAL"] else None

            comp = Component(
                component_id=comp_id,
                aircraft_id=ac.aircraft_id,
                component_type=ctype,
                component_name=comp_name,
                installation_date=ac.last_major_maintenance,
                total_operating_hours=op_hours,
                previous_failures=prev_fails,
                health_score=c_health,
                criticality=crit,
                current_status=c_status,
                compatible_part_id=matching_part
            )
            db.add(comp)
    db.commit()

    # 6. Sensor Readings Generation
    print("Generating Sensor Telemetry (~10,000 readings)...")
    sensor_rows = []
    
    for ac, scenario in aircraft_list:
        # Generate 25 historical timestamps for each aircraft (spread over 50 operating hours)
        base_temp = 80.0 + random.uniform(-2.0, 2.0)
        base_vib = 0.18 + random.uniform(-0.02, 0.02)
        base_press = 3000.0 + random.uniform(-50.0, 50.0)
        base_rpm = 10000.0 + random.uniform(-100.0, 100.0)
        base_fuel = 500.0 + random.uniform(-15.0, 15.0)
        base_oil = 52.0 + random.uniform(-2.0, 2.0)
        base_hyd = 3000.0 + random.uniform(-30.0, 30.0)
        base_volt = 28.0 + random.uniform(-0.2, 0.2)

        for step in range(25):
            t_offset = datetime.timedelta(hours=(25 - step) * 2)
            reading_time = now - t_offset

            # Degradation trend for Scenario B or A116-A125
            if scenario == "DEGRADING":
                factor = step / 24.0
                temp = base_temp + (factor * 18.0) + random.uniform(-0.8, 0.8)
                vib = base_vib + (factor * 0.28) + random.uniform(-0.01, 0.01)
                press = base_press - (factor * 350.0) + random.uniform(-20.0, 20.0)
                hyd = base_hyd - (factor * 420.0) + random.uniform(-15.0, 15.0)
            elif scenario == "SPARE_SHORTAGE":
                factor = step / 24.0
                temp = base_temp + (factor * 8.0) + random.uniform(-0.5, 0.5)
                vib = base_vib + (factor * 0.15) + random.uniform(-0.01, 0.01)
                press = base_press - (factor * 180.0) + random.uniform(-10.0, 10.0)
                hyd = base_hyd - (factor * 260.0) + random.uniform(-10.0, 10.0)
            else:
                # Healthy / Normal
                temp = base_temp + random.uniform(-1.2, 1.2)
                vib = base_vib + random.uniform(-0.015, 0.015)
                press = base_press + random.uniform(-25.0, 25.0)
                hyd = base_hyd + random.uniform(-20.0, 20.0)

            rpm = base_rpm + random.uniform(-60.0, 60.0)
            fuel = base_fuel + random.uniform(-10.0, 10.0)
            oil = base_oil + random.uniform(-1.5, 1.5)
            volt = base_volt + random.uniform(-0.15, 0.15)

            op_h = ac.total_flight_hours - (25 - step) * 2.0
            cycles = int(op_h * 0.5)

            sensor_rows.append(SensorReading(
                aircraft_id=ac.aircraft_id,
                component_id=f"COMP-{ac.aircraft_id}-HYD",
                timestamp=reading_time,
                temperature=round(temp, 2),
                vibration=round(vib, 4),
                pressure=round(press, 2),
                rpm=round(rpm, 1),
                fuel_flow=round(fuel, 2),
                oil_pressure=round(oil, 2),
                hydraulic_pressure=round(hyd, 2),
                electrical_voltage=round(volt, 2),
                operating_hours=round(op_h, 1),
                flight_cycles=cycles,
                scenario_tag=scenario
            ))

    db.bulk_save_objects(sensor_rows)
    db.commit()
    print(f"Stored {len(sensor_rows)} sensor telemetry rows.")

    # 7. Historical Maintenance Records (Hundreds)
    print("Seeding Historical Maintenance Records...")
    maint_records = []
    actions = [
        ("HYD-702", "Replaced hydraulic seal assembly and bled primary return line"),
        ("ENG-104", "Cleaned turbine wash, replaced oil pressure transducer"),
        ("AVN-301", "Calibrated flight control computer bus transceiver"),
        ("ELEC-205", "Serviced primary 28V starter generator brush pack"),
        ("FUEL-410", "Cleaned dual boost pump suction filter mesh")
    ]
    for i in range(1, 60):
        ac_idx = random.randint(1, 15)
        ac_id = f"A{100 + ac_idx}"
        code, action = random.choice(actions)
        ctype = code.split("-")[0]
        full_type = {"HYD": "HYDRAULIC", "ENG": "ENGINE", "AVN": "AVIONICS", "ELEC": "ELECTRICAL", "FUEL": "FUEL"}[ctype]
        m_date = now - datetime.timedelta(days=random.randint(5, 360))

        rec = MaintenanceRecord(
            maintenance_id=f"MNT-2025-{i:03d}",
            aircraft_id=ac_id,
            component_id=f"COMP-{ac_id}-{ctype}",
            maintenance_type=random.choice(["PREVENTIVE", "CORRECTIVE", "INSPECTION"]),
            fault_code=code,
            fault_description=f"Maintenance action required on {full_type} subsystem",
            maintenance_date=m_date,
            duration_hours=round(random.uniform(2.5, 7.5), 1),
            action_taken=action,
            workshop_id=random.choice(["WS-ALPHA-1", "WS-BRAVO-1", "WS-CENTRAL-1"]),
            technician_id=random.choice(["TECH-ENG-01", "TECH-HYD-01", "TECH-AVN-01"]),
            status="COMPLETED"
        )
        maint_records.append(rec)
    db.bulk_save_objects(maint_records)
    db.commit()

    # 8. Maintenance Tasks (For Optimizer & Queue)
    print("Seeding Maintenance Tasks (for Optimizer & Queue)...")
    tasks_data = [
        {"id": "TASK-101", "ac": "A101", "comp": "COMP-A101-HYD", "name": "Hydraulic Pump Preventive Overhaul", "prio": "CRITICAL", "score": 92.0, "dur": 4, "skill": "HYDRAULIC", "rul": 18.0, "slot": 0, "tech": "TECH-HYD-01", "ws": "WS-ALPHA-1"},
        {"id": "TASK-103", "ac": "A103", "comp": "COMP-A103-ENG", "name": "Turbofan Stage-1 Inspection & Clean", "prio": "HIGH", "score": 78.0, "dur": 6, "skill": "ENGINE", "rul": 35.0, "slot": 1, "tech": "TECH-ENG-01", "ws": "WS-ALPHA-1"}, # Conflict with Tech on Alpha
        {"id": "TASK-106", "ac": "A106", "comp": "COMP-A106-AVN", "name": "Avionics Bus Controller Diagnostic", "prio": "MEDIUM", "score": 64.0, "dur": 3, "skill": "AVIONICS", "rul": 55.0, "slot": 0, "tech": "TECH-AVN-02", "ws": "WS-ALPHA-1"},
        {"id": "TASK-107", "ac": "A107", "comp": "COMP-A107-HYD", "name": "Hydraulic Pressure Line Replacement", "prio": "CRITICAL", "score": 94.0, "dur": 5, "skill": "HYDRAULIC", "rul": 14.0, "slot": 0, "tech": "TECH-HYD-01", "ws": "WS-ALPHA-1"}, # Direct tech conflict
        {"id": "TASK-109", "ac": "A109", "comp": "COMP-A109-HYD", "name": "Hydraulic Pump Transfer & Installation", "prio": "HIGH", "score": 82.0, "dur": 4, "skill": "HYDRAULIC", "rul": 22.0, "slot": 2, "tech": None, "ws": "WS-CENTRAL-1"},
        {"id": "TASK-111", "ac": "A111", "comp": "COMP-A111-ENG", "name": "Engine Scavenge Pump Replacement", "prio": "HIGH", "score": 79.0, "dur": 5, "skill": "ENGINE", "rul": 28.0, "slot": 1, "tech": "TECH-ENG-01", "ws": "WS-CENTRAL-1"},
        {"id": "TASK-112", "ac": "A112", "comp": "COMP-A112-ELEC", "name": "28V Starter Generator Servicing", "prio": "MEDIUM", "score": 58.0, "dur": 3, "skill": "ELECTRICAL", "rul": 65.0, "slot": 4, "tech": "TECH-ELEC-01", "ws": "WS-MARITIME-1"}
    ]
    for td in tasks_data:
        task = MaintenanceTask(
            task_id=td["id"],
            aircraft_id=td["ac"],
            component_id=td["comp"],
            task_name=td["name"],
            priority=td["prio"],
            priority_score=td["score"],
            duration_hours=td["dur"],
            required_skill=td["skill"],
            required_part_id="SP-HYD-01" if td["skill"] == "HYDRAULIC" else None,
            start_time_slot=td["slot"],
            end_time_slot=td["slot"] + td["dur"],
            technician_id=td["tech"],
            workshop_id=td["ws"],
            rul_deadline_hours=td["rul"],
            is_optimized=False,
            status="QUEUED"
        )
        db.add(task)
    db.commit()

    # 9. Initial Predictions for Demo Baseline
    print("Seeding Initial Model Predictions...")
    import json
    predictions_data = [
        {
            "id": "PRED-A101",
            "ac": "A101",
            "comp": "HYDRAULIC",
            "score": -0.15,
            "anom": False,
            "sev": "NORMAL",
            "prob": 0.22,
            "risk": "LOW",
            "rul": 110.0,
            "conf": 0.91,
            "factors": [
                {"factor": "Hydraulic Pressure", "impact": 0.12, "description": "Operating within baseline bounds"},
                {"factor": "Vibration Trend", "impact": 0.08, "description": "Nominal harmonic baseline"},
                {"factor": "Operating Hours", "impact": 0.05, "description": "320h since last overhaul"}
            ],
            "action": "Routine telemetry monitoring",
            "mode": "ML_INFERENCE"
        },
        {
            "id": "PRED-A107",
            "ac": "A107",
            "comp": "HYDRAULIC",
            "score": -0.68,
            "anom": True,
            "sev": "HIGH",
            "prob": 0.88,
            "risk": "CRITICAL",
            "rul": 14.5,
            "conf": 0.89,
            "factors": [
                {"factor": "Vibration Trend Increasing", "impact": 0.42, "description": "48% deviation above normal harmonic baseline"},
                {"factor": "Hydraulic Pressure Declining", "impact": 0.31, "description": "Pressure dropped from 3000 psi to 2580 psi"},
                {"factor": "Operating Temperature Elevated", "impact": 0.18, "description": "+14°C above recent 10-hour rolling mean"}
            ],
            "action": "Immediate inspection and schedule preventive pump replacement",
            "mode": "ML_INFERENCE"
        },
        {
            "id": "PRED-A108",
            "ac": "A108",
            "comp": "ENGINE",
            "score": -0.54,
            "anom": True,
            "sev": "MEDIUM",
            "prob": 0.76,
            "risk": "HIGH",
            "rul": 24.0,
            "conf": 0.86,
            "factors": [
                {"factor": "Exhaust Gas Temp Deviation", "impact": 0.38, "description": "+11°C over cruising baseline"},
                {"factor": "Hours Since Maintenance", "impact": 0.29, "description": "240 flight hours accumulated"}
            ],
            "action": "Perform stage-1 turbine blade boroscope inspection",
            "mode": "ML_INFERENCE"
        },
        {
            "id": "PRED-A109",
            "ac": "A109",
            "comp": "HYDRAULIC",
            "score": -0.59,
            "anom": True,
            "sev": "HIGH",
            "prob": 0.82,
            "risk": "HIGH",
            "rul": 22.0,
            "conf": 0.88,
            "factors": [
                {"factor": "Hydraulic Pressure Ripple", "impact": 0.35, "description": "Fluctuation > 180 psi detected"},
                {"factor": "Local Spare Stock Zero", "impact": 0.28, "description": "Part shortage creates logistics lead-time risk at AFS Ambala"}
            ],
            "action": "Initiate inter-depot spare transfer from 4 BRD Kanpur",
            "mode": "ML_INFERENCE"
        }
    ]
    for pd in predictions_data:
        p = Prediction(
            prediction_id=pd["id"],
            aircraft_id=pd["ac"],
            component_type=pd["comp"],
            timestamp=now,
            anomaly_score=pd["score"],
            anomaly_detected=pd["anom"],
            anomaly_severity=pd["sev"],
            maintenance_probability=pd["prob"],
            risk_level=pd["risk"],
            predicted_rul_hours=pd["rul"],
            rul_lower_bound=max(2.0, pd["rul"] - 5.0),
            rul_upper_bound=pd["rul"] + 8.0,
            confidence=pd["conf"],
            top_contributing_factors=json.dumps(pd["factors"]),
            recommended_action=pd["action"],
            model_mode=pd["mode"]
        )
        db.add(p)
    db.commit()

    # 10. Initial Alerts
    print("Seeding Initial Alerts...")
    alerts_data = [
        {
            "id": "ALT-001",
            "ac": "A107",
            "comp": "HYDRAULIC",
            "sev": "CRITICAL",
            "title": "Critical Hydraulic Failure Risk Predicted",
            "reason": "Vibration slope +0.28 mm/s and hydraulic pressure drop of 420 psi detected at AFS Ambala.",
            "action": "Schedule immediate preventive inspection. Estimated RUL: 14.5 hours."
        },
        {
            "id": "ALT-002",
            "ac": "A109",
            "comp": "HYDRAULIC",
            "sev": "LOGISTICS",
            "title": "Spare Shortage: Hydraulic Pump X-200",
            "reason": "Local inventory at AFS Ambala is 0 units. Part is needed for Aircraft A109 & A101.",
            "action": "Transfer 1 unit from 4 BRD Kanpur (current stock: 3 units). Lead time: 2 days."
        },
        {
            "id": "ALT-003",
            "ac": "A108",
            "comp": "ENGINE",
            "sev": "WARNING",
            "title": "Turbine Temperature Anomaly Detected",
            "reason": "Exhaust gas temperature exceeding normal operational envelope by 11°C at AFS Hindon.",
            "action": "Schedule turbine boroscope inspection within next 20 flight cycles."
        },
        {
            "id": "ALT-004",
            "ac": "A103",
            "comp": "ENGINE",
            "sev": "SCHEDULING",
            "title": "Maintenance Technician Resource Conflict",
            "reason": "Chief Tech Sharma (TECH-ENG-01) double-booked for TASK-101 and TASK-103 at AFS Ambala.",
            "action": "Run OR-Tools Maintenance Optimizer to balance technician allocations."
        }
    ]
    for ad in alerts_data:
        alt = Alert(
            alert_id=ad["id"],
            aircraft_id=ad["ac"],
            component_type=ad["comp"],
            severity=ad["sev"],
            title=ad["title"],
            reason=ad["reason"],
            recommended_action=ad["action"],
            timestamp=now - datetime.timedelta(minutes=random.randint(10, 180)),
            acknowledged=False
        )
        db.add(alt)
    db.commit()

    # 11. Initial Simulation State
    sim_state = SimulationState(
        id=1,
        is_running=False,
        current_step=0,
        speed_multiplier=1.0,
        active_scenario="HEALTHY",
        last_tick_at=now
    )
    db.add(sim_state)
    db.commit()

    db.close()
    print("=" * 60)
    print("Database seeding completed successfully!")
    print(f"15 Aircraft, 75 Components, ~375 Initial Sensor Readings,")
    print(f"60 Maintenance records, 12 Spares, 4 Workshops, 10 Technicians initialized.")
    print("=" * 60)

if __name__ == "__main__":
    seed_database()
