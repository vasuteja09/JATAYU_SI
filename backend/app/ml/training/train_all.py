import os
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.db.session import SessionLocal
from app.db.models import (
    SensorReading, Aircraft, Component, MaintenanceRecord, ModelMetric
)
from app.ml.feature_engineering.features import (
    build_ml_dataset, get_feature_column_names
)
from app.ml.anomaly_detection.isolation_forest import AnomalyDetector
from app.ml.failure_prediction.xgb_classifier import MaintenanceRiskClassifier
from app.ml.rul_prediction.xgb_regressor import RULRegressor

def train_all_models():
    print("=" * 60)
    print("Jatayu ML Pipeline: Training Anomaly, Risk, and RUL Models...")
    print("=" * 60)

    db = SessionLocal()
    try:
        # 1. Fetch data from DB
        print("Querying training dataset from database...")
        sensors_q = db.query(SensorReading).all()
        aircraft_q = db.query(Aircraft).all()
        components_q = db.query(Component).all()
        maint_q = db.query(MaintenanceRecord).all()

        if len(sensors_q) == 0:
            print("ERROR: No sensor readings found in database. Run seed_data.py first.")
            return

        df_sensors = pd.DataFrame([{
            "id": s.id, "aircraft_id": s.aircraft_id, "component_id": s.component_id,
            "timestamp": s.timestamp, "temperature": s.temperature, "vibration": s.vibration,
            "pressure": s.pressure, "rpm": s.rpm, "fuel_flow": s.fuel_flow,
            "oil_pressure": s.oil_pressure, "hydraulic_pressure": s.hydraulic_pressure,
            "electrical_voltage": s.electrical_voltage, "operating_hours": s.operating_hours,
            "flight_cycles": s.flight_cycles, "scenario_tag": s.scenario_tag
        } for s in sensors_q])

        df_aircraft = pd.DataFrame([{
            "aircraft_id": a.aircraft_id, "aircraft_type": a.aircraft_type,
            "age_years": a.age_years, "total_flight_hours": a.total_flight_hours,
            "total_cycles": a.total_cycles, "health_score": a.health_score
        } for a in aircraft_q])

        df_components = pd.DataFrame([{
            "component_id": c.component_id, "aircraft_id": c.aircraft_id,
            "component_type": c.component_type, "health_score": c.health_score,
            "previous_failures": c.previous_failures, "total_operating_hours": c.total_operating_hours
        } for c in components_q])

        df_maintenance = pd.DataFrame([{
            "maintenance_id": m.maintenance_id, "aircraft_id": m.aircraft_id,
            "maintenance_date": m.maintenance_date, "maintenance_type": m.maintenance_type
        } for m in maint_q])

        # 2. Build Feature Engineered Dataset
        print("Engineering features (rolling averages, rates of change, slopes)...")
        dataset = build_ml_dataset(df_sensors, df_aircraft, df_components, df_maintenance)
        feature_cols = get_feature_column_names()

        # Fill any remaining NaNs safely
        for c in feature_cols:
            if c not in dataset.columns:
                dataset[c] = 0.0
            else:
                dataset[c] = dataset[c].fillna(0.0)

        # 3. Trajectory-based Train/Validation Split (Prevent temporal data leakage)
        unique_aircraft = dataset["aircraft_id"].unique()
        np.random.seed(42)
        shuffled_ac = np.random.permutation(unique_aircraft)
        split_idx = int(len(shuffled_ac) * 0.8)
        train_aircraft = set(shuffled_ac[:split_idx])
        val_aircraft = set(shuffled_ac[split_idx:])

        # Ensure validation partition includes positive risk case if available
        risk_aircraft = dataset[dataset["target_maintenance_risk"] == 1]["aircraft_id"].unique()
        if len(risk_aircraft) > 1 and not any(ac in val_aircraft for ac in risk_aircraft):
            swap_in = risk_aircraft[0]
            swap_out = list(val_aircraft)[0]
            val_aircraft.remove(swap_out)
            train_aircraft.add(swap_out)
            train_aircraft.remove(swap_in)
            val_aircraft.add(swap_in)

        train_mask = dataset["aircraft_id"].isin(train_aircraft)
        val_mask = dataset["aircraft_id"].isin(val_aircraft)

        X_train = dataset.loc[train_mask, feature_cols].values
        X_val = dataset.loc[val_mask, feature_cols].values

        print(f"Data partitioned: {len(X_train)} train rows ({len(train_aircraft)} aircraft), {len(X_val)} validation rows ({len(val_aircraft)} aircraft).")

        models_dir = settings.MODEL_DIR
        metrics_dir = settings.MODEL_DIR / "metrics"
        models_dir.mkdir(parents=True, exist_ok=True)
        metrics_dir.mkdir(parents=True, exist_ok=True)

        # 4. Train Model A: Isolation Forest
        print("\n[1/3] Training Isolation Forest for Anomaly Detection...")
        detector = AnomalyDetector()
        anomaly_metrics = detector.fit(X_train)
        anomaly_path = models_dir / "anomaly_model.pkl"
        detector.save(anomaly_path)
        with open(metrics_dir / "anomaly_metrics.json", "w") as f:
            json.dump(anomaly_metrics, f, indent=2)
        print(f"-> Anomaly model saved to {anomaly_path}")

        # 5. Train Model B: Maintenance Risk Classifier
        print("\n[2/3] Training XGBoost Classifier for Failure Risk Prediction...")
        y_train_risk = dataset.loc[train_mask, "target_maintenance_risk"].values
        y_val_risk = dataset.loc[val_mask, "target_maintenance_risk"].values

        classifier = MaintenanceRiskClassifier()
        risk_metrics = classifier.fit(X_train, y_train_risk, X_val, y_val_risk)
        risk_path = models_dir / "risk_model.pkl"
        classifier.save(risk_path)
        with open(metrics_dir / "risk_metrics.json", "w") as f:
            json.dump(risk_metrics, f, indent=2)
        print(f"-> Risk classifier saved to {risk_path}")

        # 6. Train Model C: Remaining Useful Life Regressor
        print("\n[3/3] Training XGBoost Regressor for RUL Prediction...")
        y_train_rul = dataset.loc[train_mask, "target_rul_hours"].values
        y_val_rul = dataset.loc[val_mask, "target_rul_hours"].values

        regressor = RULRegressor()
        rul_metrics = regressor.fit(X_train, y_train_rul, X_val, y_val_rul)
        rul_path = models_dir / "rul_model.pkl"
        regressor.save(rul_path)
        with open(metrics_dir / "rul_metrics.json", "w") as f:
            json.dump(rul_metrics, f, indent=2)
        print(f"-> RUL regressor saved to {rul_path}")

        # 7. Extract Feature Importance
        print("\nGenerating Global Feature Importance rankings...")
        importances = classifier.model.feature_importances_
        feature_importance_list = []
        for name, imp in zip(feature_cols, importances):
            feature_importance_list.append({
                "feature": name.replace("_", " ").title(),
                "importance": round(float(imp), 4),
                "raw_name": name
            })
        feature_importance_list.sort(key=lambda x: x["importance"], reverse=True)
        with open(metrics_dir / "feature_importance.json", "w") as f:
            json.dump(feature_importance_list[:15], f, indent=2)

        # 8. Save/Update Model Metrics into Database Table
        db.query(ModelMetric).delete()
        db.add(ModelMetric(
            model_name="ANOMALY_DETECTION",
            metrics_json=json.dumps(anomaly_metrics),
            feature_importance_json="[]"
        ))
        db.add(ModelMetric(
            model_name="RISK_PREDICTION",
            metrics_json=json.dumps(risk_metrics),
            feature_importance_json=json.dumps(feature_importance_list[:10])
        ))
        db.add(ModelMetric(
            model_name="RUL_PREDICTION",
            metrics_json=json.dumps(rul_metrics),
            feature_importance_json=json.dumps(feature_importance_list[:10])
        ))
        db.commit()

        print("\n" + "=" * 60)
        print("ML Training Pipeline Completed Successfully!")
        print(f"Metrics saved to {metrics_dir}")
        print(f"Classification Precision: {risk_metrics['precision']}, Recall: {risk_metrics['recall']}, ROC-AUC: {risk_metrics['roc_auc']}")
        print(f"RUL MAE: {rul_metrics['mae']} hours, RMSE: {rul_metrics['rmse']} hours")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    train_all_models()
