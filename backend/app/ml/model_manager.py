import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

from app.config import settings
from app.ml.anomaly_detection.isolation_forest import AnomalyDetector
from app.ml.failure_prediction.xgb_classifier import MaintenanceRiskClassifier
from app.ml.rul_prediction.xgb_regressor import RULRegressor
from app.ml.explainability.shap_explainer import PredictionExplainer
from app.ml.feature_engineering.features import get_feature_column_names

class ModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def initialize(self):
        if self._initialized:
            return

        self.models_dir = settings.MODEL_DIR
        self.metrics_dir = settings.MODEL_DIR / "metrics"
        self.feature_names = get_feature_column_names()

        # Load Anomaly Detector
        anomaly_path = self.models_dir / "anomaly_model.pkl"
        self.anomaly_detector = AnomalyDetector(anomaly_path if anomaly_path.exists() else None)

        # Load Failure Risk Classifier
        risk_path = self.models_dir / "risk_model.pkl"
        self.risk_classifier = MaintenanceRiskClassifier(risk_path if risk_path.exists() else None)

        # Load RUL Regressor
        rul_path = self.models_dir / "rul_model.pkl"
        self.rul_regressor = RULRegressor(rul_path if rul_path.exists() else None)

        # Initialize Explainer
        self.explainer = PredictionExplainer(
            model=self.risk_classifier.model,
            feature_names=self.feature_names
        )

        self._initialized = True
        print("[ModelManager] Successfully initialized all ML models & explainers.")

    def run_all_inference(self, feature_vector: np.ndarray, aircraft_id: str, component_type: str = "HYDRAULIC") -> Dict[str, Any]:
        """
        Runs full inference chain:
        Anomaly Detection -> Failure Risk -> RUL Estimation -> SHAP Explainability
        """
        if not self._initialized:
            self.initialize()

        # 1. Anomaly Model
        anom_res = self.anomaly_detector.predict(feature_vector)

        # 2. Risk Model
        risk_res = self.risk_classifier.predict(feature_vector)

        # 3. RUL Model
        rul_res = self.rul_regressor.predict(feature_vector)

        # 4. Explainability
        factors = self.explainer.explain(feature_vector, top_k=4)

        # Determine recommended maintenance action
        if risk_res["risk_level"] == "CRITICAL":
            action = f"Priority overhaul required: inspect and replace {component_type.title()} subsystem before next sortie."
        elif risk_res["risk_level"] == "HIGH":
            action = f"Schedule preventive inspection on {component_type.title()} system within {int(rul_res['predicted_rul_hours'])} hours."
        elif risk_res["risk_level"] == "MEDIUM":
            action = f"Flag for elevated monitoring; inspect {component_type.title()} seals during routine turnaround."
        else:
            action = "Routine telemetry nominal; proceed with standard operational flight schedule."

        return {
            "aircraft_id": aircraft_id,
            "component_type": component_type,
            "anomaly_score": anom_res["anomaly_score"],
            "anomaly_detected": anom_res["anomaly_detected"],
            "anomaly_severity": anom_res["severity"],
            "maintenance_probability": risk_res["maintenance_probability"],
            "risk_level": risk_res["risk_level"],
            "confidence": risk_res["confidence"],
            "predicted_rul_hours": rul_res["predicted_rul_hours"],
            "rul_lower_bound": rul_res["rul_lower_bound"],
            "rul_upper_bound": rul_res["rul_upper_bound"],
            "top_contributing_factors": factors,
            "recommended_action": action,
            "model_mode": risk_res["model_mode"]
        }

    def get_metrics(self) -> Dict[str, Any]:
        metrics = {}
        for m_name in ["anomaly_metrics.json", "risk_metrics.json", "rul_metrics.json", "feature_importance.json"]:
            path = self.metrics_dir / m_name
            if path.exists():
                try:
                    with open(path, "r") as f:
                        metrics[m_name.replace(".json", "")] = json.load(f)
                except Exception:
                    pass
        return metrics

model_manager = ModelManager()
